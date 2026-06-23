import React from 'react';
import HabitatLab from './HabitatLab.jsx';

// Ecology loop (desert wash) — emits ecology:done into chapter progression.
export default function EcologyLab() {
  return <HabitatLab dataset="ecology" />;
}
