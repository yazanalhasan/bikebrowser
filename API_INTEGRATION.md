# 🔌 External API Integration Guide

## Overview

BikeBrowser now integrates three powerful external APIs:

1. **OpenAI** - AI-powered explanations and content analysis
2. **Google Maps Places** - Local business search (bike shops, repair shops)
3. **Marketcheck** - Vehicle and motorcycle listings

All API keys are stored securely in `.env` and are NEVER exposed to the frontend.

---

## 🔐 Security Architecture

### Multi-Layer Security Model

```
┌─────────────────────────────────────────┐
│  React Frontend (Renderer Process)     │
│  - No access to API keys                │
│  - Uses window.api.* methods            │
└──────────────┬──────────────────────────┘
               │ IPC Bridge (Secure)
┌──────────────▼──────────────────────────┐
│  Preload Script (contextBridge)         │
│  - Exposes safe methods only            │
│  - No direct Node.js access             │
└──────────────┬──────────────────────────┘
               │ IPC Channel
┌──────────────▼──────────────────────────┐
│  Electron Main Process                  │
│  - Has access to API keys               │
│  - Makes actual API calls               │
│  - Returns sanitized data               │
└─────────────────────────────────────────┘
```

**Key Security Principles:**

✅ API keys stored in `.env` (gitignored)
✅ Keys loaded only in main process
✅ Frontend communicates via IPC only
✅ contextBridge prevents direct key access
✅ All responses sanitized before return

---

## 📁 File Structure

```
bikebrowser/
├── .env                          # API keys (NEVER commit!)
├── .env.example                  # Template for other developers
├── src/
│   ├── services/
│   │   ├── aiService.js         # OpenAI integration
│   │   ├── googlePlacesService.js  # Google Places integration
│   │   └── marketService.js      # Marketcheck integration
│   ├── main/
│   │   └── main.js              # IPC handlers (loads .env)
│   ├── preload/
│   │   └── preload.js           # IPC bridge (exposes window.api)
│   └── renderer/
│       └── examples/
│           └── APIExamples.jsx   # Usage examples
```

---

## 🚀 Quick Start

### 1. Set Up Environment Variables

Create `.env` in project root:

```bash
OPENAI_API_KEY=sk-proj-your-key-here
GOOGLE_MAPS_API_KEY=AIzaSy-your-key-here
MARKETCHECK_API_KEY=your-key-here
```

### 2. Install Dependencies

```bash
npm install
```

This installs:
- `dotenv` - Environment variable loader
- `openai` - Official OpenAI SDK
- `axios` - Already installed for HTTP requests

### 3. Verify Keys Loaded

Run the app:

```bash
npm run dev
```

Check the console output:

```
Environment variables loaded: {
  hasOpenAI: true,
  hasGoogleMaps: true,
  hasMarketcheck: true
}
```

---

## 📖 API Usage Guide

### OpenAI Service

#### 1. Get Child-Friendly Explanation

```javascript
// In any React component:
const result = await window.api.ai.explain("how does a dirt bike engine work");

if (result.success) {
  console.log(result.explanation);
  // "A dirt bike engine works like your heart..."
}
```

**Use Cases:**
- Explain technical bike concepts
- Simplify product descriptions
- Answer "how does it work" questions

#### 2. Generate Search Suggestions

```javascript
const result = await window.api.ai.getSearchSuggestions("BMX bikes");

if (result.success) {
  result.suggestions.forEach(suggestion => {
    console.log(suggestion);
  });
  // ["how to choose a BMX bike", "BMX bike parts explained", ...]
}
```

**Use Cases:**
- Help kids discover related topics
- Provide guided search options
- Expand learning paths

#### 3. Check Content Safety

```javascript
const result = await window.api.ai.checkSafety(
  "INSANE BMX CRASH!!!",
  "Watch this crazy crash compilation..."
);

if (result.success) {
  console.log(result.appropriate); // true/false
  console.log(result.reason); // "May contain scary content"
}
```

**Use Cases:**
- Additional safety layer for video ranking
- Filter marketplace listings
- Analyze user-generated content

#### 4. Simplify Technical Content

```javascript
const result = await window.api.ai.simplify(
  "Hydraulic disc brakes utilize Pascal's principle..."
);

if (result.success) {
  console.log(result.simplified);
  // "These brakes use liquid pressure to stop your bike..."
}
```

**Use Cases:**
- Convert product specs to kid-friendly language
- Simplify tutorial steps
- Make technical videos more accessible

---

### Google Places Service

#### 1. Search for Places

```javascript
const result = await window.api.places.search("bike shops near 85255");

if (result.success) {
  result.places.forEach(place => {
    console.log(place.name, place.address, place.rating);
  });
}
```

**Response Format:**
```javascript
{
  id: "ChIJ...",
  name: "Joe's Bike Shop",
  address: "123 Main St, Phoenix, AZ 85255",
  location: { lat: 33.123, lng: -112.456 },
  rating: 4.5,
  totalRatings: 120,
  phone: "(602) 555-1234",
  website: "https://joesbikes.com",
  isOpen: true,
  photo: "https://maps.googleapis.com/...",
  source: "google_places",
  type: "business"
}
```

#### 2. Search Nearby (by coordinates)

```javascript
const result = await window.api.places.searchNearby(
  33.5731, // latitude
  -112.0889, // longitude
  'bicycle_store',
  5000 // radius in meters
);
```

**Use Cases:**
- "Find bike shops near me"
- Show shops on map
- Calculate distances

#### 3. Get Place Details

```javascript
const result = await window.api.places.getDetails("ChIJxxx...");

if (result.success) {
  const { details } = result;
  console.log(details.openingHours); // Array of hours
  console.log(details.photos); // Array of photo URLs
}
```

#### 4. Find Bike Shops (convenience method)

```javascript
const result = await window.api.places.findBikeShops("Phoenix AZ");
// Returns shops specifically
```

---

### Marketcheck Service

#### 1. General Market Search

```javascript
const result = await window.api.market.search("electric dirt bike", {
  rows: 20,
  start: 0
});

if (result.success) {
  result.listings.forEach(item => {
    console.log(item.title, item.priceFormatted, item.location);
  });
}
```

**Response Format:**
```javascript
{
  id: "12345",
  title: "2022 Kawasaki KX 450",
  description: "...",
  price: 7500,
  priceFormatted: "$7,500",
  location: "Phoenix, AZ 85255",
  image: "https://...",
  images: ["https://...", ...],
  year: 2022,
  make: "Kawasaki",
  model: "KX",
  miles: 1200,
  condition: "used",
  dealer: {
    name: "Desert Motorsports",
    phone: "(602) 555-6789"
  },
  source: "marketcheck",
  type: "vehicle"
}
```

#### 2. Search Motorcycles (with filters)

```javascript
const result = await window.api.market.searchMotorcycles("dirt bike", {
  yearMin: 2020,
  priceMax: 5000,
  zip: "85255",
  radius: 50,
  rows: 10
});
```

**Available Filters:**
- `yearMin`, `yearMax` - Year range
- `priceMin`, `priceMax` - Price range
- `milesMax` - Maximum mileage
- `zip` - Center point for search
- `radius` - Search radius in miles
- `rows` - Number of results

#### 3. Search Electric Bikes

```javascript
const result = await window.api.market.searchElectricBikes({
  priceMax: 10000,
  zip: "85255"
});
```

#### 4. Search Dirt Bikes

```javascript
const result = await window.api.market.searchDirtBikes({
  yearMin: 2018,
  priceMax: 6000
});
```

#### 5. Get Inventory Statistics

```javascript
const result = await window.api.market.getStats("kawasaki dirt bike");

if (result.success) {
  const { stats } = result;
  console.log(`Average price: $${stats.averagePrice}`);
  console.log(`Price range: $${stats.priceRange.min} - $${stats.priceRange.max}`);
  console.log(`Total listings: ${stats.totalListings}`);
}
```

**Use Cases:**
- Show price trends to kids
- "Is this a good deal?"
- Market overview

#### 6. Compare Prices

```javascript
// After getting listings:
const result = await window.api.market.comparePrices(listings);

if (result.success) {
  const { comparison } = result;
  console.log(`Cheapest: $${comparison.lowest}`);
  console.log(`Most expensive: $${comparison.highest}`);
  console.log(`Average: $${comparison.average}`);
  console.log(`Typical price: $${comparison.median}`);
}
```

---

## 🎨 React Integration Examples

### Example 1: AI Explanation Button

```jsx
function ExplainButton({ topic }) {
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);

  const handleExplain = async () => {
    setLoading(true);
    const result = await window.api.ai.explain(topic);
    setExplanation(result.success ? result.explanation : 'Error');
    setLoading(false);
  };

  return (
    <div>
      <button onClick={handleExplain} disabled={loading}>
        {loading ? 'Thinking...' : '🧠 Explain This'}
      </button>
      {explanation && <p className="explanation">{explanation}</p>}
    </div>
  );
}
```

### Example 2: Bike Shop Finder

```jsx
function BikeShopFinder() {
  const [zipCode, setZipCode] = useState('');
  const [shops, setShops] = useState([]);

  const handleSearch = async () => {
    const result = await window.api.places.findBikeShops(zipCode);
    if (result.success) {
      setShops(result.shops);
    }
  };

  return (
    <div>
      <input 
        value={zipCode} 
        onChange={(e) => setZipCode(e.target.value)}
        placeholder="Enter ZIP code"
      />
      <button onClick={handleSearch}>Find Shops</button>
      
      <div className="shops-grid">
        {shops.map(shop => (
          <div key={shop.id} className="shop-card">
            <h3>{shop.name}</h3>
            <p>{shop.address}</p>
            <p>⭐ {shop.rating}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Example 3: Dirt Bike Marketplace

```jsx
function DirtBikeMarket() {
  const [listings, setListings] = useState([]);
  const [filters, setFilters] = useState({
    priceMax: 5000,
    yearMin: 2015
  });

  useEffect(() => {
    const loadListings = async () => {
      const result = await window.api.market.searchDirtBikes(filters);
      if (result.success) {
        setListings(result.listings);
      }
    };
    loadListings();
  }, [filters]);

  return (
    <div>
      <h2>Dirt Bikes for Sale</h2>
      <div className="filters">
        <input 
          type="number"
          value={filters.priceMax}
          onChange={(e) => setFilters({...filters, priceMax: e.target.value})}
          placeholder="Max price"
        />
      </div>
      
      <div className="listings-grid">
        {listings.map(item => (
          <div key={item.id} className="listing-card">
            <img src={item.image} alt={item.title} />
            <h3>{item.title}</h3>
            <p className="price">{item.priceFormatted}</p>
            <p>{item.miles} miles</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 🛡️ Error Handling

All API methods return a consistent format:

```javascript
{
  success: true/false,
  // On success:
  data: {...},
  // On failure:
  error: "Error message"
}
```

**Always check `success` before using data:**

```javascript
const result = await window.api.ai.explain(query);

if (result.success) {
  // Use result.explanation
} else {
  console.error('AI error:', result.error);
  // Show user-friendly error
}
```

---

## 💰 API Cost Considerations

### OpenAI
- **Model**: GPT-4
- **Cost**: ~$0.03 per request (300 tokens)
- **Recommendation**: Cache explanations, limit to user-initiated

### Google Places
- **Free Tier**: $200/month credit
- **Cost**: ~$0.017 per search
- **Recommendation**: ~11,000 free searches/month

### Marketcheck
- **Free Tier**: Depends on plan
- **Recommendation**: Cache results, paginate

**Budget-Friendly Tips:**
1. Cache API responses in database
2. Debounce search inputs
3. Show loading states to prevent double-calls
4. Set reasonable rate limits

---

## 🧪 Testing APIs

### Test OpenAI

```javascript
// In browser console:
window.api.ai.explain("how bikes work").then(console.log);
```

### Test Google Places

```javascript
window.api.places.findBikeShops("Phoenix AZ").then(console.log);
```

### Test Marketcheck

```javascript
window.api.market.searchDirtBikes({rows: 5}).then(console.log);
```

---

## 🚨 Troubleshooting

### API Keys Not Working

**Symptom**: "API key not configured" errors

**Solution:**
1. Check `.env` exists in project root
2. Verify key format (no extra spaces, quotes)
3. Restart app (`npm run dev`)
4. Check console: "Environment variables loaded: {hasOpenAI: true}"

### OpenAI Rate Limits

**Symptom**: 429 errors

**Solution:**
- Implement request queue
- Add retry logic with exponential backoff
- Cache responses

### Google Places Returns Empty

**Symptom**: `places: []`

**Solution:**
- Check API key has Places API enabled in Google Cloud Console
- Verify billing is set up (required even for free tier)
- Test with simple query: "pizza near me"

### Marketcheck No Results

**Symptom**: `listings: []`

**Solution:**
- Marketcheck is car/motorcycle focused, not regular bikes
- Use broader search terms
- Check API

 key is valid

---

## 📚 Full API Reference

See individual service files for complete method documentation:
- `src/services/aiService.js`
- `src/services/googlePlacesService.js`
- `src/services/marketService.js`

---

**Security Reminder**: Never expose API keys in frontend code, commit them to git, or log them to console!
