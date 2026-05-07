import { flattenStrokes } from './strokeCapture.js';

export function getStrokeBounds(strokes) {
  const points = flattenStrokes(strokes);
  if (!points.length) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }

  const bounds = points.reduce((acc, point) => ({
    minX: Math.min(acc.minX, point.x),
    minY: Math.min(acc.minY, point.y),
    maxX: Math.max(acc.maxX, point.x),
    maxY: Math.max(acc.maxY, point.y),
  }), {
    minX: points[0].x,
    minY: points[0].y,
    maxX: points[0].x,
    maxY: points[0].y,
  });

  return {
    ...bounds,
    width: bounds.maxX - bounds.minX,
    height: bounds.maxY - bounds.minY,
  };
}

export function normalizeStrokes(strokes, box = { width: 100, height: 120 }) {
  const bounds = getStrokeBounds(strokes);
  const scale = Math.min(
    box.width / Math.max(bounds.width, 1),
    box.height / Math.max(bounds.height, 1),
  );

  return strokes.map((stroke) => stroke.map((point) => ({
    ...point,
    x: Math.round((point.x - bounds.minX) * scale * 100) / 100,
    y: Math.round((point.y - bounds.minY) * scale * 100) / 100,
  })));
}

export function estimateStrokeLength(points) {
  return points.reduce((total, point, index) => {
    if (index === 0) return total;
    const prev = points[index - 1];
    return total + Math.hypot(point.x - prev.x, point.y - prev.y);
  }, 0);
}

export function samplePolyline(points, count = 24) {
  if (!points.length) return [];
  if (points.length === 1 || count <= 1) return [points[0]];

  const totalLength = estimateStrokeLength(points);
  if (totalLength === 0) return Array.from({ length: count }, () => points[0]);

  const samples = [points[0]];
  let segmentStartLength = 0;
  let segmentIndex = 1;

  for (let i = 1; i < count - 1; i += 1) {
    const targetLength = (totalLength * i) / (count - 1);
    while (segmentIndex < points.length - 1) {
      const prev = points[segmentIndex - 1];
      const next = points[segmentIndex];
      const segmentLength = Math.hypot(next.x - prev.x, next.y - prev.y);
      if (segmentStartLength + segmentLength >= targetLength) break;
      segmentStartLength += segmentLength;
      segmentIndex += 1;
    }

    const prev = points[segmentIndex - 1];
    const next = points[segmentIndex];
    const segmentLength = Math.max(Math.hypot(next.x - prev.x, next.y - prev.y), 1);
    const ratio = (targetLength - segmentStartLength) / segmentLength;
    samples.push({
      ...next,
      x: prev.x + (next.x - prev.x) * ratio,
      y: prev.y + (next.y - prev.y) * ratio,
    });
  }

  samples.push(points[points.length - 1]);
  return samples;
}
