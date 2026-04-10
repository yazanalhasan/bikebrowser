import React from 'react';
import YouTube from 'react-youtube';

const PLAYER_ERROR_MESSAGES = {
  2: 'The selected video ID is invalid.',
  5: 'The browser player could not load the requested video.',
  100: 'This video is unavailable.',
  101: 'The video owner has disabled embedded playback.',
  150: 'The video owner has disabled embedded playback.'
};

function normalizePlayerError(error) {
  const code = error?.data ?? error?.code ?? 'unknown';
  return {
    code,
    message: PLAYER_ERROR_MESSAGES[code] || 'Embedded YouTube playback failed.',
    raw: error
  };
}

class YouTubePlayerErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error) {
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || null;
    }

    return this.props.children;
  }
}

function YouTubePlayer({ videoId, title = 'YouTube video player', onReady, onPlay, onPause, onEnd, onError }) {
  const applyIframePermissions = (event) => {
    const iframe = event?.target?.getIframe?.();
    if (!iframe) {
      return;
    }

    iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts');
    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
    iframe.setAttribute('allowfullscreen', '');
    iframe.setAttribute('frameborder', '0');
  };

  const logToMain = (message, details = {}) => {
    window.api?.debugLog?.(message, {
      videoId,
      ...details
    });
  };

  const opts = {
    height: '100%',
    width: '100%',
    host: 'https://www.youtube-nocookie.com',
    playerVars: {
      autoplay: 1,
      modestbranding: 1,
      rel: 0,
      controls: 1,
      disablekb: 0,
      enablejsapi: 1,
      iv_load_policy: 3,
      playsinline: 1,
      origin: window.location.origin,
    },
  };

  const handleReady = (event) => {
    applyIframePermissions(event);
    console.log('YouTube player ready', event);
    logToMain('YouTube player ready');
    onReady?.(event);
  };

  const handlePlay = (event) => {
    console.log('Video playing');
    logToMain('YouTube player play');
    onPlay?.(event);
  };

  const handlePause = (event) => {
    console.log('Video paused');
    logToMain('YouTube player pause');
    onPause?.(event);
  };

  const handleEnd = (event) => {
    console.log('Video ended');
    logToMain('YouTube player end');
    onEnd?.(event);
  };

  const handleError = (event) => {
    const normalizedError = normalizePlayerError(event);
    console.error('YouTube player error', normalizedError.code, event);
    logToMain('YouTube player error', {
      errorCode: normalizedError.code,
      message: normalizedError.message
    });
    onError?.(normalizedError);
  };

  const fallback = (
    <div className="absolute inset-0 flex items-center justify-center bg-black text-white text-sm">
      Unable to load embedded YouTube player.
    </div>
  );

  return (
    <div className="youtube-player-container">
      {videoId ? (
        <YouTubePlayerErrorBoundary
          onError={(error) => {
            console.error('YouTube player boundary error', error);
            logToMain('YouTube player boundary error', {
              error: error?.message || String(error)
            });
            onError?.(error);
          }}
          fallback={fallback}
        >
          <YouTube
            videoId={videoId}
            opts={opts}
            onReady={handleReady}
            onPlay={handlePlay}
            onPause={handlePause}
            onEnd={handleEnd}
            onError={handleError}
            title={title}
            loading="eager"
            className="youtube-player"
            iframeClassName="youtube-player-iframe"
          />
        </YouTubePlayerErrorBoundary>
      ) : (
        <div className="no-video">No video selected</div>
      )}
    </div>
  );
}

export default YouTubePlayer;