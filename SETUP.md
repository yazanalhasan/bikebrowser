# BikeBrowser Setup Guide

## Prerequisites

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** (optional, for version control)

## Installation Steps

### 1. Navigate to Project Directory

```bash
cd c:\Users\yazan\bikebrowser
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages:
- Electron (desktop framework)
- React (UI framework)
- Vite (build tool)
- Tailwind CSS (styling)
- better-sqlite3 (database)
- axios & cheerio (YouTube scraping)
- And other dependencies...

**Note**: On Windows, better-sqlite3 requires build tools. If you encounter errors:

```bash
npm install --global windows-build-tools
```

Or install Visual Studio Build Tools manually.

### 3. Initialize Database

The database will be automatically created on first run, but you can manually initialize it:

```bash
node -e "require('./src/services/db').init()"
```

This creates:
- `data/bikebrowser.db` - SQLite database
- Pre-populated with trusted bike channels

### 4. Run the Application

#### Development Mode (with hot reload):

```bash
npm run dev
```

This starts:
1. Vite dev server for React (port 5173)
2. Electron app with DevTools open

#### Production Mode:

```bash
npm start
```

Runs Electron with the built React app.

## First-Time Setup

### Optional: Configure Environment Variables

Copy the example environment file:

```bash
copy .env.example .env
```

Edit `.env` to add API keys (optional for MVP):
- `EBAY_APP_ID` - For eBay shopping (Phase 4)
- `YOUTUBE_API_KEY` - For YouTube API instead of scraping (Phase 2+)

## Troubleshooting

### "Cannot find module" errors

```bash
# Clear npm cache and reinstall
npm cache clean --force
rmdir /s /q node_modules
del package-lock.json
npm install
```

### Database errors

```bash
# Delete and reinitialize database
del data\bikebrowser.db
node -e "require('./src/services/db').init()"
```

### Port 5173 already in use

Kill the process using port 5173:

```powershell
# Find process
netstat -ano | findstr :5173

# Kill process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### YouTube scraping not working

YouTube frequently changes their HTML structure. If scraping fails:

1. Check console for errors
2. Consider switching to YouTube API (requires API key in `.env`)
3. Update scraper logic in `src/services/youtubeScraper.js`

## Building for Distribution

### Build the app:

```bash
npm run build
npm run build:electron
```

This creates distributable packages in the `dist/` folder:
- Windows: `.exe` installer
- macOS: `.dmg` installer

## Project Structure

```
bikebrowser/
├── src/
│   ├── main/              # Electron main process
│   │   ├── main.js        # App entry point
│   │   └── youtubeInterceptor.js
│   ├── preload/           # IPC bridge
│   │   └── preload.js
│   ├── renderer/          # React UI
│   │   ├── pages/         # Main pages
│   │   ├── components/    # Reusable components
│   │   └── App.jsx
│   └── services/          # Backend services
│       ├── rankingEngine.js
│       ├── youtubeScraper.js
│       ├── fastRules.js
│       ├── featureExtractor.js
│       └── db.js
├── data/
│   ├── schema.sql         # Database schema
│   └── bikebrowser.db     # SQLite database (created on first run)
├── package.json
└── vite.config.js
```

## Next Steps

After setup, you can:

1. **Test searching**: Enter a query like "bike repair"
2. **View ranked results**: Videos are sorted by educational value
3. **Watch videos**: Click any video card to watch with overlays
4. **Check trust badges**: Green = trusted, Blue = relevant, Yellow = downranked

## Development Workflow

1. Make changes to files
2. Vite hot-reloads React components automatically
3. For Electron main process changes, restart with `Ctrl+C` then `npm run dev`
4. For database schema changes, delete `data/bikebrowser.db` and restart

## Support

- Check `DEVELOPMENT.md` for detailed development notes
- Review `PLANNING.md` for feature roadmap
- See console logs for debugging (DevTools auto-opens in dev mode)

## What Works in MVP

✅ YouTube search with scraping
✅ Video ranking (fast rules + feature extraction)
✅ Trust list (10 pre-loaded bike channels)
✅ Child-friendly UI with topic tiles
✅ Video playback with educational overlays
✅ Score explanations and trust badges

## Coming in Future Phases

- Phase 2: Enhanced feature extraction, better explanations
- Phase 3: Parent dashboard with history and trust management
- Phase 4: Shopping integration (eBay, Amazon, OfferUp)
- Phase 5: Educational missions and progress tracking
