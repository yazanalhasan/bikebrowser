import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import TopicTile from '../components/TopicTile';
import { useLearningStore } from '../learning/learningStore';
import { CATEGORIES } from '../learning/topics';
import { VIDEO_TOPIC_TILES } from '../data/videoQualityPresets';

function HomePage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/youtube/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleTopicClick = (topic) => {
    navigate(`/youtube/search?q=${encodeURIComponent(topic)}&fast=1`);
  };

  const utilityTiles = [
    {
      id: 'project-builder',
      title: 'Project Builder',
      subtitle: 'Guided tutorials & missions',
      emoji: '🏗️',
      isSpecial: true,
      color: 'from-purple-400 to-pink-500'
    },
    {
      id: 'build-planner',
      title: 'Build Planner',
      subtitle: 'AI checklist + compatibility review',
      emoji: '🧭',
      isBuildPlanner: true,
      color: 'from-cyan-500 to-lime-500'
    },
    {
      id: 'shop-materials',
      title: 'Shop Materials',
      subtitle: 'Kid-safe parts and cart',
      emoji: '🛒',
      isShop: true,
      color: 'from-emerald-400 to-teal-500'
    },
    {
      id: 'play-game',
      title: 'Play Game',
      subtitle: "Zuzu's Bike Adventure",
      emoji: '🎮',
      isGame: true,
      color: 'from-amber-400 to-orange-500'
    },
    {
      id: 'zaydan-spelling-trainer',
      title: "Zaydan's Spelling Trainer",
      subtitle: 'Practice spelling and worksheets',
      emoji: '🔤',
      isSpellingTrainer: true,
      color: 'from-indigo-400 to-sky-500'
    }
  ];

  const topics = [...utilityTiles, ...VIDEO_TOPIC_TILES];

  return (
    <div data-testid="home-page" className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Title Section */}
      <div className="bg-blue-50 border-b border-blue-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-4xl font-bold text-blue-600 text-center">
            🚴 BikeBrowser
          </h1>
          <p className="text-center text-gray-600 mt-2 text-lg">
            Learn about bikes, building, and engineering!
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="What do you want to learn about today?"
            className="w-full px-6 py-5 text-xl rounded-2xl border-4 border-blue-300 
                     focus:border-blue-500 focus:outline-none shadow-lg
                     placeholder-gray-400"
          />
          <button
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 
                     bg-blue-500 text-white px-8 py-3 rounded-xl
                     hover:bg-blue-600 transition-colors font-semibold text-lg"
          >
            Search
          </button>
        </form>

        {/* Suggested searches */}
        <div className="mt-4 flex flex-wrap gap-3 justify-center">
          <span className="text-gray-600 font-semibold">Try:</span>
          {[
            'Park Tool derailleur adjustment tutorial',
            'Johnny Nerd Out ebike controller troubleshooting',
            'Rocky Mountain ATV MC dirt bike maintenance'
          ].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => {
                setSearchQuery(suggestion);
                navigate(`/youtube/search?q=${encodeURIComponent(suggestion)}`);
              }}
              className="px-4 py-2 bg-white rounded-full border-2 border-gray-300
                       hover:border-blue-400 hover:bg-blue-50 transition-all text-sm"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* Topic Tiles */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          What interests you?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topics.map((topic) => (
            <TopicTile
              key={topic.id}
              {...topic}
              onClick={() => {
                if (topic.isSpecial) {
                  navigate('/project-builder');
                } else if (topic.isBuildPlanner) {
                  navigate('/build-planner');
                } else if (topic.isShop) {
                  navigate('/shop');
                } else if (topic.isGame) {
                  navigate('/play');
                } else if (topic.isSpellingTrainer) {
                  navigate('/spelling-trainer');
                } else {
                  handleTopicClick(topic.query);
                }
              }}
            />
          ))}
        </div>
      </div>

      {/* Learning Progress */}
      <LearningProgressSection navigate={navigate} />

      {/* Footer with helpful tips */}
      <div className="max-w-4xl mx-auto px-6 py-12 text-center">
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">
            💡 Learning Tips
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div>
              <div className="text-3xl mb-2">✓</div>
              <h4 className="font-semibold text-lg mb-2">Watch Tutorials</h4>
              <p className="text-gray-600">Look for "how to" videos to learn new skills</p>
            </div>
            <div>
              <div className="text-3xl mb-2">🔧</div>
              <h4 className="font-semibold text-lg mb-2">Learn by Doing</h4>
              <p className="text-gray-600">Try fixing or building something yourself</p>
            </div>
            <div>
              <div className="text-3xl mb-2">📚</div>
              <h4 className="font-semibold text-lg mb-2">Ask Questions</h4>
              <p className="text-gray-600">Don't understand? Search for explanations</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Learning Progress Section ─────────────────────────────────────

const STATE_LABELS = {
  new: { label: 'New', color: 'bg-slate-200 text-slate-600', emoji: '' },
  started: { label: 'Started', color: 'bg-blue-100 text-blue-700', emoji: '📖' },
  practiced: { label: 'Practiced', color: 'bg-amber-100 text-amber-700', emoji: '🔨' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700', emoji: '🏆' },
};

function LearningProgressSection({ navigate }) {
  const topics = useLearningStore((s) => s.topics);
  const stats = useLearningStore((s) => s.stats);

  // Derive from raw topics state — avoids infinite re-render from method selectors
  const { recommendations, completedCount, startedCount, totalCount } = useMemo(() => {
    const store = useLearningStore.getState();
    const all = store.getAllProgress();
    return {
      recommendations: store.getRecommendations(4),
      completedCount: all.filter((t) => t.progress === 'completed').length,
      startedCount: all.filter((t) => t.progress !== 'new').length,
      totalCount: all.length,
    };
  }, [topics]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-indigo-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Your Learning Journey
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              {startedCount === 0
                ? 'Start exploring topics below to begin your adventure!'
                : `${completedCount} of ${totalCount} topics completed`}
            </p>
          </div>
          {/* Progress bar */}
          <div className="w-full sm:w-48">
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-400 to-green-400 rounded-full transition-all duration-500"
                style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1 text-right">
              {stats.videosWatched} videos · {stats.questsCompleted} quests
            </p>
          </div>
        </div>

        {/* Recommended topics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {recommendations.map((topic) => {
            const cat = CATEGORIES[topic.category];
            const stateInfo = STATE_LABELS[topic.progress] || STATE_LABELS.new;
            return (
              <button
                key={topic.id}
                onClick={() => {
                  if (topic.suggestedSearches?.[0]) {
                    navigate(`/youtube/search?q=${encodeURIComponent(topic.suggestedSearches[0])}`);
                  }
                }}
                className="text-left rounded-xl border border-slate-200 bg-slate-50 p-4
                           hover:border-blue-300 hover:bg-blue-50 transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{topic.icon}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${stateInfo.color}`}>
                    {stateInfo.emoji} {stateInfo.label}
                  </span>
                </div>
                <h3 className="font-bold text-slate-800 group-hover:text-blue-700 transition-colors">
                  {topic.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {topic.description}
                </p>
                {cat && (
                  <p className="text-xs text-slate-400 mt-2">
                    {cat.icon} {cat.label} · {topic.difficulty}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default HomePage;
