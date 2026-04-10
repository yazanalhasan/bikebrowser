/**
 * Performance Monitoring Utilities
 * 
 * Lightweight performance tracking for key operations:
 * - Time to first render
 * - Time to interactive  
 * - Ranking duration
 * - API call durations
 * - Re-render counts (dev mode)
 * - Memory usage (where available)
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.timers = new Map();
    this.renderCounts = new Map();
    this.enabled = process.env.NODE_ENV === 'development';
  }

  /**
   * Start timing an operation
   */
  startTimer(name) {
    if (!this.enabled) return;
    
    this.timers.set(name, {
      startTime: performance.now(),
      startMemory: this._getMemoryUsage()
    });
  }

  /**
   * End timing an operation
   */
  endTimer(name) {
    if (!this.enabled) return;

    const timer = this.timers.get(name);
    if (!timer) {
      console.warn(`[PerformanceMonitor] No timer found for: ${name}`);
      return;
    }

    const duration = performance.now() - timer.startTime;
    const memoryDelta = this._getMemoryUsage() - timer.startMemory;

    // Store metric
    if (!this.metrics.has(name)) {
      this.metrics.set(name, {
        count: 0,
        totalDuration: 0,
        avgDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
        lastDuration: 0,
        memoryDelta: 0
      });
    }

    const metric = this.metrics.get(name);
    metric.count++;
    metric.totalDuration += duration;
    metric.avgDuration = metric.totalDuration / metric.count;
    metric.minDuration = Math.min(metric.minDuration, duration);
    metric.maxDuration = Math.max(metric.maxDuration, duration);
    metric.lastDuration = duration;
    metric.memoryDelta = memoryDelta;

    this.timers.delete(name);

    return {
      duration,
      memoryDelta
    };
  }

  /**
   * Track a render (for component performance)
   */
  trackRender(componentName) {
    if (!this.enabled) return;

    const count = (this.renderCounts.get(componentName) || 0) + 1;
    this.renderCounts.set(componentName, count);
  }

  /**
   * Get memory usage (if available)
   */
  _getMemoryUsage() {
    if (performance.memory) {
      return performance.memory.usedJSHeapSize;
    }
    return 0;
  }

  /**
   * Get all metrics
   */
  getMetrics() {
    const result = {};
    
    for (const [name, metric] of this.metrics.entries()) {
      result[name] = {
        ...metric,
        avgDuration: Math.round(metric.avgDuration * 100) / 100,
        minDuration: Math.round(metric.minDuration * 100) / 100,
        maxDuration: Math.round(metric.maxDuration * 100) / 100,
        lastDuration: Math.round(metric.lastDuration * 100) / 100,
        memoryDelta: this._formatBytes(metric.memoryDelta)
      };
    }

    return result;
  }

  /**
   * Get render counts
   */
  getRenderCounts() {
    return Object.fromEntries(this.renderCounts);
  }

  /**
   * Get summary
   */
  getSummary() {
    const metrics = this.getMetrics();
    const renders = this.getRenderCounts();
    
    return {
      metrics,
      renders,
      memory: this._getMemoryStats(),
      timestamp: Date.now()
    };
  }

  /**
   * Get memory stats (if available)
   */
  _getMemoryStats() {
    if (performance.memory) {
      return {
        used: this._formatBytes(performance.memory.usedJSHeapSize),
        total: this._formatBytes(performance.memory.totalJSHeapSize),
        limit: this._formatBytes(performance.memory.jsHeapSizeLimit)
      };
    }
    return null;
  }

  /**
   * Format bytes for display
   */
  _formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics.clear();
    this.timers.clear();
    this.renderCounts.clear();
  }

  /**
   * Log summary to console
   */
  logSummary() {
    if (!this.enabled) return;

    console.group('[Performance Summary]');
    console.table(this.getMetrics());
    console.log('Render Counts:', this.getRenderCounts());
    console.log('Memory:', this._getMemoryStats());
    console.groupEnd();
  }
}

// Singleton instance
const perfMonitor = new PerformanceMonitor();

// Convenience functions
export const startTimer = (name) => perfMonitor.startTimer(name);
export const endTimer = (name) => perfMonitor.endTimer(name);
export const trackRender = (name) => perfMonitor.trackRender(name);
export const getMetrics = () => perfMonitor.getMetrics();
export const getSummary = () => perfMonitor.getSummary();
export const logSummary = () => perfMonitor.logSummary();
export const clearMetrics = () => perfMonitor.clear();

export default perfMonitor;
