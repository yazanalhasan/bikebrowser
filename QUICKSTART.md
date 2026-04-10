# Quick Start Guide

## First Time Setup

1. **Install Node.js** (if not already installed):
   - Download from https://nodejs.org/ (v18 or higher)
   - Verify: `node --version` should show v18+

2. **Install dependencies**:
   ```bash
   npm install
   ```
   
   If you get errors with `better-sqlite3`, you may need build tools:
   ```bash
   npm install --global windows-build-tools
   ```

3. **Run the app**:
   ```bash
   npm run dev
   ```

That's it! The app should open automatically.

## Daily Development

Just run:
```bash
npm run dev
```

## Testing Your Changes

1. Make changes to any file
2. React components hot-reload automatically
3. For Electron changes, restart with `Ctrl+C` then `npm run dev`

## What to Try

1. Click a topic tile (e.g., "Bikes")
2. Or search for "bike repair"
3. See ranked results with trust badges
4. Click any video to watch
5. Notice educational scores and explanations

## Common Issues

**Port already in use?**
```bash
npx kill-port 5173
```

**Database issues?**
```bash
del data\bikebrowser.db
npm run dev
```

**Modules not found?**
```bash
rmdir /s /q node_modules
npm install
```

## Need Help?

- Check `SETUP.md` for detailed setup instructions
- Check `DEVELOPMENT.md` for technical details
- Check console logs in the Developer Tools (auto-opens)
