# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1] - 2025-11-11

### 🔧 Fixed
- Fixed navigation buttons not working on Android/mobile platform
  - Uses `window.openFileByURL()` API for proper mobile document switching
  - Added platform detection to handle desktop and mobile differently

## [0.1.0] - 2025-11-10

### 🎉 Initial Release

#### ✨ Features
- **Sequential Navigation**: Navigate through documents with Previous/Next buttons at the bottom of each document
- **Notebook Isolation**: Page numbers are calculated independently for each notebook
- **Real-time Position**: Live page indicator showing current position (e.g., "3 / 10")
- **Adaptive Width**: Automatically adjusts button container width to match document content width based on SiYuan's adaptive width settings
- **Smart Updates**: Real-time detection and response to document changes:
  - Document creation, deletion, and movement
  - Document reordering via drag & drop
  - Adaptive width mode changes
- **Theme Integration**: Seamlessly matches SiYuan's UI theme
- **Smart Button States**: Automatically disables navigation when at boundaries

#### 🛡️ Security & Stability
- Comprehensive error handling with try-catch blocks
- Memory leak prevention with proper event cleanup
- Concurrent operation protection (loading and navigation locks)
- Recursion depth limit (max 50 levels) to prevent stack overflow
- Network timeout protection (10 seconds)
- Safe DOM operations with existence checks
- XSS protection with proper content sanitization

#### 🚀 Performance
- Efficient DOM operations with minimal reflows
- Smart concurrent loading prevention
- Optimized event handling
- Automatic resource cleanup on plugin unload

#### 🧰 Technical Implementation
- Uses SiYuan's internal `listDocsByPath` API for accurate document ordering
- Event-driven architecture with WebSocket monitoring
- CSS variable integration for adaptive width (`--b3-width-protyle-wysiwyg`)
- Type-safe TypeScript implementation
- Production-ready code with no debug logging
