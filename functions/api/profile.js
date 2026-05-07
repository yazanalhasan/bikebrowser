const PROFILE_ID = 'zaydan';
const PROFILE_KEY = `profile:${PROFILE_ID}`;

function json(body, init = {}) {
  return Response.json(body, {
    ...init,
    headers: {
      'cache-control': 'no-store',
      ...(init.headers || {}),
    },
  });
}

function requireAuthorized(request, env) {
  const expected = String(env.PROFILE_SYNC_KEY || '').trim();
  if (!expected) {
    return { ok: false, response: json({ success: false, error: 'Profile sync is not configured.' }, { status: 503 }) };
  }

  const provided = String(request.headers.get('x-profile-sync-key') || '').trim();
  if (provided !== expected) {
    return { ok: false, response: json({ success: false, error: 'Profile sync key is missing or incorrect.' }, { status: 401 }) };
  }

  return { ok: true };
}

function requireStore(env) {
  if (!env.PROFILE_STORE) {
    return { ok: false, response: json({ success: false, error: 'Profile storage is not configured.' }, { status: 503 }) };
  }

  return { ok: true };
}

function normalizeProfile(payload) {
  const profile = payload?.profile || payload;
  if (!profile || typeof profile !== 'object') return null;

  const spellingContent = normalizeSpellingContent(profile.spellingContent);

  return {
    profileId: PROFILE_ID,
    version: 1,
    spellingAccount: profile.spellingAccount || null,
    educationProfile: profile.educationProfile || null,
    spellingContent,
    wordList: Array.isArray(profile.wordList) ? profile.wordList : [],
    rawInput: typeof profile.rawInput === 'string' ? profile.rawInput : '',
    updatedAt: new Date().toISOString(),
    updatedBy: typeof profile.updatedBy === 'string' ? profile.updatedBy.slice(0, 120) : 'bikebrowser',
  };
}

function normalizeSpellingContent(content) {
  if (!content || typeof content !== 'object') return null;

  const lists = Array.isArray(content.lists)
    ? content.lists.map(normalizeSpellingList).filter(Boolean).slice(0, 12)
    : [];
  if (!lists.length) return null;

  const activeListId = lists.some((list) => list.id === content.activeListId)
    ? content.activeListId
    : lists[0].id;

  return { activeListId, lists };
}

function normalizeSpellingList(list) {
  if (!list || typeof list !== 'object') return null;

  const words = Array.isArray(list.words)
    ? [...new Set(list.words.map((word) => String(word || '').trim().toLowerCase()).filter(Boolean))].slice(0, 100)
    : [];
  if (!words.length) return null;

  return {
    id: String(list.id || `spelling-${Date.now()}`).slice(0, 80),
    title: String(list.title || 'Current spelling list').trim().slice(0, 80) || 'Current spelling list',
    words,
    rawInput: typeof list.rawInput === 'string' ? list.rawInput.slice(0, 20000) : '',
    createdAt: typeof list.createdAt === 'string' ? list.createdAt : new Date().toISOString(),
    updatedAt: typeof list.updatedAt === 'string' ? list.updatedAt : new Date().toISOString(),
  };
}

export async function onRequestGet({ request, env }) {
  const auth = requireAuthorized(request, env);
  if (!auth.ok) return auth.response;

  const store = requireStore(env);
  if (!store.ok) return store.response;

  const profile = await env.PROFILE_STORE.get(PROFILE_KEY, 'json');
  if (!profile) {
    return json({ success: false, error: 'No shared profile has been saved yet.', profile: null }, { status: 404 });
  }

  return json({ success: true, profile });
}

export async function onRequestPut({ request, env }) {
  const auth = requireAuthorized(request, env);
  if (!auth.ok) return auth.response;

  const store = requireStore(env);
  if (!store.ok) return store.response;

  let payload = null;
  try {
    payload = await request.json();
  } catch {
    return json({ success: false, error: 'Invalid JSON profile payload.' }, { status: 400 });
  }

  const profile = normalizeProfile(payload);
  if (!profile?.spellingAccount && !profile?.educationProfile && !profile?.spellingContent) {
    return json({ success: false, error: 'Profile payload must include spellingAccount, educationProfile, or spellingContent.' }, { status: 400 });
  }

  await env.PROFILE_STORE.put(PROFILE_KEY, JSON.stringify(profile));
  return json({ success: true, profile });
}
