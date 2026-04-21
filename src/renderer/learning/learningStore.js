/**
 * Learning Progress Store — persistent, versioned, localStorage-backed.
 *
 * Tracks which learning topics the child has encountered, started,
 * practiced, or completed. Designed to be lightweight and extensible.
 *
 * Progress states per topic:
 *   'new'       — default, never interacted with
 *   'started'   — watched a related video or opened a related project
 *   'practiced' — completed at least one meaningful activity
 *   'completed' — achieved the topic goal (quest done, quiz passed, etc.)
 *
 * Schema (v1):
 * {
 *   version: 1,
 *   topics: { [topicId]: { state, updatedAt, activities[] } },
 *   stats: { videosWatched, questsCompleted, topicsStarted, topicsCompleted }
 * }
 */

import { create } from 'zustand';
import TOPICS, { TOPIC_MAP, QUEST_TOPIC_MAP } from './topics.js';

const STORAGE_KEY = 'bikebrowser_learning_progress';
const SCHEMA_VERSION = 1;

const STATES = ['new', 'started', 'practiced', 'completed'];

function stateRank(state) {
  return STATES.indexOf(state);
}

function defaultStore() {
  return {
    version: SCHEMA_VERSION,
    topics: {},
    stats: {
      videosWatched: 0,
      questsCompleted: 0,
      topicsStarted: 0,
      topicsCompleted: 0,
    },
  };
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultStore();
    const data = JSON.parse(raw);
    if (data.version !== SCHEMA_VERSION) return defaultStore();
    return { ...defaultStore(), ...data, version: SCHEMA_VERSION };
  } catch {
    return defaultStore();
  }
}

function saveToStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, version: SCHEMA_VERSION }));
  } catch { /* storage full — silently fail */ }
}

function recomputeStats(topics) {
  let topicsStarted = 0;
  let topicsCompleted = 0;
  for (const entry of Object.values(topics)) {
    if (entry.state !== 'new') topicsStarted++;
    if (entry.state === 'completed') topicsCompleted++;
  }
  return { topicsStarted, topicsCompleted };
}

/** Get the topic progress entry, or a default 'new' entry. */
function getTopicEntry(topics, topicId) {
  return topics[topicId] || { state: 'new', updatedAt: 0, activities: [] };
}

/** Advance a topic to at least the given state (never regresses). */
function advanceTopicState(topics, topicId, minState, activity) {
  const current = getTopicEntry(topics, topicId);
  const shouldAdvance = stateRank(minState) > stateRank(current.state);

  const activities = [...current.activities];
  if (activity) {
    activities.push({ ...activity, at: Date.now() });
    // Keep last 20 activities per topic
    if (activities.length > 20) activities.splice(0, activities.length - 20);
  }

  return {
    ...topics,
    [topicId]: {
      state: shouldAdvance ? minState : current.state,
      updatedAt: Date.now(),
      activities,
    },
  };
}

// ─── Zustand store ───────────────────────────────────────────────

const initial = loadFromStorage();

export const useLearningStore = create((set, get) => ({
  topics: initial.topics,
  stats: {
    ...initial.stats,
    ...recomputeStats(initial.topics),
  },

  /** Get progress state for a topic. Returns 'new' if untouched. */
  getTopicState(topicId) {
    return getTopicEntry(get().topics, topicId).state;
  },

  /** Get full progress data for all topics, merged with topic metadata. */
  getAllProgress() {
    const { topics } = get();
    return TOPICS.map((topic) => {
      const entry = getTopicEntry(topics, topic.id);
      return { ...topic, progress: entry.state, updatedAt: entry.updatedAt };
    });
  },

  /** Record that a video related to certain topics was watched. */
  recordVideoWatch(topicIds, videoTitle) {
    const { topics, stats } = get();
    let updated = { ...topics };
    for (const id of topicIds) {
      if (!TOPIC_MAP[id]) continue;
      updated = advanceTopicState(updated, id, 'started', {
        type: 'video_watch',
        label: videoTitle,
      });
    }
    const newStats = { ...stats, videosWatched: stats.videosWatched + 1, ...recomputeStats(updated) };
    saveToStorage({ version: SCHEMA_VERSION, topics: updated, stats: newStats });
    set({ topics: updated, stats: newStats });
  },

  /** Record that a game quest was completed. */
  recordQuestComplete(questId) {
    const topicIds = QUEST_TOPIC_MAP[questId] || [];
    if (topicIds.length === 0) return;

    const { topics, stats } = get();
    let updated = { ...topics };
    for (const id of topicIds) {
      // Quest completion → 'practiced' at minimum, 'completed' for the primary topic
      const targetState = id === topicIds[0] ? 'completed' : 'practiced';
      updated = advanceTopicState(updated, id, targetState, {
        type: 'quest_complete',
        label: questId,
      });
    }
    const newStats = { ...stats, questsCompleted: stats.questsCompleted + 1, ...recomputeStats(updated) };
    saveToStorage({ version: SCHEMA_VERSION, topics: updated, stats: newStats });
    set({ topics: updated, stats: newStats });
  },

  /** Record that a project was started/used for a topic. */
  recordProjectActivity(topicIds) {
    const { topics, stats } = get();
    let updated = { ...topics };
    for (const id of topicIds) {
      if (!TOPIC_MAP[id]) continue;
      updated = advanceTopicState(updated, id, 'started', {
        type: 'project_activity',
      });
    }
    const newStats = { ...stats, ...recomputeStats(updated) };
    saveToStorage({ version: SCHEMA_VERSION, topics: updated, stats: newStats });
    set({ topics: updated, stats: newStats });
  },

  /** Manually set a topic to a specific state (for testing or overrides). */
  setTopicState(topicId, state) {
    if (!STATES.includes(state)) return;
    const { topics, stats } = get();
    const updated = {
      ...topics,
      [topicId]: {
        ...getTopicEntry(topics, topicId),
        state,
        updatedAt: Date.now(),
      },
    };
    const newStats = { ...stats, ...recomputeStats(updated) };
    saveToStorage({ version: SCHEMA_VERSION, topics: updated, stats: newStats });
    set({ topics: updated, stats: newStats });
  },

  /** Get recommended next topics (ones that are 'new' or 'started'). */
  getRecommendations(limit = 4) {
    const { topics } = get();
    const progress = TOPICS.map((t) => ({
      ...t,
      progress: getTopicEntry(topics, t.id).state,
    }));

    // Prioritize: started > new, beginner > intermediate > advanced
    const diffOrder = { beginner: 0, intermediate: 1, advanced: 2 };
    const stateOrder = { started: 0, new: 1, practiced: 2, completed: 3 };

    return progress
      .filter((t) => t.progress !== 'completed')
      .sort((a, b) => {
        const sa = stateOrder[a.progress] ?? 9;
        const sb = stateOrder[b.progress] ?? 9;
        if (sa !== sb) return sa - sb;
        return (diffOrder[a.difficulty] ?? 9) - (diffOrder[b.difficulty] ?? 9);
      })
      .slice(0, limit);
  },
}));

export default useLearningStore;
