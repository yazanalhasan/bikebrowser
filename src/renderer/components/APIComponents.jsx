import { useState } from 'react';
import * as openaiService from '../services/openaiService';
import { smartSearch } from '../services/smartShoppingEngine';

/**
 * VideoExplanation Component
 * 
 * Adds an "Explain This" button to video cards that uses OpenAI
 * to explain what the video is about in kid-friendly language.
 */
export function VideoExplanation({ videoTitle, videoDescription }) {
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleExplain = async () => {
    setLoading(true);
    setIsOpen(true);
    
    try {
      // Combine title and description for better context
      const context = `${videoTitle}. ${videoDescription}`;
      const result = await openaiService.generateExplanation(context);
      setExplanation(result);
    } catch (error) {
      setExplanation('Oops! Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="video-explanation">
      <button
        onClick={handleExplain}
        className="btn-sm bg-purple-500 hover:bg-purple-600 text-white rounded-full px-4 py-2"
      >
        🧠 Explain This
      </button>

      {isOpen && (
        <div className="explanation-popup mt-4 p-4 bg-purple-50 rounded-xl border-2 border-purple-300">
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin h-5 w-5 border-2 border-purple-600 border-t-transparent rounded-full"></div>
              <span>Thinking...</span>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-purple-800">What's this about?</h4>
                <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700">
                  ✕
                </button>
              </div>
              <p className="text-gray-800 leading-relaxed">{explanation}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * SafetyChecker Component
 * 
 * Uses OpenAI to analyze video content for kid-appropriateness
 * Shows a warning badge if content might not be suitable
 */
export function SafetyChecker({ title, description, onResult }) {
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(null);

  const checkSafety = async () => {
    setChecking(true);
    
    try {
      const safetyResult = await openaiService.analyzeContentSafety(title, description);
      
      setResult({
        appropriate: safetyResult.appropriate,
        reason: safetyResult.reason
      });
      
      if (onResult) {
        onResult(safetyResult.appropriate);
      }
    } catch (error) {
      console.error('Safety check error:', error);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="safety-checker">
      {result && !result.appropriate && (
        <div className="safety-warning bg-yellow-100 border border-yellow-400 rounded px-3 py-2 text-sm">
          ⚠️ {result.reason}
        </div>
      )}
    </div>
  );
}

/**
 * SmartSuggestions Component
 * 
 * Generates AI-powered search suggestions based on what the kid is interested in
 */
export function SmartSuggestions({ currentTopic }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadSuggestions = async () => {
    setLoading(true);
    
    try {
      const result = await openaiService.generateSearchSuggestions(currentTopic);
      setSuggestions(result);
    } catch (error) {
      console.error('Suggestions error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="smart-suggestions">
      <h3 className="text-lg font-bold mb-3">Want to learn more?</h3>
      
      {loading ? (
        <div className="flex gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-8 w-32 bg-gray-200 animate-pulse rounded-full"></div>
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              className="suggestion-pill px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-full text-sm font-medium transition"
              onClick={() => {
                // Navigate to search with this suggestion
                window.location.hash = `#/search?q=${encodeURIComponent(suggestion)}`;
              }}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * NearbyShopsWidget Component
 * 
 * Shows local bike shops near the user - great for "Need help?" sections
 */
export function NearbyShopsWidget({ zipCode = '85255' }) {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const findShops = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await window.api.places.findBikeShops(zipCode);
      
      if (result.success) {
        setShops(result.shops.slice(0, 3)); // Show top 3
      } else {
        setError('Could not find shops nearby');
      }
    } catch (err) {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="nearby-shops-widget bg-green-50 rounded-xl p-4 border-2 border-green-200">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-green-800">🏪 Bike Shops Near You</h3>
        <button
          onClick={findShops}
          disabled={loading}
          className="text-sm bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-full"
        >
          {loading ? '...' : 'Find'}
        </button>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="space-y-2">
        {shops.map((shop, index) => (
          <div key={index} className="shop-item bg-white rounded-lg p-3 border border-green-200">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-sm">{shop.name}</h4>
                <p className="text-xs text-gray-600">{shop.address}</p>
              </div>
              {shop.rating && (
                <span className="text-xs bg-yellow-100 px-2 py-1 rounded-full">
                  ⭐ {shop.rating}
                </span>
              )}
            </div>
            {shop.phone && (
              <a href={`tel:${shop.phone}`} className="text-xs text-blue-600 mt-1 block">
                📞 {shop.phone}
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * BikeMarketplace Component
 * 
 * Browse dirt bikes, electric bikes, and other vehicles for sale
 */
export function BikeMarketplace() {
  const [category, setCategory] = useState('dirt');
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    priceMax: 5000,
    yearMin: 2015,
    zip: '85255',
    radius: 50
  });

  const searchMarket = async () => {
    setLoading(true);
    
    try {
      let result;
      
      if (category === 'dirt') {
        result = await window.api.market.searchDirtBikes(filters);
      } else if (category === 'electric') {
        result = await window.api.market.searchElectricBikes(filters);
      } else {
        const listings = await smartSearch({
          query: 'ebike kit mountain bike',
          part: { name: 'general bike build', category: 'general' },
          project: { notes: 'marketplace overview' },
          location: {
            zipCode: filters.zip || '85255',
            radiusMiles: Number(filters.radius || 50),
            preferredPickup: false,
          },
        });
        result = { success: true, listings };
      }
      
      if (result.success) {
        setListings(result.listings);
      }
    } catch (error) {
      console.error('Market search error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bike-marketplace p-6">
      <h2 className="text-3xl font-bold mb-6">🏍️ Bikes For Sale</h2>

      {/* Category Selector */}
      <div className="flex gap-2 mb-6">
        {['dirt', 'electric', 'all'].map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-2 rounded-full font-medium ${
              category === cat
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {cat === 'dirt' ? '🏍️ Dirt Bikes' : cat === 'electric' ? '⚡ Electric' : '🏍️ All'}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="filters-panel bg-gray-100 rounded-xl p-4 mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Max Price</label>
          <input
            type="number"
            value={filters.priceMax}
            onChange={(e) => setFilters({ ...filters, priceMax: e.target.value })}
            className="w-full px-3 py-2 rounded border"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Oldest Year</label>
          <input
            type="number"
            value={filters.yearMin}
            onChange={(e) => setFilters({ ...filters, yearMin: e.target.value })}
            className="w-full px-3 py-2 rounded border"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">ZIP Code</label>
          <input
            type="text"
            value={filters.zip}
            onChange={(e) => setFilters({ ...filters, zip: e.target.value })}
            className="w-full px-3 py-2 rounded border"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={searchMarket}
            disabled={loading}
            className="w-full btn-primary"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {/* Listings Grid */}
      <div className="listings-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading ? (
          // Loading skeletons
          [...Array(8)].map((_, i) => (
            <div key={i} className="listing-skeleton bg-gray-200 rounded-xl h-80 animate-pulse"></div>
          ))
        ) : (
          listings.map((item, index) => (
            <div key={index} className="listing-card bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition">
              {item.image && (
                <div className="aspect-video bg-gray-200">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div className="p-4">
                <h3 className="font-bold text-lg mb-2 line-clamp-2">{item.title}</h3>
                
                <div className="price-badge bg-green-100 text-green-800 font-bold text-xl px-3 py-1 rounded-lg inline-block mb-2">
                  {item.priceFormatted}
                </div>
                
                <div className="details text-sm text-gray-600 space-y-1">
                  {item.year && <p>📅 {item.year}</p>}
                  {item.miles && <p>🛣️ {item.miles.toLocaleString()} miles</p>}
                  {item.location && <p>📍 {item.location}</p>}
                </div>
                
                {item.dealer && (
                  <div className="dealer-info mt-3 pt-3 border-t text-xs text-gray-500">
                    <p className="font-medium">{item.dealer.name}</p>
                    {item.dealer.phone && <p>{item.dealer.phone}</p>}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {listings.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-xl">No bikes found</p>
          <p className="text-sm">Try adjusting your filters</p>
        </div>
      )}
    </div>
  );
}
