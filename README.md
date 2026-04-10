# BikeBrowser - Kid Cognitive Browser

A specialized web browser designed for a 9-year-old with interests in bikes, e-bikes, dirt bikes, and engineering. Features AI-powered explanations, local bike shop finding, and curated marketplace browsing.

## ✨ Features

### Core Features (MVP)
- 🎥 YouTube content ranking and filtering
- 📚 Educational content prioritization
- ✅ Channel trust system
- 🎨 Child-friendly interface
- 🛡️ Safety-first content scoring

### AI-Powered Features (Phase 2)
- 🧠 **OpenAI Integration** - Child-friendly explanations and content analysis
- 📍 **Local Business Search** - Find bike shops and repair shops nearby (Google Places)
- 🏍️ **Marketplace Browsing** - Discover bikes for sale safely (Marketcheck)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
```bash
cd bikebrowser
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up API keys** (optional but recommended)

Create a `.env` file in the project root:

```bash
OPENAI_API_KEY=sk-proj-your-openai-key-here
GOOGLE_MAPS_API_KEY=AIzaSy-your-google-maps-key-here
MARKETCHECK_API_KEY=your-marketcheck-key-here
```

**Note:** The app works without API keys, but enhanced features (AI explanations, shop finder, marketplace) require them.

4. **Run in development mode**
```bash
npm run dev
```

5. **Build for production**
```bash
npm run build
npm run build:electron
```

## 🔐 API Setup (Optional)

To enable all features, you'll need API keys:

1. **OpenAI (for AI explanations)**
   - Sign up at https://platform.openai.com
   - Create API key
   - Add to `.env` as `OPENAI_API_KEY`

2. **Google Maps Places (for local shop search)**
   - Go to https://console.cloud.google.com
   - Enable Places API
   - Create API key
   - Add to `.env` as `GOOGLE_MAPS_API_KEY`

3. **Marketcheck (for bike listings)**
   - Sign up at https://www.marketcheck.com
   - Get API key
   - Add to `.env` as `MARKETCHECK_API_KEY`

**See `API_INTEGRATION.md` for detailed setup instructions.**

## 📁 Project Structure

```
bikebrowser/
├── src/
│   ├── main/              # Electron main process
│   │   └── main.js        # App entry, IPC handlers, API integration
│   ├── preload/           # Preload scripts for IPC security
│   │   └── preload.js     # Secure API bridge
│   ├── renderer/          # React UI components
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable UI components
│   │   │   └── APIComponents.jsx  # NEW: API-powered components
│   │   └── examples/      # Usage examples
│   │       └── APIExamples.jsx    # NEW: API integration examples
│   └── services/          # Backend services
│       ├── rankingEngine.js       # YouTube ranking logic
│       ├── youtubeScraper.js      # YouTube HTML parsing
│       ├── fastRules.js           # Quick content scoring
│       ├── featureExtractor.js    # Advanced feature analysis
│       ├── db.js                  # SQLite database wrapper
│       ├── aiService.js           # NEW: OpenAI integration
│       ├── googlePlacesService.js # NEW: Google Places integration
│       └── marketService.js       # NEW: Marketcheck integration
├── data/                  # SQLite database
├── .env                   # API keys (create this, NEVER commit!)
├── .env.example           # Template for .env
├── README.md              # This file
├── PLANNING.md            # Full project roadmap
├── DEVELOPMENT.md         # Developer documentation
├── API_INTEGRATION.md     # Complete API guide
└── API_QUICK_REFERENCE.md # Quick API reference
```

## 🛠️ Tech Stack

### Core
- **Electron 28** - Desktop app framework
- **React 18** - UI framework
- **Tailwind CSS 3** - Styling
- **SQLite (better-sqlite3)** - Local database
- **Vite 5** - Build tool

### External APIs
- **OpenAI API (GPT-4)** - AI explanations and content analysis
- **Google Maps Places API** - Local business search
- **Marketcheck API** - Vehicle/bike marketplace listings

### Security
- Context isolation enabled
- Secure IPC bridge (contextBridge)
- API keys isolated in main process
- No Node.js access from renderer

## 📖 Documentation

- **[PLANNING.md](PLANNING.md)** - Complete project roadmap and vision
- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Developer guide and technical details
- **[API_INTEGRATION.md](API_INTEGRATION.md)** - Complete API integration guide
- **[API_QUICK_REFERENCE.md](API_QUICK_REFERENCE.md)** - Quick API reference
- **[NEXT_STEPS.md](NEXT_STEPS.md)** - What to do next

## 🎯 Usage Examples

### Using AI Explanations
```javascript
// In any React component:
const result = await window.api.ai.explain("how does a dirt bike engine work");
console.log(result.explanation); // Kid-friendly explanation
```

### Finding Bike Shops
```javascript
const result = await window.api.places.findBikeShops("85255");
result.shops.forEach(shop => {
  console.log(shop.name, shop.address, shop.rating);
});
```

### Browsing Bike Marketplace
```javascript
const result = await window.api.market.searchDirtBikes({
  priceMax: 5000,
  yearMin: 2018,
  zip: "85255"
});
console.log(result.listings); // Array of bikes for sale
```

See [API_INTEGRATION.md](API_INTEGRATION.md) for complete examples and React components.

## 🧪 Testing

### Manual Testing
```bash
npm run dev
```

Then test each feature:
1. Search for "bike repair" on home page
2. Verify trusted channels appear with green badges
3. Click "Explain This" on a video (requires OpenAI key)
4. Navigate to marketplace (requires Marketcheck key)

### Browser Console Testing
```javascript
// Test APIs directly
window.api.ai.explain("how bikes work").then(console.log);
window.api.places.findBikeShops("Phoenix AZ").then(console.log);
window.api.market.searchDirtBikes({rows: 5}).then(console.log);
```

## 🚧 Current Status

**✅ Completed:**
- Full MVP implementation (Phase 1)
- YouTube ranking and filtering
- Trust list system
- React UI with video playback
- External API integration (OpenAI, Google Places, Marketcheck)
- API security architecture
- Comprehensive documentation

**🔜 Next Steps:**
- npm install and dependency setup
- API testing with real keys
- Frontend integration of API components
- Enhanced UI polish
- Parent dashboard (Phase 3)

## 🤝 Contributing

This is a personal project for a specific use case, but contributions are welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

MIT License - See LICENSE file for details

## ⚠️ Important Notes

- **API keys are required** for enhanced features (explanations, shop finder, marketplace)
- Never commit `.env` file to version control
- The YouTube scraper may break if YouTube changes their HTML structure
- This is an educational project - parental supervision recommended
- API costs can add up - monitor usage and set billing alerts

## 🙏 Acknowledgments

- Built for a young bike enthusiast
- Inspired by the need for safe, educational browsing
- Thanks to the open-source community for the amazing tools

---

**For detailed setup instructions, see [NEXT_STEPS.md](NEXT_STEPS.md)**
