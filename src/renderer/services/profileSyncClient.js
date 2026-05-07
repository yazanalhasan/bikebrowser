export const PROFILE_SYNC_KEY_STORAGE = 'bikebrowser-profile-sync-key-v1';
export const PROFILE_SYNC_CACHE_STORAGE = 'bikebrowser-shared-profile-cache-v1';

const PROFILE_ENDPOINT = '/api/profile';

export function getProfileSyncKey(storage = localStorage) {
  try {
    return String(storage.getItem(PROFILE_SYNC_KEY_STORAGE) || '').trim();
  } catch {
    return '';
  }
}

export function setProfileSyncKey(syncKey, storage = localStorage) {
  const normalized = String(syncKey || '').trim();
  if (!normalized) {
    storage.removeItem(PROFILE_SYNC_KEY_STORAGE);
    return '';
  }

  storage.setItem(PROFILE_SYNC_KEY_STORAGE, normalized);
  return normalized;
}

export function hasProfileSyncKey(storage = localStorage) {
  return Boolean(getProfileSyncKey(storage));
}

function readCachedProfile(storage = localStorage) {
  try {
    return JSON.parse(storage.getItem(PROFILE_SYNC_CACHE_STORAGE) || 'null');
  } catch {
    return null;
  }
}

function writeCachedProfile(profile, storage = localStorage) {
  try {
    storage.setItem(PROFILE_SYNC_CACHE_STORAGE, JSON.stringify(profile, null, 2));
  } catch {
    // Cache failure should never block learning.
  }
}

function cleanWordList(words) {
  return [...new Set((Array.isArray(words) ? words : [])
    .map((word) => String(word || '').trim().toLowerCase())
    .filter(Boolean))];
}

function normalizeSpellingList(list) {
  if (!list || typeof list !== 'object') return null;

  const words = cleanWordList(list.words);
  if (!words.length) return null;

  const now = new Date().toISOString();
  return {
    id: String(list.id || `spelling-${Date.now()}`).slice(0, 80),
    title: String(list.title || 'Current spelling list').trim().slice(0, 80) || 'Current spelling list',
    words,
    rawInput: typeof list.rawInput === 'string' ? list.rawInput : '',
    createdAt: typeof list.createdAt === 'string' ? list.createdAt : now,
    updatedAt: now,
  };
}

export function buildSpellingContentFromList({
  words = [],
  rawInput = '',
  title = 'Current spelling list',
  previousContent = null,
} = {}) {
  const previousLists = Array.isArray(previousContent?.lists) ? previousContent.lists : [];
  const activeList = previousLists.find((list) => list?.id === previousContent?.activeListId);
  const nextList = normalizeSpellingList({
    id: activeList?.id || `spelling-${Date.now()}`,
    title: title || activeList?.title,
    words,
    rawInput,
    createdAt: activeList?.createdAt,
  });

  if (!nextList) return previousContent || { activeListId: '', lists: [] };

  const lists = [
    nextList,
    ...previousLists.filter((list) => list?.id !== nextList.id),
  ].slice(0, 12);

  return {
    activeListId: nextList.id,
    lists,
  };
}

export function getActiveSpellingList(profile) {
  const content = profile?.spellingContent;
  const lists = Array.isArray(content?.lists) ? content.lists : [];
  const active = lists.find((list) => list?.id === content?.activeListId) || lists[0];
  if (active?.words?.length) return active;

  if (Array.isArray(profile?.wordList) && profile.wordList.length) {
    return {
      id: 'legacy-word-list',
      title: 'Synced spelling list',
      words: cleanWordList(profile.wordList),
      rawInput: typeof profile.rawInput === 'string' ? profile.rawInput : '',
    };
  }

  return null;
}

export function buildSharedProfile({
  spellingAccount = null,
  educationProfile = null,
  wordList = [],
  rawInput = '',
  spellingContent = null,
  updatedBy = typeof navigator !== 'undefined' ? navigator.userAgent : 'bikebrowser',
} = {}) {
  const cached = readCachedProfile() || {};
  const nextWords = cleanWordList(wordList);
  const nextSpellingContent = spellingContent
    || (nextWords.length
      ? buildSpellingContentFromList({ words: nextWords, rawInput, previousContent: cached.spellingContent })
      : cached.spellingContent || null);

  return {
    profileId: 'zaydan',
    version: 1,
    spellingAccount: spellingAccount || cached.spellingAccount || null,
    educationProfile: educationProfile || cached.educationProfile || null,
    spellingContent: nextSpellingContent,
    wordList: nextWords.length ? nextWords : cached.wordList || [],
    rawInput: typeof rawInput === 'string' ? rawInput : cached.rawInput || '',
    updatedAt: new Date().toISOString(),
    updatedBy,
  };
}

export async function pullSharedProfile({ syncKey = getProfileSyncKey(), storage = localStorage } = {}) {
  if (!syncKey) {
    return { ok: false, status: 'disabled', profile: readCachedProfile(storage), error: 'Sync key is not set.' };
  }

  const response = await fetch(PROFILE_ENDPOINT, {
    method: 'GET',
    cache: 'no-store',
    headers: {
      'x-profile-sync-key': syncKey,
    },
  });

  const body = await response.json().catch(() => ({}));
  if (response.status === 404) {
    return { ok: false, status: 'missing', profile: null, error: body.error || 'No shared profile exists yet.' };
  }
  if (!response.ok || !body.success) {
    return { ok: false, status: 'error', profile: readCachedProfile(storage), error: body.error || `Profile sync failed with ${response.status}.` };
  }

  writeCachedProfile(body.profile, storage);
  return { ok: true, status: 'synced', profile: body.profile };
}

export async function pushSharedProfile(profile, { syncKey = getProfileSyncKey(), storage = localStorage } = {}) {
  if (!syncKey) {
    writeCachedProfile(profile, storage);
    return { ok: false, status: 'disabled', profile, error: 'Sync key is not set.' };
  }

  const response = await fetch(PROFILE_ENDPOINT, {
    method: 'PUT',
    cache: 'no-store',
    headers: {
      'content-type': 'application/json',
      'x-profile-sync-key': syncKey,
    },
    body: JSON.stringify({ profile }),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.success) {
    writeCachedProfile(profile, storage);
    return { ok: false, status: 'error', profile, error: body.error || `Profile sync failed with ${response.status}.` };
  }

  writeCachedProfile(body.profile, storage);
  return { ok: true, status: 'synced', profile: body.profile };
}
