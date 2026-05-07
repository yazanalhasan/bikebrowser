export function getReplayDuration(strokes, minimumMs = 900) {
  const lastPoint = strokes.flatMap((stroke) => stroke).at(-1);
  return Math.max(minimumMs, lastPoint?.t || minimumMs);
}

export function strokeToSvgPath(stroke) {
  if (!stroke?.length) return '';
  const [first, ...rest] = stroke;
  return `M ${first.x} ${first.y} ${rest.map((point) => `L ${point.x} ${point.y}`).join(' ')}`;
}

export function strokesToSvgPaths(strokes) {
  return strokes.map(strokeToSvgPath).filter(Boolean);
}
