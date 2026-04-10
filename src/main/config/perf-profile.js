// Performance profile tuned for:
//   Ryzen 7 5700 (8c/16t) · 32 GB RAM · RX 580 4 GB · NVMe · Node 20
//
// Goal: best responsiveness and smoothness, not maximum raw throughput.
// Rationale for each value is inline.

const perfProfile = {
  // ── Source fetching ────────────────────────────────────────────────────────
  // 4 concurrent HTTP fetches keeps the Node event loop responsive while
  // saturating the NVMe-backed DNS/TCP stack.  Going higher adds contention
  // without improving wall-clock time because most sources are I/O-bound.
  maxConcurrentSourceFetches: 4,

  // Stop fetching additional sources once we already have this many results
  // that passed pre-filtering.  Avoids wasting CPU on ranking 100+ items
  // when 40 is already more than the UI ever shows (24 capped).
  earlyResultCutoff: 40,

  // Per-source timeout (ms).  Keeps the fetch stage bounded even on slow APIs.
  sourceFetchTimeoutMs: 8000,

  // ── AI batch sizes ─────────────────────────────────────────────────────────
  // Cap the number of items sent to the AI evaluator per batch.
  // The RX 580's VRAM is not used for inference, but smaller batches keep
  // the main-thread event loop responsive by yielding between network calls.
  aiEvalBatchSize: 8,
  aiSafetyBatchSize: 12,

  // ── IPC response cache ─────────────────────────────────────────────────────
  // Small in-memory TTL cache.  Entries are capped by count so a burst of
  // diverse queries won't bloat the V8 heap.
  ipcCacheMaxEntries: 64,
  ipcCacheDefaultTtlMs: 30_000,   // 30 s
  // Payloads larger than this (bytes, after JSON.stringify) are never cached
  // in memory — the SQLite history store handles long-term persistence.
  ipcCacheMaxPayloadBytes: 128 * 1024, // 128 KB

  // ── Ranking / post-processing ──────────────────────────────────────────────
  // Trim oversized result sets before the expensive ranking pass.
  // With 16 threads the CPU can handle 60 items comfortably; beyond that,
  // the gains are negligible because the UI only shows 24.
  maxResultsBeforeRanking: 60,
  maxFinalResults: 24,

  // ── GPU flags (Electron) ──────────────────────────────────────────────────
  // AMD RX 580: D3D11 via ANGLE is reliable.  GPU rasterization is safe.
  // enable-zero-copy and enable-native-gpu-memory-buffers are unstable on
  // older GCN-class AMD GPUs and can cause white-flicker artefacts.
  gpu: {
    enableGpuRasterization: true,
    useAngle: 'd3d11',
    // Gate behind env flag so a user can opt-in on newer AMD GPUs.
    enableZeroCopy: process.env.BIKEBROWSER_GPU_ZEROCOPY === '1',
    enableNativeGpuMemoryBuffers: process.env.BIKEBROWSER_GPU_ZEROCOPY === '1',
  },
};

module.exports = { perfProfile };
