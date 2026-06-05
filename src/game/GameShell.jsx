import { useEffect, useRef } from 'react';
import { createGame } from './phaser/createGame.js';
import { initFeedbackOverlay } from './feedback/feedbackOverlay.js';
import './game-shell.css';

export default function GameShell() {
  const hostRef = useRef(null);

  useEffect(() => {
    if (!hostRef.current) return undefined;

    const game = createGame(hostRef.current);
    window.__bikebrowserRebuildGame = game;
    // Primary human -> Executive Brain channel (F10 feedback overlay).
    const teardownFeedback = initFeedbackOverlay();

    return () => {
      teardownFeedback();
      delete window.__bikebrowserRebuildGame;
      game.destroy(true);
    };
  }, []);

  return (
    <main className="bb-game-shell" data-testid="rebuild-game-shell">
      <div className="bb-game-frame" ref={hostRef} data-testid="rebuild-game-host" />
    </main>
  );
}
