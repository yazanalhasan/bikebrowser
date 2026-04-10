const { session } = require('electron');

let mainWindow = null;

/**
 * Setup YouTube request interception
 * Detects YouTube search and watch URLs and intercepts them for re-ranking
 */
function setup(window) {
  mainWindow = window;
  
  const filter = {
    urls: ['*://*.youtube.com/*']
  };

  // Intercept YouTube navigation
  mainWindow.webContents.on('will-navigate', (event, url) => {
    handleYouTubeUrl(event, url);
  });

  mainWindow.webContents.on('did-navigate', (event, url) => {
    if (isYouTubeSearchUrl(url)) {
      const query = extractSearchQuery(url);
      if (query) {
        // Send event to renderer to trigger custom search UI
        mainWindow.webContents.send('youtube:intercepted', { 
          type: 'search', 
          query 
        });
      }
    } else if (isYouTubeWatchUrl(url)) {
      const videoId = extractVideoId(url);
      if (videoId) {
        mainWindow.webContents.send('youtube:intercepted', { 
          type: 'watch', 
          videoId 
        });
      }
    }
  });

  console.log('YouTube interceptor initialized');
}

/**
 * Handle YouTube URL navigation
 */
function handleYouTubeUrl(event, url) {
  if (isYouTubeSearchUrl(url)) {
    // For search URLs, we'll let them load but override the display
    console.log('YouTube search detected:', url);
  } else if (isYouTubeWatchUrl(url)) {
    // For watch URLs, we'll allow playback but add overlays
    console.log('YouTube watch detected:', url);
  }
}

/**
 * Check if URL is a YouTube search
 */
function isYouTubeSearchUrl(url) {
  return url.includes('youtube.com/results') || url.includes('youtube.com/search');
}

/**
 * Check if URL is a YouTube watch page
 */
function isYouTubeWatchUrl(url) {
  return url.includes('youtube.com/watch');
}

/**
 * Extract search query from YouTube URL
 */
function extractSearchQuery(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get('search_query') || urlObj.searchParams.get('q');
  } catch (error) {
    console.error('Error extracting search query:', error);
    return null;
  }
}

/**
 * Extract video ID from YouTube URL
 */
function extractVideoId(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get('v');
  } catch (error) {
    console.error('Error extracting video ID:', error);
    return null;
  }
}

module.exports = {
  setup,
  isYouTubeSearchUrl,
  isYouTubeWatchUrl,
  extractSearchQuery,
  extractVideoId
};
