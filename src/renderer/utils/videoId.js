/**
 * Shared YouTube video ID normalization utilities.
 *
 * Used across YouTubeSearchView, ProjectBuilderPage, VideoWatchPage,
 * and any other component that handles YouTube video objects.
 */

/**
 * Strip source-manager prefix from a raw video ID.
 * e.g. "youtube:dQw4w9WgXcQ" → "dQw4w9WgXcQ"
 */
export function stripSourcePrefix(rawId) {
  if (!rawId) return rawId;
  const str = String(rawId);
  const colonIdx = str.lastIndexOf(':');
  if (colonIdx > 0) return str.slice(colonIdx + 1);
  return str;
}

/**
 * Extract a clean YouTube video ID from any shape of video object
 * returned by the search pipeline or API.
 *
 * Handles:
 *   video.videoId
 *   video.id.videoId
 *   video.id (string)
 */
export function getVideoId(video) {
  if (!video) return null;

  if (video.videoId) return stripSourcePrefix(video.videoId);
  if (video.id?.videoId) return stripSourcePrefix(video.id.videoId);
  if (typeof video.id === 'string') return stripSourcePrefix(video.id);

  return null;
}

/**
 * Check whether a video object has a plausible YouTube video ID
 * (6-15 chars, alphanumeric + dash/underscore).
 */
export function isPlayableYouTubeVideo(video) {
  const id = getVideoId(video);
  return Boolean(id && /^[a-zA-Z0-9_-]{6,15}$/.test(id));
}

/**
 * Normalize a video object so it has a consistent shape for playback.
 * Returns null if the video has no valid ID.
 */
export function normalizePlayableVideo(video) {
  const videoId = getVideoId(video);
  if (!videoId) return null;

  return {
    ...video,
    videoId,
    id: {
      ...(video?.id && typeof video.id === 'object' ? video.id : {}),
      videoId,
    },
    thumbnail: video?.thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
  };
}
