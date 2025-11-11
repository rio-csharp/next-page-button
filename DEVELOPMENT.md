# Development Guide

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- SiYuan Notes installed

### Setup

```bash
# Clone the repository
git clone https://github.com/rio-csharp/next-page-button.git
cd next-page-button

# Install dependencies
pnpm install

# Create symbolic link to SiYuan plugins directory
pnpm run make-link
# On Windows: pnpm run make-link-win

# Start development mode (with hot reload)
pnpm run dev
```

## 🛠 Tech Stack

- **TypeScript**: Type-safe main language
- **Vite**: Fast build tool with HMR
- **SiYuan Plugin API**: Core plugin system
- **SCSS**: Advanced styling with variables
- **pnpm**: Fast, disk space efficient package manager

## 📁 Project Structure

```
next-page-button/
├── src/
│   ├── index.ts          # Main plugin logic (350 lines)
│   └── index.scss        # Navigation button styles
├── public/
│   └── i18n/             # i18n resources (en_US, zh_CN)
├── scripts/
│   ├── make_dev_link.js  # Create symlink for development
│   ├── make_install.js   # Install to SiYuan
│   └── update_version.js # Sync version numbers
├── dev/                  # Development build output
├── icon.png              # Plugin icon (160x160)
├── preview.png           # Preview screenshot
├── plugin.json           # Plugin manifest
├── package.json          # NPM package config
└── README.md             # User documentation
```

## 🔧 Development

### Available Commands

```bash
# Development mode (watch for changes, auto rebuild)
pnpm run dev

# Production build
pnpm run build

# Create symlink for development
pnpm run make-link       # macOS/Linux
pnpm run make-link-win   # Windows

# Install built plugin to SiYuan
pnpm run make-install

# Update version numbers (sync plugin.json and package.json)
pnpm run update-version
```

### Hot Reload Development

The `dev` command watches for file changes and automatically rebuilds. After changes:
1. Save your file
2. Vite rebuilds automatically
3. Reload plugin in SiYuan (Ctrl+Shift+R or disable/enable)

### Production Build

Before release:
```bash
# Build minified production version
pnpm run build

# Output will be in dist/ directory
```

## 📦 Release

```bash
# Update version in both plugin.json and package.json
pnpm run update-version

# Build for production
pnpm run build

# Tag and push (GitHub Actions will create release automatically)
git tag v0.x.x
git push origin v0.x.x
```

## 🏗 Architecture

### Core Components

1. **Document Loading System**
   - Recursively fetches document tree using SiYuan's `listDocsByPath` API
   - Maintains user's manual drag-drop order
   - Supports up to 50 levels of nesting (recursion limit)
   - 10-second timeout protection

2. **Navigation UI**
   - Creates Previous/Next buttons with smart disabled states
   - Live page indicator (current / total)
   - Adaptive width matching document content

3. **Event System**
   - Listens to protyle load/switch events
   - WebSocket monitoring for real-time updates
   - Detects document changes and adaptive width toggles

4. **Navigation Logic**
   - On-demand document list refresh
   - Opens target document with error recovery
   - Concurrent navigation protection

### Key Design Decisions

**Per-Notebook Page Numbering**
- Each notebook calculates page numbers independently
- Filters documents by `notebookId` before indexing

**Adaptive Width Integration**
- Uses CSS variable `--b3-width-protyle-wysiwyg`
- Automatically adjusts when user toggles adaptive width
- Monitors `custom-sy-fullwidth` attribute changes

**Safety & Stability**
- All async operations wrapped in try-catch
- Memory leak prevention with proper cleanup
- Concurrent operation locks (`isLoadingDocs`, `isNavigating`)
- Safe DOM operations with existence checks
- No XSS vulnerabilities (uses `textContent`)

**Performance**
- Minimal DOM operations
- Efficient event handling
- Smart re-render only when needed

## 🤝 Contributing

See [CONTRIBUTING.md](https://github.com/rio-csharp/next-page-button/blob/main/CONTRIBUTING.md) for detailed guidelines.

### Quick Tips

**Before Submitting PR:**
- [ ] Code compiles without errors
- [ ] No TypeScript errors
- [ ] Tested in SiYuan (multiple scenarios)
- [ ] No console errors/warnings
- [ ] Follows code standards
- [ ] Memory-safe (no leaks)

**Code Quality Checklist:**
- [ ] All async operations have try-catch
- [ ] Event listeners cleaned up properly
- [ ] DOM operations check element existence
- [ ] No potential XSS vulnerabilities
- [ ] Functions are focused and small
- [ ] Complex logic has comments

### Common Development Tasks

**Adding a Feature:**
1. Create feature branch
2. Implement with tests
3. Update documentation
4. Submit PR with clear description

**Fixing a Bug:**
1. Reproduce the bug
2. Write failing test (if applicable)
3. Fix the issue
4. Verify fix works
5. Submit PR with reproduction steps

**Updating Dependencies:**
```bash
# Check for updates
pnpm outdated

# Update dependencies
pnpm update

# Test thoroughly after updates
pnpm run build
```

## � Android Development & Testing

### Using MuMu Emulator for Plugin Testing

**Prerequisites:**
- MuMu emulator installed and running
- ADB (Android Debug Bridge) installed
- Rooted MuMu emulator (default)
- SiYuan Android app installed in emulator

**Setup ADB Connection:**
```bash
# Connect to MuMu emulator (default port: 16384)
adb connect 127.0.0.1:16384

# Or use the IP from emulator settings
adb connect 192.168.2.107:5555

# Verify connection
adb devices
```

**Find SiYuan Workspace:**
```bash
# Locate SiYuan data directory
adb shell "su -c 'find /storage/emulated/0/Android/data -name org.b3log.siyuan'"

# Typical path:
# /storage/emulated/0/Android/data/org.b3log.siyuan/files/siyuan
```

**Deploy Plugin to Android:**
```bash
# 1. Build the plugin
npm run build

# 2. Push files to temporary location
adb push dist/index.js /sdcard/index.js
adb push dist/index.css /sdcard/index.css
adb push dist/plugin.json /sdcard/plugin.json

# 3. Copy to SiYuan plugins directory with root privileges
adb shell "su -c 'mkdir -p /storage/emulated/0/Android/data/org.b3log.siyuan/files/siyuan/data/plugins/next-page-button'"
adb shell "su -c 'cp /sdcard/index.js /storage/emulated/0/Android/data/org.b3log.siyuan/files/siyuan/data/plugins/next-page-button/'"
adb shell "su -c 'cp /sdcard/index.css /storage/emulated/0/Android/data/org.b3log.siyuan/files/siyuan/data/plugins/next-page-button/'"
adb shell "su -c 'cp /sdcard/plugin.json /storage/emulated/0/Android/data/org.b3log.siyuan/files/siyuan/data/plugins/next-page-button/'"

# 4. Fix file ownership (SiYuan app UID: u0_a39)
adb shell "su -c 'chown -R u0_a39:ext_data_rw /storage/emulated/0/Android/data/org.b3log.siyuan/files/siyuan/data/plugins/next-page-button'"

# 5. Verify deployment
adb shell "su -c 'ls -la /storage/emulated/0/Android/data/org.b3log.siyuan/files/siyuan/data/plugins/next-page-button'"
```

**Enable Plugin on Android:**
```bash
# Create plugin configuration file
echo '[{"name":"next-page-button","displayName":"Next Page Button","enabled":true,"incompatible":false,"disabledInPublish":false}]' > petals.json

# Deploy configuration
adb push petals.json /sdcard/petals.json
adb shell "su -c 'cp /sdcard/petals.json /storage/emulated/0/Android/data/org.b3log.siyuan/files/siyuan/data/storage/petal/petals.json'"
adb shell "su -c 'chown u0_a39:ext_data_rw /storage/emulated/0/Android/data/org.b3log.siyuan/files/siyuan/data/storage/petal/petals.json'"
```

**Debugging:**
```bash
# View SiYuan logs
adb shell "su -c 'tail -f /storage/emulated/0/Android/data/org.b3log.siyuan/files/siyuan/temp/siyuan.log'"

# Monitor plugin loading
adb shell "su -c 'tail -100 /storage/emulated/0/Android/data/org.b3log.siyuan/files/siyuan/temp/siyuan.log | grep -i petal'"

# Real-time logcat monitoring
adb logcat | grep -i "siyuan\|plugin"
```

**Quick Deployment Script:**

A PowerShell script `deploy-android.ps1` is provided in the project root for quick deployment:

```powershell
# Run from project root
.\deploy-android.ps1
```

The script will:
1. Build the plugin
2. Push files to device
3. Install to SiYuan plugins directory
4. Fix file permissions
5. Verify installation

**Important Notes:**
- Android 11+ blocks direct access to `/Android/data/` without root
- Always restart SiYuan app after plugin deployment
- Use `window.openFileByURL()` for mobile navigation (not `openTab`)
- Mobile DOM structure differs: editor is in `#editor` element
- Ensure UTF-8 encoding without BOM for JSON files

## �📚 Resources

- [SiYuan Plugin API](https://github.com/siyuan-note/siyuan/blob/master/API.md)
- [Plugin Sample](https://github.com/siyuan-note/plugin-sample)
- [Community](https://github.com/siyuan-note/siyuan/discussions)
