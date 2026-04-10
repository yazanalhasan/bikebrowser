/**
 * Ranking Worker Thread
 * 
 * Offloads CPU-intensive ranking operations from main thread.
 * Tasks:
 * - Feature extraction (regex, string operations)
 * - Fast rules scoring
 * - Video scoring calculations
 * - Batch ranking operations
 */

const { parentPort } = require('worker_threads');

// Import scoring modules (these are pure functions, safe for worker)
const fastRules = require('../services/fastRules');
const featureExtractor = require('../services/featureExtractor');

/**
 * Score a single video
 */
function scoreVideo(video, channelTrustData) {
  try {
    // Extract features (CPU-intensive regex operations)
    const features = featureExtractor.extractFeatures(video);

    // Fast rules scoring
    const fastScore = fastRules.scoreVideo(video);

    // Calculate base score from features
    const baseScore = 
      features.topicalRelevance * 0.4 +
      features.educationalSignals * 0.3 -
      features.entertainmentSignals * 0.2 +
      features.complexityScore * 0.1;

    // Apply trust bonus
    const channelId = video.channelId || video.channel?.id;
    let trustBonus = 0;
    
    if (channelId && channelTrustData[channelId]) {
      const trustLevel = channelTrustData[channelId];
      switch (trustLevel) {
        case 'prioritized':
          trustBonus = 25;
          break;
        case 'allowed':
          trustBonus = 0;
          break;
        case 'downranked':
          trustBonus = -15;
          break;
        case 'blocked':
          trustBonus = -200; // Effective block
          break;
      }
    }

    // Total score
    const totalScore = fastScore + baseScore + trustBonus;

    return {
      videoId: video.videoId || video.id,
      score: totalScore,
      features,
      trustBonus,
      fastScore
    };
  } catch (error) {
    console.error('[RankingWorker] Error scoring video:', error);
    return {
      videoId: video.videoId || video.id,
      score: 0,
      features: {
        topicalRelevance: 0,
        educationalSignals: 0,
        entertainmentSignals: 0,
        complexityScore: 0
      },
      trustBonus: 0,
      fastScore: 0,
      error: error.message
    };
  }
}

/**
 * Rank a batch of videos
 */
function rankVideos(videos, channelTrustData, options = {}) {
  const results = [];

  for (const video of videos) {
    const result = scoreVideo(video, channelTrustData);
    results.push(result);
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  // Apply threshold filtering if requested
  if (options.minScore !== undefined) {
    return results.filter(r => r.score >= options.minScore);
  }

  return results;
}

/**
 * Extract features only (for caching purposes)
 */
function extractFeatures(video) {
  try {
    return featureExtractor.extractFeatures(video);
  } catch (error) {
    console.error('[RankingWorker] Error extracting features:', error);
    return {
      topicalRelevance: 0,
      educationalSignals: 0,
      entertainmentSignals: 0,
      complexityScore: 0,
      error: error.message
    };
  }
}

/**
 * Fast path screening (early rejection)
 */
function fastScreen(videos, channelTrustData) {
  const results = [];

  for (const video of videos) {
    const channelId = video.channelId || video.channel?.id;
    
    // Hard block check
    if (channelId && channelTrustData[channelId] === 'blocked') {
      results.push({
        videoId: video.videoId || video.id,
        blocked: true,
        reason: 'blocked_channel'
      });
      continue;
    }

    // Fast rules only
    const fastScore = fastRules.scoreVideo(video);
    
    // Early rejection threshold
    if (fastScore < -30) {
      results.push({
        videoId: video.videoId || video.id,
        blocked: true,
        reason: 'fast_rules_reject',
        fastScore
      });
      continue;
    }

    results.push({
      videoId: video.videoId || video.id,
      blocked: false,
      fastScore
    });
  }

  return results;
}

// Message handler
parentPort.on('message', (message) => {
  const { requestId, taskType, data } = message;

  try {
    let result;

    switch (taskType) {
      case 'scoreVideo':
        result = scoreVideo(data.video, data.channelTrustData);
        break;

      case 'rankVideos':
        result = rankVideos(data.videos, data.channelTrustData, data.options);
        break;

      case 'extractFeatures':
        result = extractFeatures(data.video);
        break;

      case 'fastScreen':
        result = fastScreen(data.videos, data.channelTrustData);
        break;

      default:
        throw new Error(`Unknown task type: ${taskType}`);
    }

    // Send result back to main thread
    parentPort.postMessage({
      requestId,
      result
    });
  } catch (error) {
    // Send error back to main thread
    parentPort.postMessage({
      requestId,
      error: error.message
    });
  }
});
