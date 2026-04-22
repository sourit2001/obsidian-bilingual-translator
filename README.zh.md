# Obsidian Bilingual Translator (中英对照翻译专家)

English | 中文版

一个强大的 Obsidian 插件，能将英文文章翻译成精美的中英双语对照格式。非常适合知识管理、科研阅读和外语学习。

## ✨ 核心特性

- **🚀 顶级模型驱动**:
  - **Google Gemini 3.1 Flash-Lite**: 极速、高质，支持免费层级。
  - **MiniMax M2.7**: 国产顶尖大模型，中文表达更地道、自然。
  - **DeepSeek**: 极具性价比，翻译精准度高。
  - **Microsoft Translator**: 稳定的高额度免费备选方案。
- **🖱️ 丝滑交互**:
  - **右键菜单支持**: 右键全篇翻译或仅翻译选中段落。
  - **段落对照**: 采用逐段对照布局，大幅提升阅读体验。
- **📦 智能格式保护**:
  - 完美保留 Markdown 语法、公式和代码块。
  - 自动识别并跳过 YAML Frontmatter 和 Obsidian 内链 `[[links]]`。
- **📑 长文自动切分**:
  - 智能处理超长文章，自动分块翻译避免超时。
  - 状态栏实时显示翻译进度。

## 🚀 快速开始

### 1. 安装方法
- **插件市场**: 在 Obsidian 社区插件市场搜索 `Bilingual Translator`（正在审核中）。
- **手动安装**: 从 [Release 页面](https://github.com/sourit2001/obsidian-bilingual-translator/releases) 下载 `main.js`, `manifest.json`, `styles.css` 并放入你 Vault 的 `.obsidian/plugins/bilingual-translator/` 文件夹。

### 2. 配置 Key
进入 **设置** -> **Bilingual Translator** 并配置你喜欢的引擎：
- **DeepSeek**: [前往注册](https://platform.deepseek.com/)
- **Gemini**: [Google AI Studio 免费获取](https://aistudio.google.com/)
- **MiniMax**: [前往注册](https://platform.minimaxi.com/)

### 3. 如何使用
- **全篇翻译**: 在英文笔记中点击右键 -> `Translate note (bilingual parallel)`。
- **选中翻译**: 选中文本段落 -> 右键 -> `Translate selection (bilingual parallel)`。
- **命令面板**: 按 `Cmd + P` 搜索 `Bilingual Translator` 相关命令。

## 🛠️ 开发者编译

```bash
npm install
npm run build
```

## 📄 开源协议
MIT License.
