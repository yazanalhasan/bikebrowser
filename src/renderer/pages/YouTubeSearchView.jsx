import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import VideoCard from '../components/VideoCard';
import VideoPlayerModal from '../components/VideoPlayerModal';
import LoadingSpinner from '../components/LoadingSpinner';
import { apiClient } from '../../client/apiClient';

function stripSourcePrefix(rawId) {
  if (!rawId) return rawId;
  const str = String(rawId);
  const colonIdx = str.lastIndexOf(':');
  if (colonIdx > 0) return str.slice(colonIdx + 1);
  return str;
}

function getVideoId(video) {
  if (!video) {
    return null;
  }

  if (video.videoId) {
    return stripSourcePrefix(video.videoId);
  }

  if (video.id?.videoId) {
    return stripSourcePrefix(video.id.videoId);
  }

  if (typeof video.id === 'string') {
    return stripSourcePrefix(video.id);
  }

  return null;
}

function isPlayableYouTubeVideo(video) {
  const id = getVideoId(video);
  return Boolean(id && /^[a-zA-Z0-9_-]{6,15}$/.test(id));
}

function normalizePlayableVideo(video) {
  const videoId = getVideoId(video);
  if (!videoId) {
    return null;
  }

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

function createInitialVideoState(video, videoId) {
  return {
    videoId,
    title: video?.title || 'Video',
    channelId: video?.channelId || null,
    channelName: video?.channelName || 'Unknown Channel',
    description: video?.description || '',
    thumbnail: video?.thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    durationText: video?.durationText || '',
    viewCountText: video?.viewCountText || '',
    publishedTimeText: video?.publishedTimeText || '',
    explanation: video?.explanation || '',
    score: video?.score,
    embedScore: video?.embedScore,
    embeddable: video?.embeddable,
    embedFailureReason: video?.embedFailureReason || ''
  };
}

function dedupeByVideoId(videoList) {
  const seen = new Set();
  return videoList.filter((video) => {
    const id = getVideoId(video);
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function YouTubeSearchView() {
  const lastVideoCloseAtRef = useRef(0);
  const rankPollRef = useRef(null);
  const mountedRef = useRef(true);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  const fastMode = searchParams.get('fast') === '1';
  
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);
  const [searchInput, setSearchInput] = useState(query);
  const [activeVideo, setActiveVideo] = useState(null);
  const [searchMode, setSearchMode] = useState('quick');
  const [aiSearchLoading, setAiSearchLoading] = useState(false);

  useEffect(() => {
    if (query) {
      performSearch(query);
    }

    return () => {
      mountedRef.current = false;
      if (rankPollRef.current) {
        clearInterval(rankPollRef.current);
      }
    };
  }, [query]);

  const performSearch = async (searchQuery, { useAI = false } = {}) => {
    if (rankPollRef.current) {
      clearInterval(rankPollRef.current);
      rankPollRef.current = null;
    }

    const skipExpansion = useAI ? false : fastMode;

    setLoading(true);
    setError(null);
    setWarning(null);
    setVideos([]);
    
    try {
      console.log('Searching for:', searchQuery, useAI ? '(AI mode)' : '(quick mode)');
      const search = await apiClient.search(searchQuery, { intent: 'watch', skipExpansion });

      const baseResults = Array.isArray(search.results) ? search.results : [];
      const basePlayable = dedupeByVideoId(
        baseResults
          .filter(isPlayableYouTubeVideo)
          .map(normalizePlayableVideo)
          .filter(Boolean)
      );
      setVideos(basePlayable);

      setLoading(false);

      apiClient.rank({ query: searchQuery, results: baseResults })
        .then((rank) => {
          const initial = Array.isArray(rank.initial) && rank.initial.length > 0
            ? rank.initial
            : baseResults;
          const initialPlayable = dedupeByVideoId(
            initial
              .filter(isPlayableYouTubeVideo)
              .map(normalizePlayableVideo)
              .filter(Boolean)
          );

          if (initialPlayable.length > 0 && mountedRef.current) {
            setVideos(initialPlayable);
          }

          if (!rank.jobId) {
            return;
          }

          rankPollRef.current = setInterval(async () => {
            try {
              const status = await apiClient.rankStatus(rank.jobId);
              if (status.status === 'completed') {
                clearInterval(rankPollRef.current);
                rankPollRef.current = null;

                const rankedPlayable = dedupeByVideoId(
                  (status.result?.ranked || [])
                    .filter(isPlayableYouTubeVideo)
                    .map(normalizePlayableVideo)
                    .filter(Boolean)
                );
                if (rankedPlayable.length > 0 && mountedRef.current) {
                  setVideos(rankedPlayable);
                }
              }
            } catch (pollError) {
              if (rankPollRef.current) {
                clearInterval(rankPollRef.current);
                rankPollRef.current = null;
              }
              console.warn('Rank polling failed, keeping current search results:', pollError);
            }
          }, 1200);

          setTimeout(() => {
            if (rankPollRef.current) {
              clearInterval(rankPollRef.current);
              rankPollRef.current = null;
            }
          }, 12000);
        })
        .catch((rankError) => {
          console.warn('Ranking failed, showing base search results only:', rankError);
          setWarning('Ranking service is temporarily unavailable. Showing direct search results.');
        });
    } catch (err) {
      console.error('Search error:', err);
      const message = String(err?.message || '').toLowerCase();
      if (message.includes('failed with 401') || message.includes('failed with 403')) {
        setError('Search service rejected the request (auth/config issue).');
      } else if (message.includes('aborted') || message.includes('timeout')) {
        setError('Search timed out. Please try again.');
      } else {
        setError('Failed to search right now. Please try again.');
      }
    }
  };

  const handleAISearch = async () => {
    if (!query || aiSearchLoading) return;
    setSearchMode('ai');
    setAiSearchLoading(true);
    await performSearch(query, { useAI: true });
    setAiSearchLoading(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSearchMode('quick');
      navigate(`/youtube/search?q=${encodeURIComponent(searchInput)}`);
    }
  };

  function handleVideoSelect(clickedVideoId, clickedVideo) {
    const videoId = clickedVideoId || getVideoId(clickedVideo);
    if (!videoId) return;

    if (Date.now() - lastVideoCloseAtRef.current < 250) {
      return;
    }

    console.log('Opening video player for:', videoId);
    const selectedVideo = clickedVideo || videos.find((entry) => getVideoId(entry) === videoId);
    window.api?.debugLog?.('YouTubeSearchView opening video player', {
      videoId,
      title: selectedVideo?.title || 'Video'
    });
    setActiveVideo(createInitialVideoState(selectedVideo, videoId));
  }

  const handleCloseVideo = () => {
    lastVideoCloseAtRef.current = Date.now();
    setActiveVideo(null);
  };

  return (
    <div data-testid="youtube-search-view" className="bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Search Bar - Moved below global header */}
      <div className="max-w-7xl mx-auto px-6 py-6 border-b border-gray-200">
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search for videos..."
            className="w-full px-5 py-3 text-lg rounded-xl border-3 border-blue-300 
                     focus:border-blue-500 focus:outline-none"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 
                     bg-blue-500 text-white px-6 py-2 rounded-lg
                     hover:bg-blue-600 transition-colors font-semibold"
          >
            Search
          </button>
        </form>
        
        <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
          <div className="text-gray-600">
            Searching for: <span className="font-semibold text-gray-800">{query}</span>
            {searchMode === 'ai' && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                🤖 AI Search
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {!loading && !error && videos.length > 0 && (
              <div className="text-gray-600">
                Found {videos.length} videos
              </div>
            )}
            {!loading && query && searchMode !== 'ai' && (
              <button
                onClick={handleAISearch}
                disabled={aiSearchLoading}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold
                         bg-gradient-to-r from-purple-500 to-indigo-600 text-white
                         hover:from-purple-600 hover:to-indigo-700 transition-all
                         disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {aiSearchLoading ? (
                  <>⏳ AI Searching...</>
                ) : (
                  <>🤖 AI Search</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <main data-testid="youtube-search-main" className="max-w-7xl mx-auto px-6 py-8">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <LoadingSpinner />
            <p className="mt-4 text-xl text-gray-600">Finding the best videos for you...</p>
          </div>
        )}

        {warning && !error && (
          <div className="bg-amber-100 border-2 border-amber-300 rounded-xl p-4 text-center mb-4">
            <p className="text-amber-900 font-medium">{warning}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border-2 border-red-400 rounded-xl p-6 text-center">
            <p className="text-xl text-red-800 font-semibold">😕 Oops! {error}</p>
            <button
              onClick={() => performSearch(query)}
              className="mt-4 btn-primary"
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && videos.length === 0 && (
          <div className="bg-yellow-100 border-2 border-yellow-400 rounded-xl p-8 text-center">
            <p className="text-2xl text-yellow-800 font-semibold mb-4">
              🔍 No videos found
            </p>
            <p className="text-lg text-gray-700">
              Try searching for something else, like &quot;bike repair&quot; or &quot;BMX tricks&quot;
            </p>
          </div>
        )}

        {!loading && !error && videos.length > 0 && (
          <>
            {/* Trust explanation banner */}
            <div className="bg-blue-100 border-2 border-blue-300 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="text-2xl">💡</div>
                <div>
                  <p className="font-semibold text-blue-900">How we rank videos:</p>
                  <p className="text-blue-800 text-sm mt-1">
                    <span className="badge-green inline-block mr-2">✓ Trusted</span> = Great educational channels •
                    <span className="badge-blue inline-block mx-2">→ Relevant</span> = Good for learning •
                    <span className="badge-yellow inline-block mx-2">⚠ Less Relevant</span> = Might be off-topic
                  </p>
                </div>
              </div>
            </div>

            {/* Video Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((video) => (
                <VideoCard
                  key={getVideoId(video) || video.title}
                  video={video}
                  onClick={handleVideoSelect}
                />
              ))}
            </div>
          </>
        )}
      </main>

      {activeVideo && (
        <VideoPlayerModal
          video={activeVideo}
          onClose={handleCloseVideo}
          onFindSimilar={handleCloseVideo}
        />
      )}
    </div>
  );
}

export default YouTubeSearchView;
