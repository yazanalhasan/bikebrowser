/**
 * useUXAudit Hook
 * 
 * Auto-runs UX safety audit on every route change
 * Hooks into React Router to continuously monitor
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { captureUIState, enforceUXRules, generateAuditReport, toSerializableUIState } from '../utils/uxSafety';
import { auditUXState } from '../services/uxAuditService';

/**
 * STEP 6: Auto UX Audit Loop
 * 
 * Call this in your top-level component.
 * It will run audits on every route change.
 */
export function useUXAudit() {
  const location = useLocation();

  useEffect(() => {
    // Small delay to ensure DOM is fully rendered
    const timer = setTimeout(() => {
      try {
        const state = captureUIState();
        const violations = enforceUXRules(state);
        const serializableState = toSerializableUIState(state);

        // Store audit report in window for dev tools access
        window.__UX_AUDIT__ = generateAuditReport(state, violations);

        // If violations, log them
        if (violations.length > 0) {
          console.group('📋 UX AUDIT REPORT');
          console.table(violations);
          console.log('Full state:', serializableState);
          console.groupEnd();

          // Trigger custom event for monitoring
          window.dispatchEvent(
            new CustomEvent('uxAuditViolation', {
              detail: { violations, state: serializableState },
            })
          );
        }

        auditUXState(serializableState, {
          mode: violations.length > 0 ? 'debug' : 'continuous',
          includeHealthyState: false,
          hardViolations: violations
        }).then((result) => {
          window.__UX_AUDIT_AI__ = result;

          if (result?.success && result.violations?.length) {
            console.group(`🤖 UX AI AUDIT (${result.providerUsed})`);
            console.table(result.violations);
            console.groupEnd();
          }
        }).catch((error) => {
          console.error('UX AI audit failed (non-fatal):', error);
        });
      } catch (error) {
        console.error('UX audit hook failed (non-fatal):', error);
      }
    }, 100); // Give React time to render

    return () => clearTimeout(timer);
  }, [location.pathname]);
}

// Convenience export
export default useUXAudit;
