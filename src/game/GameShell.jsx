import { useEffect, useRef } from 'react';
import { createGame } from './phaser/createGame.js';
import { initFeedbackOverlay } from './feedback/feedbackOverlay.js';
import { initAnnotationOverlay } from './feedback/annotationOverlay.js';
import { initVoiceFeedback } from './feedback/voiceFeedback.js';
import './game-shell.css';

export default function GameShell() {
  const hostRef = useRef(null);

  useEffect(() => {
    if (!hostRef.current) return undefined;

    const game = createGame(hostRef.current);
    window.__bikebrowserRebuildGame = game;
    // Primary human -> Executive Brain channel: F10 feedback, Shift+F10 annotation, F9 voice.
    const teardownFeedback = initFeedbackOverlay();
    const teardownAnnotation = initAnnotationOverlay();
    const teardownVoice = initVoiceFeedback();

    return () => {
      teardownVoice();
      teardownAnnotation();
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
