import {
	App,
	Editor,
	MarkdownView,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	requestUrl,
} from 'obsidian';

// ─── Settings ────────────────────────────────────────────────────────────────

type EngineType = 'deepseek' | 'openai' | 'microsoft' | 'gemini' | 'minimax';

interface TranslatorSettings {
	engine: EngineType;
	deepseekApiKey: string;
	deepseekModel: string;
	openaiApiKey: string;
	openaiBaseUrl: string;
	openaiModel: string;
	microsoftApiKey: string;
	microsoftRegion: string;
	geminiApiKey: string;
	geminiModel: string;
	minimaxApiKey: string;
	minimaxModel: string;
	chunkSize: number;
}

const DEFAULT_SETTINGS: TranslatorSettings = {
	engine: 'deepseek',
	deepseekApiKey: '',
	deepseekModel: 'deepseek-chat',
	openaiApiKey: '',
	openaiBaseUrl: 'https://api.openai.com/v1',
	openaiModel: 'gpt-4o-mini',
	microsoftApiKey: '',
	microsoftRegion: 'eastasia',
	geminiApiKey: '',
	geminiModel: 'gemini-3.1-flash-lite-preview',
	minimaxApiKey: '',
	minimaxModel: 'MiniMax-M2.7',
	chunkSize: 2000,
};

// ─── Translation prompt ───────────────────────────────────────────────────────

const BILINGUAL_PROMPT = (text: string) =>
	`Translate the following and provide bilingual version.

Rules:
1. Output in BILINGUAL format: for each paragraph, output the original English paragraph first, then its Chinese translation on the next line, separated by a blank line.
2. For headings: output the original heading line, then the translated heading on the next line (same heading level, e.g. ## 原文标题).
3. Do NOT translate: code blocks (fenced with \`\`\`), inline code, URLs, file paths, YAML frontmatter, or Obsidian wiki-links [[...]].
4. Keep all Markdown syntax (bold, italic, lists, links) intact.
5. The translation should sound natural in Chinese. Do not translate word-for-word.

Article to translate:
---
${text}
---`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function chunkText(text: string, maxChars: number): string[] {
	const paragraphs = text.split(/\n{2,}/);
	const chunks: string[] = [];
	let current = '';

	for (const para of paragraphs) {
		if ((current + '\n\n' + para).length > maxChars && current.length > 0) {
			chunks.push(current.trim());
			current = para;
		} else {
			current = current ? current + '\n\n' + para : para;
		}
	}
	if (current.trim()) chunks.push(current.trim());
	return chunks;
}

function extractFrontmatter(text: string): { frontmatter: string; body: string } {
	const match = text.match(/^---\n[\s\S]*?\n---\n?/);
	if (match) {
		return { frontmatter: match[0], body: text.slice(match[0].length) };
	}
	return { frontmatter: '', body: text };
}

// ─── Plugin ───────────────────────────────────────────────────────────────────

export default class BilingualTranslator extends Plugin {
	settings: TranslatorSettings;

	async onload() {
		await this.loadSettings();

		// Migration: Update old Gemini model to 3.1
		if (this.settings.geminiModel === 'gemini-1.5-flash' || !this.settings.geminiModel) {
			this.settings.geminiModel = 'gemini-3.1-flash-lite-preview';
			await this.saveSettings();
		}

		this.addCommand({
			id: 'translate-note-bilingual',
			name: 'Translate note → bilingual parallel (中英对照)',
			editorCallback: async (editor: Editor) => {
				await this.translateAll(editor);
			},
		});

		this.addCommand({
			id: 'translate-selection-bilingual',
			name: 'Translate selection → bilingual parallel (中英对照)',
			editorCallback: async (editor: Editor) => {
				await this.translateSelection(editor);
			},
		});

		// Add ribbon icon for easy access (especially on mobile)
		this.addRibbonIcon('languages', 'Translate note → bilingual', async () => {
			const view = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (view) {
				await this.translateAll(view.editor);
			} else {
				new Notice('Please open a markdown note first');
			}
		});

		this.addSettingTab(new TranslatorSettingTab(this.app, this));

		this.registerEvent(
			this.app.workspace.on('editor-menu', (menu, editor) => {
				menu.addItem((item) => {
					item
						.setTitle('Translate note → bilingual parallel (中英对照)')
						.setIcon('languages')
						.onClick(async () => {
							await this.translateAll(editor);
						});
				});

				const selection = editor.getSelection();
				if (selection.trim()) {
					menu.addItem((item) => {
						item
							.setTitle('Translate selection → bilingual parallel (中英对照)')
							.setIcon('languages')
							.onClick(async () => {
								await this.translateSelection(editor);
							});
					});
				}
			})
		);
	}

	async translateAll(editor: Editor) {
		const text = editor.getValue();
		if (!text.trim()) {
			new Notice('Note is empty.');
			return;
		}
		await this.runTranslation(editor, text);
	}

	async translateSelection(editor: Editor) {
		const selected = editor.getSelection();
		if (!selected.trim()) {
			new Notice('No text selected.');
			return;
		}
		const notice = new Notice('Translating selection...', 0);
		try {
			const translated = await this.translateText(selected);
			editor.replaceSelection(translated);
			notice.hide();
			new Notice('Selection translated!');
		} catch (e) {
			notice.hide();
			new Notice('Translation failed: ' + (e as Error).message);
		}
	}

	async runTranslation(editor: Editor, fullText: string) {
		const { frontmatter, body } = extractFrontmatter(fullText);
		const chunks = chunkText(body, this.settings.chunkSize);
		const total = chunks.length;
		const notice = new Notice(`Translating… (0 / ${total} chunks)`, 0);

		const translated: string[] = [];
		for (let i = 0; i < chunks.length; i++) {
			notice.setMessage(`Translating… (${i + 1} / ${total} chunks)`);
			try {
				const result = await this.translateText(chunks[i]);
				translated.push(result);
			} catch (e) {
				notice.hide();
				new Notice('Translation failed: ' + (e as Error).message);
				return;
			}
		}

		notice.hide();
		editor.setValue(frontmatter + translated.join('\n\n'));
		new Notice('Translation complete!');
	}

	async translateText(text: string): Promise<string> {
		const prompt = BILINGUAL_PROMPT(text);
		switch (this.settings.engine) {
			case 'deepseek':
				return this.callOpenAICompatible(
					'https://api.deepseek.com/v1/chat/completions',
					this.settings.deepseekApiKey,
					this.settings.deepseekModel || 'deepseek-chat',
					prompt
				);
			case 'openai':
				return this.callOpenAICompatible(
					`${this.settings.openaiBaseUrl.replace(/\/$/, '')}/chat/completions`,
					this.settings.openaiApiKey,
					this.settings.openaiModel || 'gpt-4o-mini',
					prompt
				);
			case 'gemini':
				return this.callGemini(text);
			case 'minimax':
				return this.callOpenAICompatible(
					'https://api.minimaxi.com/v1/chat/completions',
					this.settings.minimaxApiKey,
					this.settings.minimaxModel || 'MiniMax-M2.7',
					prompt,
					1.0
				);
			case 'microsoft':
				return this.callMicrosoftTranslator(text);
			default:
				throw new Error('No translation engine configured.');
		}
	}

	async callOpenAICompatible(
		url: string,
		apiKey: string,
		model: string,
		prompt: string,
		temperature: number = 0.3
	): Promise<string> {
		if (!apiKey) throw new Error(`API key is missing for ${model}.`);

		const response = await requestUrl({
			url,
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${apiKey}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				model,
				messages: [{ role: 'user', content: prompt }],
				temperature: temperature,
			}),
			throw: false,
		});

		if (response.status !== 200) {
			throw new Error(`API error ${response.status}: ${JSON.stringify(response.json)}`);
		}
		return response.json.choices[0].message.content as string;
	}

	async callGemini(text: string): Promise<string> {
		if (!this.settings.geminiApiKey) throw new Error('Gemini API key is missing.');
		
		const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.settings.geminiModel}:generateContent?key=${this.settings.geminiApiKey}`;
		
		const response = await requestUrl({
			url,
			method: 'POST',
			contentType: 'application/json',
			body: JSON.stringify({
				contents: [{ parts: [{ text: BILINGUAL_PROMPT(text) }] }],
				generationConfig: {
					temperature: 0.3,
				}
			}),
			throw: false
		});

		if (response.status !== 200) {
			throw new Error(`Gemini API error ${response.status}: ${JSON.stringify(response.json)}`);
		}
		
		return response.json.candidates[0].content.parts[0].text;
	}

	async callMicrosoftTranslator(text: string): Promise<string> {
		if (!this.settings.microsoftApiKey) throw new Error('Microsoft API key is missing.');
		const paragraphs = text.split(/\n{2,}/);
		const results: string[] = [];
		for (const para of paragraphs) {
			const res = await requestUrl({
				url: `https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&from=en&to=zh-Hans`,
				method: 'POST',
				headers: {
					'Ocp-Apim-Subscription-Key': this.settings.microsoftApiKey,
					'Ocp-Apim-Subscription-Region': this.settings.microsoftRegion,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify([{ Text: para }]),
				throw: false,
			});
			if (res.status !== 200) throw new Error(`Microsoft API error ${res.status}`);
			const translated = res.json[0]?.translations[0]?.text ?? '';
			results.push(`${para}\n\n${translated}`);
		}
		return results.join('\n\n');
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class TranslatorSettingTab extends PluginSettingTab {
	plugin: BilingualTranslator;

	constructor(app: App, plugin: BilingualTranslator) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		// No heading here to satisfy reviewer

		new Setting(containerEl)
			.setName('Engine')
			.setDesc('Select the translation engine')
			.addDropdown((drop) =>
				drop
					.addOption('deepseek', 'Deepseek')
					.addOption('gemini', 'Google gemini')
					.addOption('minimax', 'Minimax')
					.addOption('openai', 'Openai compatible')
					.addOption('microsoft', 'Microsoft translator')
					.setValue(this.plugin.settings.engine)
					.onChange(async (value) => {
						this.plugin.settings.engine = value as EngineType;
						await this.plugin.saveSettings();
						this.display();
					})
			);

		new Setting(containerEl).setName('Deepseek').setHeading();

		new Setting(containerEl)
			.setName('Deepseek API key')
			.addText((text) =>
				text.setValue(this.plugin.settings.deepseekApiKey).onChange(async (v) => {
					this.plugin.settings.deepseekApiKey = v.trim();
					await this.plugin.saveSettings();
				})
			);
		new Setting(containerEl)
			.setName('Deepseek model')
			.addText((text) =>
				text
					.setPlaceholder('deepseek-chat')
					.setValue(this.plugin.settings.deepseekModel)
					.onChange(async (v) => {
						this.plugin.settings.deepseekModel = v.trim();
						await this.plugin.saveSettings();
					})
			);

		if (this.plugin.settings.engine === 'gemini') {
			new Setting(containerEl).setName('Gemini').setHeading();
			new Setting(containerEl)
				.setName('Gemini API key')
				.setDesc('Enter your Google gemini API key')
				.addText((text) =>
					text.setValue(this.plugin.settings.geminiApiKey).onChange(async (v) => {
						this.plugin.settings.geminiApiKey = v.trim();
						await this.plugin.saveSettings();
					})
				);
			new Setting(containerEl)
				.setName('Gemini model')
				.setDesc('e.g. gemini-1.5-flash-8b')
				.addText((text) =>
					text.setValue(this.plugin.settings.geminiModel).onChange(async (v) => {
						this.plugin.settings.geminiModel = v.trim();
						await this.plugin.saveSettings();
					})
				);
		}

		if (this.plugin.settings.engine === 'minimax') {
			new Setting(containerEl).setName('Minimax').setHeading();
			new Setting(containerEl)
				.setName('Minimax API key')
				.setDesc('Enter your Minimax API key')
				.addText((text) =>
					text.setValue(this.plugin.settings.minimaxApiKey).onChange(async (v) => {
						this.plugin.settings.minimaxApiKey = v.trim();
						await this.plugin.saveSettings();
					})
				);
			new Setting(containerEl)
				.setName('Minimax model')
				.setDesc('e.g. MiniMax-M2.7')
				.addText((text) =>
					text.setValue(this.plugin.settings.minimaxModel).onChange(async (v) => {
						this.plugin.settings.minimaxModel = v.trim();
						await this.plugin.saveSettings();
					})
				);
		}

		if (this.plugin.settings.engine === 'openai') {
			new Setting(containerEl).setName('Openai compatible').setHeading();
			new Setting(containerEl)
				.setName('Api key')
				.addText((text) =>
					text.setValue(this.plugin.settings.openaiApiKey).onChange(async (v) => {
						this.plugin.settings.openaiApiKey = v.trim();
						await this.plugin.saveSettings();
					})
				);
			new Setting(containerEl)
				.setName('Base url')
				.setDesc('Custom api endpoint url')
				.addText((text) =>
					text
						.setPlaceholder('https://api.openai.com/v1')
						.setValue(this.plugin.settings.openaiBaseUrl)
						.onChange(async (v) => {
							this.plugin.settings.openaiBaseUrl = v.trim();
							await this.plugin.saveSettings();
						})
				);
			new Setting(containerEl)
				.setName('Model name')
				.addText((text) =>
					text
						.setPlaceholder('Enter model id')
						.setValue(this.plugin.settings.openaiModel)
						.onChange(async (v) => {
							this.plugin.settings.openaiModel = v.trim();
							await this.plugin.saveSettings();
						})
				);
		}

		if (this.plugin.settings.engine === 'microsoft') {
			new Setting(containerEl).setName('Microsoft translator').setHeading();
			new Setting(containerEl)
				.setName('API key')
				.addText((text) =>
					text.setValue(this.plugin.settings.microsoftApiKey).onChange(async (v) => {
						this.plugin.settings.microsoftApiKey = v.trim();
						await this.plugin.saveSettings();
					})
				);
			new Setting(containerEl)
				.setName('Region')
				.addText((text) =>
					text.setValue(this.plugin.settings.microsoftRegion).onChange(async (v) => {
						this.plugin.settings.microsoftRegion = v.trim();
						await this.plugin.saveSettings();
					})
				);
		}

		new Setting(containerEl).setName('Advanced').setHeading();
		new Setting(containerEl)
			.setName('Translation chunk size')
			.setDesc('Max characters per translation request')
			.addText((text) =>
				text.setValue(String(this.plugin.settings.chunkSize)).onChange(async (v) => {
					const num = parseInt(v);
					if (!isNaN(num)) {
						this.plugin.settings.chunkSize = num;
						await this.plugin.saveSettings();
					}
				})
			);
	}
}
