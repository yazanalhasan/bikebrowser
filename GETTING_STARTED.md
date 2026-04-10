# 🚴 BikeBrowser - Complete Getting Started Guide

## ⚠️ IMPORTANT: First-Time Installation

### Step 1: Install Node.js (REQUIRED)

**You must install Node.js before running this project.**

1. **Download Node.js**:
   - Visit: https://nodejs.org/
   - Download the **LTS version** (Long Term Support)
   - For Windows: Download the `.msi` installer (64-bit recommended)

2. **Install Node.js**:
   - Run the downloaded installer
   - Accept all default options
   - Make sure "Add to PATH" is checked
   - Restart your computer after installation

3. **Verify Installation**:
   - Open PowerShell or Command Prompt
   - Run: `node --version`
   - Should show: `v18.x.x` or higher
   - Run: `npm --version`
   - Should show: `9.x.x` or higher

**If you see "npm is not recognized", Node.js is not installed or not in your PATH. Please install it first.**

---

## Step 2: Install Project Dependencies

Once Node.js is installed:

### Option A: Easy Way (Recommended)

**Double-click `run.bat`** in the project folder.

This script will:
- Check if Node.js is installed
- Install all dependencies automatically
- Start the application
- Show helpful error messages if anything fails

### Option B: Manual Way

Open PowerShell in the project folder and run:

```powershell
npm install
```

This will take 2-5 minutes on first run (downloads ~300MB of packages).

**Common Installation Issues:**

**Issue**: `better-sqlite3` build errors

**Solution**: Install Windows Build Tools (run as Administrator):
```powershell
npm install --global windows-build-tools
```

Or install Visual Studio Build Tools manually from:
https://visualstudio.microsoft.com/downloads/

**Issue**: Network errors during install

**Solution**: Check internet connection, try again, or use:
```powershell
npm install --registry=https://registry.npmjs.org/
```

---

## Step 3: Run the Application

### Option A: Easy Way

**Double-click `run.bat`**

### Option B: Manual Way

```powershell
npm run dev
```

This will:
1. Start the Vite development server (React)
2. Launch the Electron app
3. Open Developer Tools automatically (for debugging)

**The app window should open within 10-15 seconds.**

---

## Step 4: Try It Out!

### What to Do First:

1. **Home Screen**:
   - You'll see colorful topic tiles (Bikes, E-Bikes, BMX, etc.)
   - Click any tile to see curated videos on that topic
   - Or use the search bar to search for anything (e.g., "how to fix a bike")

2. **Search for Videos**:
   - Enter: "bike repair tutorial"
   - Press Search or Enter
   - Wait 2-5 seconds for results
   - See ranked videos with trust badges:
     - 🟢 Green = Trusted educational channel
     - 🔵 Blue = Relevant content
     - 🟡 Yellow = Less relevant
     - 🔴 Red = Off-topic

3. **Watch a Video**:
   - Click any video card
   - Video plays in embedded YouTube player
   - See educational score and explanation
   - Notice "Learning Tip" reminder at the bottom

4. **Try Different Searches**:
   - "BMX tricks for beginners"
   - "electric bike motor"
   - "mountain bike suspension"
   - "dirt bike maintenance"

---

## Understanding the Ranking System

### How Videos Are Ranked:

**BikeBrowser doesn't just show all YouTube results - it ranks them by educational value!**

The ranking algorithm considers:

1. **Channel Trust** (most important):
   - 10 pre-loaded trusted bike education channels
   - Examples: Park Tool, Seth's Bike Hacks, GMBN
   - Trusted channels always appear at the top

2. **Topical Relevance**:
   - Does the video discuss bikes, building, repair, etc.?
   - Keywords: bike, BMX, tutorial, repair, engineering

3. **Educational Signals**:
   - Is it a "how-to" or tutorial?
   - Does it teach something?
   - Technical vocabulary (gears, suspension, torque)

4. **Entertainment Signals** (negative):
   - Clickbait titles (ALL CAPS!!! SHOCKING!!!)
   - Drama, pranks, challenges
   - Off-topic gaming or vlog content

5. **Video Duration**:
   - 2-20 minutes = ideal tutorial length
   - Too short (<2 min) = likely clickbait
   - Too long (>30 min) = might be rambling

### Trust Badges Explained:

- **🟢 Trusted Channel** (Score 70+): Great educational content, prioritized
- **🔵 Relevant** (Score 40-69): Good for learning, shown normally
- **🟡 Less Relevant** (Score 20-39): Might be off-topic, shown at bottom
- **🔴 Off-Topic** (Score <20): Not about bikes/learning, hidden or grayed out

---

## Troubleshooting

### App Won't Start

**Symptom**: Error messages, blank screen, or crashes

**Solutions**:
1. Check Node.js is installed: `node --version`
2. Reinstall dependencies:
   ```powershell
   Remove-Item -Recurse -Force node_modules
   Remove-Item package-lock.json
   npm install
   ```
3. Check console errors in Developer Tools (auto-opens)
4. Delete database and restart:
   ```powershell
   Remove-Item data\bikebrowser.db -ErrorAction SilentlyContinue
   npm run dev
   ```

### Search Returns No Results

**Symptom**: Search completes but shows "No videos found"

**Possible Causes**:
1. **YouTube changed their HTML structure** (scraping broke)
   - Check console for errors
   - This is a known limitation of HTML scraping
   - Future versions will use YouTube API
2. **Network errors**
   - Check internet connection
   - YouTube might be blocked by firewall
3. **Very specific search query**
   - Try broader terms: "bikes" instead of "1997 BMX GT Pro Series"

**Workaround**: Try different search terms, restart app

### Videos Won't Play

**Symptom**: Black screen or error when clicking video

**Solutions**:
1. Check internet connection
2. Try clicking "Back" and selecting a different video
3. Check if YouTube.com works in a regular browser
4. Some videos may have embedding disabled by the creator

### Port 5173 Already in Use

**Symptom**: Error: "Port 5173 is already in use"

**Solution**:
```powershell
npx kill-port 5173
# Then restart:
npm run dev
```

### Database Errors

**Symptom**: "Cannot read from database" or similar errors

**Solution**: Delete and recreate database:
```powershell
Remove-Item data\bikebrowser.db -ErrorAction SilentlyContinue
npm run dev
```

The database will be recreated automatically with 10 trusted channels.

---

## Project Structure Quick Reference

```
bikebrowser/
├── run.bat                 ← CLICK THIS to run (easiest way)
├── package.json            ← Project configuration
├── src/
│   ├── main/              ← Electron backend (Node.js)
│   ├── renderer/          ← React frontend (UI)
│   └── services/          ← Ranking engine, database, scraper
├── data/
│   └── bikebrowser.db     ← SQLite database (auto-created)
└── docs/
    ├── SETUP.md           ← Detailed setup instructions
    ├── DEVELOPMENT.md     ← Technical documentation
    ├── QUICKSTART.md      ← Quick start guide
    └── STATUS.md          ← Implementation status
```

---

## What's Next?

### Current Status: MVP Complete ✅

**What Works:**
- ✅ YouTube search with intelligent ranking
- ✅ Trusted channel system (10 pre-loaded channels)
- ✅ Educational scoring algorithm
- ✅ Kid-friendly UI with topic tiles
- ✅ Video playback with explanations
- ✅ Trust badges and score visualization

**Coming in Future Phases:**

- **Phase 2**: Better ranking, YouTube API integration, richer explanations
- **Phase 3**: Parent dashboard with history and trust management
- **Phase 4**: Shopping (eBay, Amazon, OfferUp), saved bike builds
- **Phase 5**: Educational missions and progress tracking

### Want to Customize?

**Add Your Own Trusted Channels:**

1. Open `data/bikebrowser.db` with SQLite browser
2. Insert into `channels` table:
   ```sql
   INSERT INTO channels (channel_id, channel_name, trust_level, parent_notes)
   VALUES ('CHANNEL_ID', 'Channel Name', 'trusted', 'Your notes');
   ```
3. Find channel ID: Go to channel on YouTube, look at URL: 
   `youtube.com/channel/CHANNEL_ID`

**Or wait for Phase 3** when you can add channels through the parent dashboard UI!

---

## Need Help?

1. **Check the console** (Developer Tools auto-opens)
   - Look for error messages in red
   - Check "Console" tab for details

2. **Read the docs**:
   - `SETUP.md` - Detailed setup
   - `DEVELOPMENT.md` - Technical details
   - `QUICKSTART.md` - Quick reference

3. **Common fixes**:
   - Restart the app (Ctrl+C then `npm run dev`)
   - Delete database (see Troubleshooting above)
   - Reinstall dependencies (`npm install`)
   - Restart computer (if Node.js just installed)

---

## Development Mode vs Production

**Development Mode** (what you're running):
- `npm run dev`
- Hot-reload enabled (changes apply instantly)
- Developer Tools visible
- Detailed error messages
- Connected to localhost:5173

**Production Mode** (for distribution):
- `npm run build` then `npm run build:electron`
- Creates installer in `dist/` folder
- No Developer Tools
- Optimized performance
- Standalone executable

For now, stick with Development Mode for testing!

---

## Success Checklist

After following this guide, you should be able to:

- [ ] Node.js is installed (`node --version` works)
- [ ] Dependencies are installed (`node_modules/` folder exists)
- [ ] App launches (`npm run dev` opens Electron window)
- [ ] Home screen shows topic tiles
- [ ] Search for "bike repair" returns ranked results
- [ ] Trusted channels (Park Tool, etc.) have green badges
- [ ] Clicking a video opens watch page with player
- [ ] Educational score bar is visible

If all checkboxes are checked: **Congratulations! BikeBrowser is working! 🎉**

---

**Created**: March 22, 2026  
**Version**: 0.1.0 (MVP)  
**Status**: Ready for Testing
