function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeProductName(title) {
  const text = normalizeText(title);

  if (text.includes('bbs02')) return 'bafang_bbs02_motor';
  if (text.includes('bbshd')) return 'bafang_bbshd_motor';
  if (text.includes('hailong') && text.includes('48v')) return 'hailong_48v_battery';
  if (text.includes('mt200')) return 'shimano_mt200_brakes';

  return text
    .split(' ')
    .filter(Boolean)
    .slice(0, 5)
    .join('_') || 'custom_link';
}

export function getGroupKey(normalizedName) {
  const value = String(normalizedName || '').toLowerCase();

  if (value.includes('bbs02')) return 'motor_bbs02';
  if (value.includes('bbshd')) return 'motor_bbshd';
  if (value.includes('battery') || value.includes('hailong')) return 'battery_hailong';
  if (value.includes('mt200')) return 'brakes_mt200';

  return value || 'general';
}

function toBase36Hash(text) {
  let hash = 0;
  const safe = String(text || '');

  for (let i = 0; i < safe.length; i += 1) {
    hash = ((hash << 5) - hash) + safe.charCodeAt(i);
    hash |= 0;
  }

  return Math.abs(hash).toString(36);
}

export function buildVariantHash({ normalizedName, url, price, title }) {
  let hostname = '';
  let pathname = '';

  try {
    const parsed = new URL(String(url || ''));
    hostname = parsed.hostname;
    pathname = parsed.pathname;
  } catch {
    hostname = 'custom';
    pathname = String(url || '');
  }

  const base = [
    String(normalizedName || ''),
    hostname,
    pathname,
    Number.isFinite(Number(price)) ? Number(price).toFixed(2) : '',
    normalizeText(title).split(' ').slice(0, 8).join('_'),
  ].join('|');

  return `variant_${toBase36Hash(base)}`;
}

export function isDuplicate(existingNotes, newNote) {
  const safeNotes = Array.isArray(existingNotes) ? existingNotes : [];

  return safeNotes.some((note) => (
    String(note?.normalizedName || '').toLowerCase() === String(newNote?.normalizedName || '').toLowerCase() &&
    String(note?.url || '').trim().toLowerCase() === String(newNote?.url || '').trim().toLowerCase()
  ));
}

export function groupNotes(notes) {
  const groups = {};

  (Array.isArray(notes) ? notes : []).forEach((note) => {
    const key = String(note?.groupKey || 'general');
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(note);
  });

  return groups;
}

function notePrice(note) {
  const value = Number(note?.price);
  if (Number.isFinite(value) && value > 0) {
    return value;
  }
  return Number.MAX_SAFE_INTEGER;
}

export function getBestOption(group) {
  const safeGroup = Array.isArray(group) ? [...group] : [];
  if (safeGroup.length === 0) {
    return null;
  }

  return safeGroup.sort((a, b) => {
    const priceDelta = notePrice(a) - notePrice(b);
    if (priceDelta !== 0) {
      return priceDelta;
    }
    return new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime();
  })[0];
}

export default {
  normalizeProductName,
  getGroupKey,
  buildVariantHash,
  isDuplicate,
  groupNotes,
  getBestOption,
};
