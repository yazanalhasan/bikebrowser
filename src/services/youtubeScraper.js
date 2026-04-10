const axios = require('axios');

/**
 * YouTube Metadata Scraper
 * Extracts video information from YouTube search results
 * This is the MVP approach - will migrate to YouTube API in Phase 2 if needed
 */

/**
 * Search YouTube and extract video metadata
 */
async function searchVideos(query, maxResults = 20) {
  try {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    const html = response.data;
    const videos = extractVideosFromHtml(html);
    
    return videos.slice(0, maxResults);
  } catch (error) {
    console.error('YouTube search error:', error.message);
    throw new Error('Failed to fetch YouTube results');
  }
}

async function getEmbedStatus(videoId) {
  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}`;

  try {
    const response = await axios.get(embedUrl, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.youtube.com/'
      }
    });

    const html = String(response.data || '');
    const blockedMatch = html.match(/"playabilityStatus":\{"status":"(ERROR|UNPLAYABLE|LOGIN_REQUIRED)".*?"reason":"([^"]+)"/);
    const knownBlocked =
      /error\s*153/i.test(html) ||
      /video player configuration error/i.test(html) ||
      /playback on other websites has been disabled/i.test(html) ||
      /video unavailable/i.test(html) ||
      /ytp-error/i.test(html);

    if (blockedMatch || knownBlocked) {
      return {
        embeddable: false,
        embedScore: 0,
        reason: blockedMatch?.[2] || 'Blocked by YouTube embed policy'
      };
    }

    return {
      embeddable: true,
      embedScore: 1,
      reason: ''
    };
  } catch (error) {
    console.warn(`Embed status check failed for ${videoId}:`, error.message);
    return {
      embeddable: true,
      embedScore: 1,
      reason: ''
    };
  }
}

/**
 * Extract video data from YouTube HTML
 */
function extractVideosFromHtml(html) {
  const videos = [];
  
  try {
    // YouTube embeds data in a var ytInitialData object
    const dataMatch = html.match(/var ytInitialData = ({.*?});/);
    
    if (!dataMatch) {
      console.error('Could not find ytInitialData in HTML');
      return videos;
    }

    const data = JSON.parse(dataMatch[1]);
    
    // Navigate through YouTube's data structure
    const contents = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];
    
    for (const section of contents) {
      const items = section?.itemSectionRenderer?.contents || [];
      
      for (const item of items) {
        const videoRenderer = item?.videoRenderer;
        
        if (videoRenderer) {
          const video = parseVideoRenderer(videoRenderer);
          if (video) {
            videos.push(video);
          }
        }
      }
    }
    
    console.log(`Extracted ${videos.length} videos from YouTube`);
  } catch (error) {
    console.error('Error parsing YouTube HTML:', error.message);
  }
  
  return videos;
}

/**
 * Parse individual video data from videoRenderer object
 */
function parseVideoRenderer(videoRenderer) {
  try {
    const videoId = videoRenderer.videoId;
    const title = videoRenderer.title?.runs?.[0]?.text || 'Unknown Title';
    const channelId = videoRenderer.ownerText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId;
    const channelName = videoRenderer.ownerText?.runs?.[0]?.text || 'Unknown Channel';
    
    // Get thumbnail (highest quality available)
    const thumbnails = videoRenderer.thumbnail?.thumbnails || [];
    const thumbnail = thumbnails[thumbnails.length - 1]?.url || '';
    
    // Get length/duration
    const lengthText = videoRenderer.lengthText?.simpleText || '0:00';
    const durationSeconds = parseDuration(lengthText);
    
    // Get view count
    const viewCountText = videoRenderer.viewCountText?.simpleText || '0 views';
    const viewCount = parseViewCount(viewCountText);
    
    // Get published date
    const publishedTimeText = videoRenderer.publishedTimeText?.simpleText || '';
    
    // Get description snippet
    const descriptionSnippet = videoRenderer.detailedMetadataSnippets?.[0]?.snippetText?.runs?.map(r => r.text).join('') || '';
    
    return {
      videoId,
      title,
      channelId,
      channelName,
      thumbnail,
      duration: durationSeconds,
      durationText: lengthText,
      viewCount,
      viewCountText,
      publishedTimeText,
      description: descriptionSnippet,
      url: `https://www.youtube.com/watch?v=${videoId}`
    };
  } catch (error) {
    console.error('Error parsing video renderer:', error.message);
    return null;
  }
}

/**
 * Parse duration text (e.g., "10:45") to seconds
 */
function parseDuration(durationText) {
  const parts = durationText.split(':').map(p => parseInt(p, 10));
  
  if (parts.length === 2) {
    // MM:SS
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    // HH:MM:SS
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  
  return 0;
}

/**
 * Parse view count text (e.g., "1.2M views") to number
 */
function parseViewCount(viewCountText) {
  const match = viewCountText.match(/([\d.]+)([KMB]?)/i);
  
  if (!match) return 0;
  
  const num = parseFloat(match[1]);
  const multiplier = match[2].toUpperCase();
  
  const multipliers = {
    'K': 1000,
    'M': 1000000,
    'B': 1000000000
  };
  
  return Math.floor(num * (multipliers[multiplier] || 1));
}

/**
 * Get video details (for watch page)
 */
async function getVideoDetails(videoId) {
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const fallbackThumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  try {
    const oEmbedResponse = await axios.get('https://www.youtube.com/oembed', {
      params: {
        url: videoUrl,
        format: 'json'
      },
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    return {
      videoId,
      title: oEmbedResponse.data?.title || 'Unknown',
      channelId: null,
      channelName: oEmbedResponse.data?.author_name || 'Unknown',
      description: '',
      thumbnail: oEmbedResponse.data?.thumbnail_url || fallbackThumbnail,
      url: videoUrl
    };
  } catch (oEmbedError) {
    console.warn('oEmbed fetch failed, falling back to watch page scrape:', oEmbedError.message);
  }

  try {
    const response = await axios.get(videoUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    const html = response.data;
    
    // Extract ytInitialData
    const dataMatch = html.match(/var ytInitialData = ({.*?});/);
    
    if (!dataMatch) {
      throw new Error('Could not extract video data');
    }

    const data = JSON.parse(dataMatch[1]);
    
    // Extract video details
    const videoDetails = data?.contents?.twoColumnWatchNextResults?.results?.results?.contents?.[0]?.videoPrimaryInfoRenderer;
    const videoSecondary = data?.contents?.twoColumnWatchNextResults?.results?.results?.contents?.[1]?.videoSecondaryInfoRenderer;
    
    const title = videoDetails?.title?.runs?.[0]?.text || 'Unknown';
    const channelName = videoSecondary?.owner?.videoOwnerRenderer?.title?.runs?.[0]?.text || 'Unknown';
    const channelId = videoSecondary?.owner?.videoOwnerRenderer?.navigationEndpoint?.browseEndpoint?.browseId;
    
    const description = videoSecondary?.attributedDescription?.content || '';
    
    return {
      videoId,
      title,
      channelId,
      channelName,
      description,
      thumbnail: fallbackThumbnail,
      url: videoUrl
    };
  } catch (error) {
    console.error('Error fetching video details:', error.message);
    throw error;
  }
}

module.exports = {
  searchVideos,
  getVideoDetails,
  getEmbedStatus
};
