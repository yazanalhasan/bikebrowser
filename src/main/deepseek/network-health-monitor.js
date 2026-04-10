class NetworkHealthMonitor {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 2;
    this.cooldownMs = options.cooldownMs || 60000;
    this.providerState = new Map();
  }

  ensureProvider(providerName) {
    if (!this.providerState.has(providerName)) {
      this.providerState.set(providerName, {
        failures: 0,
        successes: 0,
        lastFailureAt: 0,
        lastSuccessAt: 0,
        unhealthyUntil: 0,
        lastFailureReason: null,
        skipped: 0
      });
    }

    return this.providerState.get(providerName);
  }

  shouldUseFallback(providerName) {
    const state = this.ensureProvider(providerName);
    const unhealthy = state.unhealthyUntil > Date.now();
    if (unhealthy) {
      state.skipped += 1;
    }
    return unhealthy;
  }

  recordSuccess(providerName) {
    const state = this.ensureProvider(providerName);
    state.successes += 1;
    state.failures = 0;
    state.lastSuccessAt = Date.now();
    state.unhealthyUntil = 0;
    state.lastFailureReason = null;
  }

  recordFailure(providerName, reason = 'network_error') {
    const state = this.ensureProvider(providerName);
    state.failures += 1;
    state.lastFailureAt = Date.now();
    state.lastFailureReason = reason;
    if (state.failures >= this.failureThreshold) {
      state.unhealthyUntil = Date.now() + this.cooldownMs;
    }
  }

  getStatus() {
    const status = {};
    for (const [providerName, state] of this.providerState.entries()) {
      status[providerName] = {
        failures: state.failures,
        successes: state.successes,
        skipped: state.skipped,
        lastFailureReason: state.lastFailureReason,
        unhealthy: state.unhealthyUntil > Date.now(),
        unhealthyUntil: state.unhealthyUntil,
        lastFailureAt: state.lastFailureAt,
        lastSuccessAt: state.lastSuccessAt
      };
    }
    return status;
  }
}

module.exports = {
  NetworkHealthMonitor
};