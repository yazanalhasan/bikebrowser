import { memo, useMemo } from 'react';

/**
 * Optimized Video Card Component
 *
 * Props:
 *   video   {object}   Video data
 *   onClick {Function} Called with full video object — navigates to VideoWatchPage
 *
 * Performance optimizations:
 * - Memoized with React.memo (prevents re-renders when props unchanged)
 * - Memoized class name calculations
 * - Stable callback references
 */
const VideoCard = memo(function VideoCard({ video, videoId, title, thumbnail, onClick }) {
  const resolvedVideo = video || {
    videoId,
    title,
    thumbnail,
    channelName: '',
    trustTier: 'allowed',
  };

  const resolvedVideoId = resolvedVideo?.videoId
    || resolvedVideo?.id?.videoId
    || (typeof resolvedVideo?.id === 'string' ? resolvedVideo.id : videoId || null);
  const resolvedTitle = resolvedVideo?.title || title || 'Video';
  const resolvedThumbnail = resolvedVideo?.thumbnail || thumbnail || (resolvedVideoId
    ? `https://img.youtube.com/vi/${resolvedVideoId}/mqdefault.jpg`
    : 'https://via.placeholder.com/320x180?text=No+Thumbnail');

  // Memoize class calculations (only recalculate if video changes)
  const trustBadgeClass = useMemo(() => {
    if (resolvedVideo.trustBadge) {
      const colorMap = {
        green: 'badge-green',
        blue: 'badge-blue',
        yellow: 'badge-yellow',
        red: 'badge-red'
      };
      return colorMap[resolvedVideo.trustBadge.color] || 'badge-blue';
    }
    
    // Fallback based on trust tier
    const tierMap = {
      prioritized: 'badge-green',
      allowed: 'badge-blue',
      downranked: 'badge-yellow',
      blocked: 'badge-red'
    };
    return tierMap[resolvedVideo.trustTier] || 'badge-blue';
  }, [resolvedVideo.trustBadge, resolvedVideo.trustTier]);

  const borderColor = useMemo(() => {
    if (resolvedVideo.trustTier === 'prioritized') return 'border-green-300';
    if (resolvedVideo.trustTier === 'downranked') return 'border-yellow-300';
    if (resolvedVideo.trustTier === 'blocked') return 'border-red-300';
    return 'border-gray-200';
  }, [resolvedVideo.trustTier]);

  const handleCardClick = (event) => {
    event.preventDefault();
    event.stopPropagation();

    const hasOnClick = typeof onClick === 'function';

    window.api?.debugLog?.('VideoCard clicked', {
      videoId: resolvedVideoId,
      title: resolvedTitle,
      hasOnClick
    });

    console.log('VideoCard clicked, calling onClick with:', resolvedVideoId);

    if (hasOnClick) {
      onClick(resolvedVideoId, resolvedVideo);
      return;
    }

    if (resolvedVideoId && window.api?.openVideoPlayer) {
      window.api.debugLog?.('VideoCard falling back to Electron player window', {
        videoId: resolvedVideoId,
        title: resolvedTitle
      });
      window.api.openVideoPlayer(resolvedVideoId, resolvedTitle).catch(() => {});
    } else if (resolvedVideoId) {
      // Web mode fallback - navigate to watch page
      const basePath = window.location.protocol === 'file:' ? '#' : '';
      window.location.href = `${basePath}/youtube/watch/${resolvedVideoId}`;
    } else {
      console.error('onClick prop is missing or not a function');
    }
  };

  return (
    <button
      type="button"
      onClick={handleCardClick}
      className={`video-card card card-clickable overflow-hidden w-full text-left ${borderColor}`}
    >
      {/* Thumbnail */}
      <div className="relative group">
        <img
          src={resolvedThumbnail}
          alt={resolvedTitle}
          className="w-full aspect-video object-cover"
          loading="lazy"
          draggable="false"
          onError={(event) => {
            event.currentTarget.src = 'https://via.placeholder.com/320x180?text=No+Thumbnail';
          }}
        />

        
        {/* Duration badge */}
        {resolvedVideo.durationText && (
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white 
                        px-2 py-1 rounded text-sm font-semibold">
            {resolvedVideo.durationText}
          </div>
        )}
        
        {/* Trust badge */}
        <div className="absolute top-2 right-2">
          <span className={trustBadgeClass}>
            {resolvedVideo.trustBadge?.icon || '→'} {resolvedVideo.trustBadge?.label || resolvedVideo.trustTier}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="font-bold text-lg line-clamp-2 text-gray-900 mb-2">
          {resolvedTitle}
        </h3>

        {/* Channel */}
        <p className="text-gray-600 text-sm mb-2">
          📺 {resolvedVideo.channelName}
        </p>

        {/* Metadata */}
        {resolvedVideo.viewCountText && (
          <p className="text-gray-500 text-xs mb-3">
            {resolvedVideo.viewCountText} • {resolvedVideo.publishedTimeText}
          </p>
        )}

        {/* Explanation */}
        {resolvedVideo.explanation && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-sm text-gray-700 italic line-clamp-2">
              {resolvedVideo.explanation}
            </p>
          </div>
        )}

        {/* Score (for debugging - can be hidden in production) */}
        {resolvedVideo.score !== undefined && (
          <div className="mt-2 text-xs text-gray-400">
            Score: {Math.round(resolvedVideo.score)}
          </div>
        )}
      </div>
    </button>
  );
});

export default VideoCard;
