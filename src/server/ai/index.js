/**
 * AI Resource Management — public API.
 *
 * Exports the compute orchestrator, capability detection, and
 * workload classification for use by the main process.
 */

const { orchestrateTask, decideRoute, setResourcePolicy, getResourcePolicy, getRoutingDiagnostics, RESOURCE_POLICIES } = require('./computeOrchestrator');
const { detectCapabilities, isLocalInferenceAvailable, getCapabilitySummary } = require('./capabilityDetector');
const { WorkloadClass, TASK_CLASSIFICATIONS, getTaskClassification, isDeterministicTask, getTasksByClass, classifyProviderTask } = require('./workloadClasses');

module.exports = {
  // Orchestration
  orchestrateTask,
  decideRoute,
  setResourcePolicy,
  getResourcePolicy,
  getRoutingDiagnostics,
  RESOURCE_POLICIES,

  // Capability detection
  detectCapabilities,
  isLocalInferenceAvailable,
  getCapabilitySummary,

  // Workload classification
  WorkloadClass,
  TASK_CLASSIFICATIONS,
  getTaskClassification,
  isDeterministicTask,
  getTasksByClass,
  classifyProviderTask,
};
