---
name: Obsidian Plugin Publication
description: Guidelines and workflows for developing and publishing compliant Obsidian plugins.
---

# Obsidian Plugin Development & Publication Skill

This skill provides comprehensive instructions for developing, building, and publishing Obsidian plugins, specifically focusing on passing the official community plugin review process.

## 🛠 Prerequisites
- **Language**: TypeScript
- **Bundler**: `esbuild`
- **Minimum App Version**: 0.15.0+

## 📄 Core Project Structure
- `main.ts`: Entry point for plugin logic.
- `manifest.json`: Plugin metadata.
- `styles.css`: Optional CSS styles.
- `package.json`: Build scripts and dependencies.

## ⚖️ Publication Rules (ReviewBot Compliance)
To pass the `ObsidianReviewBot` automated scan, the UI must follow these strict rules:

### 1. UI Text Case
- **Rule**: Use **Sentence case** for all UI text (settings names, descriptions, options).
- **Correct**: `Select your engine`, `Api key`.
- **Incorrect**: `Select Your Engine`, `API Key`.
- **Note**: For brand names, if the bot complains, use `Deepseek`, `Minimax` etc.

### 2. Settings Headings
- **Rule**: Do NOT use the word "settings" or "General" in headings.
- **Rule**: Do NOT include the plugin name in settings headings.
- **Guideline**: Let the first setting item start directly without a redundant heading if possible.

### 3. Setting Descriptions
- **Rule**: Avoid ending setting descriptions with a period (`.`) unless it's a long sentence.
- **Rule**: Do not use placeholders that look like actual working keys or specific models (e.g. use `Enter model id` instead of `gpt-4o-mini`).

## 🧱 Build & Deploy Workflow
1. **Build**: `npm run build` (generates `main.js`).
2. **Local Test**: Copy `main.js`, `manifest.json`, and `styles.css` to `.obsidian/plugins/<plugin-id>/`.
3. **GitHub Release**:
   - Create a tag (e.g., `1.0.0`).
   - Create a GitHub Release.
   - **Crucial**: Manually attach `main.js`, `manifest.json`, and `styles.css` to the Release assets.

## 🔄 PR Update Workflow
When requested to make changes by the reviewer:
1. Modify source code.
2. Run `npm run build`.
3. Push code to GitHub `main` branch.
4. **Update Release**: Go to GitHub Release page, delete old assets, and upload new ones.
5. **Trigger Rescan**: In the PR, `Close` and then `Reopen` the PR to force a bot re-scan.

## 📱 Mobile Compatibility
- Ensure `"isDesktopOnly": false` in `manifest.json`.
- Use `addRibbonIcon` to provide easy access for mobile users.
- Encourage users to add commands to the **Mobile Toolbar**.
