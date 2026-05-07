import React from 'react';
import { getTracingPath } from '../data/tracingPaths.js';

export default function TracingOverlay({ target = 'b', showStartAnchor = true }) {
  const path = getTracingPath(target);

  return (
    <svg className="bb-tracing-overlay" viewBox={path.viewBox} aria-hidden="true">
      <path className="bb-tracing-guide" d={path.guidePath} />
      <path className="bb-tracing-direction" d={path.guidePath} />
      {showStartAnchor && (
        <circle className="bb-tracing-start" cx={path.start.x} cy={path.start.y} r="4.5" />
      )}
    </svg>
  );
}
