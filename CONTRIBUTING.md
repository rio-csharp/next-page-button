# Contributing to Next Page Button

Thank you for your interest in contributing! 🎉

We appreciate any contributions, whether it's bug reports, feature suggestions, documentation improvements, or code changes.

## How to Contribute

### Reporting Issues

Found a bug or have a feature request? Please [open an issue](https://github.com/rio-csharp/next-page-button/issues/new) with:

- **Clear description** of the issue or feature request
- **Steps to reproduce** (for bugs)
- **Expected vs actual behavior**
- **Screenshots** (if applicable)
- **Environment information**:
  - SiYuan version
  - Plugin version
  - Operating system
  - Browser (if relevant)

### Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Test thoroughly
5. Commit with clear messages: `git commit -m "feat: add amazing feature"`
6. Push: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Development Setup

See [DEVELOPMENT.md](https://github.com/rio-csharp/next-page-button/blob/main/DEVELOPMENT.md) for complete development guide.

```bash
pnpm install
pnpm run make-link
pnpm run dev
```

### Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code formatting (no logic change)
- `refactor:` Code restructuring (no behavior change)
- `perf:` Performance improvements
- `test:` Adding or updating tests
- `chore:` Build scripts, dependencies, etc.

**Examples:**
```
feat: add support for custom button text
fix: resolve memory leak in event handlers
docs: update installation instructions
refactor: simplify navigation logic
```

### Code Standards

#### General Principles
- **Type Safety**: Use TypeScript with strict mode
- **Error Handling**: Always use try-catch for async operations
- **Memory Safety**: Clean up event listeners and DOM references
- **Performance**: Avoid unnecessary re-renders and DOM operations
- **Documentation**: Add JSDoc comments for complex functions

#### Code Style
- Use meaningful variable names
- Keep functions small and focused (single responsibility)
- Prefer `const` over `let`, avoid `var`
- Use optional chaining (`?.`) for safe property access
- Add comments for non-obvious logic
- Follow existing code structure

#### Before Submitting
- [ ] Code compiles without errors
- [ ] No TypeScript errors
- [ ] Tested in SiYuan
- [ ] No console errors or warnings
- [ ] Memory-safe (no leaks)
- [ ] Follows project conventions

## Questions?

Feel free to ask in [Discussions](https://github.com/rio-csharp/next-page-button/discussions) or [Issues](https://github.com/rio-csharp/next-page-button/issues).

Thank you! 🙏
