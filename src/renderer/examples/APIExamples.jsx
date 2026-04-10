import { useState } from 'react';
import * as openaiService from '../services/openaiService';
import { smartSearch } from '../services/smartShoppingEngine';

/**
 * Example: Using OpenAI Service
 * This component demonstrates how to get AI explanations
 */
function AIExamplePage() {
  const [query, setQuery] = useState('');
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);

  const handleExplain = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const result = await openaiService.generateExplanation(query);
      setExplanation(result);
    } catch (error) {
      setExplanation(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">AI Explanation Demo</h1>
      
      <div className="mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="What do you want to learn about?"
          className="w-full px-4 py-2 border rounded"
        />
      </div>
      
      <button
        onClick={handleExplain}
        disabled={loading}
        className="btn-primary"
      >
        {loading ? 'Thinking...' : 'Explain'}
      </button>
      
      {explanation && (
        <div className="mt-6 p-4 bg-blue-100 rounded">
          <h3 className="font-bold mb-2">Explanation:</h3>
          <p>{explanation}</p>
        </div>
      )}
    </div>
  );
}

/**
 * Example: Using Google Places Service
 * This component demonstrates searching for bike shops
 */
function PlacesExamplePage() {
  const [location, setLocation] = useState('');
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!location.trim()) return;
    
    setLoading(true);
    try {
      const result = await window.api.places.findBikeShops(location);
      if (result.success) {
        setPlaces(result.shops);
      }
    } catch (error) {
      console.error('Places search error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Find Bike Shops</h1>
      
      <div className="mb-4">
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Enter ZIP code or city"
          className="w-full px-4 py-2 border rounded"
        />
      </div>
      
      <button
        onClick={handleSearch}
        disabled={loading}
        className="btn-primary"
      >
        {loading ? 'Searching...' : 'Find Shops'}
      </button>
      
      <div className="mt-6 grid gap-4">
        {places.map((place, index) => (
          <div key={index} className="card p-4">
            <h3 className="font-bold">{place.name}</h3>
            <p className="text-gray-600">{place.address}</p>
            {place.rating && (
              <p className="text-sm">⭐ {place.rating} ({place.totalRatings} reviews)</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Example: Using Marketcheck Service
 * This component demonstrates searching for dirt bikes
 */
function MarketExamplePage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const result = await window.api.market.searchDirtBikes({
        priceMax: 5000,
        zip: '85255',
        radius: 50
      });
      
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
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Find Dirt Bikes</h1>
      
      <button
        onClick={handleSearch}
        disabled={loading}
        className="btn-primary"
      >
        {loading ? 'Searching...' : 'Search Dirt Bikes'}
      </button>
      
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {listings.map((item, index) => (
          <div key={index} className="card overflow-hidden">
            {item.image && (
              <img src={item.image} alt={item.title} className="w-full h-48 object-cover" />
            )}
            <div className="p-4">
              <h3 className="font-bold">{item.title}</h3>
              <p className="text-2xl font-bold text-blue-600">{item.priceFormatted}</p>
              <p className="text-gray-600">{item.location}</p>
              {item.miles && <p className="text-sm">{item.miles.toLocaleString()} miles</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Combined Example: Using multiple APIs together
 */
function CombinedAPIExample() {
  const [topic, setTopic] = useState('electric dirt bike engine');
  const [aiExplanation, setAiExplanation] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [listings, setListings] = useState([]);

  const handleCombinedSearch = async () => {
    // 1. Get AI explanation
    const aiExplanation = await openaiService.generateExplanation(topic);
    setAiExplanation(aiExplanation);

    // 2. Get AI search suggestions
    const suggestions = await openaiService.generateSearchSuggestions(topic);
    setSuggestions(suggestions);

    // 3. Search market listings
    const marketResult = await smartSearch({
      query: topic,
      part: { name: topic, category: 'general' },
      project: { notes: topic },
      location: { zipCode: '85255', radiusMiles: 25, preferredPickup: false },
    });
    setListings(marketResult);
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Combined API Example</h1>
      
      <input
        type="text"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        placeholder="What do you want to learn and find?"
        className="w-full px-4 py-3 border rounded mb-4"
      />
      
      <button onClick={handleCombinedSearch} className="btn-primary mb-6">
        Learn & Find
      </button>

      {/* AI Explanation */}
      {aiExplanation && (
        <div className="mb-6 p-4 bg-purple-100 rounded-xl">
          <h2 className="text-xl font-bold mb-2">🧠 What is it?</h2>
          <p>{aiExplanation}</p>
        </div>
      )}

      {/* AI Suggestions */}
      {suggestions.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-2">💡 Learn More About:</h2>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((sug, i) => (
              <button key={i} className="px-3 py-1 bg-blue-100 rounded-full text-sm">
                {sug}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Market Listings */}
      {listings.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-2">🏍️ Available for Sale:</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {listings.slice(0, 3).map((item, i) => (
              <div key={i} className="card p-4">
                {item.image && <img src={item.image} alt={item.title} className="w-full h-32 object-cover rounded mb-2" />}
                <h3 className="font-bold text-sm">{item.title}</h3>
                <p className="text-lg font-bold text-green-600">{item.priceFormatted}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export { AIExamplePage, PlacesExamplePage, MarketExamplePage, CombinedAPIExample };
