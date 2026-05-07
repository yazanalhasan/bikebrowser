import React from 'react';

export default function StrokeGuide({ target, mode = 'trace-letter' }) {
  const label = mode.includes('word') ? 'word' : 'letter';
  return (
    <div className="bb-stroke-guide">
      <span>Start at the dot</span>
      <strong>{target}</strong>
      <span>Trace slowly, then lift your finger or pen.</span>
      <small>Finger, stylus, and mouse all work. The lines are saved as strokes, not screenshots.</small>
      <em>Practice {label} shape, direction, and orientation.</em>
    </div>
  );
}
