const { ipcMain } = require('electron');
const { orchestrateTask, setResourcePolicy, getResourcePolicy, getRoutingDiagnostics } = require('../../server/ai/computeOrchestrator');
const { detectCapabilities, getCapabilitySummary } = require('../../server/ai/capabilityDetector');
const ctx = require('./ctx');

function register() {
  // Initialize capability detection at startup (non-blocking).
  detectCapabilities().then(() => {
    console.log('[Capabilities]', getCapabilitySummary());
  }).catch(() => {});

  ipcMain.handle('ai:thaura', async (event, prompt, options) => {
    try {
      if (!ctx.searchPipeline?.providerManager) {
        return { success: false, error: 'AI provider manager unavailable' };
      }
      console.log('AI structured request:', prompt.substring(0, 50) + '...');
      const result = await ctx.searchPipeline.providerManager.executeWithOrchestration({
        taskType: 'structured_parsing',
        prompt,
        expectedFormat: options?.expectedFormat || 'json',
        metadata: options || {}
      });
      return { success: result.success, data: result.data, error: result.error, providerUsed: result.providerUsed, confidence: result.confidence };
    } catch (error) {
      console.error('Thaura AI error:', error.message);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('ai:thaura:explain', async (event, topic) => {
    try {
      if (!ctx.searchPipeline?.providerManager) {
        return { success: false, error: 'AI provider manager unavailable' };
      }
      const result = await ctx.searchPipeline.providerManager.executeWithOrchestration({
        taskType: 'high_confidence',
        prompt: `Explain this topic in simple terms for a 9-year-old who loves bikes and building things: ${topic}`,
        expectedFormat: 'text'
      });
      return { success: result.success, explanation: result.data, providerUsed: result.providerUsed, confidence: result.confidence };
    } catch (error) {
      console.error('Thaura explain error:', error.message);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('ai:thaura:suggestions', async (event, topic) => {
    try {
      if (!ctx.searchPipeline?.providerManager) {
        return { success: false, error: 'AI provider manager unavailable', suggestions: [] };
      }
      const result = await ctx.searchPipeline.providerManager.executeWithOrchestration({
        taskType: 'high_confidence',
        prompt: `Generate 5 educational search queries about "${topic}" for a 9-year-old learning about bikes. Return one suggestion per line.`,
        expectedFormat: 'text'
      });
      const suggestions = String(result.data || '')
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 5);
      return { success: result.success, suggestions, providerUsed: result.providerUsed, confidence: result.confidence };
    } catch (error) {
      console.error('Thaura suggestions error:', error.message);
      return { success: false, error: error.message, suggestions: [] };
    }
  });

  ipcMain.handle('ai:thaura:safety', async (event, { title, description }) => {
    try {
      if (!ctx.searchPipeline?.providerManager) {
        return { success: false, appropriate: true, reason: 'AI provider manager unavailable' };
      }
      const result = await ctx.searchPipeline.providerManager.executeWithOrchestration({
        taskType: 'safety_filter',
        prompt: `Title: ${title}\nDescription: ${description}`,
        expectedFormat: 'json',
        metadata: {
          fallbackData: { safe: true, category: 'unknown', riskScore: 0.25 }
        }
      });
      return {
        success: result.success,
        appropriate: result.data?.safe !== false,
        reason: result.data?.safe === false ? `Risk score ${result.data?.riskScore}` : 'Content appears safe for children',
        providerUsed: result.providerUsed,
        confidence: result.confidence
      };
    } catch (error) {
      console.error('Thaura safety check error:', error.message);
      return { success: false, appropriate: true, reason: 'Safety check unavailable' };
    }
  });

  ipcMain.handle('ai:explain', async (_event, topic) => {
    try {
      if (!ctx.searchPipeline?.providerManager) {
        return { success: false, error: 'AI provider manager unavailable' };
      }
      const result = await ctx.searchPipeline.providerManager.executeWithOrchestration({
        taskType: 'high_confidence',
        prompt: `Explain this in simple terms for a 9-year-old who loves bikes, building things, and engineering: ${topic}`,
        expectedFormat: 'text'
      });
      return { success: result.success, data: result.data, providerUsed: result.providerUsed, confidence: result.confidence };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('ai:suggestions', async (_event, topic) => {
    try {
      if (!ctx.searchPipeline?.providerManager) {
        return { success: false, error: 'AI provider manager unavailable', data: [] };
      }
      const result = await ctx.searchPipeline.providerManager.executeWithOrchestration({
        taskType: 'high_confidence',
        prompt: `Generate 5 specific child-safe educational search queries about: ${topic}. Return one per line.`,
        expectedFormat: 'text'
      });
      const suggestions = String(result.data || '')
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 5);
      return { success: result.success, data: suggestions, providerUsed: result.providerUsed, confidence: result.confidence };
    } catch (error) {
      return { success: false, error: error.message, data: [] };
    }
  });

  ipcMain.handle('ai:safety', async (_event, { title, description }) => {
    try {
      if (!ctx.searchPipeline?.providerManager) {
        return { success: false, error: 'AI provider manager unavailable' };
      }
      const result = await ctx.searchPipeline.providerManager.executeWithOrchestration({
        taskType: 'safety_filter',
        prompt: `Title: ${title}\nDescription: ${description}`,
        expectedFormat: 'json',
        metadata: {
          fallbackData: { safe: true, category: 'unknown', riskScore: 0.25 }
        }
      });
      return {
        success: result.success,
        data: {
          appropriate: result.data?.safe !== false,
          reason: result.data?.safe === false ? `Risk score ${result.data?.riskScore}` : 'Content appears safe for children'
        },
        providerUsed: result.providerUsed,
        confidence: result.confidence
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('ai:ux-audit', async (_event, { uiState, mode = 'continuous', includeHealthyState = false, hardViolations = [] } = {}) => {
    try {
      if (!ctx.searchPipeline?.providerManager) {
        return {
          success: false,
          violations: [],
          error: 'AI provider manager unavailable',
          providerUsed: 'offline'
        };
      }

      if (!uiState || typeof uiState !== 'object') {
        return {
          success: false,
          violations: [],
          error: 'UI state is required',
          providerUsed: 'offline'
        };
      }

      if (!includeHealthyState && (!Array.isArray(hardViolations) || hardViolations.length === 0)) {
        return {
          success: true,
          violations: [],
          providerUsed: 'skipped',
          confidence: 1,
          raw: { skipped: true, reason: 'no_hard_violations' }
        };
      }

      const prompt = [
        'You are a UX safety auditor for a child-safe browser.',
        '',
        'Rules:',
        '- Home button must ALWAYS be visible',
        '- Navigation must be consistent',
        '- No screen should trap the user',
        '',
        'UI State:',
        JSON.stringify(uiState, null, 2),
        '',
        'Known hard violations detected before AI reasoning:',
        JSON.stringify(hardViolations, null, 2),
        '',
        'Return JSON:',
        '{',
        '  "violations": [',
        '    {',
        '      "rule": "string",',
        '      "issue": "string",',
        '      "severity": "low|medium|critical",',
        '      "fix": "string"',
        '    }',
        '  ]',
        '}'
      ].join('\n');

      const result = await ctx.searchPipeline.providerManager.executeWithOrchestration({
        taskType: mode === 'debug' ? 'ux_debug' : 'ux_audit',
        prompt,
        expectedFormat: 'json',
        metadata: {
          schema: {
            type: 'object',
            required: ['violations'],
            properties: {
              violations: {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['rule', 'issue', 'severity', 'fix'],
                  properties: {
                    rule: 'string',
                    issue: 'string',
                    severity: { enum: ['low', 'medium', 'critical'] },
                    fix: 'string'
                  }
                }
              }
            }
          },
          uiState,
          hardViolations,
          mode
        }
      });

      return {
        success: Boolean(result.success),
        violations: result.data?.violations || [],
        providerUsed: result.providerUsed,
        confidence: result.confidence,
        raw: result.data,
        error: result.error || null
      };
    } catch (error) {
      return {
        success: false,
        violations: [],
        error: error.message,
        providerUsed: 'offline'
      };
    }
  });

  ipcMain.handle('ai:orchestrate', async (_event, payload) => {
    try {
      if (!ctx.searchPipeline?.providerManager) {
        return {
          success: false,
          data: null,
          error: 'AI provider manager unavailable',
          latency: 0,
          confidence: 0,
          provider: 'offline',
          providerUsed: 'offline'
        };
      }

      const useOrchestrator = payload?.metadata?.workloadTaskType ||
                              payload?.metadata?.allowLocalGpu !== undefined ||
                              payload?.taskType === 'npc_dialogue';

      if (useOrchestrator) {
        return await orchestrateTask(payload, ctx.searchPipeline.providerManager);
      }

      return await ctx.searchPipeline.providerManager.executeWithOrchestration(payload);
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error.message,
        latency: 0,
        confidence: 0,
        provider: 'offline',
        providerUsed: 'offline'
      };
    }
  });

  ipcMain.handle('ai:capabilities', async () => {
    try {
      return await detectCapabilities();
    } catch (error) {
      return { error: error.message };
    }
  });

  ipcMain.handle('ai:resource-policy', async (_event, policy) => {
    if (policy) setResourcePolicy(policy);
    return {
      policy: getResourcePolicy(),
      diagnostics: getRoutingDiagnostics(),
      capabilities: getCapabilitySummary(),
    };
  });
}

module.exports = { register };
