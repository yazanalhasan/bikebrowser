/**
 * Feature Extractor for Video Ranking
 * Analyzes video metadata to extract scoring features
 */

const { POSITIVE_KEYWORDS, NEGATIVE_KEYWORDS, EDUCATIONAL_KEYWORDS } = require('./fastRules');

/**
 * Extract features from video metadata
 */
function extractFeatures(video) {
  const title = video.title.toLowerCase();
  const description = (video.description || '').toLowerCase();
  const combined = title + ' ' + description;
  
  return {
    topicalRelevance: calculateTopicalRelevance(combined),
    educationalSignals: calculateEducationalSignals(combined),
    entertainmentSignals: calculateEntertainmentSignals(combined, video.title),
    complexityScore: calculateComplexityScore(description),
    videoId: video.videoId
  };
}

/**
 * Calculate topical relevance (0-100)
 * How well the video matches bike-related topics
 */
function calculateTopicalRelevance(text) {
  const matches = countUniqueMatches(text, POSITIVE_KEYWORDS);
  const totalWords = text.split(/\s+/).length;
  
  // Score based on keyword density
  const density = (matches / Math.max(totalWords, 1)) * 100;
  
  // Also score on absolute matches
  const absoluteScore = Math.min(matches * 10, 50);
  
  return Math.min(density * 0.5 + absoluteScore * 0.5, 100);
}

/**
 * Calculate educational signals (0-100)
 * How well the video indicates educational content
 */
function calculateEducationalSignals(text) {
  let score = 0;
  
  // Count educational keywords
  const eduMatches = countUniqueMatches(text, EDUCATIONAL_KEYWORDS);
  score += eduMatches * 10;
  
  // Check for tutorial structure indicators
  if (/how to|step \d+|first|second|third|finally/.test(text)) {
    score += 15;
  }
  
  // Check for explanation patterns
  if (/explained|understand|learn|basics|fundamentals/.test(text)) {
    score += 10;
  }
  
  // Check for technical vocabulary (indicates depth)
  const technicalTerms = [
    'torque', 'suspension', 'geometry', 'derailleur', 'cassette',
    'hub', 'spoke', 'rim', 'brake caliper', 'fork', 'shock',
    'voltage', 'watt', 'amp', 'controller', 'motor', 'battery'
  ];
  score += countUniqueMatches(text, technicalTerms) * 5;
  
  return Math.min(score, 100);
}

/**
 * Calculate entertainment signals (0-100)
 * Higher score means more entertainment-focused, less educational
 */
function calculateEntertainmentSignals(text, originalTitle) {
  let score = 0;
  
  // Count negative keywords
  const negMatches = countUniqueMatches(text, NEGATIVE_KEYWORDS);
  score += negMatches * 15;
  
  // Clickbait indicators
  const clickbaitPhrases = [
    'you won\'t believe', 'shocking', 'insane', 'crazy', 'epic fail',
    'gone wrong', 'almost died', 'mind blown', 'must see'
  ];
  score += countUniqueMatches(text, clickbaitPhrases) * 20;
  
  // Excessive caps in title
  const capsRatio = (originalTitle.match(/[A-Z]/g) || []).length / originalTitle.length;
  if (capsRatio > 0.5) {
    score += 25;
  }
  
  // Excessive exclamation marks
  const exclamations = (originalTitle.match(/!/g) || []).length;
  score += exclamations * 10;
  
  return Math.min(score, 100);
}

/**
 * Calculate complexity score (0-100)
 * Estimates reading level and technical depth
 */
function calculateComplexityScore(text) {
  if (!text || text.length < 50) {
    return 30; // Default for short/no description
  }
  
  const words = text.split(/\s+/);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  // Average word length
  const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
  
  // Average sentence length
  const avgSentenceLength = words.length / Math.max(sentences.length, 1);
  
  // Simple complexity score (approximates grade level)
  const complexity = (avgWordLength * 4) + (avgSentenceLength * 0.5);
  
  // Normalize to 0-100 (targeting grade 4-6 as ideal, which is ~40-60 on this scale)
  const normalized = Math.min(complexity * 5, 100);
  
  return normalized;
}

/**
 * Count unique keyword matches in text
 */
function countUniqueMatches(text, keywords) {
  let count = 0;
  for (const keyword of keywords) {
    if (text.includes(keyword)) {
      count++;
    }
  }
  return count;
}

/**
 * Generate human-readable explanation for features
 */
function generateExplanation(video, features, trustLevel, finalScore) {
  const explanations = [];
  
  // Trust level explanation
  if (trustLevel === 'trusted') {
    explanations.push('✓ This is a trusted educational channel');
  } else if (trustLevel === 'blocked') {
    explanations.push('✗ This channel has been blocked');
  }
  
  // Topical relevance
  if (features.topicalRelevance > 70) {
    explanations.push('✓ Highly relevant to bikes and building');
  } else if (features.topicalRelevance < 30) {
    explanations.push('⚠ This video may not be about bikes');
  }
  
  // Educational signals
  if (features.educationalSignals > 60) {
    explanations.push('✓ This appears to be a tutorial or guide');
  }
  
  // Entertainment signals
  if (features.entertainmentSignals > 50) {
    explanations.push('⚠ This video focuses on entertainment rather than learning');
  }
  
  // Overall assessment
  if (finalScore >= 70) {
    explanations.push('📚 Great for learning!');
  } else if (finalScore < 30) {
    explanations.push('💭 Consider searching for educational content instead');
  }
  
  return explanations.join(' • ');
}

module.exports = {
  extractFeatures,
  generateExplanation
};
