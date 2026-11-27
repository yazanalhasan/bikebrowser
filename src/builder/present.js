/**
 * Kid view vs grown-up view. Kid view never receives a URL.
 * The grown-up toggle lives in one React component so a PIN can wrap it later.
 * This module stays free of React.
 */

const ALLOWED_SOURCE_HOSTS = new Set([
  'productinfo.shimano.com',
  'bike.shimano.com',
  'www.sram.com',
  'sram.com',
  'support.sram.com',
  'www.campagnolo.com',
  'campagnolo.com',
  'www.tektro.com',
  'tektro.com',
  'www.parktool.com',
  'parktool.com',
  'www.bafang-e.com',
  'bafang-e.com',
  'www.ecfr.gov',
  'ecfr.gov',
  'bike.bikegremlin.com',
  'www.bikegremlin.com',
  'bikegremlin.com',
  'wisewheeling.com',
  'www.wisewheeling.com',
  'pedalbrief.com',
  'www.pedalbrief.com',
  'github.com',
  'creativecommons.org',
]);

export function isAllowedSourceUrl(url) {
  if (typeof url !== 'string' || url.trim() === '') return false;
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== 'https:') return false;
  return ALLOWED_SOURCE_HOSTS.has(parsed.hostname);
}

export function presentFinding(finding, options = {}) {
  const grownup = Boolean(options.grownup);
  const sourceUrl = grownup && isAllowedSourceUrl(finding?.sourceUrl) ? finding.sourceUrl : null;
  return {
    ruleId: grownup ? finding?.ruleId || null : null,
    severity: finding?.severity || null,
    message: grownup ? finding?.messageAdult : finding?.messageKid,
    fix: finding?.fix || null,
    sourceUrl,
    sourceRef: grownup ? finding?.sourceRef || null : null,
  };
}

export function presentPartSource(part, options = {}) {
  if (!options.grownup) return { sourceUrl: null, sourceRef: null };
  return {
    sourceUrl: isAllowedSourceUrl(part?.sourceUrl) ? part.sourceUrl : null,
    sourceRef: part?.sourceRef || null,
  };
}
