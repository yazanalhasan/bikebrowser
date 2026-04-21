/**
 * Video → Topic Matcher
 *
 * Deterministic keyword-based matching of video metadata to learning topics.
 * No AI calls needed — uses title, description, and channel name patterns.
 *
 * Returns an array of topicIds that a video is relevant to.
 */

import { TOPIC_MAP } from './topics.js';

// ── Keyword patterns per topic ─────────────────────────────────────
// Each entry: [topicId, [patterns...]]
// Patterns are tested against lowercased title + description.
const TOPIC_PATTERNS = [
  ['bike_parts', [
    'parts of a bike', 'bicycle parts', 'bike anatomy', 'bike components',
    'name the parts', 'wheel hub spoke', 'handlebars stem',
  ]],
  ['flat_tires', [
    'flat tire', 'fix a flat', 'patch tube', 'inner tube', 'tire repair',
    'puncture repair', 'tire lever', 'tube replacement',
  ]],
  ['brakes', [
    'brake', 'braking', 'disc brake', 'rim brake', 'brake pad',
    'brake adjustment', 'stopping power', 'brake bleed',
  ]],
  ['chains', [
    'chain', 'drivetrain', 'derailleur', 'gear shift', 'cassette',
    'chainring', 'chain lube', 'chain clean', 'gear adjustment',
  ]],
  ['tools', [
    'bike tool', 'repair tool', 'wrench', 'hex key', 'allen key',
    'tire lever', 'pump', 'tool kit', 'multi-tool', 'torque wrench',
  ]],
  ['bike_safety', [
    'bike safety', 'helmet', 'hand signal', 'road safety', 'visibility',
    'safety check', 'pre-ride', 'reflector', 'bike light',
  ]],
  ['wheels', [
    'wheel build', 'spoke', 'rim', 'wheel size', 'tire size',
    'truing wheel', 'wheel lacing', 'hub', '26 inch', '29er', '700c',
  ]],
  ['ebike_basics', [
    'e-bike', 'ebike', 'electric bike', 'motor kit', 'battery pack',
    'controller', 'conversion kit', 'mid-drive', 'hub motor', 'bafang',
  ]],
  ['forces_friction', [
    'friction', 'force', 'physics', 'grip', 'traction', 'rolling resistance',
    'aerodynamic', 'drag', 'newton',
  ]],
  ['energy_motion', [
    'energy', 'kinetic', 'potential energy', 'gear ratio', 'torque',
    'pedal power', 'cadence', 'momentum', 'speed vs effort',
  ]],
  ['simple_machines', [
    'simple machine', 'lever', 'wheel and axle', 'pulley', 'inclined plane',
    'mechanical advantage',
  ]],
  ['reading_instructions', [
    'step by step', 'follow along', 'tutorial', 'how to', 'guide',
    'instruction', 'walkthrough', 'diy',
  ]],
  ['measurements', [
    'measure', 'sizing', 'frame size', 'tire width', 'calipers',
    'millimeter', 'centimeter', 'inch', 'standover height',
  ]],
];

// Pre-compile patterns for faster matching
const COMPILED = TOPIC_PATTERNS.map(([topicId, patterns]) => ({
  topicId,
  patterns: patterns.map((p) => p.toLowerCase()),
}));

/**
 * Match a video to learning topics based on its metadata.
 *
 * @param {object} video — must have at least `title`; optionally `description`, `channelName`
 * @returns {string[]} — array of matching topicIds (may be empty)
 */
export function matchVideoToTopics(video) {
  if (!video?.title) return [];

  const text = [
    video.title || '',
    video.description || '',
    video.channelName || '',
  ].join(' ').toLowerCase();

  const matched = [];

  for (const { topicId, patterns } of COMPILED) {
    if (!TOPIC_MAP[topicId]) continue;
    const hits = patterns.filter((p) => text.includes(p)).length;
    if (hits > 0) {
      matched.push({ topicId, hits });
    }
  }

  // Sort by number of pattern hits (most relevant first), take up to 3
  return matched
    .sort((a, b) => b.hits - a.hits)
    .slice(0, 3)
    .map((m) => m.topicId);
}

/**
 * Get topic metadata for matched topic IDs.
 * @param {string[]} topicIds
 * @returns {object[]} — topic objects with id, title, icon, category
 */
export function getTopicDetails(topicIds) {
  return topicIds.map((id) => TOPIC_MAP[id]).filter(Boolean);
}
