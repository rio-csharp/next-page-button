# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.2] - 2025-11-11

### ✨ Added
- Mobile keyboard detection to auto-hide navigation buttons
  - Monitors viewport resize events for keyboard visibility using `window.visualViewport` API
  - Automatically hides navigation buttons when virtual keyboard appears
  - Restores buttons when keyboard is dismissed
  - Prevents navigation buttons from interfering with editing experience
  - Uses AbortController for proper cleanup and memory leak prevention
- Debug mode for development troubleshooting
  - Controlled by `DEBUG_MODE` flag in `src/utils/constants.ts`
  - Detailed logging for document queries, UI rendering, and navigation state
  - Timestamped log entries with millisecond precision
  - See [docs/DEBUG_MODE.md](https://github.com/rio-csharp/next-page-button/blob/main/docs/DEBUG_MODE.md) for usage guide

### 🏗️ Refactored
- Complete code refactoring with service-oriented architecture (SOA)
  - `DocumentService`: Handles document tree loading, position tracking, and notebook queries
    - Recursive file tree traversal with depth limit (max 50 levels)
    - Real-time document list loading without caching for instant updates
    - Comprehensive error handling and logging
  - `NavigationService`: Manages platform-specific document navigation (desktop/mobile)
    - Desktop: Uses SiYuan's `openTab()` API
    - Mobile: Uses `window.openFileByURL()` API for proper Android/iOS support
  - `UIRenderService`: Controls UI rendering, button states, and user interactions
    - AbortController pattern for cancellable async operations
    - Smart container recreation detection
    - Proper event listener cleanup to prevent memory leaks
    - Navigation state management with concurrent operation protection
  - `KeyboardDetectionService`: Detects mobile keyboard visibility (mobile only)
    - Platform-aware initialization (only on mobile devices)
    - Uses AbortController for signal-based event cleanup
- Improved code maintainability and testability with clear separation of concerns
- Enhanced type safety with TypeScript interfaces for all services
- Centralized constants and utility functions for better code organization
- Platform detection utilities (`isMobile`, `getViewportHeight`, `isKeyboardVisible`)

### 🎨 Improved
- Added smooth transition animation for navigation container (CSS `transition` property)
- Better error handling and logging across all services
  - Separate debug, info, and error log functions
  - AbortError handling in async operations
  - Try-catch blocks in all async operations
- Memory leak prevention with proper cleanup in all services
  - Event listeners removed on cleanup
  - DOM references nullified after removal
  - AbortController cleanup in async operations
- Improved TypeScript type safety
  - Explicit `null` type instead of `undefined` for AbortController
  - Interface definitions for all services
  - Proper return type annotations

### 🔧 Fixed
- Fixed potential memory leaks in KeyboardDetectionService by using `null` instead of `undefined`
- Improved AbortController cleanup pattern across all async operations

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
