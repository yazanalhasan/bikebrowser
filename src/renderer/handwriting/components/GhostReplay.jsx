import React from 'react';
import { getTracingPath } from '../data/tracingPaths.js';
import { strokesToSvgPaths } from '../engine/strokeReplay.js';

export default function GhostReplay({ target = 'b', strokes = [], active = false }) {
  const path = getTracingPath(target);
  const childPaths = strokesToSvgPaths(strokes);

  return (
    <svg
      className={`bb-ghost-replay ${active ? 'is-active' : ''}`}
      viewBox={path.viewBox}
      aria-label="Handwriting replay"
    >
      <path className="bb-ghost-ideal" d={path.guidePath} />
      {childPaths.map((childPath, index) => (
        <path className="bb-ghost-child" d={childPath} key={`${childPath}-${index}`} />
      ))}
    </svg>
  );
}
