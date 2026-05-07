import { createContext, useContext } from 'react';
import { DEFAULT_ACCESSIBILITY_PROFILE } from './accessibilityStore.js';

export const AccessibilityContext = createContext({
  profile: DEFAULT_ACCESSIBILITY_PROFILE,
  updateProfile: () => DEFAULT_ACCESSIBILITY_PROFILE,
});

export function useAccessibility() {
  return useContext(AccessibilityContext);
}
