import { useState, useEffect } from 'react';
import { generateLearningPath, getLearningPathSummary, limitLearningPath } from '../../learning/learningPathEngine';

/**
 * Learning Path Panel Component
 * 
 * Displays videos organized by difficulty level (beginner → intermediate → advanced)
 * Encourages progressive learning
 */
export function LearningPathPanel({ videos, onVideoSelect }) {
  const [learningPath, setLearningPath] = useState(null);
  const [summary, setSummary] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState('beginner');

  useEffect(() => {
    if (videos && videos.length > 0) {
      const path = generateLearningPath(videos);
      const limitedPath = limitLearningPath(path, 6); // Max 6 videos per level
      const pathSummary = getLearningPathSummary(limitedPath);
      
      setLearningPath(limitedPath);
      setSummary(pathSummary);
      
      // Auto-select first non-empty level
      if (limitedPath.beginner.length > 0) {
        setSelectedLevel('beginner');
      } else if (limitedPath.intermediate.length > 0) {
        setSelectedLevel('intermediate');
      } else if (limitedPath.advanced.length > 0) {
        setSelectedLevel('advanced');
      }
    }
  }, [videos]);

  if (!learningPath || !summary) {
    return (
      <div className="learning-path-panel bg-white rounded-xl p-6 shadow-lg">
        <h3 className="text-xl font-bold mb-4">📚 Learning Path</h3>
        <p className="text-gray-500">Search for videos to see your learning path!</p>
      </div>
    );
  }

  const getLevelBadgeClass = (level) => {
    const classes = {
      beginner: 'bg-green-100 text-green-800 border-green-300',
      intermediate: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      advanced: 'bg-red-100 text-red-800 border-red-300'
    };
    return classes[level] || 'bg-gray-100 text-gray-800';
  };

  const getLevelIcon = (level) => {
    const icons = {
      beginner: '🟢',
      intermediate: '🟡',
      advanced: '🔵'
    };
    return icons[level] || '⚪';
  };

  return (
    <div className="learning-path-panel bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 shadow-lg">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">
          📚 Your Learning Path
        </h3>
        <p className="text-gray-600 text-sm">
          Start here, then level up! 🚀
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="stat-card bg-white rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-blue-600">{summary.totalVideos}</div>
          <div className="text-xs text-gray-600">Total Videos</div>
        </div>
        <div className="stat-card bg-white rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-purple-600">{summary.totalEstimatedTime}</div>
          <div className="text-xs text-gray-600">Minutes</div>
        </div>
        <div className="stat-card bg-white rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-600">3</div>
          <div className="text-xs text-gray-600">Levels</div>
        </div>
      </div>

      {/* Level Selector */}
      <div className="level-selector flex gap-2 mb-6">
        <button
          onClick={() => setSelectedLevel('beginner')}
          disabled={learningPath.beginner.length === 0}
          className={`flex-1 px-4 py-3 rounded-lg font-semibold text-sm transition ${
            selectedLevel === 'beginner'
              ? 'bg-green-500 text-white shadow-lg scale-105'
              : learningPath.beginner.length > 0
              ? 'bg-green-100 text-green-800 hover:bg-green-200'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          <div className="flex flex-col items-center gap-1">
            <span>🟢 Start Here</span>
            <span className="text-xs opacity-80">
              {learningPath.beginner.length} videos
            </span>
          </div>
        </button>

        <button
          onClick={() => setSelectedLevel('intermediate')}
          disabled={learningPath.intermediate.length === 0}
          className={`flex-1 px-4 py-3 rounded-lg font-semibold text-sm transition ${
            selectedLevel === 'intermediate'
              ? 'bg-yellow-500 text-white shadow-lg scale-105'
              : learningPath.intermediate.length > 0
              ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          <div className="flex flex-col items-center gap-1">
            <span>🟡 Build Skills</span>
            <span className="text-xs opacity-80">
              {learningPath.intermediate.length} videos
            </span>
          </div>
        </button>

        <button
          onClick={() => setSelectedLevel('advanced')}
          disabled={learningPath.advanced.length === 0}
          className={`flex-1 px-4 py-3 rounded-lg font-semibold text-sm transition ${
            selectedLevel === 'advanced'
              ? 'bg-blue-600 text-white shadow-lg scale-105'
              : learningPath.advanced.length > 0
              ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          <div className="flex flex-col items-center gap-1">
            <span>🔵 Master It</span>
            <span className="text-xs opacity-80">
              {learningPath.advanced.length} videos
            </span>
          </div>
        </button>
      </div>

      {/* Level Description */}
      {summary.levels[selectedLevel] && (
        <div className="level-description bg-white rounded-lg p-4 mb-4 border-l-4 border-blue-500">
          <p className="text-sm text-gray-700">
            {summary.levels[selectedLevel].description}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            ⏱️ About {summary.levels[selectedLevel].estimatedMinutes} minutes of content
          </p>
        </div>
      )}

      {/* Video List for Selected Level */}
      <div className="videos-list space-y-3 max-h-96 overflow-y-auto">
        {learningPath[selectedLevel].map((video, index) => (
          <div
            key={video.videoId}
            className="video-item bg-white rounded-lg p-4 hover:shadow-md transition cursor-pointer border-2 border-transparent hover:border-blue-400"
            onClick={() => onVideoSelect && onVideoSelect(video)}
          >
            <div className="flex gap-3">
              {/* Thumbnail */}
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-24 h-16 object-cover rounded flex-shrink-0"
              />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="font-semibold text-sm line-clamp-2 flex-1">
                    {video.title}
                  </h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getLevelBadgeClass(selectedLevel)}`}>
                    {getLevelIcon(selectedLevel)} {selectedLevel}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-gray-600">
                  <span>{video.channelName}</span>
                  <span>•</span>
                  <span>{video.durationText}</span>
                  {video.trustBadge && (
                    <>
                      <span>•</span>
                      <span className="text-green-600 font-semibold">
                        ✓ {video.trustBadge.label}
                      </span>
                    </>
                  )}
                </div>

                {/* Learning Score */}
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-blue-500 h-1.5 rounded-full"
                      style={{ width: `${video.learningScore || 50}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {Math.round(video.learningScore || 50)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Encouragement Message */}
      {learningPath.isLimited && (
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Showing top 6 videos per level ({learningPath.originalTotal} total found)
          </p>
        </div>
      )}
    </div>
  );
}
