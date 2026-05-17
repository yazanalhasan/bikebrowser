import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  GODOT_SAVE_KEY,
  buildGodotMessage,
  validateGodotBridgeEvent,
} from '../godot/bridgeEvents';

const GODOT_EXPORT_URL = '/godot/BikeBrowserWorld/index.html';

function formatEvent(event) {
  if (!event) return '';
  const label = event.questId ? `${event.type} · ${event.questId}` : event.type;
  return `${new Date().toLocaleTimeString()} ${label}`;
}

export default function GodotPrototypePage() {
  const iframeRef = useRef(null);
  const [events, setEvents] = useState([]);
  const [invalidEvents, setInvalidEvents] = useState([]);
  const [iframeStatus, setIframeStatus] = useState('loading');

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
    <div data-testid="godot-prototype-page" className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 lg:flex-row">
        <section className="min-h-[70vh] flex-1 overflow-hidden rounded-lg border border-slate-700 bg-black shadow-2xl">
          <iframe
            ref={iframeRef}
            title="BikeBrowserWorld Godot Prototype"
            data-testid="godot-iframe"
            src={GODOT_EXPORT_URL}
            onLoad={handleFrameLoad}
            onError={handleFrameError}
            allow="autoplay; fullscreen; gamepad"
            className="h-[72vh] w-full border-0 bg-black"
          />
        </section>

        <aside className="w-full rounded-lg border border-slate-700 bg-slate-900 p-4 lg:w-96">
          <div className="border-b border-slate-700 pb-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">
              Godot Quest World Prototype
            </p>
            <h1 className="mt-1 text-2xl font-bold">BikeBrowserWorld</h1>
            <p className="mt-2 text-sm text-slate-300">
              Phaser fallback remains at /play. This route is isolated and uses {GODOT_SAVE_KEY}.
            </p>
          </div>

          <div className="mt-4 rounded-md bg-slate-800 p-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold text-slate-200">Export status</span>
              <span className="rounded-full bg-cyan-500/20 px-2 py-1 text-xs font-bold text-cyan-200">
                {iframeStatus}
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Expected export path: {GODOT_EXPORT_URL}
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-md bg-cyan-500 px-3 py-2 text-sm font-bold text-slate-950 hover:bg-cyan-300"
              onClick={() => postToGodot(buildGodotMessage('settings_update', { settings: { source: 'react-prototype' } }))}
            >
              Send Settings
            </button>
            <button
              type="button"
              className="rounded-md bg-amber-400 px-3 py-2 text-sm font-bold text-slate-950 hover:bg-amber-300"
              onClick={() => postToGodot(buildGodotMessage('reward_balance', { balance: 0 }))}
            >
              Send Balance
            </button>
          </div>

          <div className="mt-5">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-300">Bridge events</h2>
            <div
              data-testid="godot-event-log"
              className="mt-2 min-h-40 rounded-md border border-slate-700 bg-slate-950 p-3 font-mono text-xs text-slate-200"
            >
              {events.length === 0 ? (
                <p className="text-slate-500">No Godot events received yet.</p>
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
            <div className="mt-4 rounded-md border border-rose-500/50 bg-rose-950/50 p-3 text-xs text-rose-100">
              <p className="font-bold">Rejected bridge messages</p>
              {invalidEvents.map((entry) => (
                <p key={`${entry.receivedAt}-${entry.reason}`} className="mt-1">{entry.reason}</p>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
