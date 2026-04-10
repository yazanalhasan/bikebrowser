/**
 * Worker Pool
 *
 * Multi-core aware worker thread pool for CPU-intensive tasks.
 *
 * Features:
 * - Pool size auto-detected from os.cpus() (2 – 4 workers)
 * - Priority queue: HIGH (0) > MEDIUM (1) > LOW (2)
 * - Tasks are QUEUED when all workers are busy — never rejected
 * - Workers are respawned automatically after crash
 * - getStats() for the diagnostics panel
 *
 * Usage (main / Node context):
 *   const { WorkerPool, PRIORITY } = require('./workerPool');
 *   const pool = new WorkerPool(path.join(__dirname, 'rankingWorker.js'));
 *   const result = await pool.execute('rankVideos', payload, { priority: 'HIGH' });
 */

'use strict';

const { Worker } = require('worker_threads');
const os = require('os');

const PRIORITY = Object.freeze({ HIGH: 0, MEDIUM: 1, LOW: 2 });

class WorkerPool {
  /**
   * @param {string} workerPath       Absolute path to the worker script
   * @param {Object} [options]
   * @param {number} [options.poolSize]        Override auto-detected size
   * @param {number} [options.defaultTimeout]  Default task timeout ms (30 s)
   */
  constructor(workerPath, options = {}) {
    this.workerPath = workerPath;

    const cpus = os.cpus().length;
    this.poolSize = options.poolSize
      ? Math.max(1, Math.min(8, options.poolSize))
      : Math.max(2, Math.min(4, cpus - 1));

    this.defaultTimeout = options.defaultTimeout ?? 30_000;
    this._nextId = 1;
    this._shutdown = false;

    /** @type {Worker[]} All live workers */
    this.workers = [];
    /** @type {Worker[]} Workers ready for a new task */
    this.idle = [];
    /**
     * Priority queues indexed by PRIORITY value.
     * Each element: { requestId, taskType, data }
     * @type {Array<Array<{requestId:number,taskType:string,data:*}>>}
     */
    this.queue = [[], [], []];
    /**
     * In-flight requests.
     * @type {Map<number,{resolve:Function,reject:Function,timeoutId:*}>}
     */
    this.pending = new Map();

    for (let i = 0; i < this.poolSize; i++) {
      this._spawnWorker();
    }

    console.log(
      `[WorkerPool] Started ${this.poolSize} workers` +
      ` (${cpus} CPU cores detected, script: ${workerPath})`
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Public API
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Execute a task on a worker thread.
   *
   * @param {string}       taskType   Identifier understood by the worker script
   * @param {*}            data       Serialisable task payload
   * @param {Object}       [opts]
   * @param {'HIGH'|'MEDIUM'|'LOW'} [opts.priority='MEDIUM']
   * @param {number}       [opts.timeout]  Override default timeout
   * @param {AbortSignal}  [opts.signal]   AbortController signal for cancellation
   * @returns {Promise<*>}
   */
  execute(taskType, data, opts = {}) {
    if (this._shutdown) {
      return Promise.reject(new Error('[WorkerPool] Pool is shut down'));
    }

    const priorityKey = opts.priority ?? 'MEDIUM';
    const priorityIdx = PRIORITY[priorityKey] ?? PRIORITY.MEDIUM;
    const timeout = opts.timeout ?? this.defaultTimeout;
    const signal = opts.signal ?? null;

    if (signal?.aborted) {
      return Promise.reject(new Error('[WorkerPool] Task already aborted'));
    }

    const requestId = this._nextId++;

    return new Promise((resolve, reject) => {
      const entry = { resolve, reject, timeoutId: null };

      // Timeout guard
      entry.timeoutId = setTimeout(() => {
        if (!this.pending.has(requestId)) return;
        this.pending.delete(requestId);
        this._removeFromQueue(requestId);
        reject(new Error(`[WorkerPool] Task timed out after ${timeout} ms`));
      }, timeout);

      // Abort-signal support
      if (signal) {
        signal.addEventListener('abort', () => {
          if (!this.pending.has(requestId)) return;
          clearTimeout(entry.timeoutId);
          this.pending.delete(requestId);
          this._removeFromQueue(requestId);
          reject(new Error('[WorkerPool] Task aborted'));
        }, { once: true });
      }

      this.pending.set(requestId, entry);

      if (this.idle.length > 0) {
        // A worker is ready — dispatch immediately
        const worker = this.idle.pop();
        this._send(worker, requestId, taskType, data);
      } else {
        // All workers busy — queue at appropriate priority level
        this.queue[priorityIdx].push({ requestId, taskType, data });
      }
    });
  }

  /**
   * Diagnostics snapshot for the performance panel.
   * @returns {{poolSize,idle,busy,queued,queuedByPriority,pending}}
   */
  getStats() {
    const queued = this.queue.reduce((s, q) => s + q.length, 0);
    return {
      poolSize: this.poolSize,
      idle: this.idle.length,
      busy: this.workers.length - this.idle.length,
      queued,
      queuedByPriority: {
        high:   this.queue[PRIORITY.HIGH].length,
        medium: this.queue[PRIORITY.MEDIUM].length,
        low:    this.queue[PRIORITY.LOW].length,
      },
      pending: this.pending.size,
    };
  }

  /** Gracefully terminate all workers. */
  async shutdown() {
    this._shutdown = true;

    // Reject all in-flight and queued tasks
    for (const [, entry] of this.pending) {
      clearTimeout(entry.timeoutId);
      entry.reject(new Error('[WorkerPool] Pool shut down'));
    }
    this.pending.clear();
    this.queue = [[], [], []];

    await Promise.all(this.workers.map(w => w.terminate()));
    this.workers = [];
    this.idle = [];
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Internals
  // ──────────────────────────────────────────────────────────────────────────

  _spawnWorker() {
    const worker = new Worker(this.workerPath);

    worker.on('message', msg  => this._onMessage(worker, msg));
    worker.on('error',   err  => {
      console.error('[WorkerPool] Worker error:', err.message);
      this._recycleWorker(worker);
    });
    worker.on('exit', code => {
      if (code !== 0) {
        console.error(`[WorkerPool] Worker exited with code ${code}`);
      }
      this._recycleWorker(worker);
    });

    this.workers.push(worker);
    this.idle.push(worker);
    return worker;
  }

  _onMessage(worker, { requestId, result, error }) {
    // Return worker to idle pool first, then drain the queue
    this._markIdle(worker);

    const entry = this.pending.get(requestId);
    if (!entry) {
      // Task timed out or was aborted before this message arrived
      this._drainQueue();
      return;
    }

    clearTimeout(entry.timeoutId);
    this.pending.delete(requestId);
    this._drainQueue();

    if (error) {
      entry.reject(new Error(error));
    } else {
      entry.resolve(result);
    }
  }

  /** Remove a crashed worker and respawn to maintain pool size. */
  _recycleWorker(worker) {
    this.workers = this.workers.filter(w => w !== worker);
    this.idle    = this.idle.filter(w => w !== worker);

    if (!this._shutdown && this.workers.length < this.poolSize) {
      console.log('[WorkerPool] Respawning crashed worker…');
      this._spawnWorker();
    }
  }

  _markIdle(worker) {
    if (!this.idle.includes(worker)) {
      this.idle.push(worker);
    }
  }

  /** Assign queued tasks to any idle workers. */
  _drainQueue() {
    while (this.idle.length > 0 && this._hasQueued()) {
      const worker = this.idle.pop();
      // Pick from highest-priority non-empty queue
      let dispatched = false;
      for (let p = 0; p < 3; p++) {
        if (this.queue[p].length > 0) {
          const task = this.queue[p].shift();
          this._send(worker, task.requestId, task.taskType, task.data);
          dispatched = true;
          break;
        }
      }
      if (!dispatched) {
        // Nothing to do — put worker back
        this.idle.push(worker);
        break;
      }
    }
  }

  _hasQueued() {
    return this.queue.some(q => q.length > 0);
  }

  _send(worker, requestId, taskType, data) {
    try {
      worker.postMessage({ requestId, taskType, data });
    } catch (err) {
      // Worker died between selection and postMessage
      this._recycleWorker(worker);
      const entry = this.pending.get(requestId);
      if (entry) {
        clearTimeout(entry.timeoutId);
        this.pending.delete(requestId);
        entry.reject(err);
      }
    }
  }

  _removeFromQueue(requestId) {
    for (const q of this.queue) {
      const idx = q.findIndex(t => t.requestId === requestId);
      if (idx !== -1) {
        q.splice(idx, 1);
        return;
      }
    }
  }
}

module.exports = { WorkerPool, PRIORITY };
