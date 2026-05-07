import React, { useEffect, useMemo, useState } from 'react';
import { AccessibilityContext } from './accessibilityHooks';
import {
  loadAccessibilityProfile,
  updateAccessibilityProfile,
} from './accessibilityStore';
import { getTypographyClasses } from './typographyEngine';

export default function AccessibilityProvider({ children }) {
  const [profile, setProfile] = useState(() => loadAccessibilityProfile());

  useEffect(() => {
    const handleProfileChange = (event) => {
      setProfile(event.detail || loadAccessibilityProfile());
    };

    window.addEventListener('bikebrowser:accessibility-profile-change', handleProfileChange);
    return () => {
      window.removeEventListener('bikebrowser:accessibility-profile-change', handleProfileChange);
    };
  }, []);

  const value = useMemo(() => ({
    profile,
    updateProfile: (partial) => updateAccessibilityProfile(partial),
  }), [profile]);

  return (
    <AccessibilityContext.Provider value={value}>
      <div className={getTypographyClasses(profile).join(' ')}>
        {children}
      </div>
    </AccessibilityContext.Provider>
  );
}
