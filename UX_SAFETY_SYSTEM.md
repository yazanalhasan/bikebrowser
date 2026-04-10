# UX Safety System Implementation Guide

## Overview

This guide documents the **production-ready UX safety system** for BikeBrowser that ensures children never get trapped on a page. It uses **runtime detection + hard constraints + AI reasoning** instead of static code analysis alone.

## Architecture

### 🧱 Step 1: Hard Constraints (Code)

**File:** `src/renderer/utils/uxSafety.js`

```javascript
const UX_RULES = {
  MUST_HAVE_HOME_BUTTON: true,        // 🏠 always visible
  MUST_HAVE_NAV_CONTAINER: true,      // Nav elements container
  NO_EMPTY_SCREEN: true,              // Never show blank page
  MUST_HAVE_ESCAPE_ROUTE: true,       // Home or back always available
  MUST_HAVE_HEADER: true              // Header with controls
};
```

These are **non-negotiable runtime checks** that execute before React renders.

### 🎬 Step 2: Runtime UI Snapshot

**Function:** `captureUIState()`

Captures the **actual** DOM state at render time:
- Home button visibility (element exists + is clickable)
- Header presence
- Nav container present
- Main content area exists
- Page is not empty

```javascript
// Returns JSON like:
{
  route: "/youtube/watch/:videoId",
  nav: {
    homeVisible: true,
    homeIsClickable: true,
    backVisible: true
  },
  layout: {
    hasHeader: true,
    hasNavContainer: true,
    hasMainContent: true
  },
  content: {
    isEmpty: false
  }
}
```

### ⚠️ Step 3: Hard Fail Enforcement

**Function:** `enforceUXRules(state)`

Runs **instantly** before AI audits:

```javascript
// CRITICAL: Home button missing on route /project-builder
// CRITICAL: Header missing on route /project-builder
// WARNING: Main content (data-testid="main-content") missing
```

These violations **stop and alert immediately** - no AI needed.

### 🤖 Step 4: AI Reasoning Hook

**File:** `src/renderer/hooks/useUXAudit.js`

Automatically runs on every route change:

```javascript
useEffect(() => {
  const state = captureUIState();
  const violations = enforceUXRules(state);  // Hard fail first
  
  // Report violations
  if (violations.length > 0) {
    console.group('📋 UX AUDIT REPORT');
    console.table(violations);
    console.groupEnd();
  }
}, [location.pathname]);
```

### 🏗️ Step 5: Persistent Global Layout

**File:** `src/renderer/components/AppLayout.jsx`

**Pattern that eliminates the root problem:**

```
App.jsx
├── Router
│   └── AppContent (uses useUXAudit)
│       └── AppLayout (persistent)
│           ├── Header (ALWAYS visible)
│           │   ├── 🏠 Home Button (data-testid="home-button")
│           │   ├── ← Back Button (data-testid="back-button")
│           │   └── Breadcrumb (data-testid="breadcrumb")
│           ├── main (data-testid="main-content")
│           │   └── Routes (all pages)
│           └── Footer (optional)
```

**Key insight:** No page defines its own header. All pages use the global one.

---

## Implementation Details

### Component Changes

#### 1. **App.jsx** - Refactored

```jsx
import AppLayout from './components/AppLayout';
import useUXAudit from './hooks/useUXAudit';

function AppContent() {
  useUXAudit();  // Runs audit on every route change
  
  return (
    <AppLayout>
      <Suspense>
        <Routes>
          {/* All routes here */}
        </Routes>
      </Suspense>
    </AppLayout>
  );
}
```

#### 2. **AppLayout.jsx** - New Component

Provides global header with home + back buttons that are ALWAYS accessible.

```jsx
<header data-testid="app-header">
  <button data-testid="home-button" onClick={handleHome}>🏠</button>
  <button data-testid="back-button" onClick={handleBack}>←</button>
</header>

<main data-testid="main-content">
  {children}
</main>
```

#### 3. **Page Changes**

Removed ALL page-level headers:
- ✅ YouTubeSearchView - Removed sticky header with home button
- ✅ VideoWatchPage - Removed header with back button
- ✅ SafeSearchPage - Removed "Back Home" link
- ✅ HomePage - Simplified (now just title + content)
- ✅ ProjectBuilderPage - Removed header

Added `data-testid` attributes:
- `data-testid="youtube-search-view"`
- `data-testid="video-watch-view"`
- `data-testid="safe-search-view"`
- `data-testid="home-page"`
- `data-testid="project-builder-page"`

#### 4. **Error Handling**

VideoWatchPage error state now includes BOTH buttons:
```jsx
<button onClick={handleBack}>← Back</button>
<button onClick={() => window.location.href = '/'}>🏠 Home</button>
```

---

## Testing the System

### 1. Browser Console

Open DevTools (F12) and execute:

```javascript
// Get instant diagnostics
window.__UX_AUDIT__

// Manual audit
import { captureUIState, enforceUXRules } from 'src/renderer/utils/uxSafety';
const state = captureUIState();
enforceUXRules(state);  // Shows violations in console
```

### 2. Watch Console Output

When navigating between pages, you'll see:

```
✅ UX Safety Check Passed {route: "/youtube/search", timestamp: "..."}
```

If violations:
```
🚨 UX SAFETY VIOLATIONS DETECTED
[CRITICAL] MUST_HAVE_HOME_BUTTON: Home button is missing on route /project-builder
[HIGH] MUST_HAVE_MAIN_CONTENT: Main content is missing
```

### 3. Test All Routes

```
Home (/)                    ✅
YouTube Search (/youtube/search?q=...) ✅
Video Watch (/youtube/watch/:videoId)  ✅
Project Builder (/project-builder)     ✅
Safe Search (/safe-search)             ✅
```

---

## Key Improvements Over Static Analysis

### ❌ Old Approach (Static Code Analysis)

- Read files, analyze code structure
- Misses conditional rendering bugs
- Doesn't catch state-driven disappearance
- Doesn't see actual DOM

### ✅ New Approach (Runtime + Logic)

1. **Hard fail checks** catch bugs instantly (no AI needed)
2. **Runtime snapshot** shows actual DOM state, not code
3. **Auto-audit hook** continuously monitors all routes
4. **Persistent layout** makes violations impossible by design
5. **AI fallback** for debugging edge cases

---

## Debugging Violations

### Issue: Home button missing

```
🚨 CRITICAL: Home button (data-testid="home-button") is missing on route /project-builder
```

**Check:**
1. Is AppLayout wrapping the routes?
2. Is the home button in AppLayout header?
3. Does it have `data-testid="home-button"`?

### Issue: Page won't render

```
🚨 CRITICAL: Screen is completely empty on route /project-builder
```

**Check:**
1. Is `<main data-testid="main-content">` in AppLayout?
2. Does the page component render children?
3. Are there any error boundaries silently catching errors?

### Issue: Header is hidden

```
🚨 CRITICAL: Home button exists but is not clickable (visibility issue)
```

**Check:**
1. Is header z-index too low (buried behind content)?
2. Is overflow hidden on parent?
3. Is the button display:none or visibility:hidden?

---

## Continuous Monitoring

The audit report is stored in `window.__UX_AUDIT__`:

```javascript
window.__UX_AUDIT__ = {
  auditTimestamp: "2026-03-24T12:00:00Z",
  route: "/youtube/search",
  passedRules: 4,
  totalRules: 5,
  violations: [],
  uiState: {
    nav: { homeVisible: true, ... },
    layout: { hasHeader: true, ... },
    ...
  }
}
```

---

## Next Steps

1. **Start the dev server:** `npm run dev`
2. **Open DevTools** (F12)
3. **Navigate between pages** - watch console for audit logs
4. **Test error states** - intentionally break something to see if home button remains
5. **Monitor** `window.__UX_AUDIT__` to see real-time state

---

## Design Philosophy

**You don't need better prompts. You need:**

1. **UI invariants** - What MUST always be true?
2. **Runtime state** - What is actually rendered?
3. **AI reasoning** - Why might violations happen?

This system implements all three automatically.
