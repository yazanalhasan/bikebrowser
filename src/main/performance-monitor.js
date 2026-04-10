class PerformanceMonitor {
  constructor() {
    this.traces = new Map();
  }

  startTrace(name) {
    const traceId = `${name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    this.traces.set(traceId, {
      name,
      startedAt: Date.now(),
      marks: []
    });
    return traceId;
  }

  async measure(name, fn, traceId) {
    const startedAt = Date.now();
    try {
      return await fn();
    } finally {
      const duration = Date.now() - startedAt;
      if (traceId && this.traces.has(traceId)) {
        this.traces.get(traceId).marks.push({
          name,
          duration,
          completedAt: Date.now()
        });
      }
      console.log(`[Performance] ${name}: ${duration}ms`);
    }
  }

  endTrace(traceId, metadata = {}) {
    const trace = this.traces.get(traceId);
    if (!trace) {
      return;
    }

    trace.endedAt = Date.now();
    trace.metadata = metadata;
  }

  getTraceDuration(traceId) {
    const trace = this.traces.get(traceId);
    if (!trace) {
      return null;
    }

    return (trace.endedAt || Date.now()) - trace.startedAt;
  }

  getTraceMarks(traceId) {
    const trace = this.traces.get(traceId);
    if (!trace) {
      return [];
    }

    return trace.marks.map((mark) => ({ ...mark }));
  }

  clearTrace(traceId) {
    this.traces.delete(traceId);
  }
}

module.exports = {
  PerformanceMonitor
};