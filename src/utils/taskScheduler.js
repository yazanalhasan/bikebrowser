/**
 * Task Scheduler  (Renderer / browser context — ES module)
 *
 * Defers work by priority so the UI thread stays responsive.
 *
 *  HIGH   – Runs immediately via queueMicrotask()
 *           Use for: visible UI updates, first-screen results
 *
 *  MEDIUM – Runs in the next microtask checkpoint via Promise.resolve()
 *           Use for: ranking visible videos, secondary API data
 *
 *  LOW    – Deferred to idle time via requestIdleCallback / setTimeout
 *           Use for: background ranking, prefetch, mission generation
 *
 * CPU-load adaptation
 * -------------------
 * Call `scheduler.setCpuLoad(0–1)` from your performance monitor.
 * When load > 0.7 the LOW queue shrinks its budget-per-frame and
 * inter-batch delay grows so the main thread is not starved.
 *
 * Example
 * -------
 *   import scheduler, { PRIORITY } from '../utils/taskScheduler';
 *
 *   // High priority — runs before the next paint
 *   const result = await scheduler.schedule(
 *     () => computeVisibleRanking(videos),
 *     PRIORITY.HIGH,
 *     'initial-ranking'
 *   );
 *
 *   // Low priority — background prefetch during browser idle time
 *   scheduler.schedule(prefetchNextPage, PRIORITY.LOW, 'prefetch');
 */

const PRIORITY = Object.freeze({
  HIGH:   'HIGH',
  MEDIUM: 'MEDIUM',
  LOW:    'LOW',
});

class TaskScheduler {
  constructor() {
    this.queues = {
      HIGH:   /** @type {{fn,resolve,reject,label}[]} */ ([]),
      MEDIUM: ([]),
      LOW:    ([]),
    };
    /** requestIdleCallback / setTimeout handle for LOW tasks */
    this._idleHandle = null;
    /** Estimated CPU load 0–1 set by the performance monitor */
    this._cpuLoad = 0;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Public API
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Schedule a function to run with the given priority.
   *
   * @param {() => (any | Promise<any>)} fn       Sync or async function
   * @param {'HIGH'|'MEDIUM'|'LOW'}      priority  Default: 'MEDIUM'
   * @param {string}                    [label]   Optional label for debugging
   * @returns {Promise<any>}  Resolves/rejects with the function's return value
   */
  schedule(fn, priority = PRIORITY.MEDIUM, label = '') {
    if (!this.queues[priority]) {
      priority = PRIORITY.MEDIUM;
    }
    return new Promise((resolve, reject) => {
      this.queues[priority].push({ fn, resolve, reject, label });
      this._kick(priority);
    });
  }

  /**
   * Inform the scheduler of estimated CPU load (0–1).
   * Called from the adaptive performance monitor.
   *
   * @param {number} load  0 = idle, 1 = saturated
   */
  setCpuLoad(load) {
    this._cpuLoad = Math.max(0, Math.min(1, load));
  }

  /**
   * Cancel all pending LOW-priority tasks (e.g. on page navigation).
   * Each task promise is rejected with a cancellation error.
   */
  clearLow() {
    const cancelled = this.queues.LOW.splice(0);
    for (const t of cancelled) {
      t.reject(new Error('[TaskScheduler] LOW task cancelled'));
    }
  }

  /**
   * Cancel all pending tasks at every priority level.
   */
  clearAll() {
    for (const level of Object.keys(this.queues)) {
      const cancelled = this.queues[level].splice(0);
      for (const t of cancelled) {
        t.reject(new Error('[TaskScheduler] Task cancelled'));
      }
    }
  }

  /**
   * Diagnostics snapshot for the performance panel.
   * @returns {{high,medium,low,cpuLoad,throttled}}
   */
  getStats() {
    return {
      high:     this.queues.HIGH.length,
      medium:   this.queues.MEDIUM.length,
      low:      this.queues.LOW.length,
      cpuLoad:  Math.round(this._cpuLoad * 100),
      throttled: this._cpuLoad > 0.7,
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Internals
  // ──────────────────────────────────────────────────────────────────────────

  _kick(priority) {
    if (priority === PRIORITY.HIGH) {
      queueMicrotask(() => this._flush(PRIORITY.HIGH));
    } else if (priority === PRIORITY.MEDIUM) {
      Promise.resolve().then(() => this._flush(PRIORITY.MEDIUM));
    } else {
      this._scheduleIdle();
    }
  }

  /**
   * Drain all currently-queued tasks of the given priority in one pass.
   * (Tasks added *during* this flush go to the next microtask / idle batch.)
   */
  _flush(priority) {
    const batch = this.queues[priority].splice(0);
    for (const task of batch) {
      this._runTask(task);
    }
    // After HIGH drains, cascade into MEDIUM if it has accumulated work
    if (priority === PRIORITY.HIGH && this.queues.MEDIUM.length > 0) {
      Promise.resolve().then(() => this._flush(PRIORITY.MEDIUM));
    }
  }

  async _runTask(task) {
    try {
      task.resolve(await task.fn());
    } catch (err) {
      task.reject(err);
    }
  }

  _scheduleIdle() {
    if (this._idleHandle !== null) return; // Already scheduled

    const run = (deadline) => {
      this._idleHandle = null;

      // Under high CPU load give the browser a larger minimum free slice
      // so it can handle input / paint without competition.
      const minFreeMs = this._cpuLoad > 0.7 ? 8 : 2;

      while (this.queues.LOW.length > 0) {
        const remaining = deadline ? deadline.timeRemaining() : Infinity;
        if (remaining < minFreeMs) break;
        this._runTask(this.queues.LOW.shift());
      }

      if (this.queues.LOW.length > 0) {
        this._scheduleIdle(); // More work remains — schedule next batch
      }
    };

    if (typeof requestIdleCallback !== 'undefined') {
      this._idleHandle = requestIdleCallback(run, { timeout: 500 });
    } else {
      // Node.js or environments without requestIdleCallback
      const delay = this._cpuLoad > 0.7 ? 200 : 50;
      this._idleHandle = setTimeout(() => {
        this._idleHandle = null;
        run(null);
      }, delay);
    }
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Renderer-process singleton
// ────────────────────────────────────────────────────────────────────────────
const scheduler = new TaskScheduler();

export { scheduler, TaskScheduler, PRIORITY };
export default scheduler;
