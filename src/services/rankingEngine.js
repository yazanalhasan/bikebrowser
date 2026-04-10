/**
 * Ranking Engine
 * Orchestrates video scoring and ranking
 */

const youtubeScraper = require('./youtubeScraper');
const fastRules = require('./fastRules');
const featureExtractor = require('./featureExtractor');
const db = require('./db');

// Initialize database
db.init();

// Scoring thresholds (configurable in parent dashboard in Phase 3)
const THRESHOLDS = {
  PRIORITIZE: 70,
  ALLOW: 40,
  DOWNRANK: 20,
  BLOCK: 0
};

// Feature weights for final score
const WEIGHTS = {
  topicalRelevance: 0.4,
  educationalSignals: 0.3,
  entertainmentSignals: -0.2,
  complexityScore: 0.1
};

const EMBED_BONUS = 5;
const EMBED_BLOCK_PENALTY = 35;
const CHANNEL_BLOCK_PENALTY_STEP = 5;
const CHANNEL_BLOCK_PENALTY_CAP = 15;

async function enrichVideoWithEmbedStatus(video) {
  const cachedStatus = db.embedFeedback.get(video.videoId);

  let embedStatus;
  if (cachedStatus) {
    embedStatus = {
      embeddable: Boolean(cachedStatus.embeddable),
      embedScore: cachedStatus.embeddable ? 1 : 0,
      reason: cachedStatus.failure_reason || ''
    };
  } else {
    embedStatus = await youtubeScraper.getEmbedStatus(video.videoId);
    db.embedFeedback.set(video.videoId, video.channelId, embedStatus.embeddable, embedStatus.reason);
  }

  const blockedCount = db.embedFeedback.getChannelBlockedCount(video.channelId);
  const channelEmbedPenalty = Math.min(CHANNEL_BLOCK_PENALTY_CAP, blockedCount * CHANNEL_BLOCK_PENALTY_STEP);

  return {
    ...video,
    embeddable: embedStatus.embeddable,
    embedScore: embedStatus.embedScore,
    embedFailureReason: embedStatus.reason,
    channelEmbedPenalty
  };
}

/**
 * Process a YouTube search query
 * Returns ranked list of videos
 */
async function processSearch(query) {
  try {
    console.log('Processing search for:', query);
    
    // Fetch videos from YouTube
    const videos = await youtubeScraper.searchVideos(query);
    
    if (!videos || videos.length === 0) {
      return [];
    }
    
    const videosWithEmbedStatus = await Promise.all(videos.map(enrichVideoWithEmbedStatus));

    // Score and rank each video
    const rankedVideos = [];
    
    for (const video of videosWithEmbedStatus) {
      // Check cache first
      const cached = db.rankingCache.get(video.videoId);
      
      let score, features, explanation;
      
      if (
        cached &&
        cached.features?.embedScore === video.embedScore &&
        cached.features?.channelEmbedPenalty === video.channelEmbedPenalty
      ) {
        score = cached.score;
        features = cached.features;
        console.log(`Using cached score for ${video.videoId}: ${score}`);
      } else {
        // Calculate new score
        const result = scoreVideo(video);
        score = result.score;
        features = result.features;
        explanation = result.explanation;
        
        // Cache the result
        db.rankingCache.set(video.videoId, score, features);
      }
      
      // Get explanation if not from cache
      if (!explanation) {
        explanation = featureExtractor.generateExplanation(
          video,
          features,
          features.trustLevel,
          score
        );
      }
      
      // Determine trust tier
      const trustTier = getTrustTier(score);
      
      rankedVideos.push({
        ...video,
        score,
        features,
        trustTier,
        explanation,
        trustBadge: getTrustBadge(trustTier, features.trustLevel)
      });
    }
    
    // Sort by score (descending)
    rankedVideos.sort((a, b) => b.score - a.score);
    
    console.log(`Ranked ${rankedVideos.length} videos`);
    
    return rankedVideos;
  } catch (error) {
    console.error('Error in processSearch:', error);
    throw error;
  }
}

/**
 * Score an individual video
 */
function scoreVideo(video) {
  // Get channel trust level
  const trustLevel = db.channels.getTrustLevel(video.channelId);
  
  // Check for video-specific override
  const override = db.videoOverrides.get(video.videoId);
  if (override) {
    return handleOverride(video, override, trustLevel);
  }
  
  // Apply fast rules
  const fastScore = fastRules.scoreVideo(video);
  
  // Extract features
  const features = featureExtractor.extractFeatures(video);
  features.trustLevel = trustLevel;
  features.embedScore = video.embedScore ?? 1;
  features.channelEmbedPenalty = video.channelEmbedPenalty ?? 0;
  
  // Calculate weighted score from features
  const featureScore = 
    (features.topicalRelevance * WEIGHTS.topicalRelevance) +
    (features.educationalSignals * WEIGHTS.educationalSignals) +
    (features.entertainmentSignals * WEIGHTS.entertainmentSignals) +
    (features.complexityScore * WEIGHTS.complexityScore);
  
  // Apply trust bonus
  const trustBonus = getTrustBonus(trustLevel);
  
  // Final score
  let finalScore = fastScore + featureScore + trustBonus;

  finalScore += features.embedScore > 0 ? EMBED_BONUS : -EMBED_BLOCK_PENALTY;
  finalScore -= features.channelEmbedPenalty;
  
  // Force blocked channels to bottom
  if (trustLevel === 'blocked') {
    finalScore = -100;
  }
  
  // Force trusted channels to top (but still allow feature scores to rank among them)
  if (trustLevel === 'trusted') {
    finalScore = Math.max(finalScore, 70); // Guarantee at least 70
  }
  
  // Clamp to 0-100 range (except blocked which can be negative)
  if (trustLevel !== 'blocked') {
    finalScore = Math.max(0, Math.min(100, finalScore));
  }
  
  const explanation = featureExtractor.generateExplanation(video, features, trustLevel, finalScore);

  const embedExplanation = features.embedScore > 0
    ? explanation
    : `May not play inside BikeBrowser. ${explanation}`;
  
  return {
    score: finalScore,
    features,
    explanation: embedExplanation
  };
}

/**
 * Handle video override
 */
function handleOverride(video, override, trustLevel) {
  const features = featureExtractor.extractFeatures(video);
  features.trustLevel = trustLevel;
  
  const overrideScores = {
    'prioritize': 90,
    'allow': 60,
    'downrank': 25,
    'block': -100
  };
  
  const score = overrideScores[override.decision] || 50;
  const explanation = `Parent override: ${override.reason || override.decision}`;
  
  return { score, features, explanation };
}

/**
 * Get trust bonus based on channel trust level
 */
function getTrustBonus(trustLevel) {
  const bonuses = {
    'trusted': 25,
    'allowed': 0,
    'blocked': -200,
    'unknown': 0
  };
  
  return bonuses[trustLevel] || 0;
}

/**
 * Get trust tier label based on score
 */
function getTrustTier(score) {
  if (score >= THRESHOLDS.PRIORITIZE) return 'prioritized';
  if (score >= THRESHOLDS.ALLOW) return 'allowed';
  if (score >= THRESHOLDS.DOWNRANK) return 'downranked';
  return 'blocked';
}

/**
 * Get trust badge info for UI
 */
function getTrustBadge(trustTier, trustLevel) {
  if (trustLevel === 'trusted') {
    return {
      label: 'Trusted Channel',
      color: 'green',
      icon: '✓'
    };
  }
  
  const badges = {
    'prioritized': {
      label: 'Great for Learning',
      color: 'green',
      icon: '⭐'
    },
    'allowed': {
      label: 'Relevant',
      color: 'blue',
      icon: '→'
    },
    'downranked': {
      label: 'Less Relevant',
      color: 'yellow',
      icon: '⚠'
    },
    'blocked': {
      label: 'Off-Topic',
      color: 'red',
      icon: '✗'
    }
  };
  
  return badges[trustTier] || badges['allowed'];
}

/**
 * Get video details (for watch page)
 */
async function getVideoDetails(videoId) {
  try {
    const video = await youtubeScraper.getVideoDetails(videoId);
    const videoWithEmbedStatus = await enrichVideoWithEmbedStatus(video);
    const result = scoreVideo(videoWithEmbedStatus);
    
    return {
      ...videoWithEmbedStatus,
      score: result.score,
      features: result.features,
      explanation: result.explanation
    };
  } catch (error) {
    console.error('Error getting video details:', error);
    throw error;
  }
}

module.exports = {
  processSearch,
  scoreVideo,
  getVideoDetails,
  reportEmbedStatus(videoId, channelId, embeddable, reason = '') {
    db.embedFeedback.set(videoId, channelId, embeddable, reason);
    db.rankingCache.delete(videoId);
  },
  THRESHOLDS,
  WEIGHTS
};
