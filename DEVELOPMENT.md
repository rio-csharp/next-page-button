# Development Guide

## 🚀 Quick Start

```bash
# Clone & setup
git clone https://github.com/rio-csharp/next-page-button.git
cd next-page-button
pnpm install

# Create symlink
pnpm run make-link       # macOS/Linux
pnpm run make-link-win   # Windows

# Start dev mode (hot reload)
pnpm run dev
```

**Prerequisites**: Node.js 18+, pnpm 8+, SiYuan Notes

## 🐛 Debug Mode

Set `DEBUG_MODE = true` in `src/utils/constants.ts` for detailed logs. **Always set to `false` before release.**

## 📁 Project Structure

```
src/
├── index.ts                    # Plugin entry point
├── services/
│   ├── DocumentService.ts      # Document tree & position tracking
│   ├── NavigationService.ts    # Platform-specific navigation
│   ├── UIRenderService.ts      # UI rendering & state management
│   └── KeyboardDetectionService.ts  # Mobile keyboard detection
├── utils/
│   ├── constants.ts            # Configuration (DEBUG_MODE here)
│   ├── logger.ts               # Logging utilities
│   └── platformUtils.ts        # Platform detection
└── models/
    └── DocItem.ts              # Type definitions
```

## 🏗️ Architecture

**Service-Oriented Design (SOA)**

- **DocumentService**: Document tree loading, position tracking, notebook queries
- **NavigationService**: Desktop (`openTab`) vs Mobile (`window.openFileByURL`)
- **UIRenderService**: UI lifecycle, button states, AbortController for cleanup
- **KeyboardDetectionService**: Mobile-only, auto-hide buttons when keyboard shows

**Key Features**
- Per-notebook page numbering
- Real-time updates (no caching)
- Memory leak prevention (proper cleanup)
- AbortController for async operations
- Platform detection for mobile/desktop

## 📦 Release

```bash
pnpm run update-version  # Sync versions
pnpm run build           # Production build
git tag v0.x.x && git push origin v0.x.x
```

## 📱 Android Development

**Quick Deploy**: Use `.\deploy-android.ps1` (requires rooted device/emulator with ADB)

**Manual Setup:**
```bash
# Connect
adb connect 127.0.0.1:16384

# Build & deploy
pnpm run build
adb push dist/index.js /sdcard/
adb push dist/index.css /sdcard/
adb push dist/plugin.json /sdcard/
adb shell "su -c 'cp /sdcard/{index.js,index.css,plugin.json} /storage/emulated/0/Android/data/org.b3log.siyuan/files/siyuan/data/plugins/next-page-button/'"
adb shell "su -c 'chown -R u0_a39:ext_data_rw /storage/emulated/0/Android/data/org.b3log.siyuan/files/siyuan/data/plugins/next-page-button'"

# Debug
adb logcat | grep -i "siyuan\|plugin"
```

**Mobile Notes:**
- Use `window.openFileByURL()` for navigation (not `openTab`)
- Keyboard detection via `window.visualViewport`
- Requires root for `/Android/data/` access

## 💡 Best Practices

**Memory Management:**
```typescript
// ✅ Proper cleanup
cleanup(): void {
  if (this.abortController) {
    this.abortController.abort();
    this.abortController = null;
  }
  this.btnPrev?.removeEventListener("click", this.handler);
  this.containerElement?.remove();
  this.containerElement = null;
}
```

**Error Handling:**
```typescript
// ✅ Handle AbortError
try {
  await operation();
} catch (err) {
  if (err instanceof Error && err.name === 'AbortError') return;
  errorLog("Tag", "Error:", err);
}
```

**Type Safety:**
```typescript
// ✅ Use explicit types
private controller: AbortController | null = null;

// ❌ Avoid
private controller?: AbortController;
```

## 🤝 Contributing

**PR Checklist:**
- [ ] TypeScript compiles without errors
- [ ] Tested in SiYuan (desktop + mobile if applicable)
- [ ] All async operations have try-catch
- [ ] Event listeners cleaned up properly
- [ ] DOM references nullified in cleanup
- [ ] DEBUG_MODE = false in production

## 📚 Resources

- [SiYuan Plugin API](https://github.com/siyuan-note/siyuan/blob/master/API.md)
- [Plugin Sample](https://github.com/siyuan-note/plugin-sample)
- [Community](https://github.com/siyuan-note/siyuan/discussions)
