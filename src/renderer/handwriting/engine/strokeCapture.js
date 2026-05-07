export function buildStrokePoint(event, bounds, startedAt = event.timeStamp || Date.now()) {
  const timestamp = event.timeStamp || Date.now();
  return {
    x: Math.round((event.clientX - bounds.left) * 100) / 100,
    y: Math.round((event.clientY - bounds.top) * 100) / 100,
    t: Math.max(0, Math.round(timestamp - startedAt)),
    pressure: typeof event.pressure === 'number' && event.pressure > 0 ? event.pressure : 0.5,
    pointerType: event.pointerType || 'mouse',
  };
}

export function createStrokeSession(initialStrokes = []) {
  const session = {
    strokes: initialStrokes.map((stroke) => [...stroke]),
    activeStroke: null,
    start(point) {
      this.activeStroke = [point];
      this.strokes = [...this.strokes, this.activeStroke];
      return this.activeStroke;
    },
    append(point) {
      if (!this.activeStroke) return null;
      this.activeStroke.push(point);
      return this.activeStroke;
    },
    end() {
      const finished = this.activeStroke;
      this.activeStroke = null;
      return finished;
    },
    undo() {
      this.end();
      this.strokes = this.strokes.slice(0, -1);
      return this.strokes;
    },
    clear() {
      this.activeStroke = null;
      this.strokes = [];
      return this.strokes;
    },
  };

  return session;
}

export function flattenStrokes(strokes) {
  return strokes.flatMap((stroke) => stroke);
}
