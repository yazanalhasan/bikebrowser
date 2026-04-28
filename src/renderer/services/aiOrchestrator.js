import {
  buildPlannerPrompt,
  compatibilityPrompt,
  structuredOutputPrompt,
  imagePrompt,
  safetyPrompt,
  explanationPrompt,
  suggestionsPrompt,
  uxAuditPrompt,
  analyzeCustomPartPrompt,
} from './aiPrompts';

function normalizeProviderName(provider) {
  if (!provider) {
    return null;
  }

  const normalized = String(provider).toLowerCase();
  if (normalized === 'thura') {
    return 'thaura';
  }

  return normalized;
}

async function callOrchestrator(taskType, prompt, options = {}) {
  const preferredProvider = normalizeProviderName(options.preferredProvider);

  if (!window.api?.ai?.orchestrate) {
    if (options.fallbackData !== undefined) {
      return {
        success: true,
        data: options.fallbackData,
        providerUsed: 'offline',
        confidence: 0,
      };
    }
    throw new Error(`AI bridge unavailable for task ${taskType}`);
  }

  const payload = {
    taskType,
    prompt,
    expectedFormat: options.expectedFormat || 'text',
    metadata: {
      ...(options.metadata || {}),
      preferredProvider,
      fallbackData: options.fallbackData,
      schema: options.schema,
    },
  };

  const result = await window.api.ai.orchestrate(payload);
  if (!result?.success) {
    throw new Error(result?.error || `AI orchestration failed for task ${taskType}`);
  }

  console.log({
    task: options.taskName || taskType,
    providerUsed: result.providerUsed,
    timestamp: Date.now(),
  });

  return result;
}

async function runDeepSeek(prompt, options = {}) {
  return callOrchestrator(options.taskType || 'high_confidence', prompt, {
    ...options,
    preferredProvider: 'deepseek',
  });
}

async function runOpenAI(prompt, options = {}) {
  return callOrchestrator(options.taskType || 'high_confidence', prompt, {
    ...options,
    preferredProvider: 'openai',
  });
}

async function runThura(prompt, options = {}) {
  return callOrchestrator(options.taskType || 'safety_filter', prompt, {
    ...options,
    preferredProvider: 'thaura',
  });
}

async function multiPassStructuredFormat(data) {
  const reasoning = await runDeepSeek(structuredOutputPrompt({
    mode: 'reasoning-pass',
    data,
  }), {
    taskType: 'high_confidence',
    expectedFormat: 'text',
  });

  const structured = await runOpenAI(structuredOutputPrompt({
    mode: 'json-pass',
    sourceReasoning: reasoning.data,
    data,
  }), {
    taskType: 'structured_parsing',
    expectedFormat: 'json',
    fallbackData: data?.fallbackData || null,
    schema: data?.schema || null,
  });

  return {
    ...structured,
    reasoning: reasoning.data,
    firstPassProvider: reasoning.providerUsed,
    secondPassProvider: structured.providerUsed,
  };
}

function recommendedPartsCount(payload) {
  if (!payload || typeof payload !== 'object') {
    return 0;
  }

  return Array.isArray(payload.recommendedParts) ? payload.recommendedParts.length : 0;
}

export async function runAITask(task, data) {
  switch (task) {
    case 'buildPlan':
      {
        const prompt = buildPlannerPrompt(data);
        const firstPass = await runDeepSeek(prompt, {
          taskName: 'buildPlan',
          taskType: 'high_confidence',
          expectedFormat: 'json',
          fallbackData: data?.fallbackData || null,
        });

        if (recommendedPartsCount(firstPass?.data) >= 3) {
          return firstPass;
        }

        const retryPrompt = [
          prompt,
          'Retry instruction: Provide more specific and actionable recommendations.',
          'Ensure recommendedParts contains 3 to 6 entries with concrete part types.',
          'Do not use generic labels.',
        ].join('\n\n');

        return runDeepSeek(retryPrompt, {
          taskName: 'buildPlan-retry-quality',
          taskType: 'high_confidence',
          expectedFormat: 'json',
          fallbackData: data?.fallbackData || null,
        });
      }

    case 'compatibilityCheck':
      return runDeepSeek(compatibilityPrompt(data), {
        taskName: 'compatibilityCheck',
        taskType: 'structured_parsing',
        expectedFormat: 'json',
        fallbackData: data?.fallbackData || null,
      });

    case 'analyzeCustomPart':
      return runDeepSeek(analyzeCustomPartPrompt(data), {
        taskName: 'analyzeCustomPart',
        taskType: 'structured_parsing',
        expectedFormat: 'json',
        fallbackData: data?.fallbackData || null,
      });

    case 'structuredFormat':
      return runOpenAI(structuredOutputPrompt(data), {
        taskName: 'structuredFormat',
        taskType: 'structured_parsing',
        expectedFormat: 'json',
        fallbackData: data?.fallbackData || null,
        schema: data?.schema || null,
      });

    case 'generateBuildImage':
      return runOpenAI(imagePrompt(data), {
        taskName: 'generateBuildImage',
        taskType: 'high_confidence',
        expectedFormat: 'text',
      });

    case 'safetyCheck':
      return runThura(safetyPrompt(data), {
        taskName: 'safetyCheck',
        taskType: 'safety_filter',
        expectedFormat: 'json',
        fallbackData: { safe: true, category: 'unknown', riskScore: 0.25, notes: [] },
      });

    case 'explainTopic':
      return callOrchestrator('high_confidence', explanationPrompt(data?.topic || data), {
        taskName: 'explainTopic',
        expectedFormat: 'text',
      });

    case 'searchSuggestions':
      return callOrchestrator('high_confidence', suggestionsPrompt(data?.topic || data), {
        taskName: 'searchSuggestions',
        expectedFormat: 'text',
      });

    case 'uxAudit':
      return callOrchestrator(data?.mode === 'debug' ? 'ux_debug' : 'ux_audit', uxAuditPrompt(data), {
        taskName: 'uxAudit',
        expectedFormat: 'json',
        fallbackData: { violations: [] },
      });

    case 'structuredFormatMultiPass':
      return multiPassStructuredFormat(data);

    default:
      throw new Error('Unknown AI task');
  }
}

export default {
  runAITask,
};
