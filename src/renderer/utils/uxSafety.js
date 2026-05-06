/**
 * UX Safety System for BikeBrowser
 * 
 * This module enforces hard UX constraints at runtime.
 * Non-negotiable rules to ensure children never get trapped.
 */

// ============================================================================
// STEP 1: DEFINE NON-NEGOTIABLE UX RULES (hard constraints)
// ============================================================================

export const UX_RULES = {
  MUST_HAVE_HOME_BUTTON: true,
  MUST_HAVE_NAV_CONTAINER: true,
  NO_EMPTY_SCREEN: true,
  MUST_HAVE_ESCAPE_ROUTE: true,
  MUST_HAVE_HEADER: true,
};

// ============================================================================
// ROUTE EXEMPTIONS
// ============================================================================
// Some routes intentionally render without standard app chrome. These are
// design decisions, not regressions — the chrome checks would fire as false
// positives for them. See `src/renderer/components/AppLayout.jsx` lines 27
// and 42 (the `/play` immersive game branch — "ZERO app chrome").
//
// Match is exact pathname equality — `/play-back`, `/play/foo`, etc. are NOT
// exempted. To exempt a new route, add an entry below and document the
// AppLayout (or equivalent) line that bypasses the chrome.
export const ROUTE_EXEMPTIONS = {
  '/play': ['MUST_HAVE_HOME_BUTTON', 'MUST_HAVE_HEADER', 'MUST_HAVE_NAV_CONTAINER', 'MUST_HAVE_MAIN_CONTENT', 'NO_EMPTY_SCREEN'],
  '/play3d': ['MUST_HAVE_HOME_BUTTON', 'MUST_HAVE_HEADER', 'MUST_HAVE_NAV_CONTAINER', 'MUST_HAVE_MAIN_CONTENT', 'NO_EMPTY_SCREEN'],
};

// ============================================================================
// STEP 2: RUNTIME UI SNAPSHOT FUNCTION
// ============================================================================

/**
 * Captures the actual runtime UI state (not read from code)
 * This is what we send to AI for reasoning, not raw code
 */
export function captureUIState() {
  const homeButton = document.querySelector('[data-testid="home-button"]');
  const backButton = document.querySelector('[data-testid="back-button"]');
  const header = document.querySelector('[data-testid="app-header"]');
  const navContainer = document.querySelector('[data-testid="nav-container"]');
  const mainContent = document.querySelector('[data-testid="main-content"]');

  return {
    timestamp: new Date().toISOString(),
    route: window.location.pathname,

    nav: {
      homeVisible: !!homeButton,
      homeButtonElement: homeButton,
      homeIsClickable: !!homeButton && homeButton.offsetParent !== null,
      backVisible: !!backButton,
      backButtonElement: backButton,
    },

    layout: {
      hasHeader: !!header,
      headerElement: header,
      hasNavContainer: !!navContainer,
      navContainerElement: navContainer,
      hasFooter: !!document.querySelector('[data-testid="app-footer"]'),
    },

    content: {
      hasMainContent: !!mainContent,
      mainContentElement: mainContent,
      isEmpty: document.body.innerText.trim().length === 0,
      contentLength: document.body.innerText.trim().length,
    },

    visibility: {
      // Check for hidden/display:none/visibility:hidden elements
      homeHidden:
        !!homeButton &&
        (homeButton.offsetParent === null || getComputedStyle(homeButton).display === 'none'),
      headerHidden:
        !!header &&
        (header.offsetParent === null || getComputedStyle(header).display === 'none'),
    },

    // Debugging info
    debug: {
      allTestIds: Array.from(document.querySelectorAll('[data-testid]')).map(
        (el) => el.getAttribute('data-testid')
      ),
    },
  };
}

export function toSerializableUIState(state) {
  return {
    timestamp: state.timestamp,
    route: state.route,
    nav: {
      homeVisible: state.nav.homeVisible,
      homeIsClickable: state.nav.homeIsClickable,
      backVisible: state.nav.backVisible,
    },
    layout: {
      hasHeader: state.layout.hasHeader,
      hasNavContainer: state.layout.hasNavContainer,
      hasFooter: state.layout.hasFooter,
    },
    content: {
      hasMainContent: state.content.hasMainContent,
      isEmpty: state.content.isEmpty,
      contentLength: state.content.contentLength,
    },
    visibility: {
      homeHidden: state.visibility.homeHidden,
      headerHidden: state.visibility.headerHidden,
    },
    debug: {
      allTestIds: state.debug.allTestIds,
    },
  };
}

// ============================================================================
// STEP 3: HARD FAIL ENFORCEMENT (before AI runs)
// ============================================================================

/**
 * Enforces UX rules at runtime
 * Catches bugs INSTANTLY without waiting for AI
 */
export function enforceUXRules(state) {
  const violations = [];
  // Exact-match pathname lookup — see ROUTE_EXEMPTIONS docblock above.
  const exemptedRules = ROUTE_EXEMPTIONS[state.route] || [];
  const isExempt = (rule) => exemptedRules.includes(rule);

  // Rule 1: Home button must always be visible
  if (UX_RULES.MUST_HAVE_HOME_BUTTON && !isExempt('MUST_HAVE_HOME_BUTTON') && !state.nav.homeVisible) {
    const violation = `CRITICAL: Home button (data-testid="home-button") is missing on route ${state.route}`;
    console.error('🚨', violation);
    violations.push({
      rule: 'MUST_HAVE_HOME_BUTTON',
      severity: 'critical',
      message: violation,
    });
  }

  // Rule 1b: Home button must be clickable (not hidden)
  if (UX_RULES.MUST_HAVE_HOME_BUTTON && !isExempt('MUST_HAVE_HOME_BUTTON') && state.nav.homeVisible && !state.nav.homeIsClickable) {
    const violation = `CRITICAL: Home button exists but is not clickable (visibility issue) on route ${state.route}`;
    console.error('🚨', violation);
    violations.push({
      rule: 'MUST_HAVE_HOME_BUTTON',
      severity: 'critical',
      message: violation,
    });
  }

  // Rule 2: Header container must exist
  if (UX_RULES.MUST_HAVE_HEADER && !isExempt('MUST_HAVE_HEADER') && !state.layout.hasHeader) {
    const violation = `CRITICAL: App header (data-testid="app-header") is missing on route ${state.route}`;
    console.error('🚨', violation);
    violations.push({
      rule: 'MUST_HAVE_HEADER',
      severity: 'critical',
      message: violation,
    });
  }

  // Rule 3: Nav container must exist
  if (UX_RULES.MUST_HAVE_NAV_CONTAINER && !isExempt('MUST_HAVE_NAV_CONTAINER') && !state.layout.hasNavContainer) {
    const violation = `CRITICAL: Navigation container (data-testid="nav-container") is missing on route ${state.route}`;
    console.error('🚨', violation);
    violations.push({
      rule: 'MUST_HAVE_NAV_CONTAINER',
      severity: 'critical',
      message: violation,
    });
  }

  // Rule 4: Main content must exist
  if (!isExempt('MUST_HAVE_MAIN_CONTENT') && !state.content.hasMainContent) {
    const violation = `WARNING: Main content (data-testid="main-content") is missing on route ${state.route}`;
    console.warn('⚠️', violation);
    violations.push({
      rule: 'MUST_HAVE_MAIN_CONTENT',
      severity: 'high',
      message: violation,
    });
  }

  // Rule 5: Screen cannot be completely empty
  if (UX_RULES.NO_EMPTY_SCREEN && !isExempt('NO_EMPTY_SCREEN') && state.content.isEmpty) {
    const violation = `CRITICAL: Screen is completely empty on route ${state.route}`;
    console.error('🚨', violation);
    violations.push({
      rule: 'NO_EMPTY_SCREEN',
      severity: 'critical',
      message: violation,
    });
  }

  // Log summary
  if (violations.length > 0) {
    console.group('🚨 UX SAFETY VIOLATIONS DETECTED');
    violations.forEach((v) => {
      console.log(`[${v.severity.toUpperCase()}] ${v.rule}: ${v.message}`);
    });
    console.groupEnd();
  } else {
    console.log('✅ UX Safety Check Passed', { route: state.route, timestamp: state.timestamp });
  }

  return violations;
}

// ============================================================================
// STEP 4: AUDIT REPORTING
// ============================================================================

/**
 * Generates audit report JSON (can be sent to AI for reasoning)
 */
export function generateAuditReport(state, violations = enforceUXRules(state)) {
  const serializableState = toSerializableUIState(state);

  return {
    auditTimestamp: new Date().toISOString(),
    route: state.route,
    passedRules: Object.entries(UX_RULES).length - violations.length,
    totalRules: Object.entries(UX_RULES).length,
    violations,
    uiState: serializableState,
  };
}

// ============================================================================
// STEP 5: DIAGNOSTICS
// ============================================================================

/**
 * Get detailed diagnostics for debugging
 */
export function getUXDiagnostics() {
  const state = captureUIState();
  const report = generateAuditReport(state);

  return {
    ...report,
    diagnostics: {
      documentReady: document.readyState,
      bodyContent: document.body.innerHTML.substring(0, 200),
      testIdElements: state.debug.allTestIds,
      warnings: [],
    },
  };
}

export default {
  UX_RULES,
  ROUTE_EXEMPTIONS,
  captureUIState,
  toSerializableUIState,
  enforceUXRules,
  generateAuditReport,
  getUXDiagnostics,
};
