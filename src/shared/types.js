/**
 * Unified search result source identifiers.
 * @typedef {'youtube'|'youtube-kids'|'sciencekids'|'toymaker'|'krokotak'|'ndli'|'tiinker'|'diyorg'|'aliexpress'|'banggood'|'alibaba'|'revzilla'|'jensonusa'|'chainreaction'|'offerup'|'facebook-marketplace'|'adafruit'|'makerbeam'} SearchSource
 */

/**
 * @typedef {'build'|'buy'|'watch'} SearchCategory
 */

/**
 * @typedef {'easy'|'medium'|'hard'} SearchDifficulty
 */

/**
 * @typedef {Object} SearchResult
 * @property {string} id
 * @property {string} title
 * @property {SearchSource} source
 * @property {string} sourceName
 * @property {string} url
 * @property {string} thumbnail
 * @property {string} description
 * @property {number} safety_score
 * @property {number} relevance_score
 * @property {number} educational_score
 * @property {SearchCategory} category
 * @property {string} summary
 * @property {string[]} tags
 * @property {boolean} requires_supervision
 * @property {{duration?: string, author?: string, difficulty?: SearchDifficulty, materials_needed?: string[], age_range?: string, is_curated?: boolean}} sourceMetadata
 * @property {{amount: number, currency: string}=} price
 */

/**
 * @typedef {Object} SearchQuery
 * @property {string} original
 * @property {string[]} expanded
 * @property {'build'|'buy'|'watch'|'mixed'} intent
 * @property {{max_price?: number, require_location?: boolean, zip?: string}} filters
 */

const SEARCH_SOURCES = Object.freeze([
  'youtube',
  'youtube-kids',
  'sciencekids',
  'toymaker',
  'krokotak',
  'ndli',
  'tiinker',
  'diyorg',
  'aliexpress',
  'banggood',
  'alibaba',
  'revzilla',
  'jensonusa',
  'chainreaction',
  'offerup',
  'facebook-marketplace',
  'adafruit',
  'makerbeam'
]);

const SEARCH_CATEGORIES = Object.freeze(['build', 'buy', 'watch']);

module.exports = {
  SEARCH_SOURCES,
  SEARCH_CATEGORIES
};