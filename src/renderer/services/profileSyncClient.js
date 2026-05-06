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

export function buildSharedProfile({
  spellingAccount = null,
  educationProfile = null,
  wordList = [],
  rawInput = '',
  updatedBy = typeof navigator !== 'undefined' ? navigator.userAgent : 'bikebrowser',
} = {}) {
  const cached = readCachedProfile() || {};
  return {
    profileId: 'zaydan',
    version: 1,
    spellingAccount: spellingAccount || cached.spellingAccount || null,
    educationProfile: educationProfile || cached.educationProfile || null,
    wordList: Array.isArray(wordList) ? wordList : cached.wordList || [],
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
