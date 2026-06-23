import { useEffect, useRef, useState, Suspense, lazy } from 'react';
import { createGame } from './phaser/createGame.js';
import { initFeedbackOverlay } from './feedback/feedbackOverlay.js';
import { initAnnotationOverlay } from './feedback/annotationOverlay.js';
import { initVoiceFeedback } from './feedback/voiceFeedback.js';
import './game-shell.css';

// The R3F apparatus labs are heavy (three.js); each loads on demand only when the
// player opens that apparatus in-game.
const LAB_COMPONENTS = {
  utm: lazy(() => import('../renderer/utm/UTMLab.jsx')),
  bridge: lazy(() => import('../renderer/bridge/BridgeDesignLab.jsx')),
  dyno: lazy(() => import('../renderer/dyno/EngineDynoLab.jsx')),
  crash: lazy(() => import('../renderer/crash/CrashTestLab.jsx')),
  tunnel: lazy(() => import('../renderer/tunnel/WindTunnelLab.jsx')),
  circuit: lazy(() => import('../renderer/circuit/CircuitBenchLab.jsx')),
  boat: lazy(() => import('../renderer/boat/BoatTankLab.jsx')),
  vacuum: lazy(() => import('../renderer/vacuum/VacuumChamberLab.jsx')),
  extraction: lazy(() => import('../renderer/extraction/ExtractionLab.jsx')),
};
const LAB_TITLE = {
  utm: 'Universal Testing Machine', bridge: 'Bridge Design', dyno: 'Engine Dyno',
  crash: 'Crash & Load Test', tunnel: 'Wind Tunnel', circuit: 'Circuit Bench',
  boat: 'Hydro Tank', vacuum: 'Vacuum & Re-entry Chamber',
  extraction: 'Extraction Bench',
};
// The chapter bench labs replace a Phaser bench scene, triggered by its registry
// start event. We open the React lab and hide the Phaser stub it supersedes.
// (UTM + bridge are opened directly from NeighborhoodScene via window events.)
const LAB_TRIGGERS = [
  { lab: 'dyno', start: 'engine:start', scene: 'EngineDynoScene' },
  { lab: 'crash', start: 'crash:start', scene: 'CrashTestScene' },
  { lab: 'tunnel', start: 'plane:start', scene: 'PlaneTunnelScene' },
  { lab: 'circuit', start: 'circuit:start', scene: 'CircuitBenchScene' },
  { lab: 'boat', start: 'boat:start', scene: 'BoatTankScene' },
  { lab: 'vacuum', start: 'space:start', scene: 'VacuumChamberScene' },
  { lab: 'extraction', start: 'extraction:start', scene: 'ExtractionBenchScene' },
];
const SCENE_BY_LAB = Object.fromEntries(LAB_TRIGGERS.map((t) => [t.lab, t.scene]));

export default function GameShell() {
  const hostRef = useRef(null);
  const [lab, setLab] = useState(null);

  useEffect(() => {
    if (!hostRef.current) return undefined;

    const game = createGame(hostRef.current);
    window.__bikebrowserRebuildGame = game;
    const teardownFeedback = initFeedbackOverlay();
    const teardownAnnotation = initAnnotationOverlay();
    const teardownVoice = initVoiceFeedback();

    const open = (which) => {
      if (!LAB_COMPONENTS[which]) return;
      setLab(which);
      // Hide the superseded Phaser stub (after its own start handler runs) and
      // freeze the overworld player while the lab is open.
      requestAnimationFrame(() => {
        try { game.scene.getScene(SCENE_BY_LAB[which])?.hide?.(); game.registry.set('modalActive', true); } catch { /* noop */ }
      });
    };

    const onOpenUtm = () => open('utm');
    const onOpenLab = (e) => open(e.detail?.lab);
    window.addEventListener('bikebrowser:open-utm', onOpenUtm);
    window.addEventListener('bikebrowser:open-lab', onOpenLab);

    const offs = LAB_TRIGGERS.map((t) => {
      const handler = () => open(t.lab);
      game.registry.events.on(t.start, handler);
      return () => game.registry.events.off(t.start, handler);
    });

    return () => {
      window.removeEventListener('bikebrowser:open-utm', onOpenUtm);
      window.removeEventListener('bikebrowser:open-lab', onOpenLab);
      offs.forEach((off) => off());
      teardownVoice(); teardownAnnotation(); teardownFeedback();
      delete window.__bikebrowserRebuildGame;
      game.destroy(true);
    };
  }, []);

  const close = () => {
    const which = lab;
    setLab(null);
    try {
      const game = window.__bikebrowserRebuildGame;
      game?.registry?.set('modalActive', false);
      if (which && SCENE_BY_LAB[which]) game?.scene?.getScene(SCENE_BY_LAB[which])?.hide?.();
    } catch { /* game gone */ }
  };

  // Record a tested material back into the game so objectives/discoveries advance.
  const handleMaterialTested = (id) => { try { window.__GAME__?.testMaterial?.(id); } catch { /* not ready */ } };

  const LabComponent = lab ? LAB_COMPONENTS[lab] : null;

  return (
    <main className="bb-game-shell" data-testid="rebuild-game-shell">
      <div className="bb-game-frame" ref={hostRef} data-testid="rebuild-game-host" />

      {LabComponent && (
        <div className="bb-utm-overlay" role="dialog" aria-modal="true" aria-label={LAB_TITLE[lab]}>
          <button type="button" className="bb-utm-close" onClick={close}>✕ Close {LAB_TITLE[lab]}</button>
          <Suspense fallback={<div className="bb-utm-loading">Loading {LAB_TITLE[lab]}…</div>}>
            <LabComponent onMaterialTested={lab === 'utm' ? handleMaterialTested : undefined} />
          </Suspense>
        </div>
      )}
    </main>
  );
}
