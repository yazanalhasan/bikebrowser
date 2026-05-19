import { useState, useEffect, useRef } from 'react';
import { LearningPathPanel } from '../components/LearningPathPanel';
import { MissionFromVideoPanel } from '../components/MissionFromVideoPanel';
import VideoCard from '../components/VideoCard';
import VideoPlayerModal from '../components/VideoPlayerModal';
import useGlobalCart from '../hooks/useGlobalCart';
import { apiClient } from '../../client/apiClient';
import { getVideoId, isPlayableYouTubeVideo, normalizePlayableVideo } from '../utils/videoId';

const FALLBACK_TUTORIALS = {
  'bike-repair': [
    {
      videoId: 'bike-repair-local-1',
      title: 'Start Here: What to Check Before a Ride',
      channelName: 'BikeBrowser Workshop',
      thumbnail: fallbackThumb('Safety Check'),
      durationText: '6 min',
      publishedTimeText: 'local guide',
      viewCountText: 'Offline ready',
      trustTier: 'prioritized',
      trustBadge: { color: 'green', icon: '✓', label: 'Local guide' },
      explanation: 'A calm checklist for brakes, tires, chain, and fit before moving on.'
    },
    {
      videoId: 'bike-repair-local-2',
      title: 'Flat Tire Flow: Find, Patch, Inflate, Verify',
      channelName: 'BikeBrowser Workshop',
      thumbnail: fallbackThumb('Flat Tire'),
      durationText: '8 min',
      publishedTimeText: 'local guide',
      viewCountText: 'Offline ready',
      trustTier: 'prioritized',
      trustBadge: { color: 'green', icon: '✓', label: 'Local guide' },
      explanation: 'Matches the in-game tire repair sequence so the learning path never dead-ends.'
    }
  ],
  'bike-build': [
    {
      videoId: 'bike-build-local-1',
      title: 'Build Order: Frame, Wheels, Brakes, Chain',
      channelName: 'BikeBrowser Workshop',
      thumbnail: fallbackThumb('Build Order'),
      durationText: '9 min',
      publishedTimeText: 'local guide',
      viewCountText: 'Offline ready',
      trustTier: 'prioritized',
      trustBadge: { color: 'green', icon: '✓', label: 'Local guide' },
      explanation: 'A stable build sequence for planning before shopping or watching outside videos.'
    }
  ],
  'dirt-bike': [
    {
      videoId: 'dirt-bike-local-1',
      title: 'Trail Readiness: Tires, Chain, Controls',
      channelName: 'BikeBrowser Workshop',
      thumbnail: fallbackThumb('Trail Check'),
      durationText: '7 min',
      publishedTimeText: 'local guide',
      viewCountText: 'Offline ready',
      trustTier: 'prioritized',
      trustBadge: { color: 'green', icon: '✓', label: 'Local guide' },
      explanation: 'Keeps the same mechanical grammar while shifting toward off-road checks.'
    }
  ],
  'e-bike': [
    {
      videoId: 'e-bike-local-1',
      title: 'E-Bike Basics: Battery, Motor, Brakes',
      channelName: 'BikeBrowser Workshop',
      thumbnail: fallbackThumb('E-Bike'),
      durationText: '8 min',
      publishedTimeText: 'local guide',
      viewCountText: 'Offline ready',
      trustTier: 'prioritized',
      trustBadge: { color: 'green', icon: '✓', label: 'Local guide' },
      explanation: 'Introduces power assist without leaving mechanical safety behind.'
    }
  ],
  'bmx-tricks': [
    {
      videoId: 'bmx-local-1',
      title: 'BMX Practice: Check the Bike Before the Jump',
      channelName: 'BikeBrowser Workshop',
      thumbnail: fallbackThumb('BMX Check'),
      durationText: '5 min',
      publishedTimeText: 'local guide',
      viewCountText: 'Offline ready',
      trustTier: 'prioritized',
      trustBadge: { color: 'green', icon: '✓', label: 'Local guide' },
      explanation: 'Connects the neighborhood ramp energy back to brakes, tires, and chain.'
    }
  ]
};

function fallbackThumb(label) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360">
    <rect width="640" height="360" fill="#203247"/>
    <circle cx="190" cy="225" r="58" fill="none" stroke="#f3d37a" stroke-width="14"/>
    <circle cx="430" cy="225" r="58" fill="none" stroke="#f3d37a" stroke-width="14"/>
    <path d="M190 225 278 132 338 225 248 225 330 132 430 225" fill="none" stroke="#8fd3c7" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M330 132h70m-122 0h-50" stroke="#f7a35c" stroke-width="14" stroke-linecap="round"/>
    <text x="320" y="78" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="#fff4cf">${label}</text>
    <text x="320" y="315" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" fill="#cfe7e2">BikeBrowser Workshop</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function uniqueVideos(videos) {
  const seen = new Set();
  return videos.filter((video) => {
    const key = video?.videoId || video?.id?.videoId || video?.id || video?.title;
    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

/**
 * Project Builder Page
 * 
 * Main interface for building projects with guided learning paths
 * Integrates video ranking, learning paths, and mission generation
 */
export default function ProjectBuilderPage() {
  const lastPlayerCloseAtRef = useRef(0);
  const rankPollRef = useRef(null);
  const mountedRef = useRef(true);
  const globalCart = useGlobalCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [warning, setWarning] = useState('');
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [activeVideo, setActiveVideo] = useState(null);
  const [showMissionPanel, setShowMissionPanel] = useState(false);
  const [projectType, setProjectType] = useState('bike-repair');

  const createPlayerVideoState = (video, videoId) => ({
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
  });

  const projectTypes = [
    { id: 'bike-repair', name: '🔧 Bike Repair', query: 'bike repair tutorial' },
    { id: 'bike-build', name: '🏗️ Build a Bike', query: 'how to build a bike' },
    { id: 'dirt-bike', name: '🏍️ Dirt Bike Mods', query: 'dirt bike modifications' },
    { id: 'e-bike', name: '⚡ E-Bike Build', query: 'electric bike conversion' },
    { id: 'bmx-tricks', name: '🚴 BMX Skills', query: 'BMX tricks tutorial' }
  ];

  useEffect(() => {
    // Auto-load default project on mount
    handleProjectSelect('bike-repair');

    return () => {
      mountedRef.current = false;
      if (rankPollRef.current) {
        clearInterval(rankPollRef.current);
      }
    };
  }, []);

  const handleProjectSelect = async (projectId) => {
    const project = projectTypes.find(p => p.id === projectId);
    if (!project) return;

    setProjectType(projectId);
    setSearchQuery(project.query);
    await searchVideos(project.query);
  };

  const searchVideos = async (query) => {
    if (rankPollRef.current) {
      clearInterval(rankPollRef.current);
      rankPollRef.current = null;
    }

    setWarning('');
    setVideos([]);
    setLoading(true);

    try {
      const search = await apiClient.search(query, { intent: 'watch' });
      const baseResults = Array.isArray(search.results) ? search.results : [];
      const basePlayable = uniqueVideos(baseResults
        .filter(isPlayableYouTubeVideo)
        .map(normalizePlayableVideo)
        .filter(Boolean));

      setVideos(basePlayable);
      setLoading(false);

      apiClient.rank({ query, results: baseResults })
        .then((rank) => {
          const initial = Array.isArray(rank.initial) && rank.initial.length > 0 ? rank.initial : baseResults;
          const initialPlayable = uniqueVideos(initial
            .filter(isPlayableYouTubeVideo)
            .map(normalizePlayableVideo)
            .filter(Boolean));

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

                const rankedPlayable = uniqueVideos((status.result?.ranked || [])
                  .filter(isPlayableYouTubeVideo)
                  .map(normalizePlayableVideo)
                  .filter(Boolean));

                if (rankedPlayable.length > 0 && mountedRef.current) {
                  setVideos(rankedPlayable);
                }
              }
            } catch {
              if (rankPollRef.current) {
                clearInterval(rankPollRef.current);
                rankPollRef.current = null;
              }
            }
          }, 1200);

          setTimeout(() => {
            if (rankPollRef.current) {
              clearInterval(rankPollRef.current);
              rankPollRef.current = null;
            }
          }, 12000);
        })
        .catch(() => {
          setWarning('Ranking is slow right now. Showing direct search results.');
        });
    } catch (error) {
      const fallback = FALLBACK_TUTORIALS[projectType] || FALLBACK_TUTORIALS['bike-repair'];
      setWarning('Live tutorial search is unavailable, so BikeBrowser is showing the built-in workshop path.');
      setVideos(fallback);
      setLoading(false);
    }
  };

  const handleVideoSelect = (video) => {
    setSelectedVideo(video);
    setShowMissionPanel(true);
  };

  const handleVideoPlay = (videoId, video) => {
    const normalizedVideoId = getVideoId({ ...video, videoId });
    if (!normalizedVideoId) {
      return;
    }

    if (Date.now() - lastPlayerCloseAtRef.current < 250) {
      return;
    }

    console.log('Opening video player for:', normalizedVideoId);
    window.api?.debugLog?.('ProjectBuilderPage opening video player', {
      videoId: normalizedVideoId,
      title: video?.title || 'Video'
    });
    setActiveVideo(createPlayerVideoState(video, normalizedVideoId));
  };

  const handleClosePlayer = () => {
    lastPlayerCloseAtRef.current = Date.now();
    setActiveVideo(null);
  };

  const handleStartMission = (mission) => {
    console.log('Starting mission:', mission);
    // TODO: Save mission to database and navigate to mission tracker
    alert(`Mission "${mission.title}" started! (Implementation pending)`);
    setShowMissionPanel(false);
  };

  return (
    <div data-testid="project-builder-page" className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      {/* Title Section */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-lg lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              🏗️ Project Builder
            </h1>
            <p className="text-gray-600">
              Choose a project, watch videos in order, build something amazing!
            </p>
          </div>
          <div className="rounded-2xl bg-slate-900 px-5 py-4 text-white shadow-sm">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-300">Global Cart</p>
            <p className="mt-2 text-2xl font-bold">${globalCart.totalEstimatedCost.toFixed(2)}</p>
            <p className="text-sm text-slate-300">{globalCart.items.length} unique item{globalCart.items.length === 1 ? '' : 's'}</p>
          </div>
        </div>
      </div>

      {/* Project Type Selector */}
      <div className="max-w-7xl mx-auto mb-8">
        <h2 className="text-lg font-bold mb-3">Choose Your Project:</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {projectTypes.map(project => (
            <button
              key={project.id}
              onClick={() => handleProjectSelect(project.id)}
              className={`p-4 rounded-xl font-semibold text-sm transition transform hover:scale-105 ${
                projectType === project.id
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50 shadow'
              }`}
            >
              {project.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Video Grid */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search Bar */}
          <div className="bg-white rounded-xl p-4 shadow-lg">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchVideos(searchQuery)}
                placeholder="Search for tutorials..."
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
              />
              <button
                onClick={() => searchVideos(searchQuery)}
                disabled={loading}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition disabled:bg-gray-300"
              >
                {loading ? '...' : '🔍 Search'}
              </button>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
              <p className="mt-4 text-gray-600">Finding awesome tutorials...</p>
            </div>
          )}

          {/* Videos Grid */}
          {!loading && videos.length > 0 && (
            <>
            <div className="videos-grid grid grid-cols-1 md:grid-cols-2 gap-4">
              {videos.slice(0, 8).map((video, index) => (
                <div key={`${video.videoId || video.title}-${index}`} className="relative">
                  <VideoCard video={video} onClick={handleVideoPlay} />
                  <button
                    onClick={() => handleVideoSelect(video)}
                    className="absolute bottom-4 right-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full font-semibold text-sm hover:shadow-xl transition transform hover:scale-105"
                  >
                    🔧 Try This Build
                  </button>
                </div>
              ))}
            </div>
            </>
          )}

          {warning && !loading && videos.length > 0 && (
            <div className="rounded-lg border border-amber-300 bg-amber-100 p-3 text-sm text-amber-900">
              {warning}
            </div>
          )}

          {/* Empty State */}
          {!loading && videos.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl">
              <p className="text-xl text-gray-500 mb-2">No tutorials loaded</p>
              <p className="text-sm text-gray-400">Choose a project above or try a more specific repair search.</p>
            </div>
          )}
        </div>

        {/* Right Column: Learning Path */}
        <div className="lg:col-span-1">
          <LearningPathPanel
            videos={videos}
            onVideoSelect={handleVideoSelect}
          />
        </div>
      </div>

      {/* Mission Panel Modal */}
      {showMissionPanel && selectedVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
          <div className="max-w-2xl w-full max-h-screen overflow-y-auto">
            <MissionFromVideoPanel
              video={selectedVideo}
              onClose={() => setShowMissionPanel(false)}
              onStartMission={handleStartMission}
            />
          </div>
        </div>
      )}

      {activeVideo && (
        <VideoPlayerModal
          video={activeVideo}
          isOpen={Boolean(activeVideo)}
          onClose={handleClosePlayer}
          onFindSimilar={handleClosePlayer}
        />
      )}
    </div>
  );
}
