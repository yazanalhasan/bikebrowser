/**
 * Video to Mission Service
 * 
 * Bridge between videos and missions
 * Handles conversion from YouTube video to actionable building mission
 */

import { createMissionFromVideo } from '../services/buildMissions.js';

/**
 * Generate a mission from a video
 * @param {Object} video - Video object from YouTube scraper
 * @param {Object} rankedVideo - Video with ranking features (optional)
 * @returns {Object} - Mission object
 */
export function generateMissionFromVideo(video, rankedVideo) {
  return createMissionFromVideo(video, rankedVideo);
}

/**
 * Check if a video is suitable for mission creation
 * @param {Object} video - Video object
 * @returns {boolean} - True if video is mission-worthy
 */
export function canCreateMission(video) {
  const features = video.features || {};
  
  // Must have decent educational value
  if (features.educationalSignals < 30) return false;
  
  // Must be bike-related
  if (features.topicalRelevance < 50) return false;
  
  // Must not be pure entertainment
  if (features.entertainmentSignals > 80) return false;
  
  // Must have reasonable duration (1-30 minutes)
  const duration = video.duration || video.durationSeconds || 0;
  if (duration < 60 || duration > 1800) return false;
  
  return true;
}

/**
 * Filter videos that are suitable for missions
 * @param {Array} videos - Array of video objects
 * @returns {Array} - Filtered videos suitable for missions
 */
export function filterMissionVideos(videos) {
  return videos.filter(video => canCreateMission(video));
}

/**
 * Get mission quality score (0-100)
 * Higher = better mission candidate
 * @param {Object} video - Video object
 * @returns {number} - Quality score
 */
export function getMissionQuality(video) {
  const features = video.features || {};
  
  return Math.round(
    (features.educationalSignals || 0) * 0.5 +
    (features.topicalRelevance || 0) * 0.3 +
    (100 - (features.entertainmentSignals || 0)) * 0.2
  );
}

/**
 * Suggest best mission videos from a list
 * @param {Array} videos - Array of video objects
 * @param {number} limit - Maximum missions to suggest (default: 5)
 * @returns {Array} - Best mission candidate videos
 */
export function suggestMissionVideos(videos, limit = 5) {
  return videos
    .filter(video => canCreateMission(video))
    .map(video => ({
      ...video,
      missionQuality: getMissionQuality(video)
    }))
    .sort((a, b) => b.missionQuality - a.missionQuality)
    .slice(0, limit);
}

/**
 * Generate mission preview (lightweight, for UI cards)
 * @param {Object} video - Video object
 * @returns {Object} - Mission preview
 */
export function generateMissionPreview(video) {
  const fullMission = createMissionFromVideo(video);
  
  return {
    missionId: fullMission.missionId,
    videoId: video.videoId,
    title: fullMission.title,
    difficulty: fullMission.difficulty,
    estimatedMinutes: fullMission.estimatedMinutes,
    rewardPoints: fullMission.rewardPoints,
    materialCount: fullMission.materials.length,
    stepCount: fullMission.steps.length,
    thumbnail: video.thumbnail,
    canCreate: canCreateMission(video),
    quality: getMissionQuality(video)
  };
}

/**
 * Batch generate mission previews
 * @param {Array} videos - Array of video objects
 * @returns {Array} - Array of mission previews
 */
export function generateMissionPreviews(videos) {
  return videos
    .filter(video => canCreateMission(video))
    .map(video => generateMissionPreview(video));
}
