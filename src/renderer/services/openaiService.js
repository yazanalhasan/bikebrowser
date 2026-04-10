/**
 * OpenAI Service - Renderer Process
 *
 * This file now proxies to the main-process AI orchestration layer.
 * UI code never talks to providers directly.
 */

import { runAITask } from './aiOrchestrator';

/**
 * Generate a child-friendly explanation
 * @param {string} query - The topic or question to explain
 * @returns {Promise<string>} - Child-appropriate explanation
 */
export async function generateExplanation(query) {
  try {
    const result = await runAITask('explainTopic', { topic: query });
    return result.data || 'Sorry, I couldn\'t explain that right now.';
  } catch (error) {
    console.error('OpenAI API error:', error.message);
    return `Sorry, I couldn't get an explanation right now. ${error.message}`;
  }
}

/**
 * Generate structured search suggestions
 * @param {string} topic - The topic to generate suggestions for
 * @returns {Promise<string[]>} - Array of search suggestions
 */
export async function generateSearchSuggestions(topic) {
  try {
    const result = await runAITask('searchSuggestions', { topic });
    return String(result.data || '')
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 5);
  } catch (error) {
    console.error('OpenAI API error:', error.message);
    return [];
  }
}

/**
 * Analyze if content is appropriate for children
 * @param {string} title - Video or content title
 * @param {string} description - Content description
 * @returns {Promise<{appropriate: boolean, reason: string}>}
 */
export async function analyzeContentSafety(title, description) {
  try {
    const result = await runAITask('safetyCheck', { title, description });
    return {
      appropriate: result.data?.safe !== false,
      reason: result.data?.safe === false
        ? `Risk score ${result.data?.riskScore}`
        : 'Content appears safe for children',
    };
  } catch (error) {
    console.error('OpenAI safety check error:', error.message);
    // Default to safe if check fails
    return { appropriate: true, reason: 'Safety check unavailable' };
  }
}

/**
 * Simplify technical content for kids
 * @param {string} technicalText - Complex technical description
 * @returns {Promise<string>} - Simplified version
 */
export async function simplifyTechnicalContent(technicalText) {
  try {
    const result = await runAITask('explainTopic', { topic: technicalText });
    return result.data || technicalText;
  } catch (error) {
    console.error('OpenAI simplification error:', error.message);
    return technicalText;
  }
}
