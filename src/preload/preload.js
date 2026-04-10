const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('api', {
  // YouTube operations
  youtubeSearch: (query) => ipcRenderer.invoke('youtube:search', query),
  getVideoDetails: (videoId) => ipcRenderer.invoke('youtube:getVideoDetails', videoId),
  openVideoPlayer: (videoId, title) => ipcRenderer.invoke('youtube:openVideoPlayer', videoId, title),
  reportEmbedStatus: (videoId, channelId, embeddable, reason) => ipcRenderer.invoke('youtube:reportEmbedStatus', { videoId, channelId, embeddable, reason }),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  debugLog: (...args) => ipcRenderer.send('debug:log', ...args),
  
  // Navigation
  navigate: (url) => ipcRenderer.invoke('navigate', url),
  search: (query, options) => ipcRenderer.invoke('search', query, options),
  getResult: (source, id) => ipcRenderer.invoke('get-result', source, id),
  getAIStats: () => ipcRenderer.invoke('get-ai-stats'),
  getDeepSeekStats: () => ipcRenderer.invoke('get-deepseek-stats'),
  getProviderStatus: () => ipcRenderer.invoke('get-provider-status'),
  getConnectionInfo: () => ipcRenderer.invoke('get-connection-info'),
  getConnectionStatus: () => ipcRenderer.invoke('get-connection-status'),
  serverSearch: (payload) => ipcRenderer.invoke('server:search', payload),
  serverRank: (payload) => ipcRenderer.invoke('server:rank', payload),
  getProjects: () => ipcRenderer.invoke('server:getProjects'),
  createProject: (payload) => ipcRenderer.invoke('server:createProject', payload),
  getNotesServer: () => ipcRenderer.invoke('server:getNotes'),
  addNoteServer: (payload) => ipcRenderer.invoke('server:addNote', payload),
  
  // Database operations — SQLite-backed history
  getHistory: (limit, offset) => ipcRenderer.invoke('db:getHistory', limit, offset),
  getTrustList: () => ipcRenderer.invoke('db:getTrustList'),
  
  ai: {
    explain: (topic) => ipcRenderer.invoke('ai:explain', topic),
    suggestions: (topic) => ipcRenderer.invoke('ai:suggestions', topic),
    safety: (payload) => ipcRenderer.invoke('ai:safety', payload),
    orchestrate: (payload) => ipcRenderer.invoke('ai:orchestrate', payload),
    auditUX: (payload) => ipcRenderer.invoke('ai:ux-audit', payload)
  },
  
  // =============================================================================
  // Google Places Service API
  // =============================================================================
  places: {
    // Search for places by text query
    search: (query) => ipcRenderer.invoke('places:search', query),
    
    // Search nearby places by coordinates
    searchNearby: (lat, lng, type, radius) => ipcRenderer.invoke('places:nearby', { lat, lng, type, radius }),
    
    // Get detailed place information
    getDetails: (placeId) => ipcRenderer.invoke('places:details', placeId),
    
    // Find bike shops near location
    findBikeShops: (location) => ipcRenderer.invoke('places:bikeShops', location)
  },
  
  // =============================================================================
  // Marketcheck Service API
  // =============================================================================
  market: {
    // General market search
    search: (query, options) => ipcRenderer.invoke('market:search', { query, options }),
    
    // Search motorcycles
    searchMotorcycles: (query, filters) => ipcRenderer.invoke('market:motorcycles', { query, filters }),
    
    // Search electric bikes
    searchElectricBikes: (filters) => ipcRenderer.invoke('market:electricBikes', filters),
    
    // Search dirt bikes
    searchDirtBikes: (filters) => ipcRenderer.invoke('market:dirtBikes', filters),
    
    // Get inventory statistics
    getStats: (query) => ipcRenderer.invoke('market:stats', query),
    
    // Compare prices across listings
    comparePrices: (listings) => ipcRenderer.invoke('market:comparePrices', listings)
  },

  localSearch: {
    search: (payload) => ipcRenderer.invoke('local-search:search', payload),
    searchLegacy: (payload) => ipcRenderer.invoke('local-search', payload),
  },

  shopping: {
    searchRetailers: (query) => ipcRenderer.invoke('shopping:searchRetailers', query),
    searchLocal: (query, zipcode) => ipcRenderer.invoke('shopping:searchLocal', query, zipcode),
    searchEbay: (query, zipcode) => ipcRenderer.invoke('shopping:searchEbay', query, zipcode)
  },
  
  // =============================================================================
  // THAURA AI SERVICE API
  // =============================================================================
  // Secure AI integration - API key stored in main process, never exposed to renderer
  // All requests proxied through IPC using axios (no fetch/undici in main)
  thaura: {
    // Raw Thaura API query
    query: (prompt, options) => ipcRenderer.invoke('ai:thaura', prompt, options),
    
    // Get child-friendly explanation
    explain: (topic) => ipcRenderer.invoke('ai:thaura:explain', topic),
    
    // Generate search suggestions
    getSuggestions: (topic) => ipcRenderer.invoke('ai:thaura:suggestions', topic),
    
    // Check content safety
    checkSafety: (title, description) => ipcRenderer.invoke('ai:thaura:safety', { title, description })
  },
  
  // Performance diagnostics (used by DiagnosticsPanel)
  getPerformanceStats: () => ipcRenderer.invoke('perf:getStats'),

  // =============================================================================
  // Camera / Image Intent API
  // =============================================================================
  camera: {
    analyzeImage: (imageBase64) => ipcRenderer.invoke('camera:analyzeImage', imageBase64),
    searchFromImage: (imageBase64) => ipcRenderer.invoke('search:fromImage', imageBase64),
  },

  // =============================================================================
  // Voice Intent API
  // =============================================================================
  voice: {
    parseTranscript: (transcript) => ipcRenderer.invoke('voice:parseTranscript', transcript),
    searchFromTranscript: (transcript) => ipcRenderer.invoke('search:fromVoice', transcript),
  },

  // =============================================================================
  // History & Decisions API (SQLite-backed)
  // =============================================================================
  history: {
    get: (limit, offset) => ipcRenderer.invoke('db:getHistory', limit, offset),
    saveSearchSession: (data) => ipcRenderer.invoke('db:saveSearchSession', data),
    saveDecision: (decision) => ipcRenderer.invoke('db:saveDecision', decision),
    getSessionWithResults: (sessionId) => ipcRenderer.invoke('db:getSessionWithResults', sessionId),
    getDecisions: (limit) => ipcRenderer.invoke('db:getDecisions', limit),
  },

  // =============================================================================
  // Compatibility Profiles API
  // =============================================================================
  profiles: {
    save: (profile) => ipcRenderer.invoke('db:saveProfile', profile),
    getAll: () => ipcRenderer.invoke('db:getProfiles'),
  },

  // Listeners for main process events
  onYoutubeIntercepted: (callback) => {
    ipcRenderer.on('youtube:intercepted', (event, data) => callback(data));
  },
  
  removeYoutubeInterceptedListener: () => {
    ipcRenderer.removeAllListeners('youtube:intercepted');
  },

  youtube: {
    search: (query) => ipcRenderer.invoke('youtube:search', query),
    getVideoDetails: (videoId) => ipcRenderer.invoke('youtube:getVideoDetails', videoId),
    openVideoPlayer: (videoId, title) => ipcRenderer.invoke('youtube:openVideoPlayer', videoId, title),
    reportEmbedStatus: (videoId, channelId, embeddable, reason) => ipcRenderer.invoke('youtube:reportEmbedStatus', { videoId, channelId, embeddable, reason }),
    openExternal: (url) => ipcRenderer.invoke('open-external', url),
    debugLog: (...args) => ipcRenderer.send('debug:log', ...args)
  }
});

contextBridge.exposeInMainWorld('electron', {
  search: (query, options) => ipcRenderer.invoke('search', query, options),
  getResult: (source, id) => ipcRenderer.invoke('get-result', source, id),
  getAIStats: () => ipcRenderer.invoke('get-ai-stats'),
  getDeepSeekStats: () => ipcRenderer.invoke('get-deepseek-stats'),
  getProviderStatus: () => ipcRenderer.invoke('get-provider-status'),
  getConnectionInfo: () => ipcRenderer.invoke('get-connection-info'),
  getConnectionStatus: () => ipcRenderer.invoke('get-connection-status'),
  send: (channel, data) => {
    const validChannels = ['play-video', 'search-youtube'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  receive: (channel, func) => {
    const validChannels = ['video-ready', 'video-error'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (_event, ...args) => func(...args));
    }
  }
});

console.log('Preload script loaded successfully with API integrations');
console.log('Available APIs: youtube, places, market, thaura, ai, camera, voice, history, profiles');
