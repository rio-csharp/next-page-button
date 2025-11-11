# Debug Mode Guide

## 🎯 Overview

The plugin includes a debug mode that outputs detailed logs to help troubleshoot issues during development.

## 📝 How to Enable

### Step 1: Edit Constants File

Open `src/utils/constants.ts` and change:

```typescript
export const DEBUG_MODE = false;  // Default (production)
```

to:

```typescript
export const DEBUG_MODE = true;   // Enable debug logs
```

### Step 2: Rebuild

```bash
pnpm run dev
# or for production build
pnpm run build
```

## 📊 What Gets Logged

When `DEBUG_MODE = true`, you'll see detailed logs in the browser console:

### Document Service Logs
- `[DEBUG-DocumentService]` - Document ID queries
- Retry attempts for new documents
- Notebook ID lookups
- Document position calculations

### UI Render Logs
- `[DEBUG-UIRender]` - Render lifecycle
- DOM element detection
- Container creation
- State updates

### Example Output
```
[DEBUG-DocumentService] Querying notebook ID for doc 20251111205732-3bfbf7t (attempt 1)
[DEBUG-DocumentService] No data found, retrying in 300ms... (1/5)
[DEBUG-DocumentService] Found notebook ID: 20251109202149-jw9bpuw
[DEBUG-UIRender] Current doc ID: 20251111205732-3bfbf7t
[DEBUG-UIRender] Position: 4/21
[DEBUG-UIRender] Container created
```

## ⚠️ Important Notes

### For Production Release

**Always set `DEBUG_MODE = false` before publishing!**

Why?
- Reduces console noise for end users
- Better performance (no unnecessary string formatting)
- Professional user experience
- Smaller bundle size

### For Development

Keep `DEBUG_MODE = true` when:
- Debugging new features
- Investigating user-reported issues
- Testing document creation flows
- Troubleshooting timing issues

## 🔍 Log Categories

### Always Logged (regardless of DEBUG_MODE)
- `[NextPageButton]` - Plugin lifecycle events
- `[DocumentService]` - Critical errors
- `[UIRenderService]` - Render failures
- `[NavigationService]` - Navigation errors

### Debug Only (when DEBUG_MODE = true)
- Database query details
- Retry attempts and delays
- DOM element searches
- Position calculations
- Container state changes

## 💡 Tips

1. **Use browser filter**: In DevTools Console, filter by "DEBUG" to see only debug logs
2. **Clear console**: Clear console before testing to see clean logs
3. **Timestamps**: Browser console shows timestamps for timing analysis
4. **Export logs**: Right-click console → Save as... to save logs for analysis
