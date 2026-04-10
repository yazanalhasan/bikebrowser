/**
 * Build Missions Service
 * 
 * Converts videos into actionable building missions for kids
 * Generates step-by-step guides with materials, time estimates, and rewards
 */

/**
 * Extract key materials/tools from video title and description
 * @param {string} text - Combined title + description
 * @returns {Array<string>} - List of materials
 */
function extractMaterials(text) {
  const materialKeywords = [
    'wrench', 'allen key', 'hex key', 'screwdriver', 'pliers',
    'tire lever', 'pump', 'grease', 'oil', 'lubricant',
    'brake pads', 'cable', 'chain', 'tube', 'tire',
    'pedal', 'seat', 'handlebar', 'grip', 'wheel',
    'spoke', 'rim', 'hub', 'bearing', 'bolt', 'nut',
    'frame', 'fork', 'suspension', 'derailleur', 'cassette'
  ];
  
  const found = new Set();
  const lowerText = text.toLowerCase();
  
  materialKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      found.add(keyword);
    }
  });
  
  // Return as array, limited to 8 items
  return Array.from(found).slice(0, 8);
}

/**
 * Estimate mission difficulty based on video features
 * @param {Object} video - Video object with features
 * @returns {string} - 'easy' | 'medium' | 'hard'
 */
function estimateDifficulty(video) {
  const features = video.features || {};
  const complexity = features.complexityScore || 50;
  const duration = video.duration || video.durationSeconds || 0;
  
  if (complexity < 40 && duration < 420) return 'easy';
  if (complexity > 65 || duration > 900) return 'hard';
  return 'medium';
}

/**
 * Estimate time to complete mission (not just watch video)
 * @param {Object} video - Video object
 * @returns {number} - Estimated minutes
 */
function estimateCompletionTime(video) {
  const duration = video.duration || video.durationSeconds || 0;
  const videoDuration = Math.round(duration / 60);
  
  // Building takes longer than watching
  // Simple formula: video time + 50% for hands-on work
  return Math.round(videoDuration * 1.5) || 15;
}

/**
 * Generate child-friendly steps from video
 * @param {Object} video - Video object
 * @returns {Array<Object>} - Array of step objects
 */
function generateSteps(video) {
  const title = video.title || '';
  const description = video.description || '';
  const difficulty = estimateDifficulty(video);
  
  // Generic steps based on common patterns
  const steps = [];
  
  // Step 1: Always gather materials
  steps.push({
    number: 1,
    title: 'Gather Your Tools & Materials',
    description: 'Get everything you need ready before you start',
    icon: '🧰',
    isComplete: false
  });
  
  // Step 2: Watch video
  steps.push({
    number: 2,
    title: 'Watch the Video Carefully',
    description: `Watch the video all the way through. Take notes if needed!`,
    icon: '📺',
    isComplete: false
  });
  
  // Step 3-5: Action steps (vary by difficulty)
  if (difficulty === 'easy') {
    steps.push({
      number: 3,
      title: 'Follow Along Step by Step',
      description: 'Pause the video and do each step carefully',
      icon: '🔧',
      isComplete: false
    });
  } else {
    steps.push({
      number: 3,
      title: 'Set Up Your Workspace',
      description: 'Make sure you have room to work safely',
      icon: '🏗️',
      isComplete: false
    });
    
    steps.push({
      number: 4,
      title: 'Follow the Instructions',
      description: 'Do each step carefully. Ask for help if stuck!',
      icon: '🔧',
      isComplete: false
    });
  }
  
  // Final step: test/reflect
  steps.push({
    number: steps.length + 1,
    title: 'Test Your Work',
    description: 'Make sure everything works correctly and safely',
    icon: '✅',
    isComplete: false
  });
  
  return steps;
}

/**
 * Generate reflection questions to deepen learning
 * @param {Object} video - Video object
 * @returns {Array<string>} - Array of questions
 */
function generateReflectionQuestions(video) {
  return [
    'What was the hardest part of this build?',
    'What would you do differently next time?',
    'What did you learn that surprised you?',
    'How could you improve or customize this project?'
  ];
}

/**
 * Calculate reward points based on difficulty and duration
 * @param {Object} video - Video object
 * @returns {number} - Points to award
 */
function calculateRewardPoints(video) {
  const difficulty = estimateDifficulty(video);
  const duration = video.duration || video.durationSeconds || 0;
  
  let basePoints = 50;
  
  if (difficulty === 'easy') basePoints = 30;
  if (difficulty === 'hard') basePoints = 100;
  
  // Bonus for longer projects
  if (duration > 600) basePoints += 20;
  if (duration > 1200) basePoints += 30;
  
  return basePoints;
}

/**
 * Main function: Create a mission from a video
 * @param {Object} video - Video object from YouTube
 * @param {Object} rankedVideo - Video with ranking features
 * @returns {Object} - Complete mission object
 */
export function createMissionFromVideo(video, rankedVideo = null) {
  const videoData = rankedVideo || video;
  const title = videoData.title || 'Untitled Mission';
  const description = videoData.description || '';
  const combinedText = `${title} ${description}`;
  
  const difficulty = estimateDifficulty(videoData);
  const estimatedTime = estimateCompletionTime(videoData);
  const materials = extractMaterials(combinedText);
  const steps = generateSteps(videoData);
  const reflectionQuestions = generateReflectionQuestions(videoData);
  const rewardPoints = calculateRewardPoints(videoData);
  
  // Generate mission ID from video ID
  const missionId = `mission_${videoData.videoId}_${Date.now()}`;
  
  return {
    missionId,
    videoId: videoData.videoId,
    title: `Build: ${title.substring(0, 60)}${title.length > 60 ? '...' : ''}`,
    description: `Learn to ${title.toLowerCase().replace(/^how to /i, '')}`,
    videoUrl: videoData.url || `https://www.youtube.com/watch?v=${videoData.videoId}`,
    thumbnail: videoData.thumbnail,
    
    // Mission metadata
    difficulty,
    estimatedMinutes: estimatedTime,
    rewardPoints,
    
    // Learning content
    materials,
    steps,
    reflectionQuestions,
    
    // Video metadata
    channelName: videoData.channelName,
    videoDuration: videoData.durationText,
    trustLevel: videoData.trustTier || 'unknown',
    
    // Progress tracking
    progress: {
      started: false,
      stepsCompleted: 0,
      totalSteps: steps.length,
      completed: false,
      startedAt: null,
      completedAt: null
    },
    
    // Metadata
    createdAt: new Date().toISOString(),
    source: 'video'
  };
}

/**
 * Create a batch of missions from multiple videos
 * @param {Array} videos - Array of video objects
 * @returns {Array<Object>} - Array of mission objects
 */
export function createMissionsFromVideos(videos) {
  return videos.map(video => createMissionFromVideo(video));
}

/**
 * Get difficulty icon
 * @param {string} difficulty - 'easy' | 'medium' | 'hard'
 * @returns {string} - Emoji icon
 */
export function getDifficultyIcon(difficulty) {
  const icons = {
    easy: '🟢',
    medium: '🟡',
    hard: '🔴'
  };
  return icons[difficulty] || '⚪';
}

/**
 * Get difficulty color
 * @param {string} difficulty - 'easy' | 'medium' | 'hard'
 * @returns {string} - Tailwind color class
 */
export function getDifficultyColor(difficulty) {
  const colors = {
    easy: 'green',
    medium: 'yellow',
    hard: 'red'
  };
  return colors[difficulty] || 'gray';
}
