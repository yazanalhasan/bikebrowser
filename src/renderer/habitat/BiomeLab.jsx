import React from 'react';
import HabitatLab from './HabitatLab.jsx';

// Salt River biome loop — emits biome:complete + biome:done into progression.
export default function BiomeLab() {
  return <HabitatLab dataset="biome" />;
}
