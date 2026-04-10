# API Quick Reference

One-page quick reference for BikeBrowser's external APIs.

---

## 🧠 OpenAI API

### 1. Explain Topics
```javascript
const result = await window.api.ai.explain("how does a dirt bike engine work");
```
**Returns:** Child-friendly explanation (9-year-old level)

### 2. Search Suggestions
```javascript
const result = await window.api.ai.getSearchSuggestions("BMX bikes");
```
**Returns:** Array of related search suggestions

### 3. Safety Check
```javascript
const result = await window.api.ai.checkSafety(title, description);
```
**Returns:** `{ appropriate: true/false, reason: "..." }`

### 4. Simplify Text
```javascript
const result = await window.api.ai.simplify("Complex technical text...");
```
**Returns:** Simplified version for kids

---

## 📍 Google Places API

### 1. Find Bike Shops
```javascript
const result = await window.api.places.findBikeShops("85255");
// or
const result = await window.api.places.findBikeShops("Phoenix AZ");
```
**Returns:** Array of bike shops with name, address, rating, phone, hours

### 2. General Search
```javascript
const result = await window.api.places.search("bike repair near me");
```

### 3. Nearby Search (by coordinates)
```javascript
const result = await window.api.places.searchNearby(33.5731, -112.0889, 'bicycle_store', 5000);
```
**Parameters:** latitude, longitude, type, radius (meters)

### 4. Place Details
```javascript
const result = await window.api.places.getDetails("ChIJ...");
```
**Returns:** Full business details with photos, reviews, hours

---

## 🏍️ Marketcheck API

### 1. Search Dirt Bikes
```javascript
const result = await window.api.market.searchDirtBikes({
  priceMax: 5000,
  yearMin: 2018,
  zip: "85255",
  radius: 50,
  rows: 20
});
```

### 2. Search Electric Bikes
```javascript
const result = await window.api.market.searchElectricBikes({
  priceMax: 10000,
  zip: "85255"
});
```

### 3. Search Motorcycles (general)
```javascript
const result = await window.api.market.searchMotorcycles("kawasaki", {
  yearMin: 2020,
  priceMax: 8000
});
```

### 4. General Search
```javascript
const result = await window.api.market.search("electric dirt bike", {
  rows: 10,
  start: 0
});
```

### 5. Market Statistics
```javascript
const result = await window.api.market.getStats("dirt bike");
```
**Returns:** `{ averagePrice, priceRange: {min, max}, totalListings }`

### 6. Compare Prices
```javascript
const result = await window.api.market.comparePrices(listingsArray);
```
**Returns:** `{ lowest, highest, average, median }`

---

## 🔄 Response Format

All API methods return:
```javascript
{
  success: true/false,
  // On success: data fields
  // On failure:
  error: "Error message"
}
```

**Example:**
```javascript
const result = await window.api.ai.explain("how bikes work");

if (result.success) {
  console.log(result.explanation);
} else {
  console.error(result.error);
}
```

---

## 📊 Common Data Formats

### Place Object (Google Places)
```javascript
{
  id: "ChIJ...",
  name: "Joe's Bike Shop",
  address: "123 Main St, Phoenix, AZ",
  location: { lat: 33.123, lng: -112.456 },
  rating: 4.5,
  totalRatings: 120,
  phone: "(602) 555-1234",
  website: "https://...",
  isOpen: true,
  photo: "https://...",
  source: "google_places",
  type: "business"
}
```

### Listing Object (Marketcheck)
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

---

## ⚡ Quick Test Commands

Paste in browser dev console:

```javascript
// Test AI
window.api.ai.explain("how bikes work").then(console.log);

// Test Places
window.api.places.findBikeShops("Phoenix AZ").then(console.log);

// Test Market
window.api.market.searchDirtBikes({rows: 5}).then(console.log);
```

---

## 🚨 Troubleshooting

**"API key not configured"**
→ Check `.env` file exists with correct keys

**Empty results**
→ Try broader search terms, check internet connection

**Rate limit errors**
→ Wait a moment, implement caching

**For full documentation:** See `API_INTEGRATION.md`
