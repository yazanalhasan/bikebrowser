import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import YouTubePlayer from '../components/YouTubePlayer';

const WATCH_PLAYER_TIMEOUT_MS = 4500;

function VideoWatchPage() {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const initialVideo = location.state?.initialVideo?.videoId === videoId
    ? location.state.initialVideo
    : null;
  
  const [videoDetails, setVideoDetails] = useState(initialVideo);
  const [loading, setLoading] = useState(!initialVideo);
  const [error, setError] = useState(null);
  const [playbackState, setPlaybackState] = useState(initialVideo?.embedScore === 0 ? 'fallback' : 'loading');
  const [failureReason, setFailureReason] = useState(initialVideo?.embedFailureReason || '');

  useEffect(() => {
    let isCancelled = false;

    if (initialVideo) {
      setVideoDetails(initialVideo);
      setLoading(false);
      setError(null);
      return () => {
        isCancelled = true;
      };
    }

    async function loadVideoDetails() {
      setLoading(true);
      setError(null);

      try {
        if (!window.api?.getVideoDetails) {
          // Web mode - no IPC available, show basic player
          setVideoDetails({ videoId, title: 'Video', embeddable: true });
          return;
        }

        const result = await Promise.race([
          window.api.getVideoDetails(videoId),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Video details request timed out')), 10000)),
        ]);

        if (isCancelled) {
          return;
        }

        if (result.success) {
          setVideoDetails(result.details);
        } else {
          setError(result.error || 'Failed to load video');
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('Error loading video:', err);
          setError('Failed to load video details');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadVideoDetails();

    return () => {
      isCancelled = true;
    };
  }, [videoId, initialVideo]);

  useEffect(() => {
    if (!videoId) return;
    const knownBlocked = videoDetails?.embedScore === 0 || videoDetails?.embeddable === false;
    setPlaybackState(knownBlocked ? 'fallback' : 'loading');
    setFailureReason(knownBlocked ? (videoDetails?.embedFailureReason || 'This video blocks embedded playback.') : '');

    if (knownBlocked) {
      return undefined;
    }

    const t = setTimeout(() => {
      setPlaybackState((currentState) => {
        if (currentState === 'ready') {
          return currentState;
        }

        setFailureReason((currentReason) => currentReason || 'The embedded player timed out before it became interactive.');
        return 'fallback';
      });
    }, WATCH_PLAYER_TIMEOUT_MS);

    return () => clearTimeout(t);
  }, [videoId, videoDetails?.embedScore, videoDetails?.embeddable, videoDetails?.embedFailureReason]);

  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;

  const handleBack = () => {
    navigate(-1);
  };

  const handleOpenOnYouTube = async () => {
    try {
      if (window.api?.openExternal) {
        await window.api.openExternal(watchUrl);
      } else {
        window.open(watchUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      console.error('Error opening YouTube externally:', err);
      window.open(watchUrl, '_blank', 'noopener,noreferrer');
    }
  };
  const failed = playbackState === 'fallback';

  const handlePlayerReady = () => {
    setPlaybackState('ready');
    setFailureReason('');
  };

  const handlePlayerError = (playerError) => {
    setFailureReason(playerError?.message || videoDetails?.embedFailureReason || 'Embedded playback failed.');
    setPlaybackState('fallback');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-white text-xl">Loading video...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center bg-white rounded-xl p-8 max-w-md">
          <p className="text-2xl text-red-600 font-bold mb-4">😕 Error</p>
          <p className="text-gray-700 mb-6">{error}</p>
          <div className="flex gap-3">
            <button onClick={handleBack} className="btn-primary flex-1">
              ← Back
            </button>
            <button onClick={() => window.location.href = '/'} className="btn-primary flex-1">
              🏠 Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="video-watch-view" className="bg-gray-900">
      {/* Video Player */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-black rounded-xl overflow-hidden shadow-2xl">
          <div className="relative aspect-video">
            {failed ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800 text-white gap-4 p-6 text-center">
                <p className="text-2xl font-semibold">Can't play this video here</p>
                <p className="max-w-md text-sm text-gray-300">
                  {failureReason || 'This video appears to block in-app embeds. Open it on YouTube instead of showing a broken player screen.'}
                </p>
                <button
                  onClick={handleOpenOnYouTube}
                  className="rounded-lg bg-red-600 px-4 py-2 font-semibold hover:bg-red-500"
                >
                  Watch on YouTube
                </button>
              </div>
            ) : (
              <YouTubePlayer
                videoId={videoId}
                title={videoDetails?.title || 'YouTube video player'}
                onReady={handlePlayerReady}
                onPlay={handlePlayerReady}
                onError={handlePlayerError}
              />
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-4 rounded-xl bg-gray-800 px-4 py-3 text-white">
          <p className="text-sm text-gray-200">
            Videos that block embedding will fall back to an external YouTube open instead of showing a broken player.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenOnYouTube}
              className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-500"
            >
              Open on YouTube
            </button>
          </div>
        </div>

        {/* Video Info */}
        <div className="mt-6 bg-white rounded-xl p-6 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            {videoDetails?.title}
          </h2>
          
          <div className="flex items-center gap-4 mb-4">
            <p className="text-lg text-gray-700">
              📺 {videoDetails?.channelName}
            </p>
            
            {videoDetails?.explanation && (
              <div className="flex-1 bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
                <p className="text-blue-900 text-sm">
                  💡 {videoDetails.explanation}
                </p>
              </div>
            )}
          </div>

          {videoDetails?.description && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-2">About this video:</h3>
              <p className="text-gray-700 whitespace-pre-wrap">
                {videoDetails.description}
              </p>
            </div>
          )}

          {videoDetails?.score !== undefined && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">Educational Score:</span>
                <div className="flex-1 bg-gray-200 rounded-full h-4 max-w-xs">
                  <div
                    className={`h-4 rounded-full transition-all ${
                      videoDetails.score >= 70 ? 'bg-green-500' :
                      videoDetails.score >= 40 ? 'bg-blue-500' :
                      videoDetails.score >= 20 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${Math.max(0, Math.min(100, videoDetails.score))}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-gray-700">
                  {Math.round(videoDetails.score)}/100
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Learning reminder */}
        <div className="mt-6 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-6 border-2 border-purple-300">
          <h3 className="text-xl font-bold text-purple-900 mb-2">
            🎯 Learning Tip
          </h3>
          <p className="text-purple-800">
            While watching, think about: What did you learn? Could you explain it to someone else? 
            What would you try building or fixing?
          </p>
        </div>
      </div>
    </div>
  );
}

export default VideoWatchPage;
