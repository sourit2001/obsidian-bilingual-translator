# Obsidian Bilingual Translator

[中文版](./README.zh.md) | English

A powerful Obsidian plugin that translates English articles into a beautiful Chinese bilingual (Parallel) format. Perfect for personal knowledge management, research, and learning.

## ✨ Features

- **🚀 Multiple Master Engines**:
  - **Google Gemini 3.1 Flash-Lite**: Ultra-fast, high-quality, and free-tier support.
  - **MiniMax M2.7**: State-of-the-art Chinese LLM for natural expression.
  - **DeepSeek**: Cost-effective and highly precise English-Chinese translation.
  - **Microsoft Translator**: Solid fallback for high-volume free translation.
- **🖱️ Seamless Integration**:
  - **Right-click Menu**: Translate the entire note or just the selected text instantly.
  - **Parallel Content**: Paragraph-by-paragraph bilingual layout for better reading.
- **📦 Intelligent Format Preservation**:
  - Keeps all Markdown syntax, LaTeX, and code blocks intact.
  - Automatically skips YAML frontmatter and internal [[links]].
- **📑 Long Article Support**:
  - Intelligent text chunking to handle large articles without hitting API timeouts.
  - Real-time progress notifications.

## 🚀 Getting Started

### 1. Installation
- **Community Store**: Search for `Bilingual Translator` in Obsidian Community Plugins (Coming soon!).
- **Manual**: Download `main.js`, `manifest.json`, and `styles.css` from the latest release and place them in your vault's `.obsidian/plugins/bilingual-translator/` folder.

### 2. Configuration
Go to Obsidian **Settings** -> **Bilingual Translator** and set up your preferred engine:
- **DeepSeek**: Get your key at [platform.deepseek.com](https://platform.deepseek.com/).
- **Gemini**: Get your key at [Google AI Studio](https://aistudio.google.com/).
- **MiniMax**: Get your key at [MiniMax Open Platform](https://platform.minimaxi.com/).

### 3. Usage
- **Option A**: Right-click anywhere in an English note -> `Translate note (bilingual parallel)`.
- **Option B**: Highlight a paragraph -> Right-click -> `Translate selection (bilingual parallel)`.
- **Option C**: Use Command Palette (`Cmd + P`) -> Search `Bilingual Translator`.

## 🛠️ Build from Source

```bash
npm install
npm run build
```

## 📄 License
MIT License.
