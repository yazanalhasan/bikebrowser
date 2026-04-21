/**
 * Workload Classification System — formal task categories for resource routing.
 *
 * Each AI-related task is classified by where it should execute:
 *   A. CPU_CONTROL       — deterministic control-plane logic (always CPU)
 *   B. CPU_REALTIME      — lightweight synchronous CPU tasks
 *   C. GPU_LOCAL_INTERACTIVE — local GPU inference for interactive tasks
 *   D. GPU_LOCAL_BATCH    — heavier background GPU work (future)
 *   E. REMOTE_PROVIDER    — cloud AI providers
 *   F. BROWSER_PLATFORM   — OS/browser managed services
 *
 * The compute orchestrator uses these classifications to route tasks.
 */

const WorkloadClass = {
  CPU_CONTROL: 'CPU_CONTROL',
  CPU_REALTIME: 'CPU_REALTIME',
  GPU_LOCAL_INTERACTIVE: 'GPU_LOCAL_INTERACTIVE',
  GPU_LOCAL_BATCH: 'GPU_LOCAL_BATCH',
  REMOTE_PROVIDER: 'REMOTE_PROVIDER',
  BROWSER_PLATFORM: 'BROWSER_PLATFORM',
};

/**
 * Task-to-workload classification map.
 *
 * Each entry defines:
 *   - primaryClass: where this task should run by default
 *   - fallbackChain: ordered fallback if primary is unavailable
 *   - maxLatencyMs: acceptable latency budget
 *   - requiresDeterministic: if true, never use AI for correctness
 *   - description: human-readable purpose
 */
const TASK_CLASSIFICATIONS = {
  // ── A. CPU_CONTROL — always CPU, never offloaded ──────────────────────────
  quest_correctness: {
    primaryClass: WorkloadClass.CPU_CONTROL,
    fallbackChain: [],
    maxLatencyMs: 5,
    requiresDeterministic: true,
    description: 'Quest step validation, answer correctness, progression logic',
  },
  save_load: {
    primaryClass: WorkloadClass.CPU_CONTROL,
    fallbackChain: [],
    maxLatencyMs: 10,
    requiresDeterministic: true,
    description: 'Game save/load, state persistence',
  },
  inventory_check: {
    primaryClass: WorkloadClass.CPU_CONTROL,
    fallbackChain: [],
    maxLatencyMs: 5,
    requiresDeterministic: true,
    description: 'Inventory validation, item checks',
  },
  learning_progress: {
    primaryClass: WorkloadClass.CPU_CONTROL,
    fallbackChain: [],
    maxLatencyMs: 10,
    requiresDeterministic: true,
    description: 'Learning store updates, topic progress',
  },
  reward_logic: {
    primaryClass: WorkloadClass.CPU_CONTROL,
    fallbackChain: [],
    maxLatencyMs: 5,
    requiresDeterministic: true,
    description: 'Zuzubucks, reputation, reward granting',
  },
  npc_state: {
    primaryClass: WorkloadClass.CPU_CONTROL,
    fallbackChain: [],
    maxLatencyMs: 5,
    requiresDeterministic: true,
    description: 'NPC state machine, dialogue state transitions',
  },
  prompt_construction: {
    primaryClass: WorkloadClass.CPU_CONTROL,
    fallbackChain: [],
    maxLatencyMs: 10,
    requiresDeterministic: true,
    description: 'AI prompt assembly, template selection',
  },
  json_validation: {
    primaryClass: WorkloadClass.CPU_CONTROL,
    fallbackChain: [],
    maxLatencyMs: 5,
    requiresDeterministic: true,
    description: 'Schema checking, JSON validation of AI output',
  },
  cache_routing: {
    primaryClass: WorkloadClass.CPU_CONTROL,
    fallbackChain: [],
    maxLatencyMs: 2,
    requiresDeterministic: true,
    description: 'Cache lookup, routing decisions, provider selection',
  },
  fallback_selection: {
    primaryClass: WorkloadClass.CPU_CONTROL,
    fallbackChain: [],
    maxLatencyMs: 5,
    requiresDeterministic: true,
    description: 'Deterministic fallback template selection',
  },

  // ── B. CPU_REALTIME — lightweight CPU tasks ───────────────────────────────
  difficulty_selection: {
    primaryClass: WorkloadClass.CPU_REALTIME,
    fallbackChain: [],
    maxLatencyMs: 10,
    requiresDeterministic: true,
    description: 'Rule-based difficulty band computation',
  },
  question_selection: {
    primaryClass: WorkloadClass.CPU_REALTIME,
    fallbackChain: [],
    maxLatencyMs: 5,
    requiresDeterministic: true,
    description: 'Deterministic question/choice selection from templates',
  },
  topic_matching: {
    primaryClass: WorkloadClass.CPU_REALTIME,
    fallbackChain: [],
    maxLatencyMs: 10,
    requiresDeterministic: false,
    description: 'Keyword/topic matching for content relevance',
  },
  hint_assembly: {
    primaryClass: WorkloadClass.CPU_REALTIME,
    fallbackChain: [],
    maxLatencyMs: 10,
    requiresDeterministic: false,
    description: 'Local hint text assembly from templates',
  },

  // ── C. GPU_LOCAL_INTERACTIVE — local GPU when available ───────────────────
  npc_dialogue_generation: {
    primaryClass: WorkloadClass.GPU_LOCAL_INTERACTIVE,
    fallbackChain: [WorkloadClass.REMOTE_PROVIDER, WorkloadClass.CPU_CONTROL],
    maxLatencyMs: 3000,
    requiresDeterministic: false,
    description: 'AI-generated NPC dialogue, greeting variants',
  },
  question_rewording: {
    primaryClass: WorkloadClass.GPU_LOCAL_INTERACTIVE,
    fallbackChain: [WorkloadClass.REMOTE_PROVIDER, WorkloadClass.CPU_CONTROL],
    maxLatencyMs: 3000,
    requiresDeterministic: false,
    description: 'Adaptive question phrasing by complexity band',
  },
  explanation_generation: {
    primaryClass: WorkloadClass.GPU_LOCAL_INTERACTIVE,
    fallbackChain: [WorkloadClass.REMOTE_PROVIDER, WorkloadClass.CPU_CONTROL],
    maxLatencyMs: 3000,
    requiresDeterministic: false,
    description: 'Educational explanation depth scaling',
  },
  hint_generation: {
    primaryClass: WorkloadClass.GPU_LOCAL_INTERACTIVE,
    fallbackChain: [WorkloadClass.REMOTE_PROVIDER, WorkloadClass.CPU_CONTROL],
    maxLatencyMs: 2000,
    requiresDeterministic: false,
    description: 'AI-generated contextual hints',
  },
  encouragement_generation: {
    primaryClass: WorkloadClass.GPU_LOCAL_INTERACTIVE,
    fallbackChain: [WorkloadClass.REMOTE_PROVIDER, WorkloadClass.CPU_CONTROL],
    maxLatencyMs: 2000,
    requiresDeterministic: false,
    description: 'Adaptive encouragement/feedback lines',
  },

  // ── D. GPU_LOCAL_BATCH — heavier background work (future) ─────────────────
  content_pre_generation: {
    primaryClass: WorkloadClass.GPU_LOCAL_BATCH,
    fallbackChain: [WorkloadClass.REMOTE_PROVIDER],
    maxLatencyMs: 30000,
    requiresDeterministic: false,
    description: 'Pre-generate dialogue variants for caching',
  },
  embedding_generation: {
    primaryClass: WorkloadClass.GPU_LOCAL_BATCH,
    fallbackChain: [WorkloadClass.REMOTE_PROVIDER],
    maxLatencyMs: 10000,
    requiresDeterministic: false,
    description: 'Text embeddings for content similarity',
  },

  // ── E. REMOTE_PROVIDER — cloud AI tasks ───────────────────────────────────
  structured_parsing: {
    primaryClass: WorkloadClass.REMOTE_PROVIDER,
    fallbackChain: [WorkloadClass.GPU_LOCAL_INTERACTIVE, WorkloadClass.CPU_CONTROL],
    maxLatencyMs: 8000,
    requiresDeterministic: false,
    description: 'Complex structured JSON generation (existing provider task)',
  },
  safety_filter: {
    primaryClass: WorkloadClass.REMOTE_PROVIDER,
    fallbackChain: [WorkloadClass.CPU_CONTROL],
    maxLatencyMs: 4000,
    requiresDeterministic: false,
    description: 'Content safety evaluation',
  },
  high_confidence: {
    primaryClass: WorkloadClass.REMOTE_PROVIDER,
    fallbackChain: [WorkloadClass.GPU_LOCAL_INTERACTIVE, WorkloadClass.CPU_CONTROL],
    maxLatencyMs: 8000,
    requiresDeterministic: false,
    description: 'High-quality generation requiring strong model',
  },
  query_expansion: {
    primaryClass: WorkloadClass.REMOTE_PROVIDER,
    fallbackChain: [WorkloadClass.CPU_CONTROL],
    maxLatencyMs: 8000,
    requiresDeterministic: false,
    description: 'Search query expansion and safety filtering',
  },

  // ── F. BROWSER_PLATFORM — OS/browser managed ─────────────────────────────
  speech_synthesis: {
    primaryClass: WorkloadClass.BROWSER_PLATFORM,
    fallbackChain: [],
    maxLatencyMs: 100,
    requiresDeterministic: false,
    description: 'Browser TTS for NPC dialogue',
  },
  webgl_rendering: {
    primaryClass: WorkloadClass.BROWSER_PLATFORM,
    fallbackChain: [],
    maxLatencyMs: 16, // 60fps frame budget
    requiresDeterministic: false,
    description: 'Phaser game rendering via WebGL',
  },
};

/**
 * Get the classification for a task type.
 * @param {string} taskType
 * @returns {object|null} classification object or null if unknown
 */
function getTaskClassification(taskType) {
  return TASK_CLASSIFICATIONS[taskType] || null;
}

/**
 * Check if a task type is deterministic-only (must never use AI for correctness).
 * @param {string} taskType
 * @returns {boolean}
 */
function isDeterministicTask(taskType) {
  const cls = TASK_CLASSIFICATIONS[taskType];
  return cls ? cls.requiresDeterministic : false;
}

/**
 * Get all task types for a given workload class.
 * @param {string} workloadClass
 * @returns {string[]}
 */
function getTasksByClass(workloadClass) {
  return Object.entries(TASK_CLASSIFICATIONS)
    .filter(([, cls]) => cls.primaryClass === workloadClass)
    .map(([key]) => key);
}

/**
 * Map an existing provider-manager taskType to a workload classification.
 * This bridges the existing system to the new classification.
 * @param {string} providerTaskType - existing taskType from provider-manager
 * @param {object} [metadata] - task metadata for refinement
 * @returns {string} workload task type
 */
function classifyProviderTask(providerTaskType, metadata = {}) {
  // If the caller explicitly set a workload task type, use it
  if (metadata.workloadTaskType && TASK_CLASSIFICATIONS[metadata.workloadTaskType]) {
    return metadata.workloadTaskType;
  }

  // Map existing provider task types to workload classes
  const mapping = {
    structured_parsing: 'structured_parsing',
    safety_filter: 'safety_filter',
    high_confidence: 'high_confidence',
    query_expansion: 'query_expansion',
    ranking: 'structured_parsing',
    ux_audit: 'high_confidence',
    ux_debug: 'high_confidence',
  };

  return mapping[providerTaskType] || 'structured_parsing';
}

module.exports = {
  WorkloadClass,
  TASK_CLASSIFICATIONS,
  getTaskClassification,
  isDeterministicTask,
  getTasksByClass,
  classifyProviderTask,
};
