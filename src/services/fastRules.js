/**
 * Fast Rules for Video Ranking
 * Quick heuristics for scoring videos based on keywords and metadata
 */

// Positive keywords (boost score)
const POSITIVE_KEYWORDS = [
  'bike', 'bmx', 'e-bike', 'ebike', 'electric bike', 'dirt bike', 'mountain bike',
  'bicycle', 'cycling', 'tutorial', 'how to', 'how-to', 'guide', 'learn',
  'build', 'repair', 'fix', 'maintenance', 'assembly', 'setup',
  'engineering', 'mechanics', 'technical', 'review', 'explained',
  'welding', 'frame', 'suspension', 'brakes', 'gears', 'derailleur',
  'motor', 'battery', 'wheel', 'tire', 'chain', 'drivetrain',
  'controller', 'throttle', 'bms', 'hall sensor', 'phase wire', 'mosfet',
  'multimeter', 'carburetor', 'fork seal', 'top end', 'rebuild', 'valve clearance'
];

// Negative keywords (lower score)
const NEGATIVE_KEYWORDS = [
  'gaming', 'game', 'vlog', 'prank', 'challenge', 'reaction',
  'drama', 'beef', 'exposed', 'clickbait', 'shocking', 'insane',
  'you won\'t believe', 'almost died', 'gone wrong', 'versus', 'vs'
];

// Educational signals
const EDUCATIONAL_KEYWORDS = [
  'tutorial', 'how to', 'guide', 'learn', 'explained', 'step by step',
  'beginner', 'basics', 'fundamentals', 'lesson', 'course', 'teach',
  'demonstration', 'instruction', 'tips', 'tricks', 'technique',
  'diagnosis', 'diagnostic', 'troubleshooting', 'service', 'overhaul', 'rebuild'
];

/**
 * Score a video based on fast rules
 */
function scoreVideo(video) {
  let score = 0;
  const title = video.title.toLowerCase();
  const description = (video.description || '').toLowerCase();
  const combined = title + ' ' + description;
  
  // Keyword matching
  score += countKeywordMatches(combined, POSITIVE_KEYWORDS) * 5;
  score -= countKeywordMatches(combined, NEGATIVE_KEYWORDS) * 3;
  score += countKeywordMatches(combined, EDUCATIONAL_KEYWORDS) * 3;
  
  // Title analysis
  score += analyzeTitleQuality(video.title);
  
  // Duration heuristics
  score += analyzeDuration(video.duration);
  
  // View count (slight preference for proven content, but not too much)
  score += analyzeViewCount(video.viewCount);
  
  return Math.max(0, Math.min(score, 50)); // Cap fast rules at ±50
}

/**
 * Count how many keywords from list appear in text
 */
function countKeywordMatches(text, keywords) {
  let count = 0;
  for (const keyword of keywords) {
    if (text.includes(keyword)) {
      count++;
    }
  }
  return count;
}

/**
 * Analyze title quality
 */
function analyzeTitleQuality(title) {
  let score = 0;
  
  // Excessive caps (clickbait indicator)
  const capsRatio = (title.match(/[A-Z]/g) || []).length / title.length;
  if (capsRatio > 0.5) {
    score -= 10; // Too much caps
  }
  
  // Excessive punctuation
  const exclamationCount = (title.match(/!/g) || []).length;
  const questionCount = (title.match(/\?/g) || []).length;
  
  if (exclamationCount > 2 || questionCount > 2) {
    score -= 5; // Sensational
  }
  
  // Numbers in title (often indicates structured content like "10 tips" or "Part 1")
  if (/\d+/.test(title) && !/(part|episode|ep|\d+\s*min)/i.test(title)) {
    score += 2; // Likely structured content
  }
  
  return score;
}

/**
 * Analyze video duration
 */
function analyzeDuration(durationSeconds) {
  if (durationSeconds < 120) {
    return -5; // Too short, likely clickbait
  } else if (durationSeconds >= 120 && durationSeconds <= 1200) {
    return 5; // Ideal tutorial length (2-20 minutes)
  } else if (durationSeconds > 1800) {
    return -3; // Very long, might be rambling
  }
  return 0;
}

/**
 * Analyze view count
 */
function analyzeViewCount(viewCount) {
  if (viewCount > 100000) {
    return 2; // Popular, likely quality
  } else if (viewCount > 10000) {
    return 1;
  }
  return 0; // Don't penalize low views (might be newer content)
}

module.exports = {
  scoreVideo,
  POSITIVE_KEYWORDS,
  NEGATIVE_KEYWORDS,
  EDUCATIONAL_KEYWORDS
};
