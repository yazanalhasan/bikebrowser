# Development Notes

## MVP Status: ✅ COMPLETE

All Sprint 0-4 features implemented:
- ✅ Electron + React + Tailwind boilerplate
- ✅ YouTube interception and scraping
- ✅ Fast ranking engine with trust list
- ✅ Feature extraction for scoring
- ✅ React UI with video cards and trust badges
- ✅ Video playback with overlays

## How It Works

### YouTube Interception Flow

1. User enters search query in home page
2. App navigates to `/youtube/search?q=query`
3. `YouTubeSearchView` calls `window.api.youtubeSearch(query)`
4. IPC message sent to Electron main process
5. Main process calls `rankingEngine.processSearch(query)`
6. Ranking engine:
   - Scrapes YouTube search results via `youtubeScraper`
   - Extracts metadata for each video
   - Scores each video using fast rules + feature extraction
   - Checks channel trust list via database
   - Sorts by final score
   - Returns ranked list to renderer
7. UI displays video cards with trust badges

### Scoring System

**Components:**
1. **Fast Rules** (`fastRules.js`):
   - Keyword matching (positive/negative)
   - Title quality analysis (caps ratio, punctuation)
   - Duration heuristics (ideal 2-20 minutes)
   - View count bonus

2. **Feature Extraction** (`featureExtractor.js`):
   - Topical relevance (0-100): bike-related keyword density
   - Educational signals (0-100): tutorial patterns, technical terms
   - Entertainment signals (0-100): clickbait, sensationalism
   - Complexity score (0-100): reading level estimation

3. **Trust Bonus**:
   - Trusted channel: +25 points
   - Blocked channel: -200 points (forces to bottom)

4. **Final Score**:
   ```
   score = fastScore + 
           (0.4 * topicalRelevance) +
           (0.3 * educationalSignals) -
           (0.2 * entertainmentSignals) +
           (0.1 * complexityScore) +
           trustBonus
   ```

**Thresholds:**
- ≥70: Prioritized (green badge)
- ≥40: Allowed (blue badge)
- ≥20: Downranked (yellow badge)
- <20: Blocked (red badge, or hidden)

### Database

**SQLite** (`data/bikebrowser.db`)

**Tables (MVP uses only channels and ranking_cache):**
- `channels`: Channel trust list (10 pre-populated trusted channels)
- `ranking_cache`: Cached scores (7-day TTL)
- `video_overrides`: Manual rating overrides (Phase 3)
- `watch_history`: Viewing history (Phase 3)
- `saved_builds`: Bike builds (Phase 4)
- `build_parts`: Parts in builds (Phase 4)
- `missions`: Educational goals (Phase 5)
- `mission_progress`: Mission tracking (Phase 5)

### Pre-loaded Trusted Channels

1. Park Tool - Professional bike repair
2. Seth's Bike Hacks - Mountain bike education
3. GMBN - Global Mountain Bike Network
4. GCN Tech - Technical cycling
5. BikeRadar - Reviews and tutorials
6. RJ The Bike Guy - Repair and maintenance
7. Berm Peak - Building and trail projects
8. BikemanforU - Bike building
9. EMBN - Electric Mountain Bike Network
10. Just Riding Along - Bike mechanics

## API Integration Status

### ✅ Integrated APIs (Phase 2)

**OpenAI (GPT-4):**
- Purpose: Child-friendly explanations, content safety, search suggestions
- Methods: 4 (explain, getSearchSuggestions, checkSafety, simplify)
- Status: Fully integrated, ready for use

**Google Maps Places:**
- Purpose: Find local bike shops, repair shops
- Methods: 4 (search, searchNearby, getDetails, findBikeShops)
- Status: Fully integrated, ready for use

**Marketcheck:**
- Purpose: Motorcycle/bike marketplace listings
- Methods: 6 (search, searchMotorcycles, searchElectricBikes, searchDirtBikes, getStats, comparePrices)
- Status: Fully integrated, ready for use

**Security:**
- All API keys stored in `.env` (gitignored)
- Keys loaded only in Electron main process
- IPC bridge prevents frontend key access
- contextBridge isolates renderer from Node.js

## File Architecture

### Electron Main Process
- `src/main/main.js`: App entry, window management, IPC handlers
- `src/main/youtubeInterceptor.js`: Detects YouTube URLs (currently listens to navigation events)

### Preload (IPC Bridge)
- `src/preload/preload.js`: Exposes `window.api` to renderer with security

### Services (Node.js)
- `src/services/rankingEngine.js`: Orchestrates scoring
- `src/services/youtubeScraper.js`: Parses YouTube HTML (ytInitialData)
- `src/services/fastRules.js`: Keyword-based scoring
- `src/services/featureExtractor.js`: Advanced feature extraction
- `src/services/db.js`: SQLite wrapper with prepared statements

### React Renderer
- `src/renderer/pages/HomePage.jsx`: Landing page with topic tiles
- `src/renderer/pages/YouTubeSearchView.jsx`: Search results with ranked videos
- `src/renderer/pages/VideoWatchPage.jsx`: Video player with metadata overlay
- `src/renderer/components/VideoCard.jsx`: Video thumbnail card with trust badge
- `src/renderer/components/TopicTile.jsx`: Topic category tile
- `src/renderer/components/LoadingSpinner.jsx`: Loading indicator

### Styles
- `src/renderer/index.css`: Global styles, Tailwind imports, kid-friendly theme

## Known Issues / Tech Debt

### 1. YouTube Scraping Fragility
**Issue**: YouTube HTML parsing breaks when YouTube changes structure.

**Impact**: Video search fails completely.

**Solutions**:
- **Short-term**: Add error handling with user-friendly message
- **Long-term**: Migrate to YouTube Data API v3 (requires API key, has quota limits)

**Code location**: `src/services/youtubeScraper.js`

### 2. No Actual Request Interception Yet
**Issue**: Current implementation listens to navigation events, doesn't fully intercept/replace YouTube UI.

**Impact**: If user navigates directly to youtube.com, they see real YouTube.

**Solutions**:
- Use Electron `session.webRequest` API to block YouTube domains
- Force all YouTube queries through our ranking system
- Block direct YouTube access entirely

**Code location**: `src/main/youtubeInterceptor.js` (needs enhancement)

### 3. Ranking Cache Never Expires
**Issue**: Cache query only checks 7-day expiration but never runs cleanup.

**Impact**: Database grows indefinitely.

**Solutions**:
- Add periodic cleanup job (every app start or weekly)
- Implement in `src/services/db.js::rankingCache.clearOld()`

### 4. No Error Handling for Missing Metadata
**Issue**: If YouTube video lacks title/channel/thumbnail, app may crash.

**Impact**: UI breaks for malformed data.

**Solutions**:
- Add null checks and default values throughout scraper
- Validate video objects before passing to UI

**Code location**: `src/services/youtubeScraper.js`

### 5. Hardcoded Weights and Thresholds
**Issue**: Scoring weights are hardcoded in `rankingEngine.js`.

**Impact**: Parents can't tune sensitivity (Phase 3 feature).

**Solutions**:
- Move to database settings table
- Add parent UI for threshold adjustment
- Expose in parent dashboard (Phase 3)

## Testing Strategy (Manual MVP)

### Test Case 1: Basic Search
1. Launch app
2. Enter "bike repair" in search
3. **Expected**: 10+ videos, trusted channels at top, relevant results
4. **Check**: Green badges on Park Tool, RJ The Bike Guy videos

### Test Case 2: Off-Topic Search
1. Search "gaming"
2. **Expected**: Few or no results, any results have yellow/red badges
3. **Check**: Explanation says "off-topic" or "not about bikes"

### Test Case 3: Educational Content Prioritization
1. Search "how to fix bike brakes"
2. **Expected**: Tutorial videos at top, vlogs at bottom
3. **Check**: Videos with "tutorial" or "how to" rank higher

### Test Case 4: Video Playback
1. Click any video card
2. **Expected**: Navigate to watch page, YouTube iframe loads, metadata shown
3. **Check**: Trust badge and explanation visible, score bar displayed

### Test Case 5: Trust List
1. Manually query database: `SELECT * FROM channels`
2. **Expected**: 10 trusted channels present
3. Search for one of those channels
4. **Expected**: Their videos have green "Trusted Channel" badge

## Performance Considerations

### Current Performance (MVP)
- Search time: ~2-5 seconds (YouTube scraping + scoring)
- Cached searches: ~500ms (database lookup only)
- Memory: ~150MB (Electron baseline + Chromium)

### Bottlenecks
1. **YouTube scraping**: Network latency (2-3s)
2. **Feature extraction**: CPU-bound (50-100ms per video)
3. **Database**: Negligible (<10ms for queries)

### Optimization Opportunities (Future)
- Parallel scraping and scoring
- Web workers for feature extraction
- Pre-fetch video metadata on hover
- Service worker for offline caching

## Security Notes

### Current Security Posture
- ✅ Context isolation enabled
- ✅ Node integration disabled in renderer
- ✅ Preload script with limited API surface
- ✅ Parameterized SQL queries (prevents injection)
- ❌ No sandboxing for network requests
- ❌ No parent authentication yet (Phase 3)

### Risks
1. **YouTube scraping**: App makes raw HTTP requests to YouTube (could expose child's IP)
2. **No content filtering**: YouTube iframe can load any video (no CSP on embedded content)
3. **Local database**: Anyone with file access can modify trust list

### Mitigations (Future Phases)
- Add parent password protection (Phase 3)
- Implement network request logging
- Consider VPN or proxy for YouTube requests
- Add CSP headers to restrict iframe domains

## Next Development Steps (Phase 2)

1. **Improve scraping reliability**:
   - Add fallback to YouTube API
   - Better error messages
   - Retry logic for failed requests

2. **Enhanced explanations**:
   - Richer feature breakdown in UI
   - "Why is this ranked here?" tooltip
   - Substitute video suggestions for blocked content

3. **UI polish**:
   - Skeleton loaders during search
   - Smooth transitions between pages
   - Better mobile/small window support

4. **Testing**:
   - Unit tests for ranking logic
   - Integration tests for scraper
   - E2E tests with Playwright

## API Surface (window.api)

Exposed to renderer via preload:

```javascript
window.api = {
  // YouTube
  youtubeSearch(query) -> { success, videos[], error }
  getVideoDetails(videoId) -> { success, details, error }
  
  // Navigation
  navigate(url) -> void
  
  // Database (future)
  getHistory() -> { success, history[] }
  getTrustList() -> { success, channels[] }
  
  // Event listeners
  onYoutubeIntercepted(callback) -> void
  removeYoutubeInterceptedListener() -> void
  
  // ✨ NEW: External APIs (Added in Phase 2)
  ai: {
    explain(query) -> { success, explanation, error }
    getSearchSuggestions(topic) -> { success, suggestions[], error }
    checkSafety(title, description) -> { success, appropriate, reason, error }
    simplify(text) -> { success, simplified, error }
  }
  
  places: {
    search(query) -> { success, places[], error }
    searchNearby(lat, lng, type, radius) -> { success, places[], error }
    getDetails(placeId) -> { success, details, error }
    findBikeShops(location) -> { success, shops[], error }
  }
  
  market: {
    search(query, options) -> { success, listings[], error }
    searchMotorcycles(query, filters) -> { success, listings[], error }
    searchElectricBikes(filters) -> { success, listings[], error }
    searchDirtBikes(filters) -> { success, listings[], error }
    getStats(query) -> { success, stats, error }
    comparePrices(listings) -> { success, comparison, error }
  }
}
```

## 🚀 External API Integration (Phase 2 Enhancement)

### Overview

BikeBrowser now integrates three powerful external APIs to enhance the learning experience:

1. **OpenAI** (GPT-4) - AI-powered explanations and content analysis
2. **Google Maps Places** - Local bike shop and repair shop search
3. **Marketcheck** - Motorcycle and bike marketplace listings

### Architecture

**Security-First Design:**

All API keys are stored in `.env` and loaded ONLY in the Electron main process. The renderer process has NO access to keys.

```
Frontend (React) 
    ↓ IPC
Preload (contextBridge) - Exposes safe methods
    ↓ IPC  
Main Process - Has API keys, makes actual calls
    ↓ HTTPS
External APIs (OpenAI, Google, Marketcheck)
```

**Files:**
- `.env` - API keys (gitignored, NEVER commit!)
- `src/services/aiService.js` - OpenAI integration
- `src/services/googlePlacesService.js` - Google Places integration
- `src/services/marketService.js` - Marketcheck integration
- `src/main/main.js` - Loads dotenv, adds IPC handlers
- `src/preload/preload.js` - Exposes window.api.ai/places/market

### Setup

1. **Install dependencies:**
```bash
npm install dotenv openai
```

2. **Create `.env` file in project root:**
```bash
OPENAI_API_KEY=sk-proj-your-key-here
GOOGLE_MAPS_API_KEY=AIzaSy-your-key-here
MARKETCHECK_API_KEY=your-marketcheck-key
```

3. **Verify on startup:**
Check console for:
```
Environment variables loaded: {
  hasOpenAI: true,
  hasGoogleMaps: true,
  hasMarketcheck: true
}
```

### Use Cases

#### OpenAI (aiService.js)

**1. Explain Complex Topics**
```javascript
const result = await window.api.ai.explain("how does a bike derailleur work");
// Returns kid-friendly explanation
```

**Use Case:** "Explain This" button on video cards, product descriptions

**2. Generate Search Suggestions**
```javascript
const result = await window.api.ai.getSearchSuggestions("BMX bikes");
// Returns: ["how to choose a BMX bike", "BMX bike parts", ...]
```

**Use Case:** "Learn More" suggestions, guided exploration

**3. Safety Checking**
```javascript
const result = await window.api.ai.checkSafety(videoTitle, videoDescription);
// Returns: { appropriate: true/false, reason: "..." }
```

**Use Case:** Additional layer for video ranking, filter inappropriate content

**4. Simplify Technical Content**
```javascript
const result = await window.api.ai.simplify("Hydraulic disc brakes utilize...");
// Returns simpler version for kids
```

**Use Case:** Convert product specifications, tutorial text

#### Google Places (googlePlacesService.js)

**1. Find Bike Shops**
```javascript
const result = await window.api.places.findBikeShops("85255");
// Returns nearby bike shops with ratings, hours, contact info
```

**Use Case:** "Need Help?" widget, local shop finder

**2. Search Places**
```javascript
const result = await window.api.places.search("bike repair near Phoenix");
```

**Use Case:** General local search

**3. Get Place Details**
```javascript
const result = await window.api.places.getDetails(placeId);
// Returns full details: photos, hours, reviews
```

**Use Case:** Shop detail pages

#### Marketcheck (marketService.js)

**1. Search Dirt Bikes**
```javascript
const result = await window.api.market.searchDirtBikes({
  priceMax: 5000,
  yearMin: 2018,
  zip: "85255",
  radius: 50
});
```

**Use Case:** Marketplace page, dream bike shopping

**2. Get Market Stats**
```javascript
const result = await window.api.market.getStats("kawasaki dirt bike");
// Returns: averagePrice, priceRange, totalListings
```

**Use Case:** "Is this a good deal?" helper, price education

**3. Compare Prices**
```javascript
const result = await window.api.market.comparePrices(listings);
// Returns: lowest, highest, average, median
```

**Use Case:** Price comparison tool

### Cost Management

**OpenAI:**
- GPT-4 costs ~$0.03 per explanation
- **Mitigation:** Cache explanations, limit to user-initiated actions
- **Budget:** $30/month = ~1000 explanations

**Google Places:**
- $200/month free credit
- ~$0.017 per search = ~11,000 free searches/month
- **Mitigation:** Cache results, debounce search inputs

**Marketcheck:**
- Check plan limits
- **Mitigation:** Cache listings, paginate results

### Components Using APIs

**Created:**
- `src/renderer/components/APIComponents.jsx`:
  - `VideoExplanation` - "Explain This" button for videos
  - `SafetyChecker` - AI safety validation
  - `SmartSuggestions` - AI-generated search suggestions
  - `NearbyShopsWidget` - Local bike shop finder
  - `BikeMarketplace` - Full marketplace browsing

**Example Usage:**
```jsx
import { VideoExplanation, NearbyShopsWidget } from './components/APIComponents';

<VideoExplanation videoTitle={video.title} videoDescription={video.description} />
<NearbyShopsWidget zipCode="85255" />
```

### Testing APIs

**In Browser Console:**
```javascript
// Test OpenAI
window.api.ai.explain("how bikes work").then(console.log);

// Test Google Places
window.api.places.findBikeShops("Phoenix AZ").then(console.log);

// Test Marketcheck
window.api.market.searchDirtBikes({rows: 5}).then(console.log);
```

### Error Handling

All API methods return:
```javascript
{
  success: true/false,
  // On success: data fields
  // On failure: error field
}
```

**Always check success:**
```javascript
const result = await window.api.ai.explain(query);
if (result.success) {
  // Use result data
} else {
  console.error('API error:', result.error);
  // Show user-friendly message
}
```

### Documentation

See `API_INTEGRATION.md` for:
- Complete API reference
- Integration examples
- Troubleshooting guide
- Security best practices

## Environment Setup for Development

### Required Node Version
Node.js 18+ (for better-sqlite3 compatibility)

### Recommended VSCode Extensions
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- ES7+ React/Redux/React-Native snippets

### VSCode Settings (optional)
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "eslint.validate": ["javascript", "javascriptreact"]
}
```

## Deployment Checklist

Before building for distribution:

- [ ] Remove console.log statements (or use logger)
- [ ] Disable DevTools in production build
- [ ] Set appropriate app icon (replace placeholder)
- [ ] Test packaged app on clean machine
- [ ] Verify database initializes correctly
- [ ] Test all navigation flows
- [ ] Check for any exposed API keys
- [ ] Add crash reporting (Sentry or similar)
- [ ] Create installation guide for parents
- [ ] Set up auto-updater (electron-updater)

**API Integration Checklist:**

- [ ] Ensure `.env` is in `.gitignore` (CRITICAL!)
- [ ] Create `.env.example` template for other developers
- [ ] Verify API keys work in all environments
- [ ] Test API error handling (expired keys, rate limits)
- [ ] Confirm no API keys in compiled/bundled code
- [ ] Add API usage monitoring (track costs)
- [ ] Set up API key rotation strategy
- [ ] Test app behavior when APIs are down
- [ ] Add fallback messages for API failures
- [ ] Document API setup in README for parents/developers

## Future Enhancements Roadmap

See `PLANNING.md` for full roadmap. Summary:

- **Phase 2**: Better features, YouTube API, richer UI
- **Phase 3**: Parent dashboard, history, trust manager, settings
- **Phase 4**: Shopping (eBay API, Amazon/OfferUp URLs), saved builds
- **Phase 5**: Educational missions, progress tracking, rewards

## Contributing Guidelines (if open-sourcing)

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

**Code Style**:
- Use ESLint configuration
- Follow existing naming conventions
- Add comments for complex logic
- Write descriptive commit messages

## License

MIT License - See LICENSE file for details

---

**Last Updated**: March 22, 2026  
**Status**: MVP Complete, Ready for Testing  
**Next Milestone**: Phase 2 - Enhanced Ranking
