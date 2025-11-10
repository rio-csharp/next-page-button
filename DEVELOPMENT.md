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

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

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

## 📚 Resources

- [SiYuan Plugin API](https://github.com/siyuan-note/siyuan/blob/master/API.md)
- [Plugin Sample](https://github.com/siyuan-note/plugin-sample)
- [Community](https://github.com/siyuan-note/siyuan/discussions)
