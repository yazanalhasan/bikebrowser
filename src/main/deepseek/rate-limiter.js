class RateLimiter {
  constructor(config) {
    this.config = config;
    this.requestQueue = [];
    this.activeRequests = 0;
    this.requestTimestamps = [];

    if (config.enabled) {
      this.cleanupTimer = setInterval(() => this.cleanTimestamps(), 60 * 1000);
      if (typeof this.cleanupTimer.unref === 'function') {
        this.cleanupTimer.unref();
      }
    }
  }

  async waitForSlot() {
    if (!this.config.enabled) {
      return () => {};
    }

    return new Promise((resolve) => {
      this.requestQueue.push(resolve);
      this.processQueue();
    });
  }

  processQueue() {
    if (this.requestQueue.length === 0) {
      return;
    }

    const now = Date.now();
    const recentRequests = this.requestTimestamps.filter((timestamp) => now - timestamp < 60 * 1000);
    this.requestTimestamps = recentRequests;

    if (recentRequests.length >= this.config.requestsPerMinute) {
      const waitTime = Math.max(0, (60 * 1000) - (now - recentRequests[0]));
      setTimeout(() => this.processQueue(), waitTime);
      return;
    }

    if (this.activeRequests >= this.config.maxConcurrent) {
      return;
    }

    const resolve = this.requestQueue.shift();
    this.activeRequests += 1;
    this.requestTimestamps.push(now);

    resolve(() => {
      this.activeRequests = Math.max(0, this.activeRequests - 1);
      this.processQueue();
    });

    this.processQueue();
  }

  cleanTimestamps() {
    const now = Date.now();
    this.requestTimestamps = this.requestTimestamps.filter((timestamp) => now - timestamp < 60 * 1000);
  }
}

module.exports = {
  RateLimiter
};