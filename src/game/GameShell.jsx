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
  phyto: lazy(() => import('../renderer/phyto/PhytoLab.jsx')),
  microscope: lazy(() => import('../renderer/microscope/MicroscopeLab.jsx')),
  ferment: lazy(() => import('../renderer/ferment/FermentLab.jsx')),
  mechanism: lazy(() => import('../renderer/mechanism/MechanismLab.jsx')),
  ecosystem: lazy(() => import('../renderer/ecosystem/EcosystemLab.jsx')),
  skate: lazy(() => import('../renderer/skate/SkateLab.jsx')),
};
const LAB_TITLE = {
  utm: 'Universal Testing Machine', bridge: 'Bridge Design', dyno: 'Engine Dyno',
  crash: 'Crash & Load Test', tunnel: 'Wind Tunnel', circuit: 'Circuit Bench',
  boat: 'Hydro Tank', vacuum: 'Vacuum & Re-entry Chamber',
  extraction: 'Extraction Bench', phyto: 'Phytochemistry Lab', microscope: 'Microscope',
  ferment: 'Fermentation Bench', mechanism: 'Molecular Mechanism Bench',
  ecosystem: 'Ecosystem Engineering',
  skate: 'Skate Park',
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
  { lab: 'phyto', start: 'phyto:start', scene: 'PhytoLabScene' },
  { lab: 'microscope', start: 'cell:start', scene: 'MicroscopeScene' },
  { lab: 'ferment', start: 'ferment:start', scene: 'FermentBenchScene' },
  { lab: 'mechanism', start: 'mech:start', scene: 'MechanismScene' },
  { lab: 'ecosystem', start: 'eco:start', scene: 'EcosystemScene' },
  // NOTE: loadTest:start, ecology:start and biome:start deliberately have NO
  // React triggers — the truss designer flows into the Phaser LoadTestScene,
  // and the in-world Salt River / planting loops are the Phaser Ecology/Biome
  // scenes (beat-driven, notebook-integrated, acceptance-tested). Their React
  // twins stay reachable at /loadtest-lab, /ecology-lab and /biome-lab.
];
const SCENE_BY_LAB = Object.fromEntries(LAB_TRIGGERS.map((t) => [t.lab, t.scene]));
const START_BY_LAB = Object.fromEntries(LAB_TRIGGERS.map((t) => [t.lab, t.start]));
// Dual spine (arc.md): every engineering chapter rig cross-links to its chapter's
// biology pillar. The Phaser bench scenes carried this door, but they are hidden
// under the React labs — the door must live on the visible overlay or the whole
// biology spine is unreachable in normal play.
const BIO_DOOR = {
  circuit: { lab: 'extraction', label: '🌿 Extraction Bench →' },
  dyno: { lab: 'phyto', label: '🌿 Phytochemistry Lab →' },
  crash: { lab: 'microscope', label: '🧫 Microscope →' },
  boat: { lab: 'ferment', label: '🧪 Fermentation Bench →' },
  tunnel: { lab: 'mechanism', label: '🧬 Mechanism Bench →' },
  vacuum: { lab: 'ecosystem', label: '🌎 Ecosystem Engineering →' },
};

export default function GameShell() {
  const hostRef = useRef(null);
  const [lab, setLab] = useState(null);
  const [labDetail, setLabDetail] = useState(null);

  useEffect(() => {
    if (!hostRef.current) return undefined;

    const game = createGame(hostRef.current);
    window.__bikebrowserRebuildGame = game;
    const teardownFeedback = initFeedbackOverlay();
    const teardownAnnotation = initAnnotationOverlay();
    const teardownVoice = initVoiceFeedback();

    const open = (which, detail) => {
      if (!LAB_COMPONENTS[which]) return;
      setLab(which);
      setLabDetail(detail ?? null);
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
      const handler = (detail) => open(t.lab, detail);
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

  // Anti-trap guarantee: every lab overlay closes on Escape, exactly like the
  // Phaser modals it replaced — the player is never stuck in an apparatus.
  useEffect(() => {
    if (!lab) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // Record a tested material back into the game so objectives/discoveries advance.
  const handleMaterialTested = (id) => { try { window.__GAME__?.testMaterial?.(id); } catch { /* not ready */ } };
  // Record predictions into the runtime ledger too — the lab UI gates test-on-
  // predict, but "prediction precedes intervention" (arc.md) must also be TRUE in
  // the game state the acceptance suite reads, not just in local component state.
  const handleMaterialPredicted = (id, verdict) => {
    try { window.__GAME__?.predictMaterial?.(id, verdict === 'SUITABLE', 'medium', `UTM lab prediction: ${verdict}`); } catch { /* not ready */ }
  };

  // Walk through the dual-spine door: emit the biology bench's start trigger so
  // the normal open() path (including hiding the superseded Phaser stub) runs.
  const openBioDoor = () => {
    const door = BIO_DOOR[lab];
    if (!door) return;
    try {
      const game = window.__bikebrowserRebuildGame;
      if (game && START_BY_LAB[door.lab]) game.registry.events.emit(START_BY_LAB[door.lab]);
    } catch { /* game gone */ }
  };

  const LabComponent = lab ? LAB_COMPONENTS[lab] : null;

  return (
    <main className="bb-game-shell" data-testid="rebuild-game-shell">
      <div className="bb-game-frame" ref={hostRef} data-testid="rebuild-game-host" />

      {LabComponent && (
        <div className="bb-utm-overlay" role="dialog" aria-modal="true" aria-label={LAB_TITLE[lab]}>
          <button type="button" className="bb-utm-close" onClick={close}>✕ Close {LAB_TITLE[lab]}</button>
          {BIO_DOOR[lab] && (
            <button type="button" className="bb-utm-close bb-bio-door" data-testid="bio-door" onClick={openBioDoor}>
              {BIO_DOOR[lab].label}
            </button>
          )}
          <Suspense fallback={<div className="bb-utm-loading">Loading {LAB_TITLE[lab]}…</div>}>
            <LabComponent
              onMaterialTested={lab === 'utm' ? handleMaterialTested : undefined}
              onMaterialPredicted={lab === 'utm' ? handleMaterialPredicted : undefined}
            />
          </Suspense>
        </div>
      )}
    </main>
  );
}
