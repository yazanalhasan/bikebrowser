# Mobile / Web Compatibility Guide

BikeBrowser runs in two environments:

| Environment | Access | `window.api` | `localhost` | Browser engine |
|-------------|--------|--------------|-------------|----------------|
| **Electron (desktop)** | Direct | Available (IPC bridge) | Points at this machine | Chromium (latest APIs) |
| **Mobile / web** | `bike-browser.com` tunnel | `undefined` | Points at the phone | Safari/Chrome (may lack newer APIs) |

## Rules

### 1. Never assume `window.api` exists

Every `window.api` call must either:
- Use optional chaining: `window.api?.method?.()`
- Have an explicit web fallback when the result affects UI behavior

**Bad:**
```js
const result = await window.api.ai.orchestrate(payload);
```

**Good:**
```js
if (window.api?.ai?.orchestrate) {
  return await window.api.ai.orchestrate(payload);
} else {
  // web fallback — call the REST API directly
  return await apiClient.searchText(payload.query);
}
```

Silent no-ops (`window.api?.debugLog?.()`) are fine for logging. They are NOT fine
for buttons, features, or anything the user expects to do something.

### 2. Never use `localhost` in client-side fetch paths on mobile

On the phone, `localhost` is the phone itself. Use the Vite `/api` proxy for
all API calls when accessed through the tunnel.

**Detection:**
```js
const onTunnel = window.location.hostname.includes('bike-browser.com');
```

`apiClient.js` already handles this via `inferBaseUrl()`. New code should use
`apiClient` rather than raw `fetch` to `localhost`.

### 3. Never use `AbortSignal.timeout()`

Not available in Safari < 16 / older Android WebView. Use manual AbortController:

```js
const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), 5000);
try {
  const res = await fetch(url, { signal: controller.signal });
} finally {
  clearTimeout(timer);
}
```

### 4. Timeouts must account for tunnel latency

Desktop fetches hit `localhost` (~1ms). Mobile fetches go:
phone -> cellular -> Cloudflare -> tunnel -> localhost (~200-800ms+).

- Health checks: 4s minimum per attempt, with retry/backoff
- YouTube embed initialization: 10s minimum
- API search: 25s (already fine)
- Don't use timeouts under 5s for anything user-visible on mobile

### 5. iframe sandbox must include mobile-required permissions

YouTube embeds need at minimum:
```
allow-same-origin allow-scripts allow-popups allow-forms allow-presentation
```

Omitting `allow-popups` or `allow-presentation` breaks YouTube on mobile Safari.

### 6. External link buttons need web fallbacks

**Bad:**
```js
await window.api?.openExternal?.(url); // silently does nothing on mobile
```

**Good:**
```js
if (window.api?.openExternal) {
  await window.api.openExternal(url);
} else {
  window.open(url, '_blank', 'noopener,noreferrer');
}
```

## Testing checklist

Before shipping changes that touch networking, video, or `window.api`:

1. Open `https://bike-browser.com` on a phone
2. Verify the search page loads (no "server unavailable")
3. Search for a video topic
4. Tap a video result — verify it plays or shows a working fallback
5. Tap "Watch on YouTube" — verify it opens YouTube
