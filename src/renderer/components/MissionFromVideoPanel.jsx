import { useState, useEffect } from 'react';
import { generateMissionFromVideo } from '../../learning/videoToMissionService';
import { getDifficultyIcon } from '../../services/buildMissions';
import ProjectShoppingPanel from './ProjectShoppingPanel';

const FALLBACK_MATERIALS = ['chain', 'tube', 'brake pads'];

function inferFallbackMaterials(video) {
  const combined = `${video?.title || ''} ${video?.description || ''}`.toLowerCase();
  const inferred = [];

  if (combined.includes('chain')) inferred.push('chain');
  if (combined.includes('brake')) inferred.push('brake pads');
  if (combined.includes('tire') || combined.includes('tyre')) inferred.push('tire');
  if (combined.includes('tube')) inferred.push('tube');
  if (combined.includes('wheel')) inferred.push('wheel');

  return inferred.length > 0 ? inferred : FALLBACK_MATERIALS;
}

/**
 * Mission From Video Panel
 * 
 * Displays a complete mission generated from a video
 * Shows materials, steps, rewards, and reflection questions
 */
export function MissionFromVideoPanel({ video, onClose, onStartMission }) {
  const [mission, setMission] = useState(null);
  const [currentStep] = useState(0);

  useEffect(() => {
    if (video) {
      const generatedMission = generateMissionFromVideo(video, video);
      setMission(generatedMission);
    }
  }, [video]);

  if (!mission) {
    return (
      <div className="mission-panel bg-white rounded-xl p-6 shadow-lg">
        <p>Loading mission...</p>
      </div>
    );
  }

  const difficultyIcon = getDifficultyIcon(mission.difficulty);
  const projectId = `${video?.videoId || mission.title}`;
  const shoppingMaterials = mission.materials.length > 0 ? mission.materials : inferFallbackMaterials(video);

  return (
    <div className="mission-panel bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-2xl max-w-2xl mx-auto">
      {/* Header */}
      <div className="mission-header bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-t-xl">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2">{mission.title}</h2>
            <p className="text-purple-100 text-sm">{mission.description}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition"
          >
            ✕
          </button>
        </div>

        {/* Mission Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="stat bg-white bg-opacity-20 rounded-lg p-3 text-center">
            <div className="text-2xl mb-1">{difficultyIcon}</div>
            <div className="text-xs uppercase tracking-wide">{mission.difficulty}</div>
          </div>
          <div className="stat bg-white bg-opacity-20 rounded-lg p-3 text-center">
            <div className="text-2xl mb-1">⏱️</div>
            <div className="text-xs">{mission.estimatedMinutes} min</div>
          </div>
          <div className="stat bg-white bg-opacity-20 rounded-lg p-3 text-center">
            <div className="text-2xl mb-1">🏆</div>
            <div className="text-xs">{mission.rewardPoints} pts</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mission-content p-6 space-y-6">
        {/* Materials + Shopping Section */}
        <div className="materials-section space-y-4">
          <div>
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              🧰 What You&apos;ll Need
            </h3>
            {mission.materials.length === 0 && (
              <p className="text-gray-500 text-sm">
                We could not extract materials from this video, so we loaded safe starter parts.
              </p>
            )}
          </div>
          <ProjectShoppingPanel projectId={projectId} materials={shoppingMaterials} />
        </div>

        {/* Steps Section */}
        <div className="steps-section">
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
            📋 Build Steps
          </h3>
          <div className="space-y-3">
            {mission.steps.map((step, index) => (
              <div
                key={step.number}
                className={`step-card bg-white rounded-lg p-4 border-2 transition ${
                  index === currentStep
                    ? 'border-blue-500 shadow-lg'
                    : 'border-gray-200'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="step-number flex-shrink-0 w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                    {step.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm mb-1">{step.title}</h4>
                    <p className="text-sm text-gray-600">{step.description}</p>
                  </div>
                  <div className="flex-shrink-0">
                    {step.isComplete ? (
                      <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center">
                        ✓
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-gray-300"></div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reflection Questions */}
        <div className="reflection-section bg-yellow-50 rounded-lg p-4 border-2 border-yellow-200">
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
            💭 Think About It
          </h3>
          <ul className="space-y-2">
            {mission.reflectionQuestions.map((question, index) => (
              <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-yellow-600">•</span>
                <span>{question}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Video Info */}
        <div className="video-info bg-gray-50 rounded-lg p-4">
          <h4 className="font-bold text-sm mb-2">📺 Tutorial Video</h4>
          <div className="flex items-center gap-3">
            <img
              src={mission.thumbnail}
              alt={mission.title}
              className="w-20 h-12 object-cover rounded"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{video.title}</p>
              <p className="text-xs text-gray-600">{mission.channelName}</p>
            </div>
            {mission.trustLevel === 'prioritized' && (
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-semibold">
                ✓ Trusted
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="actions flex gap-3">
          <button
            onClick={() => onStartMission && onStartMission(mission)}
            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-4 rounded-xl font-bold text-lg hover:shadow-xl transition transform hover:scale-105"
          >
            🚀 Start This Mission!
          </button>
          <button
            onClick={onClose}
            className="px-6 py-4 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition"
          >
            Maybe Later
          </button>
        </div>

        {/* Reward Preview */}
        <div className="reward-preview text-center p-4 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg border-2 border-yellow-300">
          <p className="text-sm font-semibold text-gray-700">
            Complete this mission to earn{' '}
            <span className="text-orange-600 text-lg">🏆 {mission.rewardPoints} points</span>!
          </p>
        </div>
      </div>
    </div>
  );
}
