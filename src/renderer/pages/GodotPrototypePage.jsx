import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  GODOT_SAVE_KEY,
  buildGodotMessage,
  validateGodotBridgeEvent,
} from '../godot/bridgeEvents';

const GODOT_EXPORT_URL = '/godot/BikeBrowserWorld/index.html';

function diagnosticsRequested() {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return (
    params.get('diagnostics') === '1' ||
    params.get('dev') === '1' ||
    window.localStorage?.getItem('bikebrowser_godot_diagnostics') === '1'
  );
}

function formatEvent(event) {
  if (!event) return '';
  const label = event.questId ? `${event.type} / ${event.questId}` : event.type;
  return `${new Date().toLocaleTimeString()} ${label}`;
}

export default function GodotPrototypePage() {
  const iframeRef = useRef(null);
  const [events, setEvents] = useState([]);
  const [invalidEvents, setInvalidEvents] = useState([]);
  const [iframeStatus, setIframeStatus] = useState('loading');
  const [showDiagnostics, setShowDiagnostics] = useState(diagnosticsRequested);

  const hydrateMessage = useMemo(() => buildGodotMessage('hydrate_save', {
    saveKey: GODOT_SAVE_KEY,
    save: {
      schemaVersion: 1,
      currentRegion: 'neighborhood_street',
      activeQuestIds: [],
    },
  }), []);

  const postToGodot = useCallback((message) => {
    const target = iframeRef.current?.contentWindow;
    if (!target) return;
    target.postMessage(message, window.location.origin);
  }, []);

  useEffect(() => {
    const handleMessage = (messageEvent) => {
      if (messageEvent.origin !== window.location.origin) {
        return;
      }

      const result = validateGodotBridgeEvent(messageEvent.data);
      if (!result.ok) {
        setInvalidEvents((current) => [
          { reason: result.reason, receivedAt: new Date().toISOString() },
          ...current,
        ].slice(0, 8));
        return;
      }

      setEvents((current) => [result.event, ...current].slice(0, 12));

      if (result.event.type === 'save_requested') {
        postToGodot(buildGodotMessage('hydrate_save', {
          saveKey: GODOT_SAVE_KEY,
          save: result.event.save || {},
        }));
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [postToGodot]);

  const handleFrameLoad = () => {
    setIframeStatus('loaded');
    postToGodot(hydrateMessage);
  };

  const handleFrameError = () => {
    setIframeStatus('missing-export');
  };

  return (
    <div
      data-testid="godot-prototype-page"
      className="relative h-full min-h-screen w-full overflow-hidden bg-black text-white"
    >
      <iframe
        ref={iframeRef}
        title="BikeBrowserWorld"
        data-testid="godot-iframe"
        src={GODOT_EXPORT_URL}
        onLoad={handleFrameLoad}
        onError={handleFrameError}
        allow="autoplay; fullscreen; gamepad"
        className="absolute inset-0 h-full w-full border-0 bg-black"
      />

      {iframeStatus === 'missing-export' && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-stone-950 px-6 text-center">
          <div>
            <h1 className="text-2xl font-semibold">BikeBrowserWorld export is unavailable.</h1>
            <p className="mt-3 text-sm text-stone-300">
              Rebuild the Godot web export, then return to play.
            </p>
          </div>
        </div>
      )}

      {showDiagnostics ? (
        <aside
          data-testid="godot-diagnostics"
          className="absolute right-3 top-3 z-20 max-h-[calc(100vh-1.5rem)] w-96 overflow-y-auto rounded-md border border-stone-700 bg-stone-950/90 p-4 text-sm shadow-2xl backdrop-blur"
        >
          <div className="flex items-start justify-between gap-3 border-b border-stone-700 pb-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-200">
                Godot Diagnostics
              </p>
              <h1 className="mt-1 text-lg font-bold">BikeBrowserWorld</h1>
              <p className="mt-1 text-xs text-stone-400">
                Legacy Phaser remains available at /legacy-play.
              </p>
            </div>
            <button
              type="button"
              className="rounded bg-stone-800 px-2 py-1 text-xs font-semibold text-stone-200 hover:bg-stone-700"
              onClick={() => setShowDiagnostics(false)}
            >
              Hide
            </button>
          </div>

          <div className="mt-4 rounded bg-stone-900 p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold text-stone-200">Export status</span>
              <span className="rounded-full bg-amber-400/20 px-2 py-1 text-xs font-bold text-amber-100">
                {iframeStatus}
              </span>
            </div>
            <p className="mt-2 text-xs text-stone-500">{GODOT_EXPORT_URL}</p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded bg-stone-200 px-3 py-2 text-xs font-bold text-stone-950 hover:bg-white"
              onClick={() => postToGodot(buildGodotMessage('settings_update', { settings: { source: 'react-diagnostics' } }))}
            >
              Send Settings
            </button>
            <button
              type="button"
              className="rounded bg-amber-300 px-3 py-2 text-xs font-bold text-stone-950 hover:bg-amber-200"
              onClick={() => postToGodot(buildGodotMessage('reward_balance', { balance: 0 }))}
            >
              Send Balance
            </button>
          </div>

          <div className="mt-5">
            <h2 className="text-xs font-bold uppercase tracking-wide text-stone-300">Bridge events</h2>
            <div
              data-testid="godot-event-log"
              className="mt-2 min-h-36 rounded border border-stone-700 bg-black p-3 font-mono text-xs text-stone-200"
            >
              {events.length === 0 ? (
                <p className="text-stone-500">No Godot events received yet.</p>
              ) : events.map((event) => (
                <pre key={`${event.type}-${event.timestamp}-${event.idempotencyKey || ''}`} className="mb-3 whitespace-pre-wrap">
                  {formatEvent(event)}
                  {'\n'}
                  {JSON.stringify(event, null, 2)}
                </pre>
              ))}
            </div>
          </div>

          {invalidEvents.length > 0 && (
            <div className="mt-4 rounded border border-rose-500/50 bg-rose-950/60 p-3 text-xs text-rose-100">
              <p className="font-bold">Rejected bridge messages</p>
              {invalidEvents.map((entry) => (
                <p key={`${entry.receivedAt}-${entry.reason}`} className="mt-1">{entry.reason}</p>
              ))}
            </div>
          )}
        </aside>
      ) : null}
    </div>
  );
}
