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
│   └── i18n/             # Internationalization files
├── scripts/              # Build and development scripts
├── icon.png              # Plugin icon (160x160)
├── preview.png           # Preview screenshot
├── plugin.json           # Plugin manifest
└── README.md             # User documentation
```

## 🔧 Development

### Debug Mode

Enable detailed logging in `src/index.ts`:

```typescript
private readonly DEBUG = true; // Set to false before release
```

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

- **Document Loading**: Recursively fetches document tree using `listDocsByPath` API, maintains user's manual document order
- **Navigation UI**: Creates prev/next buttons with disabled states and page indicator
- **Event Handling**: Listens to document load/switch events and WebSocket updates
- **Navigation Logic**: Opens target document with error recovery

### Key Design

- Uses `listDocsByPath` API to preserve user's drag-drop document order
- WebSocket monitoring for real-time updates (500ms delay for DB sync)
- Concurrent loading protection with `isLoadingDocs` flag

## 🤝 Contributing

### Code Style

- Use TypeScript strict mode
- Follow existing code structure
- Add comments for complex logic
- Keep functions focused and small

### Commit Convention

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `refactor:` Code refactoring
- `chore:` Build/tooling changes

## 📚 Resources

- [SiYuan Plugin API](https://github.com/siyuan-note/siyuan/blob/master/API.md)
- [Plugin Sample](https://github.com/siyuan-note/plugin-sample)
- [Community](https://github.com/siyuan-note/siyuan/discussions)
