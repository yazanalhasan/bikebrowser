import { memo, useEffect, useRef, useCallback, useState } from 'react';
import YouTubePlayer from './YouTubePlayer';

const PLAYER_TIMEOUT_MS = 4500;

function getFallbackReason(video, error) {
  if (error?.message) {
    return error.message;
  }

  if (video?.embedFailureReason) {
    return video.embedFailureReason;
  }

  if (video?.embeddable === false || video?.embedScore === 0) {
    return 'This video blocks embedded playback.';
  }

  return 'The embedded player could not be started in the app.';
}

/**
 * VideoPlayerModal
 *
 * Renders a single YouTube embed in a focus-trapped overlay.
 *
 * Safety guarantees:
 * - Only ONE instance is ever mounted (parent controls activeVideo state).
 * - iframe src is cleared on close (stops audio/video immediately).
 * - iframe is never rendered unless videoId is present.
 * - ESC and backdrop click both close the modal.
 *
 * Props:
 *   video   {object}   Full video object (videoId, title, channelName, thumbnail)
 *   onClose {Function} Called when user dismisses the modal
 */
const VideoPlayerModal = memo(function VideoPlayerModal({ video, onClose, onFindSimilar, isOpen = true }) {
  const backdropRef = useRef(null);
  const [playbackState, setPlaybackState] = useState('loading');
  const [failureReason, setFailureReason] = useState('');

  const videoId = video?.videoId
    || video?.id?.videoId
    || (typeof video?.id === 'string' ? video.id : null);
  const watchUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : '';

  const handleClose = useCallback((event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    onClose();
  }, [onClose]);

  // ── ESC key ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleClose]);

  useEffect(() => {
    if (!isOpen || !videoId) {
      return undefined;
    }

    const knownBlocked = video?.embedScore === 0 || video?.embeddable === false;
    setPlaybackState(knownBlocked ? 'fallback' : 'loading');
    setFailureReason(knownBlocked ? getFallbackReason(video) : '');

    if (knownBlocked) {
      return undefined;
    }

    const timer = setTimeout(() => {
      setPlaybackState((currentState) => {
        if (currentState === 'ready') {
          return currentState;
        }

        setFailureReason((currentReason) => currentReason || 'The embedded player timed out before it became interactive.');
        return 'fallback';
      });
    }, PLAYER_TIMEOUT_MS);

    return () => clearTimeout(timer);
  }, [isOpen, videoId, video?.embedScore, video?.embeddable, video?.embedFailureReason]);

  // ── Backdrop click — close only when clicking the dark overlay itself ─────
  const handleBackdropClick = useCallback((e) => {
    if (e.target === backdropRef.current) {
      handleClose();
    }
  }, [handleClose]);

  const handleBackdropPointerDown = useCallback((e) => {
    if (e.target === backdropRef.current) {
      handleClose(e);
    }
  }, [handleClose]);

  const handleOpenExternal = useCallback(async () => {
    try {
      await window.api?.openExternal?.(watchUrl);
    } catch (err) {
      console.error('[VideoPlayerModal] openExternal failed:', err);
    }
  }, [watchUrl]);

  useEffect(() => {
    if (!videoId) {
      return;
    }

    window.api?.debugLog?.('VideoPlayerModal playback state changed', {
      videoId,
      playbackState,
      failureReason
    });

    if (playbackState === 'fallback') {
      const result = window.api?.reportEmbedStatus?.(
        videoId,
        video?.channelId || null,
        false,
        failureReason || getFallbackReason(video)
      );

      if (result?.catch) {
        result.catch(() => {});
      }

      return;
    }

    if (playbackState === 'ready') {
      const result = window.api?.reportEmbedStatus?.(
        videoId,
        video?.channelId || null,
        true,
        ''
      );

      if (result?.catch) {
        result.catch(() => {});
      }
    }
  }, [failureReason, playbackState, videoId, video, video?.channelId]);

  const handlePlayerReady = useCallback(() => {
    setPlaybackState('ready');
    setFailureReason('');
  }, []);

  const handlePlayerError = useCallback((error) => {
    setFailureReason(getFallbackReason(video, error));
    setPlaybackState('fallback');
  }, [video]);

  const handleFindSimilar = useCallback(() => {
    onFindSimilar?.();
    onClose();
  }, [onClose, onFindSimilar]);

  const isFallback = playbackState === 'fallback';
  const isLoading = playbackState === 'loading';

  if (!isOpen || !videoId) return null;

  if (isFallback) {
    return (
      <div
        ref={backdropRef}
        onMouseDown={handleBackdropPointerDown}
        onClick={handleBackdropClick}
        className="video-player-backdrop fixed inset-0 z-50 flex items-center justify-center"
        style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(2px)' }}
        role="dialog"
        aria-modal="true"
        aria-label="Video playback fallback"
      >
        <div
          className="video-player-fallback-card w-[min(92vw,32rem)] rounded-3xl bg-slate-950 p-8 text-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-sm uppercase tracking-[0.3em] text-amber-300">Playback fallback</p>
          <h2 className="mt-3 text-3xl font-bold">Can&apos;t play this video here</h2>
          <p className="mt-3 text-sm text-slate-300">
            This video appears to block in-app embeds. You can watch it on YouTube or go back to similar results.
          </p>
          <p className="mt-4 rounded-2xl bg-white/5 px-4 py-3 text-sm text-slate-300">
            {failureReason || getFallbackReason(video)}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={handleOpenExternal}
              className="rounded-xl bg-red-600 px-4 py-3 font-semibold text-white hover:bg-red-500"
            >
              Watch on YouTube
            </button>
            <button
              onClick={handleFindSimilar}
              className="rounded-xl bg-slate-800 px-4 py-3 font-semibold text-white hover:bg-slate-700"
            >
              Show similar videos
            </button>
            <button
              onClick={handleClose}
              className="rounded-xl border border-white/15 bg-transparent px-4 py-3 font-semibold text-white hover:bg-white/10"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={backdropRef}
      onMouseDown={handleBackdropPointerDown}
      onClick={handleBackdropClick}
      className="video-player-backdrop fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(2px)' }}
      role="dialog"
      aria-modal="true"
      aria-label={video?.title ? `Playing: ${video.title}` : 'Video player'}
    >
      <div
        className="video-player-modal video-player-panel relative bg-gray-900 rounded-2xl shadow-2xl overflow-hidden"
        style={{ width: '82vw', maxWidth: '900px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="flex items-start justify-between px-4 py-3 bg-gray-800">
          <div className="flex-1 min-w-0 pr-4">
            <p className="text-white font-semibold text-sm truncate leading-tight">
              {video?.title || 'Video'}
            </p>
            {video?.channelName && (
              <p className="text-gray-400 text-xs mt-0.5 truncate">
                📺 {video.channelName}
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="flex-shrink-0 text-gray-400 hover:text-white transition-colors
                       rounded-lg p-1.5 hover:bg-gray-700 focus:outline-none focus:ring-2
                       focus:ring-white"
            aria-label="Close video player"
            title="Close (Esc)"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M12.7 3.3a1 1 0 0 0-1.4 0L8 6.6 4.7 3.3a1 1 0 0 0-1.4 1.4L6.6 8l-3.3 3.3a1 1 0 1 0 1.4 1.4L8 9.4l3.3 3.3a1 1 0 0 0 1.4-1.4L9.4 8l3.3-3.3a1 1 0 0 0 0-1.4z"/>
            </svg>
          </button>
        </div>

        <div className="video-player-content" style={{ flex: 1, position: 'relative', margin: '20px', backgroundColor: '#000', minHeight: '420px' }}>
          {isLoading && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center bg-black"
              style={{ zIndex: 1 }}
            >
              {video?.thumbnail && (
                <img
                  src={video.thumbnail}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover opacity-30"
                />
              )}
              <div className="relative text-white text-sm font-medium animate-pulse">
                Loading video…
              </div>
            </div>
          )}
          <YouTubePlayer
            videoId={videoId}
            title={video?.title || 'YouTube video player'}
            onReady={handlePlayerReady}
            onPlay={handlePlayerReady}
            onPause={() => {}}
            onEnd={() => {}}
            onError={handlePlayerError}
          />
        </div>

        <div className="px-4 py-2 bg-gray-800 flex items-center justify-between gap-3">
          <span className="text-gray-500 text-xs">Press Esc or click outside to close</span>
          <button
            onClick={handleOpenExternal}
            className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5
                       rounded-lg font-medium transition-colors flex-shrink-0"
            title="Open this video directly on YouTube"
          >
            Watch on YouTube
          </button>
        </div>
      </div>
    </div>
  );
});

export default VideoPlayerModal;
