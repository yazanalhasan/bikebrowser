/**
 * Thaura AI Service - Main Process
 * 
 * Handles all Thaura AI API requests from the main process using axios.
 * API key is securely stored in .env and never exposed to the renderer.
 * 
 * Architecture:
 * - Main process handles HTTP requests using axios (Node-safe)
 * - Renderer invokes via IPC (window.api.thaura)
 * - No fetch/undici in main process (prevents "File is not defined" errors)
 */

const axios = require('axios');

const THAURA_API_URL = 'https://api.thaura.ai/v1/chat/completions';
const THAURA_MODEL = 'thaura-3-default';

/**
 * Query Thaura AI with a prompt
 * @param {string} prompt - The user's query or prompt
 * @param {Object} options - Optional configuration
 * @returns {Promise<Object>} - Thaura API response
 */
async function thauraSearch(prompt, options = {}) {
  try {
    const apiKey = process.env.THAURA_API_KEY;
    
    if (!apiKey) {
      throw new Error('Thaura API key not configured in .env');
    }

    const response = await axios.post(
      THAURA_API_URL,
      {
        model: options.model || THAURA_MODEL,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: options.maxTokens || 500,
        temperature: options.temperature || 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      }
    );

    return response.data;
  } catch (error) {
    console.error('Thaura AI error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
}

/**
 * Generate child-friendly explanation using Thaura
 * @param {string} topic - Topic to explain
 * @returns {Promise<string>} - Simplified explanation
 */
async function explainForKids(topic) {
  const prompt = `Explain this topic in simple terms for a 9-year-old who loves bikes and building things. Use short sentences and fun examples: ${topic}`;
  
  const response = await thauraSearch(prompt, {
    maxTokens: 300,
    temperature: 0.7
  });

  return response.choices[0]?.message?.content || 'Sorry, I couldn\'t explain that right now.';
}

/**
 * Generate search suggestions using Thaura
 * @param {string} topic - Topic to generate suggestions for
 * @returns {Promise<Array<string>>} - Array of search suggestions
 */
async function generateSuggestions(topic) {
  const prompt = `Generate 5 educational search queries about "${topic}" that would interest a 9-year-old learning about bikes. Return only the queries, one per line, no numbering.`;
  
  const response = await thauraSearch(prompt, {
    maxTokens: 150,
    temperature: 0.8
  });

  const content = response.choices[0]?.message?.content || '';
  return content.split('\n').filter(s => s.trim().length > 0).slice(0, 5);
}

/**
 * Check content safety using Thaura
 * @param {string} title - Content title
 * @param {string} description - Content description
 * @returns {Promise<{appropriate: boolean, reason: string}>}
 */
async function checkSafety(title, description) {
  const prompt = `Analyze if this content is appropriate for a 9-year-old. Respond with ONLY "SAFE" or "UNSAFE: [brief reason]".\n\nTitle: ${title}\nDescription: ${description}`;
  
  try {
    const response = await thauraSearch(prompt, {
      maxTokens: 50,
      temperature: 0.3
    });

    const result = response.choices[0]?.message?.content || 'SAFE';
    const appropriate = result.toUpperCase().startsWith('SAFE');
    const reason = appropriate 
      ? 'Content appears safe for children' 
      : result.replace(/^UNSAFE:\s*/i, '').trim();

    return { appropriate, reason };
  } catch (error) {
    console.error('Safety check error:', error.message);
    // Default to safe if check fails
    return { appropriate: true, reason: 'Safety check unavailable' };
  }
}

module.exports = {
  thauraSearch,
  explainForKids,
  generateSuggestions,
  checkSafety
};
