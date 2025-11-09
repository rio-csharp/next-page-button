# Development Guide / 开发指南

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
# On Windows with UAC: pnpm run make-link-win

# Start development mode (with hot reload)
pnpm run dev
```

## 🛠 Tech Stack

- **TypeScript**: Main programming language
- **Vite**: Build tool with hot module replacement
- **SiYuan Plugin API**: Core plugin system
- **SCSS**: Styling

## 📁 Project Structure

```
next-page-button/
├── src/
│   ├── index.ts          # Main plugin logic
│   └── index.scss        # Styles for navigation buttons
├── public/
│   └── i18n/             # Internationalization files (empty for this plugin)
├── scripts/              # Build and development scripts
├── .github/
│   └── workflows/
│       └── release.yml   # Auto-release workflow
├── icon.png              # Plugin icon (160x160)
├── preview.png           # Preview screenshot (1024x768)
├── plugin.json           # Plugin manifest
└── README.md             # User documentation
```

## 🔧 Development Workflow

### Debug Mode

Enable detailed logging by setting `DEBUG = true` in `src/index.ts` (line 12):

```typescript
private readonly DEBUG = true; // Set to true for development
```

**Debug logs include:**
- Plugin loading status
- Document list loading count
- Document switch events
- Button insertion confirmation
- Document search process

**Remember to set `DEBUG = false` before release!**

### Log Types

The plugin uses two logging methods:

1. **`this.log(...)`** - Debug logs (controlled by `DEBUG` flag)
   - Only output in development mode
   - Used to track plugin execution

2. **`this.logError(...)`** - Error logs (always enabled)
   - Not affected by `DEBUG` flag
   - Used to record runtime errors for troubleshooting

### Build Commands

```bash
# Development mode (watch for changes)
pnpm run dev

# Production build
pnpm run build

# Update version (sync plugin.json and package.json)
pnpm run update-version

# Install to SiYuan plugins directory
pnpm run make-install
```

## 🏗 Architecture

### Core Components

**Document Loading (`loadDocList`, `loadDocsFromPath`)**
- Recursively fetches document tree using `listDocsByPath` API
- Maintains user's manual document order (drag & drop)
- Concurrent loading protection with `isLoadingDocs` flag

**Navigation UI (`createNavigationContainer`, `createButton`)**
- Creates prev/next buttons with disabled states
- Displays page indicator (e.g., "3 / 10")
- Integrated with SiYuan's theme system

**Event Handling**
- Listens to: `loaded-protyle-static`, `switch-protyle`, `loaded-protyle-dynamic`
- WebSocket monitoring: `ws-main` for real-time document changes
- Auto-refresh on create/delete/move/rename operations

**Navigation Logic (`navigateToDoc`)**
- Opens target document in current tab
- Error recovery with fallback search
- Smooth user experience

### Key Technical Decisions

**Why `listDocsByPath` API?**
- SQL ORDER BY `hpath` sorts alphabetically, not by user order
- `listDocsByPath` returns actual document tree order including manual reordering
- Recursive traversal ensures complete document hierarchy

**Concurrent Loading Protection**
- `isLoadingDocs` flag prevents race conditions
- Single source of truth for document list
- Better performance on rapid document switches

**Real-time Updates**
- WebSocket `ws-main` event captures all document mutations
- 500ms delay allows database sync before refresh
- Ensures navigation always reflects current state

## 🧪 Testing

### Manual Testing Checklist

- [ ] Navigation works in single-document notebook
- [ ] Navigation works in multi-level document tree
- [ ] First/last document shows disabled buttons
- [ ] Page indicator updates correctly
- [ ] Real-time updates on document create/delete
- [ ] Drag & drop reordering updates navigation
- [ ] Theme compatibility (light/dark modes)
- [ ] Multi-notebook switching works

### Test Scenarios

1. **Basic Navigation**: Open document, click next/prev buttons
2. **Boundary Cases**: First document (prev disabled), last document (next disabled)
3. **Real-time Updates**: Create/delete/move documents, check button updates
4. **Manual Reordering**: Drag documents in file tree, verify navigation order
5. **Multi-notebook**: Switch between notebooks, verify correct document list

## 📦 Release Process

### Version Update

```bash
# Update version in plugin.json and package.json
pnpm run update-version
```

### Create Release

1. Ensure `DEBUG = false` in `src/index.ts`
2. Update `CHANGELOG.md` with release notes
3. Commit changes: `git commit -m "release: v0.x.x"`
4. Create tag: `git tag v0.x.x`
5. Push: `git push && git push origin v0.x.x`
6. GitHub Actions automatically builds and creates release

### Submit to Plugin Marketplace

See [Plugin Marketplace Submission Guide](https://github.com/siyuan-note/bazaar#%E6%8F%92%E4%BB%B6)

## 🐛 Debugging Tips

### Common Issues

**Buttons not showing:**
- Check if plugin is enabled in settings
- Open browser DevTools console for errors
- Verify `DEBUG = true` and check logs

**Wrong document order:**
- Verify using `listDocsByPath` API, not SQL
- Check recursive traversal logic in `loadDocsFromPath`

**Navigation not updating:**
- Check WebSocket event listener is registered
- Verify 500ms delay for database sync
- Ensure `loadDocList` is called on updates

## 🤝 Contributing

### Code Style

- Use TypeScript strict mode
- Follow existing code structure
- Add comments for complex logic
- Keep functions focused and small

### Pull Request Process

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Make changes and test thoroughly
4. Commit: `git commit -m "feat: add amazing feature"`
5. Push: `git push origin feature/amazing-feature`
6. Open Pull Request with clear description

### Commit Message Convention

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Test additions/changes
- `chore:` Build process or tooling changes

## 📚 Resources

- [SiYuan Plugin API Documentation](https://github.com/siyuan-note/siyuan/blob/master/API.md)
- [SiYuan Plugin Sample](https://github.com/siyuan-note/plugin-sample)
- [Plugin Development Community](https://github.com/siyuan-note/siyuan/discussions)

## 📄 License

MIT License - see [LICENSE](LICENSE) for details

```bash
# 开发模式（热重载）
pnpm dev

# 生产构建
pnpm build
```
