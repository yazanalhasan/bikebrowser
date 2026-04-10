/**
 * Worker Manager
 * 
 * Manages a pool of worker threads for offloading CPU-intensive tasks.
 * Features:
 * - Request/response tracking with unique IDs
 * - Timeout protection
 * - Cancellation support via AbortController pattern
 * - Worker reuse (small pool, not unlimited spawning)
 * - Automatic cleanup of completed/timed-out requests
 */

const { Worker } = require('worker_threads');
const path = require('path');

class WorkerManager {
  constructor(options = {}) {
    this.maxWorkers = options.maxWorkers || 4;
    this.workers = [];
    this.availableWorkers = [];
    this.pendingRequests = new Map(); // requestId -> { resolve, reject, timeoutId, aborted }
    /**
     * Tasks waiting for an available worker.
     * Each element: { requestId, taskType, data }
     * Populated when all workers are busy instead of rejecting.
     */
    this.taskQueue = [];
    this.nextRequestId = 1;
    this.defaultTimeout = options.defaultTimeout || 30000; // 30s default
  }

  /**
   * Initialize worker pool
   */
  initialize(workerPath) {
    this.workerPath = workerPath;
    
    // Pre-spawn workers for instant availability
    for (let i = 0; i < Math.min(2, this.maxWorkers); i++) {
      this._createWorker();
    }
  }

  /**
   * Create a new worker thread
   */
  _createWorker() {
    if (this.workers.length >= this.maxWorkers) {
      return null;
    }

    const worker = new Worker(this.workerPath);
    
    // Handle messages from worker
    worker.on('message', (message) => {
      this._handleWorkerMessage(worker, message);
    });

    // Handle worker errors
    worker.on('error', (error) => {
      console.error('[WorkerManager] Worker error:', error);
      this._killWorker(worker);
    });

    // Handle worker exit
    worker.on('exit', (code) => {
      if (code !== 0) {
        console.error(`[WorkerManager] Worker exited with code ${code}`);
      }
      this._removeWorker(worker);
    });

    this.workers.push(worker);
    this.availableWorkers.push(worker);
    
    return worker;
  }

  /**
   * Handle message from worker
   */
  _handleWorkerMessage(worker, message) {
    const { requestId, result, error } = message;

    const request = this.pendingRequests.get(requestId);
    if (!request) {
      // Request already timed out or cancelled
      return;
    }

    // Clear timeout
    if (request.timeoutId) {
      clearTimeout(request.timeoutId);
    }

    // Remove from pending
    this.pendingRequests.delete(requestId);

    // Mark worker as available then drain the task queue before resolving
    if (!this.availableWorkers.includes(worker)) {
      this.availableWorkers.push(worker);
    }

    // Drain one queued task (if any) before settling the promise
    this._dequeueNext();

    // Resolve or reject promise
    if (error) {
      request.reject(new Error(error));
    } else {
      request.resolve(result);
    }
  }

  /**
   * Pick the next queued task and dispatch it to an available worker.
   */
  _dequeueNext() {
    if (this.taskQueue.length === 0 || this.availableWorkers.length === 0) {
      return;
    }

    const next   = this.taskQueue.shift();
    const worker = this.availableWorkers.pop();

    try {
      worker.postMessage({
        requestId: next.requestId,
        taskType:  next.taskType,
        data:      next.data
      });
    } catch (err) {
      // Worker died — return it to the graveyard and reject the request
      this._removeWorker(worker);
      const request = this.pendingRequests.get(next.requestId);
      if (request) {
        clearTimeout(request.timeoutId);
        this.pendingRequests.delete(next.requestId);
        request.reject(err);
      }
    }
  }

  /**
   * Get an available worker (or create one)
   */
  _getAvailableWorker() {
    // Reuse available worker
    if (this.availableWorkers.length > 0) {
      return this.availableWorkers.pop();
    }

    // Create new worker if under limit
    if (this.workers.length < this.maxWorkers) {
      const worker = this._createWorker();
      if (worker) {
        this.availableWorkers.pop(); // Remove it since we're using it
        return worker;
      }
    }

    // No workers available - wait for one (queue)
    return null;
  }

  /**
   * Execute work on a worker thread
   * 
   * @param {string} taskType - Type of task (e.g., 'rankVideos', 'extractFeatures')
   * @param {any} data - Data to pass to worker
   * @param {Object} options - { timeout, signal }
   * @returns {Promise<any>} Result from worker
   */
  async execute(taskType, data, options = {}) {
    const requestId = this.nextRequestId++;
    const timeout = options.timeout || this.defaultTimeout;
    const signal = options.signal; // AbortSignal for cancellation

    // Check if already aborted
    if (signal && signal.aborted) {
      throw new Error('Request was aborted');
    }

    return new Promise((resolve, reject) => {
      const request = {
        resolve,
        reject,
        timeoutId: null,
        aborted: false
      };

      this.pendingRequests.set(requestId, request);

      // Set up timeout
      request.timeoutId = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error(`Worker task timed out after ${timeout}ms`));
      }, timeout);

      // Set up abort signal listener
      if (signal) {
        const onAbort = () => {
          if (request.timeoutId) {
            clearTimeout(request.timeoutId);
          }
          this.pendingRequests.delete(requestId);
          request.aborted = true;
          reject(new Error('Request was cancelled'));
        };

        signal.addEventListener('abort', onAbort, { once: true });
      }

      // Get worker and send task
      const worker = this._getAvailableWorker();

      if (!worker) {
        // All workers busy — queue the task for later dispatch
        this.taskQueue.push({ requestId, taskType, data });
        return;
      }

      // Send task to worker
      try {
        worker.postMessage({
          requestId,
          taskType,
          data
        });
      } catch (error) {
        clearTimeout(request.timeoutId);
        this.pendingRequests.delete(requestId);
        this.availableWorkers.push(worker); // Return worker to pool
        reject(error);
      }
    });
  }

  /**
   * Cancel a specific request (if still pending)
   */
  cancelRequest(requestId) {
    const request = this.pendingRequests.get(requestId);
    if (request) {
      if (request.timeoutId) {
        clearTimeout(request.timeoutId);
      }
      this.pendingRequests.delete(requestId);
      request.reject(new Error('Request was cancelled'));
    }
  }

  /**
   * Cancel all pending requests
   */
  cancelAll() {
    for (const [requestId, request] of this.pendingRequests.entries()) {
      if (request.timeoutId) {
        clearTimeout(request.timeoutId);
      }
      request.reject(new Error('All requests cancelled'));
    }
    this.pendingRequests.clear();
  }

  /**
   * Remove worker from pool
   */
  _removeWorker(worker) {
    const index = this.workers.indexOf(worker);
    if (index !== -1) {
      this.workers.splice(index, 1);
    }

    const availIndex = this.availableWorkers.indexOf(worker);
    if (availIndex !== -1) {
      this.availableWorkers.splice(availIndex, 1);
    }
  }

  /**
   * Terminate a worker
   */
  _killWorker(worker) {
    this._removeWorker(worker);
    worker.terminate();
  }

  /**
   * Shutdown all workers
   */
  async shutdown() {
    this.cancelAll();
    
    const terminationPromises = this.workers.map(worker => worker.terminate());
    await Promise.all(terminationPromises);
    
    this.workers = [];
    this.availableWorkers = [];
  }

  /**
   * Get status for diagnostics
   */
  getStatus() {
    return {
      totalWorkers:     this.workers.length,
      availableWorkers: this.availableWorkers.length,
      busyWorkers:      this.workers.length - this.availableWorkers.length,
      pendingRequests:  this.pendingRequests.size,
      queuedTasks:      this.taskQueue.length,
      maxWorkers:       this.maxWorkers
    };
  }
}

module.exports = WorkerManager;
