import React from 'react';
import { useAccessibility } from '../../accessibility/accessibilityHooks';
import { FONT_MODES } from '../../accessibility/readingModes';

const TOGGLES = [
  ['dyslexiaMode', 'Dyslexia mode'],
  ['lowercasePriority', 'Lowercase-first mode'],
  ['preserveCapitalBD', 'Preserve capital B/D'],
  ['increasedSpacing', 'Enhanced spacing'],
  ['reducedMotion', 'Reduced motion'],
  ['readingFocusMode', 'Reading focus mode'],
  ['phonemeAudio', 'Audio assist'],
];

export default function DyslexiaSettingsPanel({ compact = false }) {
  const { profile, updateProfile } = useAccessibility();

  return (
    <section className={`bb-dyslexia-settings ${compact ? 'is-compact' : ''}`}>
      <div>
        <p>Reading settings</p>
        <h2>Dyslexia accessibility</h2>
      </div>
      <div className="bb-settings-grid">
        {TOGGLES.map(([key, label]) => (
          <label key={key} className="bb-settings-toggle">
            <input
              type="checkbox"
              checked={Boolean(profile[key])}
              onChange={(event) => updateProfile({ [key]: event.target.checked })}
            />
            <span>{label}</span>
          </label>
        ))}
      </div>
      <label className="bb-font-selector">
        <span>Font</span>
        <select
          value={profile.fontMode}
          onChange={(event) => updateProfile({ fontMode: event.target.value })}
        >
          {Object.values(FONT_MODES).map((font) => (
            <option key={font.id} value={font.id}>{font.label}</option>
          ))}
        </select>
      </label>
    </section>
  );
}
