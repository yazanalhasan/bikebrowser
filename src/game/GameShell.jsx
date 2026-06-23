import { useEffect, useRef, useState, Suspense, lazy } from 'react';
import { createGame } from './phaser/createGame.js';
import { initFeedbackOverlay } from './feedback/feedbackOverlay.js';
import { initAnnotationOverlay } from './feedback/annotationOverlay.js';
import { initVoiceFeedback } from './feedback/voiceFeedback.js';
import './game-shell.css';

// The R3F Universal Testing Machine lab is heavy (three.js); load it on demand
// only when the player opens the in-game UTM.
const UTMLab = lazy(() => import('../renderer/utm/UTMLab.jsx'));

export default function GameShell() {
  const hostRef = useRef(null);
  const [utmOpen, setUtmOpen] = useState(false);

  useEffect(() => {
    if (!hostRef.current) return undefined;

    const game = createGame(hostRef.current);
    window.__bikebrowserRebuildGame = game;
    // Primary human -> Executive Brain channel: F10 feedback, Shift+F10 annotation, F9 voice.
    const teardownFeedback = initFeedbackOverlay();
    const teardownAnnotation = initAnnotationOverlay();
    const teardownVoice = initVoiceFeedback();

    // The in-game UTM (NeighborhoodScene) dispatches this to open the React lab.
    const openUtm = () => setUtmOpen(true);
    window.addEventListener('bikebrowser:open-utm', openUtm);

    return () => {
      window.removeEventListener('bikebrowser:open-utm', openUtm);
      teardownVoice();
      teardownAnnotation();
      teardownFeedback();
      delete window.__bikebrowserRebuildGame;
      game.destroy(true);
    };
  }, []);

  const closeUtm = () => {
    setUtmOpen(false);
    // unfreeze the player (NeighborhoodScene set modalActive when opening)
    try { window.__bikebrowserRebuildGame?.registry?.set('modalActive', false); } catch { /* game gone */ }
  };

  // Record a tested material back into the game so objectives/discoveries advance.
  const handleMaterialTested = (id) => {
    try { window.__GAME__?.testMaterial?.(id); } catch { /* runtime not ready */ }
  };

  return (
    <main className="bb-game-shell" data-testid="rebuild-game-shell">
      <div className="bb-game-frame" ref={hostRef} data-testid="rebuild-game-host" />

      {utmOpen && (
        <div className="bb-utm-overlay" role="dialog" aria-modal="true" aria-label="Universal Testing Machine">
          <button type="button" className="bb-utm-close" onClick={closeUtm}>✕ Close UTM</button>
          <Suspense fallback={<div className="bb-utm-loading">Loading Universal Testing Machine…</div>}>
            <UTMLab onMaterialTested={handleMaterialTested} />
          </Suspense>
        </div>
      )}
    </main>
  );
}
