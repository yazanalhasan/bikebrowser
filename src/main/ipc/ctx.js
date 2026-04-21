// Shared mutable context for extracted IPC handler modules.
//
// main.js assigns these fields as services come online during startup.
// Handlers read fields at invocation time (after the app is ready), so the
// lazy-lookup matches the old closure-over-module-scope behavior.
module.exports = {
  searchPipeline: null,
  historyStore: null,
  imageIntentService: null,
  voiceIntentService: null,
  mainWindow: null,
  apiServer: null,
  apiConnectionInfo: null,
  fallbackHandler: null,
  withIpcCache: null,
  createVideoPlayerWindow: null,
};
