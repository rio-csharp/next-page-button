
# Next Page Button

English | [中文](https://github.com/rio-csharp/next-page-button/blob/main/README_zh_CN.md)

> Navigate through your documents sequentially with "Previous" and "Next" buttons at the bottom of each document.

[![Version](https://img.shields.io/github/v/release/rio-csharp/next-page-button)](https://github.com/rio-csharp/next-page-button/releases)
[![License](https://img.shields.io/github/license/rio-csharp/next-page-button)](LICENSE)
[![Downloads](https://img.shields.io/github/downloads/rio-csharp/next-page-button/total)](https://github.com/rio-csharp/next-page-button/releases)

##  Features

- **Sequential Navigation**: Browse documents in tree order with prev/next buttons
- **Notebook Isolation**: Each notebook has independent page numbering
- **Position Indicator**: Live display of your current position (e.g., "5 / 20")
- **Adaptive Width**: Button container automatically matches document width
- **Real-time Updates**: Instantly responds to document structure changes
- **Smart Detection**: Automatically detects drag-and-drop reordering
- **Mobile Support**: Works perfectly on Android with keyboard auto-hide
- **Theme Compatible**: Seamlessly integrates with SiYuan's UI
- **Production Ready**: Comprehensive error handling, no memory leaks
- **Zero Configuration**: Works out of the box

##  Installation

### From Plugin Marketplace (Recommended)

1. Open SiYuan Notes
2. Go to `Settings`  `Marketplace`  `Plugins`
3. Search for "Next Page Button"
4. Click download and enable

### Manual Installation

1. Download `package.zip` from [Releases](https://github.com/rio-csharp/next-page-button/releases)
2. Extract to `{workspace}/data/plugins/`
3. Restart SiYuan
4. Enable in `Settings`  `Marketplace`  `Downloaded`

##  Usage

After installation, the plugin works automatically:

1. Open any document
2. Scroll to the bottom
3. Use the navigation buttons to move between documents
4. The page indicator shows your current position within the notebook

**Button States:**
-  **Active**: Blue buttons are clickable
-  **Disabled**: Gray buttons indicate first/last document in the notebook

**Key Features:**
- Each notebook has independent page numbering
- When you drag a document to reorder, navigation updates automatically
- Button width adapts to document content width (respects SiYuan's adaptive width setting)

##  Smart Updates

The navigation automatically updates when you:
- Create or delete documents
- Move documents between folders
- Rename documents
- Reorder documents by dragging
- Change adaptive width settings

##  Mobile Experience

On Android devices, the plugin provides an optimized mobile experience:
- Navigation buttons automatically hide when the virtual keyboard appears
- Buttons restore when keyboard is dismissed
- Uses native SiYuan mobile navigation API for smooth transitions
- No interference with document editing

##  Contributing

Contributions are welcome! Please see [DEVELOPMENT.md](https://github.com/rio-csharp/next-page-button/blob/main/DEVELOPMENT.md) for setup.

##  License

[MIT License](https://github.com/rio-csharp/next-page-button/blob/main/LICENSE)
