/**
 * Learning Path Engine
 * 
 * Orders videos from beginner → intermediate → advanced
 * Based on educational signals, complexity, and skill-building potential
 */

/**
 * Determine difficulty level of a video based on its features
 * @param {Object} video - Video object with features from rankingEngine
 * @returns {string} - 'beginner' | 'intermediate' | 'advanced'
 */
function classifyVideoLevel(video) {
  const features = video.features || {};
  
  // Extract relevant features (0-100 scale)
  const educational = features.educationalSignals || 0;
  const complexity = features.complexityScore || 50;
  const topical = features.topicalRelevance || 0;
  const entertainment = features.entertainmentSignals || 0;
  const duration = video.duration || video.durationSeconds || 0;
  
  // ADVANCED: High educational value + long form + low stimulation
  if (
    educational > 70 &&
    complexity > 60 &&
    duration > 600 && // 10+ minutes
    entertainment < 30
  ) {
    return 'advanced';
  }
  
  // BEGINNER: Short, simple, high entertainment (engaging for kids)
  if (
    duration < 300 || // Under 5 minutes
    complexity < 40 ||
    (entertainment > 60 && educational < 50)
  ) {
    return 'beginner';
  }
  
  // INTERMEDIATE: Everything else
  return 'intermediate';
}

/**
 * Calculate a learning score for path ordering within same level
 * Higher = better for learning progression
 */
function calculateLearningScore(video) {
  const features = video.features || {};
  
  return (
    (features.educationalSignals || 0) * 0.4 +
    (features.topicalRelevance || 0) * 0.3 +
    (100 - (features.entertainmentSignals || 0)) * 0.2 +
    (features.complexityScore || 50) * 0.1
  );
}

/**
 * Generate a structured learning path from ranked videos
 * @param {Array} videos - Array of video objects from rankingEngine
 * @returns {Object} - Categorized and ordered learning path
 */
export function generateLearningPath(videos) {
  if (!videos || videos.length === 0) {
    return {
      beginner: [],
      intermediate: [],
      advanced: [],
      totalVideos: 0
    };
  }
  
  // Classify each video and add learning score
  const classifiedVideos = videos.map(video => ({
    ...video,
    level: classifyVideoLevel(video),
    learningScore: calculateLearningScore(video)
  }));
  
  // Group by level
  const beginner = classifiedVideos
    .filter(v => v.level === 'beginner')
    .sort((a, b) => b.learningScore - a.learningScore);
    
  const intermediate = classifiedVideos
    .filter(v => v.level === 'intermediate')
    .sort((a, b) => b.learningScore - a.learningScore);
    
  const advanced = classifiedVideos
    .filter(v => v.level === 'advanced')
    .sort((a, b) => b.learningScore - a.learningScore);
  
  return {
    beginner,
    intermediate,
    advanced,
    totalVideos: videos.length,
    distribution: {
      beginner: beginner.length,
      intermediate: intermediate.length,
      advanced: advanced.length
    }
  };
}

/**
 * Get recommended starting video (easiest beginner video)
 * @param {Object} learningPath - Output from generateLearningPath
 * @returns {Object|null} - Recommended starting video
 */
export function getRecommendedStart(learningPath) {
  if (learningPath.beginner.length > 0) {
    return learningPath.beginner[0];
  }
  if (learningPath.intermediate.length > 0) {
    return learningPath.intermediate[0];
  }
  if (learningPath.advanced.length > 0) {
    return learningPath.advanced[0];
  }
  return null;
}

/**
 * Get next recommended video based on current level
 * @param {Object} learningPath - Output from generateLearningPath
 * @param {string} currentLevel - 'beginner' | 'intermediate' | 'advanced'
 * @param {number} currentIndex - Index of current video in that level
 * @returns {Object|null} - Next recommended video
 */
export function getNextRecommendation(learningPath, currentLevel, currentIndex) {
  const currentLevelVideos = learningPath[currentLevel] || [];
  
  // Try next video in same level
  if (currentIndex + 1 < currentLevelVideos.length) {
    return {
      video: currentLevelVideos[currentIndex + 1],
      level: currentLevel,
      index: currentIndex + 1,
      message: `Continue with ${currentLevel} videos`
    };
  }
  
  // Level up!
  if (currentLevel === 'beginner' && learningPath.intermediate.length > 0) {
    return {
      video: learningPath.intermediate[0],
      level: 'intermediate',
      index: 0,
      message: '🎉 Level up to Intermediate!'
    };
  }
  
  if (currentLevel === 'intermediate' && learningPath.advanced.length > 0) {
    return {
      video: learningPath.advanced[0],
      level: 'advanced',
      index: 0,
      message: '🚀 Level up to Advanced!'
    };
  }
  
  // Completed all videos
  return {
    video: null,
    level: null,
    index: -1,
    message: '🏆 You completed the entire learning path!'
  };
}

/**
 * Generate learning path summary for UI display
 * @param {Object} learningPath - Output from generateLearningPath
 * @returns {Object} - Summary with metadata
 */
export function getLearningPathSummary(learningPath) {
  const estimateTime = (videos) => {
    const totalSeconds = videos.reduce((sum, v) => 
      sum + (v.duration || v.durationSeconds || 0), 0
    );
    const minutes = Math.round(totalSeconds / 60);
    return minutes;
  };
  
  return {
    totalVideos: learningPath.totalVideos,
    levels: {
      beginner: {
        count: learningPath.distribution.beginner,
        estimatedMinutes: estimateTime(learningPath.beginner),
        description: 'Start here! Easy, engaging videos to build confidence'
      },
      intermediate: {
        count: learningPath.distribution.intermediate,
        estimatedMinutes: estimateTime(learningPath.intermediate),
        description: 'Build skills with hands-on tutorials'
      },
      advanced: {
        count: learningPath.distribution.advanced,
        estimatedMinutes: estimateTime(learningPath.advanced),
        description: 'Master advanced techniques'
      }
    },
    recommendedStart: getRecommendedStart(learningPath),
    totalEstimatedTime: estimateTime([
      ...learningPath.beginner,
      ...learningPath.intermediate,
      ...learningPath.advanced
    ])
  };
}

/**
 * Filter learning path to max N videos per level
 * Useful for limiting UI clutter
 * @param {Object} learningPath - Output from generateLearningPath
 * @param {number} maxPerLevel - Maximum videos per level (default: 6)
 * @returns {Object} - Filtered learning path
 */
export function limitLearningPath(learningPath, maxPerLevel = 6) {
  return {
    beginner: learningPath.beginner.slice(0, maxPerLevel),
    intermediate: learningPath.intermediate.slice(0, maxPerLevel),
    advanced: learningPath.advanced.slice(0, maxPerLevel),
    totalVideos: Math.min(
      learningPath.totalVideos,
      maxPerLevel * 3
    ),
    distribution: {
      beginner: Math.min(learningPath.distribution.beginner, maxPerLevel),
      intermediate: Math.min(learningPath.distribution.intermediate, maxPerLevel),
      advanced: Math.min(learningPath.distribution.advanced, maxPerLevel)
    },
    isLimited: true,
    originalTotal: learningPath.totalVideos
  };
}
