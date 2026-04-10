class JobQueue {
  constructor(processor, options = {}) {
    this.processor = processor;
    this.concurrency = options.concurrency || 2;
    this.active = 0;
    this.queue = [];
    this.jobs = new Map();
  }

  enqueue(payload) {
    const id = `job-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const job = {
      id,
      status: 'queued',
      payload,
      result: null,
      error: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.jobs.set(id, job);
    this.queue.push(job);
    this.drain();
    return job;
  }

  get(id) {
    return this.jobs.get(id) || null;
  }

  async drain() {
    while (this.active < this.concurrency && this.queue.length > 0) {
      const next = this.queue.shift();
      this.active += 1;
      next.status = 'running';
      next.updatedAt = Date.now();

      Promise.resolve()
        .then(() => this.processor(next.payload))
        .then((result) => {
          next.status = 'completed';
          next.result = result;
          next.updatedAt = Date.now();
        })
        .catch((error) => {
          next.status = 'failed';
          next.error = error.message;
          next.updatedAt = Date.now();
        })
        .finally(() => {
          this.active -= 1;
          this.cleanupOldJobs();
          this.drain();
        });
    }
  }

  cleanupOldJobs(maxAgeMs = 10 * 60 * 1000) {
    const now = Date.now();
    for (const [id, job] of this.jobs.entries()) {
      if ((job.status === 'completed' || job.status === 'failed') && now - job.updatedAt > maxAgeMs) {
        this.jobs.delete(id);
      }
    }
  }
}

module.exports = {
  JobQueue,
};
