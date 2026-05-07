import React from 'react';
import { useAccessibility } from '../../accessibility/accessibilityHooks';

export default function ReadingFocusOverlay() {
  const { profile } = useAccessibility();

  if (!profile.readingFocusMode) return null;

  return (
    <div className="bb-reading-focus-overlay" aria-hidden="true">
      <div className="bb-reading-focus-strip" />
    </div>
  );
}
