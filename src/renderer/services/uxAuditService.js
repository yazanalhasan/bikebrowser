import { runAITask } from './aiOrchestrator';

export async function auditUXState(uiState, options = {}) {
  try {
    const result = await runAITask('uxAudit', {
      uiState,
      mode: options.mode || 'continuous',
      includeHealthyState: Boolean(options.includeHealthyState),
      hardViolations: options.hardViolations || [],
    });

    return {
      success: true,
      violations: result.data?.violations || [],
      providerUsed: result.providerUsed,
      confidence: result.confidence,
      raw: result.data || null
    };
  } catch (error) {
    console.error('UX audit service error:', error);
    return {
      success: false,
      violations: [],
      providerUsed: 'offline',
      error: error.message
    };
  }
}

export default {
  auditUXState
};