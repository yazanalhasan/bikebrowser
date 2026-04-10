/**
 * Thaura AI Client - Renderer Process
 * 
 * Simple wrapper for Thaura AI API calls via IPC.
 * All actual HTTP requests happen in the main process using axios.
 * API key is secure and never exposed to the renderer.
 * 
 * Usage:
 * 
 * import { thauraQuery, thauraExplain } from '../services/thauraClient';
 * 
 * const result = await thauraQuery("Explain electric dirt bikes");
 * const explanation = await thauraExplain("How does a bike derailleur work?");
 */

import { runAITask } from './aiOrchestrator';

/**
 * Raw Thaura AI query
 * @param {string} prompt - The user's prompt
 * @param {Object} options - Optional API parameters
 * @returns {Promise<Object>} - Thaura API response
 */
export async function thauraQuery(prompt, options = {}) {
  try {
    const result = await runAITask('structuredFormat', {
      input: prompt,
      schema: options.schema,
      fallbackData: options.fallbackData,
    });
    return result.data;
  } catch (error) {
    console.error('Thaura query error:', error);
    throw error;
  }
}

/**
 * Get a child-friendly explanation from Thaura
 * @param {string} topic - Topic to explain
 * @returns {Promise<string>} - Kid-friendly explanation
 */
export async function thauraExplain(topic) {
  try {
    const result = await runAITask('explainTopic', { topic });
    return result.data;
  } catch (error) {
    console.error('Thaura explain error:', error);
    return `Sorry, I couldn't explain that right now. ${error.message}`;
  }
}

/**
 * Generate educational search suggestions
 * @param {string} topic - Topic to generate suggestions for
 * @returns {Promise<Array<string>>} - Array of search suggestions
 */
export async function thauraSuggestions(topic) {
  try {
    const result = await runAITask('searchSuggestions', { topic });
    return String(result.data || '')
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 5);
  } catch (error) {
    console.error('Thaura suggestions error:', error);
    return [];
  }
}

/**
 * Check content safety for kids
 * @param {string} title - Content title
 * @param {string} description - Content description
 * @returns {Promise<{appropriate: boolean, reason: string}>}
 */
export async function thauraSafetyCheck(title, description) {
  try {
    const result = await runAITask('safetyCheck', { title, description });

    return {
      appropriate: result.data?.safe !== false,
      reason: result.data?.safe === false
        ? `Risk score ${result.data?.riskScore}`
        : 'Content appears safe for children',
    };
  } catch (error) {
    console.error('Thaura safety check error:', error);
    // Default to safe if check fails
    return {
      appropriate: true,
      reason: 'Safety check unavailable'
    };
  }
}

/**
 * Unified AI router - route to different providers
 * @param {string} prompt - The prompt to send
 * @param {string} provider - AI provider ('thaura', 'openai', etc.)
 * @returns {Promise<string>} - AI response
 */
export async function askAI(prompt, provider = 'thaura') {
  const result = await runAITask('structuredFormat', {
    input: prompt,
    provider,
    fallbackData: { text: 'No response' },
  });

  if (typeof result.data === 'string') {
    return result.data;
  }

  return result.data?.text || result.data?.message || JSON.stringify(result.data);
}
