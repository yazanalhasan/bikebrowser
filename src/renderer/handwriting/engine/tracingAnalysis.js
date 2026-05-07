import { flattenStrokes } from './strokeCapture.js';
import { estimateStrokeLength, samplePolyline } from './strokeNormalization.js';
import { getTracingPath } from '../data/tracingPaths.js';

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function expectedOrientation(letter) {
  return getTracingPath(letter).orientation;
}

function orientationFromPoints(points) {
  if (points.length < 2) return 'unknown';
  const anchorX = points[0].x;
  const xs = points.slice(1).map((point) => point.x);
  const rightReach = Math.max(...xs) - anchorX;
  const leftReach = anchorX - Math.min(...xs);
  return rightReach >= leftReach ? 'right' : 'left';
}

function countHesitations(points) {
  let hesitations = 0;
  for (let index = 1; index < points.length; index += 1) {
    const delta = points[index].t - points[index - 1].t;
    if (delta > 650) hesitations += 1;
  }
  return hesitations;
}

function smoothnessFor(points) {
  if (points.length < 3) return 1;
  let sharpTurns = 0;
  for (let index = 2; index < points.length; index += 1) {
    const a = points[index - 2];
    const b = points[index - 1];
    const c = points[index];
    const angle1 = Math.atan2(b.y - a.y, b.x - a.x);
    const angle2 = Math.atan2(c.y - b.y, c.x - b.x);
    const delta = Math.abs(Math.atan2(Math.sin(angle2 - angle1), Math.cos(angle2 - angle1)));
    if (delta > 2.35) sharpTurns += 1;
  }
  return clamp01(1 - sharpTurns / Math.max(points.length - 2, 1));
}

export function analyzeTracingAttempt(strokesOrPoints, options = {}) {
  const points = Array.isArray(strokesOrPoints?.[0])
    ? flattenStrokes(strokesOrPoints)
    : strokesOrPoints;
  const targetLetter = options.targetLetter || 'b';
  const target = options.targetPath || getTracingPath(targetLetter);
  const sampleCount = Math.max(target.samplePoints.length, 12);
  const childSamples = samplePolyline(points || [], sampleCount);
  const targetSamples = samplePolyline(target.samplePoints, sampleCount);
  const tolerance = options.tolerance || 28;

  const distances = targetSamples.map((targetPoint, index) => {
    const point = childSamples[index] || childSamples[childSamples.length - 1] || { x: 0, y: 0 };
    return Math.hypot(point.x - targetPoint.x, point.y - targetPoint.y);
  });
  const closeCount = distances.filter((distance) => distance <= tolerance).length;
  const overlap = closeCount / Math.max(targetSamples.length, 1);
  const childLength = estimateStrokeLength(points || []);
  const targetLength = estimateStrokeLength(target.samplePoints);
  const completion = clamp01(childLength / Math.max(targetLength * 0.72, 1));
  const directionSimilarity = childSamples.length > 1 && targetSamples.length > 1
    ? clamp01(1 - (
      Math.hypot(
        childSamples[0].x - targetSamples[0].x,
        childSamples[0].y - targetSamples[0].y,
      ) / 80
    ))
    : 0;
  const orientation = orientationFromPoints(points || []);
  const orientationCorrect = orientation === expectedOrientation(targetLetter);
  const orientationScore = orientationCorrect ? 1 : 0.25;
  const hesitationCount = countHesitations(points || []);
  const smoothness = smoothnessFor(points || []);

  return {
    targetLetter,
    overlap: Math.round(overlap * 100) / 100,
    completion: Math.round(completion * 100) / 100,
    directionSimilarity: Math.round(directionSimilarity * 100) / 100,
    orientationCorrect,
    orientationScore,
    smoothness: Math.round(smoothness * 100) / 100,
    hesitationCount,
    strokeCount: Array.isArray(strokesOrPoints?.[0]) ? strokesOrPoints.length : (points?.length ? 1 : 0),
  };
}
