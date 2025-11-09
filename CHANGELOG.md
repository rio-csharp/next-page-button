# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0] - 2025-11-09

### 🎉 Initial Release

#### Features
- ✨ Navigation buttons at document bottom (Previous/Next)
- 📍 Real-time page indicator (e.g., "3 / 10")
- 📚 Multi-notebook support
- 🔄 Real-time updates on document changes
  - Document creation
  - Document deletion
  - Document movement
  - Document renaming
  - Drag & drop reordering
- 🎨 Seamless theme integration
- ⚪ Disabled button states for first/last documents

#### Technical
- Implemented using SiYuan's `listDocsByPath` API for accurate ordering
- Event-driven architecture with WebSocket monitoring
- Concurrent loading protection
- Comprehensive error handling and fallback mechanisms
