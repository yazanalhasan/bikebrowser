/**
 * DEPRECATED - DO NOT USE
 * 
 * This file has been replaced by src/renderer/services/openaiService.js
 * 
 * OpenAI calls are now handled directly in the renderer process using fetch
 * to avoid "File is not defined" errors from undici/node-fetch in the Electron main process.
 * 
 * This file exists only to prevent import errors during transition.
 * It should be deleted once all references are removed.
 */

module.exports = {
  generateExplanation: () => { throw new Error('aiService is deprecated. Use src/renderer/services/openaiService.js'); },
  generateSearchSuggestions: () => { throw new Error('aiService is deprecated. Use src/renderer/services/openaiService.js'); },
  analyzeContentSafety: () => { throw new Error('aiService is deprecated. Use src/renderer/services/openaiService.js'); },
  simplifyTechnicalContent: () => { throw new Error('aiService is deprecated. Use src/renderer/services/openaiService.js'); },
  initOpenAI: () => { throw new Error('aiService is deprecated. Use src/renderer/services/openaiService.js'); }
};
