/**
 * GameContainer.jsx — React wrapper around the Phaser game.
 *
 * Responsibilities:
 *   1. Show a start screen (Continue / New Game / Start Adventure).
 *   2. Mount / unmount the Phaser.Game instance in a DOM ref.
 *   3. Feed saved game state into Phaser's registry on boot.
 *   4. Render the React HUD overlay (quest tracker, inventory, notebook, pause).
 *   5. Render the dialog overlay for quest step interactions.
 *   6. Provide mobile virtual joystick controls.
 *   7. Handle pause/resume on visibility change (tab switch, phone lock screen).
 *   8. Prevent page scroll while the game is active.
 *   9. Support New Game from pause menu with confirmation + clean Phaser reboot.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Phaser from 'phaser';
import { createGameConfig } from './config.js';
import { loadGame, saveGame, resetGame, hasSave } from './systems/saveSystem.js';
import { getQuestSummary, getInventoryDisplay, getJournalEntries } from './ui/gameHud.js';
import useGameAudio from './audio/useGameAudio.js';
import { useLearningStore } from '../learning/learningStore.js';
import { getQuestBoard, getNewlyUnlocked } from './data/questBoard.js';
import { getShopItems } from './data/shop.js';
import { addItem, removeItem, hasItem } from './systems/inventorySystem.js';
import { processEvent as processKnowledgeEvent } from './systems/knowledgeSystem.js';
import { checkMilestones, applyRewards, getAvailableMilestones, getCompletedMilestones, getProgressionSummary } from './systems/milestoneEngine.js';
import { CATEGORY_ICONS, PHASE_NAMES } from './data/milestones.js';
import { canCraft, craft, getAllRecipes } from './systems/craftingSystem.js';
import ITEMS from './data/items.js';
import MaterialLogEntry from './components/MaterialLogEntry.jsx';
import {
  autoSpeak, speak, replay as replaySpeech, cancelSpeech, resetLastSpoken,
  isSpeechAvailable, isSpeechEnabled, setSpeechEnabled,
  setAutoSpeak, isAutoSpeakEnabled,
} from './services/npcSpeech.js';
import { clearDialogueCache } from './services/npcAiClient.js';
import { setBusy, recordQuestionDismissed } from './systems/gameplayArbiter.js';
import { runRuntimeAudit } from './systems/runtimeAudit.js';
import { initDiscoveryQuestBridge } from './systems/questSystem.js';
import { triggerQuestRevealsForState } from './systems/discoveryBridge.js';

// ---------------------------------------------------------------------------
// Mobile detection helper
// ---------------------------------------------------------------------------
function isTouchDevice() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

// ---------------------------------------------------------------------------
// Speaker display name → npcId resolver
// ---------------------------------------------------------------------------
// Converts a dialog `speaker` display name (e.g. "Mrs. Ramirez",
// "Old Miner Pete") into the snake_case key shape used by
// CHARACTER_GENDER in services/npcSpeech.js (e.g. "mrs_ramirez",
// "old_miner_pete"). Honorifics are stripped first because the
// gender-map keys are constructed without them (e.g. "desert_guide",
// not "ranger_nita"). Misses fall through to the upstream 'default'
// voice — this resolver only needs to give gender lookup a fighting
// chance when `dialog.npcId` is absent.
function resolveSpeakerToNpcId(speaker) {
  if (!speaker || typeof speaker !== 'string') return undefined;
  const HONORIFIC_RE = /^(ranger)\.?\s+/i;
  let s = speaker.trim();
  while (HONORIFIC_RE.test(s)) {
    s = s.replace(HONORIFIC_RE, '');
  }
  return s
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function GameContainer() {
  const containerRef = useRef(null);
  const gameRef = useRef(null);
  const [containerReady, setContainerReady] = useState(false);
  const prevCompletedRef = useRef(new Set());
  const navigate = useNavigate();
  const recordQuestComplete = useLearningStore((s) => s.recordQuestComplete);

  const { audio, isUnlocked, unlock, settings: audioSettings, setSetting: setAudioSetting } = useGameAudio();
  const [showAudioSettings, setShowAudioSettings] = useState(false);

  // ---------- Start screen state ----------
  // 'menu' = show start screen, 'playing' = Phaser running
  const [phase, setPhase] = useState('menu');
  const [saveExists] = useState(() => hasSave());
  // Counter to force Phaser re-mount after a new-game reset from pause menu
  const [bootKey, setBootKey] = useState(0);

  // ---------- Confirmation dialog ----------
  const [confirmNewGame, setConfirmNewGame] = useState(false);

  // HUD state
  const [questInfo, setQuestInfo] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [journal, setJournal] = useState([]);
  const [zuzubucks, setZuzubucks] = useState(0);
  const [showQuestBoard, setShowQuestBoard] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [gameState, setGameState] = useState(null);
  const [paused, setPaused] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [showNotebook, setShowNotebook] = useState(false);

  // Dialog state (quest step overlay)
  const [dialog, setDialog] = useState(null);

  // AI notification toasts
  const [aiToasts, setAiToasts] = useState([]);

  // Crafting panel
  const [showCrafting, setShowCrafting] = useState(false);
  const [craftResult, setCraftResult] = useState(null); // { success, message, itemName }

  // Physics education
  const [physicsHUD, setPhysicsHUD] = useState(null);
  const [showPhysicsHUD, setShowPhysicsHUD] = useState(false);
  const [physicsQuestion, setPhysicsQuestion] = useState(null);

  // Milestones panel
  const [showMilestones, setShowMilestones] = useState(false);

  // AI Assistant panel
  const [showAssistant, setShowAssistant] = useState(false);
  const [assistantMessages, setAssistantMessages] = useState([]);
  const [assistantStatus, setAssistantStatus] = useState('idle'); // 'idle' | 'analyzing' | 'warning'

  // Touch controls
  const [showTouch, setShowTouch] = useState(false);

  // ------------------------------------------------------------------
  // HUD refresh
  // ------------------------------------------------------------------
  const refreshHud = useCallback((state) => {
    setQuestInfo(getQuestSummary(state));
    setInventory(getInventoryDisplay(state?.inventory));
    setJournal(getJournalEntries(state));
    setZuzubucks(state?.zuzubucks || 0);
    setGameState(state);
  }, []);

  // ------------------------------------------------------------------
  // Start screen actions
  // ------------------------------------------------------------------
  const handleContinue = useCallback(() => {
    setPhase('playing');
  }, []);

  const handleNewGameFromMenu = useCallback(() => {
    if (saveExists) {
      setConfirmNewGame(true);
    } else {
      // No save — just start fresh
      resetGame();
      setPhase('playing');
    }
  }, [saveExists]);

  const handleStartAdventure = useCallback(() => {
    // No save exists — start fresh
    setPhase('playing');
  }, []);

  const confirmAndStartNewGame = useCallback(() => {
    // Wipe game save (NOT learning progress)
    resetGame();
    clearDialogueCache();
    cancelSpeech();
    setConfirmNewGame(false);

    // If Phaser is already running (pause menu path), destroy and reboot
    if (gameRef.current) {
      gameRef.current.destroy(true);
      gameRef.current = null;
    }

    // Reset all React overlay state
    setQuestInfo(null);
    setInventory([]);
    setJournal([]);
    setZuzubucks(0);
    setGameState(null);
    setPaused(false);
    setShowInventory(false);
    setShowNotebook(false);
    setShowQuestBoard(false);
    setShowShop(false);
    setShowAudioSettings(false);
    setDialog(null);
    prevCompletedRef.current = new Set();

    // Force Phaser re-mount via key bump
    setBootKey((k) => k + 1);
    setPhase('playing');
  }, []);

  const cancelNewGame = useCallback(() => {
    setConfirmNewGame(false);
  }, []);

  // Reset the gate when bootKey changes (e.g., Reset Game) so the new
  // Phaser instance also waits for valid container dimensions.
  useEffect(() => {
    setContainerReady(false);
  }, [bootKey]);

  // ------------------------------------------------------------------
  // Gate: wait for the container to have real dimensions before
  // booting Phaser. On cold start, AppLayout's 100dvh height +
  // Suspense lazy-load mean clientWidth/Height return 0 right after
  // mount. If we boot Phaser at 0×0, every scene's create() reads
  // those zero dimensions from this.cameras.main and bakes them into
  // node positions, parchment rectangles, etc. Even after the canvas
  // later resizes (via the ResizeObserver below), the scene content
  // stays clustered in the top-left because positions are already
  // locked in. Solution: don't boot until the layout has settled.
  // ------------------------------------------------------------------
  useEffect(() => {
    if (phase !== 'playing') return;
    if (!containerRef.current) return;
    if (containerReady) return;

    const el = containerRef.current;

    const check = () => {
      if (el.clientWidth > 0 && el.clientHeight > 0) {
        setContainerReady(true);
        return true;
      }
      return false;
    };

    if (check()) return;

    const observer = new ResizeObserver(() => {
      if (check()) {
        observer.disconnect();
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [phase, containerReady]);

  // ------------------------------------------------------------------
  // Boot Phaser (only when phase === 'playing')
  // ------------------------------------------------------------------
  useEffect(() => {
    if (phase !== 'playing') return;
    if (!containerReady) return;       // NEW: don't boot at 0×0
    if (!containerRef.current) return;

    // Guard: prevent Vite HMR from creating duplicate Phaser instances
    if (gameRef.current) return;

    const el = containerRef.current;

    // Initial measurement — may be 0×0 on cold start when AppLayout's
    // 100dvh height hasn't resolved yet (lazy-loaded via Suspense). The
    // ResizeObserver below catches that case by calling scale.refresh()
    // as soon as the layout settles, AND on any subsequent parent resize
    // (window chrome changes, devtools open/close, etc.). Phaser's
    // Scale.RESIZE mode only tracks `window` resize events natively — it
    // does NOT observe parent-element size changes.
    const width = el.clientWidth || window.innerWidth;
    const height = el.clientHeight || window.innerHeight;

    const savedState = loadGame();
    const startScene = savedState.player?.scene || 'ZuzuGarageScene';

    const config = createGameConfig(el, width, height, startScene);
    const game = new Phaser.Game(config);
    gameRef.current = game;

    // Dev-only: console buffer for AI-agent runtime visibility. Dynamic
    // import keeps the module out of production bundles via Vite tree-
    // shaking. See src/renderer/devtools/README.md for usage.
    if (import.meta.env.DEV) {
      import('../devtools/consoleBuffer.js').then(({ initConsoleBuffer }) => {
        initConsoleBuffer();
      });
    }

    // Dev-only: expose the running Phaser game on window so DevTools and
    // the (planned) phaser-hmr-bridge can reach it. Phaser scenes are
    // stateful and don't HMR cleanly via Vite — to manually re-load a
    // scene after editing its file, run in DevTools console:
    //   __phaserGame.scene.remove('WorldMapScene');
    //   __phaserGame.scene.add('WorldMapScene', WorldMapScene, true);
    // (the second arg is the imported class — refresh the page first if
    // your console doesn't already have it in scope).
    if (import.meta.env.DEV) {
      window.__phaserGame = game;
      runRuntimeAudit();
    }

    // Wire discovery → quest unlocks (gameplay, not DEV-only). Listener
    // queues quest IDs when regions are discovered; scenes consume the queue
    // at natural checkpoints via consumePendingDiscoveryUnlocks(state).
    initDiscoveryQuestBridge();

    // Reverse discovery bridge — re-fire location reveals for the active
    // quest at load time so that a save mid-quest (e.g. bridge_collapse
    // step 6) doesn't soft-lock behind fog-of-war. The reveals are queued
    // until WorldMapScene mounts, then drained via _drainPendingReveals().
    if (savedState && savedState.activeQuest && savedState.activeQuest.id) {
      triggerQuestRevealsForState(savedState);
    }

    // Track parent-element resizes so Phaser re-fits the canvas whenever
    // layout shifts (cold-start race, window resize, devtools toggle).
    const resizeObserver = new ResizeObserver(() => {
      if (gameRef.current) {
        gameRef.current.scale.refresh();
      }
    });
    resizeObserver.observe(el);

    // Seed registry with saved state
    game.registry.set('gameState', savedState);
    prevCompletedRef.current = new Set(savedState.completedQuests || []);

    // Inject audio manager into registry so scenes can use it
    game.registry.set('audioManager', null); // set after unlock

    // Refresh HUD once the game is ready
    game.events.once('ready', () => {
      refreshHud(savedState);
    });

    // Listen for registry changes to keep HUD in sync
    game.registry.events.on('changedata-gameState', (_parent, value) => {
      refreshHud(value);

      // Detect newly completed quests → update learning + knowledge + quest tree
      const completed = new Set(value?.completedQuests || []);
      for (const questId of completed) {
        if (!prevCompletedRef.current.has(questId)) {
          recordQuestComplete(questId);

          // Unlock knowledge concepts
          const gameState = game.registry.get('gameState');
          if (gameState?.knowledge) {
            const { knowledge: updatedKnowledge, newUnlocks } = processKnowledgeEvent(
              gameState.knowledge, 'quest', questId
            );
            if (newUnlocks.length > 0) {
              const updated = { ...gameState, knowledge: updatedKnowledge };
              game.registry.set('gameState', updated);
              saveGame(updated);
            }
          }

          // Emit QUEST_COMPLETED to MCP for AI + quest tree unlocking
          const mcp = game.registry.get('mcp');
          if (mcp) {
            mcp.emit('QUEST_COMPLETED', { questId });
          }

          // ── Milestone Engine: check if any milestones are now complete ──
          // Loop to handle cascading (milestone A completes → enables milestone B)
          {
            let msState = game.registry.get('gameState');
            const allCompleted = [];
            const allRewards = [];
            for (let pass = 0; pass < 10; pass++) { // cap at 10 to prevent runaway
              const { milestoneState, newlyCompleted, rewards } = checkMilestones(msState);
              if (newlyCompleted.length === 0) break;
              allCompleted.push(...newlyCompleted);
              allRewards.push(...rewards);
              msState = applyRewards(msState, rewards);
              msState = { ...msState, milestones: milestoneState };
            }
            if (allCompleted.length > 0) {
              game.registry.set('gameState', msState);
              saveGame(msState);

              const msNames = allCompleted.map((m) => m.name).join(', ');
              game.registry.set('mcpAlert', {
                id: `milestone_${Date.now()}`,
                message: `Milestone complete: ${msNames}`,
                severity: 'success',
              });

              if (mcp) {
                for (const m of allCompleted) {
                  mcp.emit('MILESTONE_COMPLETED', { milestoneId: m.id, phase: m.phase, category: m.category });
                }
              }
            }
          }

          // Show unlock notifications for newly available quests
          const newlyUnlocked = getNewlyUnlocked(questId, value);
          if (newlyUnlocked.length > 0) {
            const unlockMsg = newlyUnlocked.map((q) => `${q.icon} ${q.title}`).join(', ');
            // Push via registry to show as toast + assistant message
            game.registry.set('mcpAlert', {
              id: `quest_unlock_${questId}`,
              message: `Quests unlocked: ${unlockMsg}`,
              severity: 'info',
            });
          }
        }
      }
      prevCompletedRef.current = completed;
    });

    // Listen for dialog events from scenes
    game.registry.events.on('changedata-dialogEvent', (_parent, value) => {
      setDialog(value);
    });

    // Listen for MCP AI alerts → surface as toast + assistant panel
    game.registry.events.on('changedata-mcpAlert', (_parent, value) => {
      if (!value) return;

      // Toast notification (ephemeral)
      setAiToasts((prev) => {
        if (prev.some((t) => t.id === value.id)) return prev;
        const next = [...prev, { ...value, shownAt: Date.now() }];
        return next.slice(-3);
      });

      // Assistant panel message (persistent feed)
      setAssistantMessages((prev) => {
        if (prev.some((m) => m.id === value.id && Date.now() - m.timestamp < 10000)) return prev;
        const msg = {
          id: value.id,
          type: value.id.startsWith('ai_') ? value.id.replace('ai_', '') : 'system',
          priority: value.severity === 'critical' ? 'high' : value.severity === 'warning' ? 'medium' : 'low',
          title: getAlertTitle(value.id),
          message: value.message,
          details: null,
          timestamp: Date.now(),
        };
        return [...prev, msg].slice(-15); // keep last 15
      });

      // Flash status indicator
      setAssistantStatus(value.severity === 'critical' ? 'warning' : 'analyzing');
      setTimeout(() => setAssistantStatus('idle'), 3000);
    });

    // Listen for physics education data
    game.registry.events.on('changedata-physicsHUD', (_p, v) => setPhysicsHUD(v));
    game.registry.events.on('changedata-physicsQuestion', (_p, v) => {
      if (v) {
        setPhysicsQuestion(v);
        // Auto-speak the question text plus each answer choice so kids who
        // can't read fluently can still pick an answer.  Web Speech inserts
        // a brief pause on each period; the "Option N:" prefix anchors the
        // choice number to the visual button order.
        if (isSpeechEnabled()) {
          const stem = (v.question || '').trim();
          const choices = Array.isArray(v.choices) ? v.choices : [];
          const choicesText = choices
            .map((choice, i) => `Option ${i + 1}: ${choice}`)
            .join('. ');
          const fullText = choicesText ? `${stem} ${choicesText}.` : stem;
          speak(fullText, { rate: 0.85, pitch: 1.0 });
        }
      } else {
        // Question was auto-dismissed by arbiter (player moved or became busy)
        setPhysicsQuestion(null);
        recordQuestionDismissed();
        cancelSpeech();
      }
    });

    // Detect touch device
    setShowTouch(isTouchDevice());

    // If audio is already unlocked, inject it
    if (isUnlocked && audio) {
      game.registry.set('audioManager', audio);
    }

    // Cleanup on unmount
    return () => {
      resizeObserver.disconnect();
      game.destroy(true);
      gameRef.current = null;
      if (import.meta.env.DEV && window.__phaserGame === game) {
        delete window.__phaserGame;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, bootKey, containerReady]);

  // ------------------------------------------------------------------
  // Re-inject AudioManager into Phaser registry when unlock state changes
  // (covers HMR hot-swap: useGameAudio resets isUnlocked→false then the
  // overlay tap sets it true again, but the Phaser init effect won't rerun
  // because [phase, bootKey, containerReady] didn't change).
  // ------------------------------------------------------------------
  useEffect(() => {
    if (isUnlocked && audio && gameRef.current) {
      gameRef.current.registry.set('audioManager', audio);
    }
  }, [isUnlocked, audio]);

  // ------------------------------------------------------------------
  // Pause / resume on visibility change
  // ------------------------------------------------------------------
  useEffect(() => {
    const onVisChange = () => {
      if (document.hidden) {
        setPaused(true);
        gameRef.current?.scene?.scenes?.forEach((s) => s.scene?.pause());
        // Suspend audio when tab hidden
        audio?.suspend();
      }
    };
    document.addEventListener('visibilitychange', onVisChange);
    return () => document.removeEventListener('visibilitychange', onVisChange);
  }, [audio]);

  // Auto-dismiss AI toasts after 6 seconds
  useEffect(() => {
    if (aiToasts.length === 0) return;
    const timer = setInterval(() => {
      setAiToasts((prev) => prev.filter((t) => Date.now() - t.shownAt < 6000));
    }, 1000);
    return () => clearInterval(timer);
  }, [aiToasts.length]);

  // ------------------------------------------------------------------
  // Sync React state → gameplay arbiter busy flags
  // ------------------------------------------------------------------
  useEffect(() => { setBusy('inDialogue', !!dialog); }, [dialog]);
  useEffect(() => { setBusy('crafting', showCrafting); }, [showCrafting]);
  useEffect(() => { setBusy('paused', paused); }, [paused]);
  useEffect(() => { setBusy('inMenu', showQuestBoard || showShop || showInventory || showNotebook || showMilestones || showAssistant || showAudioSettings); },
    [showQuestBoard, showShop, showInventory, showNotebook, showMilestones, showAssistant, showAudioSettings]);
  useEffect(() => {
    const state = gameRef.current?.registry?.get?.('gameState');
    setBusy('activeQuestStep', !!state?.activeQuest);
  });

  // Keyboard shortcut: C → toggle crafting panel
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'c' || e.key === 'C') {
        if (phase === 'playing' && !dialog && !paused) {
          setShowCrafting((v) => !v);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, dialog, paused]);

  // ------------------------------------------------------------------
  // Prevent page scrolling while game is active
  // ------------------------------------------------------------------
  useEffect(() => {
    const handler = (e) => {
      // Only prevent if the touch is inside the game container
      if (containerRef.current?.contains(e.target)) {
        e.preventDefault();
      }
    };
    document.addEventListener('touchmove', handler, { passive: false });
    return () => document.removeEventListener('touchmove', handler);
  }, []);

  // ------------------------------------------------------------------
  // Pause toggle
  // ------------------------------------------------------------------
  const togglePause = useCallback(() => {
    const game = gameRef.current;
    if (!game) return;
    const scenes = game.scene.scenes;
    if (paused) {
      scenes.forEach((s) => s.scene?.resume());
      audio?.resume();
      setPaused(false);
    } else {
      scenes.forEach((s) => s.scene?.pause());
      audio?.suspend();
      setPaused(true);
    }
  }, [paused, audio]);

  // ------------------------------------------------------------------
  // Dialog continue / choice handler
  // ------------------------------------------------------------------
  const handleDialogContinue = useCallback((choiceIndex) => {
    const game = gameRef.current;
    if (!game) return;

    audio?.playSfx('ui_tap');

    // Find any active scene with advanceFromDialog and call it
    const activeScenes = game.scene.getScenes(true);
    let handled = false;
    for (const scene of activeScenes) {
      if (scene.advanceFromDialog) {
        scene.advanceFromDialog(choiceIndex ?? undefined);
        handled = true;
        break;
      }
    }
    if (!handled) {
      // Simple dialog (no quest advancement) — just close
      setDialog(null);
    }
  }, [audio]);

  const handleDialogClose = useCallback(() => {
    cancelSpeech();
    resetLastSpoken();
    setDialog(null);
    gameRef.current?.registry?.set('dialogEvent', null);
  }, []);

  // Auto-speak NPC dialogue when dialog changes
  const prevDialogTextRef = useRef(null);
  useEffect(() => {
    if (!dialog) {
      prevDialogTextRef.current = null;
      return;
    }
    const stem = dialog.aiDialogue?.spokenLine || dialog.text;
    if (stem && stem !== prevDialogTextRef.current) {
      prevDialogTextRef.current = stem;
      // If the dialog is a quiz, append each choice with the same
      // "Option N: <label>" prefix used by the physics-question path
      // so non-readers can pick by listening.
      const choices = Array.isArray(dialog.choices) ? dialog.choices : [];
      const choicesText = choices
        .map((c, i) => `Option ${i + 1}: ${c.label}`)
        .join('. ');
      const textToSpeak = choicesText ? `${stem}. ${choicesText}.` : stem;
      autoSpeak(textToSpeak, dialog.voicePreference, {
        npcId: dialog.npcId || resolveSpeakerToNpcId(dialog.speaker),
      });
    }
  }, [dialog]);

  // Speech toggle state for UI
  const [speechOn, setSpeechOn] = useState(() => isSpeechEnabled());
  const [showGameSettings, setShowGameSettings] = useState(false);

  // Initialize speech service from saved game settings
  useEffect(() => {
    const saved = loadGame();
    const gs = saved.gameSettings || {};
    if (typeof gs.speechEnabled === 'boolean') {
      setSpeechEnabled(gs.speechEnabled);
      setSpeechOn(gs.speechEnabled);
    }
    if (typeof gs.autoSpeak === 'boolean') setAutoSpeak(gs.autoSpeak);
  }, []);

  // ------------------------------------------------------------------
  // Virtual joystick
  // ------------------------------------------------------------------
  const setJoystick = useCallback((x, y) => {
    const game = gameRef.current;
    if (!game) return;
    game.scene.scenes.forEach((s) => {
      if (s.player) s.player.joystick = { x, y };
    });
  }, []);

  // ------------------------------------------------------------------
  // Pause menu: New Game handler
  // ------------------------------------------------------------------
  const handleNewGameFromPause = useCallback(() => {
    setConfirmNewGame(true);
  }, []);

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  return (
    <div className="relative w-full h-full select-none" style={{ touchAction: 'none' }}>

      {/* ================================================================== */}
      {/* START SCREEN — shown before Phaser boots                          */}
      {/* ================================================================== */}
      {phase === 'menu' && (
        <div className="absolute inset-0 z-50 bg-gradient-to-b from-sky-400 via-sky-300 to-amber-200 flex items-center justify-center">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 text-center shadow-2xl max-w-sm mx-4 border-2 border-sky-200">
            <div className="text-5xl mb-3">🚲</div>
            <h1 className="text-2xl font-bold text-sky-800 mb-1">
              Zuzu&apos;s Bike Adventure
            </h1>
            <p className="text-sky-600 text-sm mb-6">From Neighborhood to Stars</p>

            {saveExists ? (
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleContinue}
                  className="bg-sky-500 text-white px-6 py-3 rounded-2xl text-lg font-bold
                             hover:bg-sky-600 active:scale-95 transition-all shadow-md cursor-pointer"
                >
                  Continue Adventure
                </button>
                <button
                  onClick={handleNewGameFromMenu}
                  className="bg-amber-100 text-amber-800 px-6 py-2.5 rounded-2xl text-base font-semibold
                             hover:bg-amber-200 active:scale-95 transition-all cursor-pointer"
                >
                  New Game
                </button>
              </div>
            ) : (
              <button
                onClick={handleStartAdventure}
                className="bg-sky-500 text-white px-8 py-3 rounded-2xl text-lg font-bold
                           hover:bg-sky-600 active:scale-95 transition-all shadow-md
                           animate-pulse cursor-pointer"
              >
                Start Adventure!
              </button>
            )}

            <p className="text-sky-400 text-xs mt-4">A bike repair learning game</p>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* CONFIRMATION DIALOG — New Game warning                            */}
      {/* ================================================================== */}
      {confirmNewGame && (
        <div className="absolute inset-0 z-[60] bg-black/60 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 text-center shadow-2xl max-w-xs mx-4">
            <div className="text-3xl mb-2">⚠️</div>
            <h2 className="text-lg font-bold text-gray-800 mb-2">Start New Game?</h2>
            <p className="text-gray-600 text-sm mb-5 leading-relaxed">
              Your current game progress will be replaced.
              Quests, inventory, Zuzubucks, and upgrades will be reset.
            </p>
            <p className="text-sky-600 text-xs mb-4">
              Your learning progress across BikeBrowser is kept safe.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={confirmAndStartNewGame}
                className="bg-red-500 text-white px-6 py-2.5 rounded-xl text-base font-bold
                           hover:bg-red-600 active:scale-95 transition-all cursor-pointer"
              >
                Yes, Start Fresh
              </button>
              <button
                onClick={cancelNewGame}
                className="bg-gray-100 text-gray-600 px-6 py-2 rounded-xl text-sm font-semibold
                           hover:bg-gray-200 active:scale-95 transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- Audio unlock overlay (shown until first tap, only when playing) ---- */}
      {phase === 'playing' && !isUnlocked && (
        <div
          className="absolute inset-0 z-50 bg-black/70 flex items-center justify-center cursor-pointer"
          onClick={() => {
            unlock();
            // Inject audio manager into Phaser registry
            if (gameRef.current && audio) {
              gameRef.current.registry.set('audioManager', audio);
              // Start scene audio for whatever scene is active
              const activeScenes = gameRef.current.scene.getScenes(true);
              if (activeScenes.length > 0) {
                audio.transitionToScene(activeScenes[0].scene.key);
              }
            }
          }}
          onTouchStart={() => {
            unlock();
            if (gameRef.current && audio) {
              gameRef.current.registry.set('audioManager', audio);
              const activeScenes = gameRef.current.scene.getScenes(true);
              if (activeScenes.length > 0) {
                audio.transitionToScene(activeScenes[0].scene.key);
              }
            }
          }}
        >
          <div className="bg-white rounded-2xl p-8 text-center shadow-xl max-w-xs mx-4">
            <div className="text-4xl mb-3">🎮</div>
            <div className="text-xl font-bold text-gray-800 mb-2">Zuzu&apos;s Bike Adventure</div>
            <div className="text-blue-600 font-semibold text-lg animate-pulse">
              Tap to Start 🔊
            </div>
            <div className="text-gray-400 text-xs mt-2">Sound will be enabled</div>
          </div>
        </div>
      )}

      {/* Phaser canvas container */}
      <div ref={containerRef} key={bootKey} className="w-full h-full" />

      {/* ---- Floating nav overlay (replaces removed header) ---- */}
      {phase === 'playing' && (
        <div className="absolute z-20 pointer-events-none" style={{ top: 'max(0.5rem, env(safe-area-inset-top))', left: 'max(0.5rem, env(safe-area-inset-left))' }}>
          <div className="flex gap-1.5 pointer-events-auto">
            <button
              onClick={() => navigate('/')}
              className="bg-white/90 rounded-lg p-2 shadow text-lg transition-all duration-75 active:scale-90 hover:bg-white cursor-pointer"
              title="Home"
            >🏠</button>
            <button
              onClick={() => navigate(-1)}
              className="bg-white/90 rounded-lg p-2 shadow text-lg transition-all duration-75 active:scale-90 hover:bg-white cursor-pointer"
              title="Back"
            >←</button>
          </div>
        </div>
      )}

      {/* ---- HUD overlay ---- */}
      {phase === 'playing' && (
        <div className="absolute left-0 right-0 pointer-events-none z-10" style={{ top: 'calc(max(0.5rem, env(safe-area-inset-top)) + 2.5rem)' }}>
          <div className="flex items-start justify-between px-2 gap-2">
            {/* Quest tracker + Zuzubucks */}
            <div className="flex flex-col gap-1.5 max-w-[55%]">
              {questInfo && (
                <div className="bg-white/90 rounded-lg px-3 py-2 shadow text-xs sm:text-sm pointer-events-auto">
                  <div className="font-bold text-blue-700 truncate">📋 {questInfo.title}</div>
                  <div className="text-gray-600">Step {questInfo.progress}</div>
                  {questInfo.stepHint && (
                    <div className="text-amber-600 mt-0.5">{questInfo.stepHint}</div>
                  )}
                </div>
              )}
              <div className="bg-white/90 rounded-lg px-3 py-1.5 shadow text-xs sm:text-sm pointer-events-auto w-fit">
                <span className="font-bold text-amber-600">💰 {zuzubucks}</span>
                <span className="text-gray-500 ml-1">Zuzubucks</span>
              </div>
            </div>

            {/* HUD buttons */}
            <div className="flex gap-1.5 pointer-events-auto flex-wrap justify-end">
              <button
                onClick={() => {
                  setShowQuestBoard(!showQuestBoard); setShowInventory(false); setShowNotebook(false); setShowAudioSettings(false); setShowShop(false); setShowMilestones(false);
                  audio?.playSfx('ui_tap');
                }}
                className="bg-white/90 rounded-lg p-2 shadow text-lg transition-all duration-75 active:scale-90 hover:bg-white cursor-pointer"
                title="Quest Board"
              >📋</button>
              <button
                onClick={() => {
                  setShowShop(!showShop); setShowInventory(false); setShowNotebook(false); setShowAudioSettings(false); setShowQuestBoard(false); setShowMilestones(false);
                  audio?.playSfx('ui_tap');
                }}
                className="bg-white/90 rounded-lg p-2 shadow text-lg transition-all duration-75 active:scale-90 hover:bg-white cursor-pointer"
                title="Shop"
              >🏪</button>
              <button
                onClick={() => {
                  setShowInventory(!showInventory); setShowNotebook(false); setShowAudioSettings(false); setShowQuestBoard(false); setShowShop(false); setShowMilestones(false);
                  audio?.playSfx(!showInventory ? 'ui_panel_open' : 'ui_panel_close');
                }}
                className="bg-white/90 rounded-lg p-2 shadow text-lg transition-all duration-75 active:scale-90 hover:bg-white cursor-pointer"
                title="Inventory"
              >🎒</button>
              <button
                onClick={() => {
                  setShowNotebook(!showNotebook); setShowInventory(false); setShowAudioSettings(false); setShowQuestBoard(false); setShowShop(false); setShowMilestones(false);
                  audio?.playSfx(!showNotebook ? 'ui_notebook_open' : 'ui_panel_close');
                }}
                className="bg-white/90 rounded-lg p-2 shadow text-lg transition-all duration-75 active:scale-90 hover:bg-white cursor-pointer"
                title="Notebook"
              >📓</button>
              <button
                onClick={() => {
                  setShowCrafting(!showCrafting); setShowInventory(false); setShowNotebook(false); setShowAudioSettings(false); setShowQuestBoard(false); setShowShop(false); setShowAssistant(false);
                  audio?.playSfx('ui_tap');
                }}
                className={`rounded-lg p-2 shadow text-lg transition-all duration-75 active:scale-90 cursor-pointer ${showCrafting ? 'bg-amber-400 text-white' : 'bg-white/90 hover:bg-white'}`}
                title="Crafting (C)"
              >⚗️</button>
              <button
                onClick={() => {
                  setShowMilestones(!showMilestones); setShowInventory(false); setShowNotebook(false); setShowAudioSettings(false); setShowQuestBoard(false); setShowShop(false); setShowAssistant(false); setShowCrafting(false);
                  audio?.playSfx('ui_tap');
                }}
                className={`rounded-lg p-2 shadow text-lg transition-all duration-75 active:scale-90 cursor-pointer ${showMilestones ? 'bg-purple-400 text-white' : 'bg-white/90 hover:bg-white'}`}
                title="Milestones"
              >🏆</button>
              <button
                onClick={() => {
                  setShowAudioSettings(!showAudioSettings); setShowInventory(false); setShowNotebook(false);
                  audio?.playSfx('ui_tap');
                }}
                className="bg-white/90 rounded-lg p-2 shadow text-lg transition-all duration-75 active:scale-90 hover:bg-white cursor-pointer"
                title="Audio Settings"
              >{audioSettings?.masterMute ? '🔇' : '🔊'}</button>
              <button
                onClick={() => {
                  setShowAssistant(!showAssistant); setShowInventory(false); setShowNotebook(false); setShowAudioSettings(false); setShowQuestBoard(false); setShowShop(false);
                  audio?.playSfx('ui_tap');
                }}
                className={`rounded-lg p-2 shadow text-lg transition-all duration-75 active:scale-90 cursor-pointer ${
                  showAssistant ? 'bg-purple-400 text-white' :
                  assistantStatus === 'warning' ? 'bg-red-400/90 text-white animate-pulse' :
                  assistantStatus === 'analyzing' ? 'bg-blue-400/90 text-white' :
                  assistantMessages.length > 0 ? 'bg-purple-100 hover:bg-purple-200' :
                  'bg-white/90 hover:bg-white'
                }`}
                title="AI Assistant"
              >🧠</button>
              <button
                onClick={togglePause}
                className="bg-white/90 rounded-lg p-2 shadow text-lg transition-all duration-75 active:scale-90 hover:bg-white cursor-pointer"
                title={paused ? 'Resume' : 'Pause'}
              >{paused ? '▶️' : '⏸️'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ---- Inventory panel ---- */}
      {showInventory && (
        <div className="absolute top-14 right-2 z-20 bg-white/70 backdrop-blur-sm rounded-xl shadow-lg p-3 w-56 max-h-64 overflow-y-auto">
          <div className="font-bold text-gray-700 mb-2 text-sm">🎒 Inventory</div>
          {inventory.length === 0 && (
            <div className="text-gray-400 text-xs">Nothing yet.</div>
          )}
          {inventory.map((item) => (
            <div key={item.id} className="flex items-center gap-2 py-1 text-xs">
              <span className="text-lg">{item.icon}</span>
              <div>
                <div className="font-semibold">{item.name}{item.count > 1 ? ` ×${item.count}` : ''}</div>
                <div className="text-gray-500">{item.description}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ---- Notebook panel ---- */}
      {showNotebook && (
        <div className="absolute top-14 right-2 z-20 bg-white/70 backdrop-blur-sm rounded-xl shadow-lg p-3 w-64 max-h-72 overflow-y-auto">
          <div className="font-bold text-gray-700 mb-2 text-sm">📓 Zuzu's Notebook</div>
          {journal.map((entry, i) => {
            if (typeof entry === 'string') {
              return (
                <div key={i} className="text-xs text-gray-600 py-1 border-b border-gray-100 last:border-0">
                  {entry}
                </div>
              );
            }
            if (entry && typeof entry === 'object' && entry.kind === 'materialLog') {
              return <MaterialLogEntry key={i} data={entry} />;
            }
            return null;
          })}
        </div>
      )}

      {/* ---- Audio settings panel ---- */}
      {showAudioSettings && audioSettings && (
        <AudioSettingsPanel
          settings={audioSettings}
          onChangeSetting={setAudioSetting}
          onClose={() => setShowAudioSettings(false)}
        />
      )}

      {/* ---- Crafting panel ---- */}
      {showCrafting && gameState && (
        <CraftingPanel
          state={gameState}
          craftResult={craftResult}
          onCraft={(recipeId) => {
            const game = gameRef.current;
            if (!game) return;
            const s = game.registry.get('gameState');
            const result = craft(recipeId, s.inventory);
            if (result.success) {
              const updated = { ...s, inventory: result.inventory };
              game.registry.set('gameState', updated);
              saveGame(updated);
              audio?.playSfx('item_pickup');
              setCraftResult({ success: true, message: result.message, itemName: result.result });
              // Emit to MCP
              const mcp = game.registry.get('mcp');
              if (mcp) mcp.emit('CRAFT_COMPLETED', { recipeId, result: result.result });
              // Clear result after 3s
              setTimeout(() => setCraftResult(null), 3000);
            } else {
              setCraftResult({ success: false, message: result.message });
              setTimeout(() => setCraftResult(null), 2500);
            }
          }}
          onClose={() => setShowCrafting(false)}
        />
      )}

      {/* ---- AI Assistant panel ---- */}
      {showAssistant && (
        <AIAssistantPanel
          messages={assistantMessages}
          status={assistantStatus}
          onClose={() => setShowAssistant(false)}
          onClear={() => setAssistantMessages([])}
        />
      )}

      {/* ---- Game settings panel (NPC & Dialogue) ---- */}
      {showGameSettings && gameState && (
        <GameSettingsPanel
          state={gameState}
          speechOn={speechOn}
          onChangeSetting={(key, value) => {
            const game = gameRef.current;
            if (!game) return;
            const s = game.registry.get('gameState');
            const gs = { ...(s.gameSettings || {}), [key]: value };
            const updated = { ...s, gameSettings: gs };
            game.registry.set('gameState', updated);
            saveGame(updated);
            // Sync speech service
            if (key === 'speechEnabled') { setSpeechEnabled(value); setSpeechOn(value); }
            if (key === 'autoSpeak') setAutoSpeak(value);
          }}
          onClose={() => setShowGameSettings(false)}
        />
      )}

      {/* ---- Quest Board panel ---- */}
      {showQuestBoard && gameState && (
        <QuestBoardPanel state={gameState} onClose={() => setShowQuestBoard(false)} />
      )}

      {/* ---- Milestones panel ---- */}
      {showMilestones && gameState && (
        <MilestonesPanel state={gameState} onClose={() => setShowMilestones(false)} />
      )}

      {/* ---- Shop panel ---- */}
      {showShop && gameState && (
        <ShopPanel
          state={gameState}
          onBuy={(itemId, cost) => {
            const game = gameRef.current;
            if (!game) return;
            const s = game.registry.get('gameState');
            if ((s.zuzubucks || 0) < cost) return;
            const updated = {
              ...s,
              zuzubucks: s.zuzubucks - cost,
              upgrades: [...(s.upgrades || []), itemId],
              journal: [...s.journal, `🏪 Purchased: ${itemId} for ${cost} Zuzubucks`],
            };
            game.registry.set('gameState', updated);
            saveGame(updated);
            audio?.playSfx('item_pickup');
          }}
          onClose={() => setShowShop(false)}
        />
      )}

      {/* ---- Pause overlay ---- */}
      {paused && !confirmNewGame && (
        <div className="absolute inset-0 z-30 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 text-center shadow-xl min-w-[220px]">
            <div className="text-2xl mb-4">⏸️ Paused</div>
            <div className="flex flex-col gap-2">
              <button
                onClick={togglePause}
                className="bg-blue-500 text-white px-6 py-2 rounded-xl text-lg font-semibold hover:bg-blue-600 active:scale-95 w-full"
              >
                ▶️ Resume
              </button>
              <button
                onClick={() => { togglePause(); setShowNotebook(true); setShowInventory(false); setShowAudioSettings(false); }}
                className="bg-amber-100 text-amber-800 px-6 py-2 rounded-xl text-sm font-semibold hover:bg-amber-200 active:scale-95 w-full"
              >
                📓 Notebook
              </button>
              <button
                onClick={() => { togglePause(); setShowAudioSettings(true); setShowInventory(false); setShowNotebook(false); }}
                className="bg-green-100 text-green-800 px-6 py-2 rounded-xl text-sm font-semibold hover:bg-green-200 active:scale-95 w-full"
              >
                🔊 Audio Settings
              </button>
              <button
                onClick={() => { togglePause(); setShowGameSettings(true); }}
                className="bg-purple-100 text-purple-800 px-6 py-2 rounded-xl text-sm font-semibold hover:bg-purple-200 active:scale-95 w-full"
              >
                🗣️ NPC & Dialogue
              </button>
              <button
                onClick={handleNewGameFromPause}
                className="bg-orange-100 text-orange-700 px-6 py-2 rounded-xl text-sm font-semibold hover:bg-orange-200 active:scale-95 w-full"
              >
                🔄 Start New Game
              </button>
              <button
                onClick={() => { if (audio) audio.stopAll(); navigate('/'); }}
                className="bg-red-100 text-red-600 px-6 py-2 rounded-xl text-sm font-semibold hover:bg-red-200 active:scale-95 w-full mt-2"
              >
                🚪 Exit Game
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- Dialog overlay (quest steps) ---- */}
      {dialog && (
        <div className="absolute inset-x-0 bottom-0 z-30 p-2 sm:p-4">
          <div className="bg-white rounded-2xl shadow-xl p-4 max-w-lg mx-auto border-2 border-blue-200">
            {/* Speaker label + speech controls */}
            <div className="flex items-center justify-between mb-1">
              <div className="font-bold text-blue-700 text-sm">{dialog.speaker}</div>
              {isSpeechAvailable() && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => replaySpeech()}
                    className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-lg
                               hover:bg-blue-100 active:scale-95"
                    title="Read aloud"
                  >
                    🔊
                  </button>
                  <button
                    onClick={() => {
                      const next = !speechOn;
                      setSpeechOn(next);
                      setSpeechEnabled(next);
                      if (!next) cancelSpeech();
                    }}
                    className={`text-xs px-2 py-1 rounded-lg active:scale-95 ${
                      speechOn
                        ? 'bg-green-50 text-green-600 hover:bg-green-100'
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    }`}
                    title={speechOn ? 'Voice on' : 'Voice off'}
                  >
                    {speechOn ? '🗣️' : '🔇'}
                  </button>
                </div>
              )}
            </div>

            {/* Dialogue text (caption) */}
            <div className="text-gray-700 text-sm whitespace-pre-line mb-2 leading-relaxed">
              {dialog.text}
            </div>

            {/* Hint line */}
            {dialog.aiDialogue?.hintLine && dialog.step && (
              <div className="text-amber-600 text-xs mb-2 bg-amber-50 rounded-lg px-3 py-1.5">
                💡 {dialog.aiDialogue.hintLine}
              </div>
            )}

            {/* Difficulty band indicator */}
            {dialog.band && (
              <div className="text-[10px] text-gray-300 mb-2">
                {dialog.band === 'starter' ? '⭐' : dialog.band === 'guided' ? '⭐⭐' : dialog.band === 'builder' ? '⭐⭐⭐' : '⭐⭐⭐⭐'}
              </div>
            )}

            {/* Quiz choices */}
            {dialog.choices ? (
              <div className="flex flex-col gap-2">
                {dialog.choices.map((choice, i) => (
                  <button
                    key={i}
                    onClick={() => handleDialogContinue(i)}
                    className="bg-blue-50 border-2 border-blue-300 rounded-xl px-4 py-2 text-sm
                               font-medium text-blue-800 hover:bg-blue-100 active:scale-[0.98]
                               text-left"
                  >
                    {choice.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => handleDialogContinue(null)}
                  className="bg-blue-500 text-white px-5 py-2 rounded-xl text-sm font-semibold
                             hover:bg-blue-600 active:scale-95"
                >
                  Continue →
                </button>
                <button
                  onClick={handleDialogClose}
                  className="bg-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm
                             hover:bg-gray-300 active:scale-95"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---- Physics HUD (bottom-left, above joystick) ---- */}
      {phase === 'playing' && showPhysicsHUD && physicsHUD && (
        <div className="absolute bottom-24 left-2 z-15 bg-black/60 backdrop-blur-sm rounded-xl px-3 py-2 text-white pointer-events-none"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="text-[10px] text-gray-300 mb-1">📊 Physics · T{physicsHUD.tier} {physicsHUD.tierLabel}</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
            <div>🏃 {physicsHUD.speed}</div>
            <div>📏 {physicsHUD.distance}</div>
            <div>⚡ {physicsHUD.acceleration}</div>
            <div>⏱️ {physicsHUD.time}</div>
          </div>
        </div>
      )}

      {/* ---- Physics HUD toggle (tiny button, bottom-left corner) ---- */}
      {phase === 'playing' && !paused && (
        <button
          onClick={() => setShowPhysicsHUD((v) => !v)}
          className={`absolute bottom-2 left-[170px] z-20 rounded-lg px-2 py-1 text-xs shadow transition-all active:scale-90 cursor-pointer ${
            showPhysicsHUD ? 'bg-blue-500 text-white' : 'bg-white/60 text-gray-600 hover:bg-white/80'
          }`}
          style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
          title="Physics HUD"
        >📊</button>
      )}

      {/* ---- Physics Question Popup ---- */}
      {physicsQuestion && (
        <div className="absolute inset-0 z-40 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-5 max-w-sm mx-4 border-2 border-blue-300">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">📐</span>
              <span className="font-bold text-blue-700 text-sm">Physics Challenge!</span>
              <span className="text-[10px] text-gray-400 ml-auto">T{physicsHUD?.tier || 1}</span>
            </div>
            <div className="text-gray-700 text-sm mb-3 leading-relaxed">
              {physicsQuestion.question}
            </div>
            <div className="flex flex-col gap-2">
              {physicsQuestion.choices.map((choice, i) => (
                <button
                  key={i}
                  onClick={() => {
                    const game = gameRef.current;
                    const mcp = game?.registry?.get('mcp');
                    const physEd = mcp?.getSystem('physics_education');
                    if (physEd) {
                      const result = physEd.answerQuestion(i);
                      if (result) {
                        setPhysicsQuestion(null);
                        recordQuestionDismissed();
                        cancelSpeech(); // stop reading the question
                        game.registry.set('mcpAlert', {
                          id: 'physics_answer',
                          message: result.correct
                            ? `✅ Correct! ${result.explanation} (+${result.xpGained} XP)`
                            : `❌ Not quite. ${result.explanation}`,
                          severity: result.correct ? 'info' : 'warning',
                        });
                        if (result.correct) audio?.playSfx('ui_success');
                        else audio?.playSfx('ui_error');
                      }
                    } else {
                      setPhysicsQuestion(null);
                      recordQuestionDismissed();
                    }
                  }}
                  className="bg-blue-50 border-2 border-blue-300 rounded-xl px-4 py-2 text-sm
                             font-medium text-blue-800 hover:bg-blue-100 active:scale-[0.98] text-left"
                >
                  {choice.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => { setPhysicsQuestion(null); recordQuestionDismissed(); cancelSpeech(); }}
              className="mt-2 text-xs text-gray-400 hover:text-gray-600 w-full text-center"
            >Skip</button>
          </div>
        </div>
      )}

      {/* ---- AI Toast Notifications ---- */}
      {phase === 'playing' && aiToasts.length > 0 && (
        <div className="absolute top-[120px] left-1/2 -translate-x-1/2 z-25 flex flex-col gap-2 pointer-events-none max-w-sm w-full px-2">
          {aiToasts.map((toast) => {
            const bg = toast.severity === 'critical' ? 'bg-red-500/90'
              : toast.severity === 'warning' ? 'bg-amber-500/90'
              : 'bg-blue-500/85';
            const icon = toast.severity === 'critical' ? '🚨'
              : toast.severity === 'warning' ? '⚠️'
              : '💡';
            const age = Date.now() - toast.shownAt;
            const fading = age > 4500;
            return (
              <div
                key={toast.id + toast.shownAt}
                className={`${bg} text-white rounded-xl px-4 py-2.5 shadow-lg text-sm leading-snug
                  transition-all duration-500 ${fading ? 'opacity-30 translate-y-1' : 'opacity-100'}`}
              >
                <span className="mr-1.5">{icon}</span>
                {toast.message}
              </div>
            );
          })}
        </div>
      )}

      {/* ---- Virtual joystick (always visible for accessibility) ---- */}
      {phase === 'playing' && !paused && !dialog && (
        <VirtualJoystick onMove={setJoystick} />
      )}

      {/* ---- Action button (interact with NPCs) ---- */}
      {phase === 'playing' && !paused && !dialog && (
        <button
          onPointerDown={() => {
            const game = gameRef.current;
            game?.scene?.scenes?.forEach((s) => {
              // Check all NPCs for proximity interaction (supports both old and new layout)
              const npcs = s._npcs ? Object.values(s._npcs) : [];
              for (const npc of npcs) {
                if (npc.isNearby?.()) {
                  npc.onInteract?.();
                  return;
                }
              }
            });
          }}
          className="absolute bottom-6 right-6 z-20 bg-amber-400 text-white rounded-full w-16 h-16
                     flex items-center justify-center text-2xl shadow-lg
                     transition-all duration-75 active:scale-90 hover:bg-amber-300
                     border-4 border-amber-500 cursor-pointer"
          style={{ marginBottom: 'env(safe-area-inset-bottom)', marginRight: 'env(safe-area-inset-right)' }}
        >
          💬
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Alert title helper
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// CraftingPanel — recipe-based crafting with visual feedback
// ---------------------------------------------------------------------------
function CraftingPanel({ state, craftResult, onCraft, onClose }) {
  const recipes = getAllRecipes();
  const inv = state?.inventory || [];

  // Count items in inventory
  const itemCounts = {};
  for (const id of inv) {
    itemCounts[id] = (itemCounts[id] || 0) + 1;
  }

  // Get foraged items only
  const foragedItems = Object.entries(itemCounts)
    .filter(([id]) => ITEMS[id]?.category === 'foraged')
    .map(([id, count]) => ({ id, name: ITEMS[id]?.name || id, icon: ITEMS[id]?.icon || '📦', count }));

  const craftedItems = Object.entries(itemCounts)
    .filter(([id]) => ITEMS[id]?.category === 'crafted')
    .map(([id, count]) => ({ id, name: ITEMS[id]?.name || id, icon: ITEMS[id]?.icon || '📦', count }));

  return (
    <div className="absolute top-14 right-2 z-20 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg w-80 max-h-[440px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
        <div className="font-bold text-gray-700 text-sm">⚗️ Crafting Bench</div>
        <div className="flex gap-1">
          <span className="text-[10px] text-gray-400">Press C</span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm px-1">✕</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2">
        {/* Craft result feedback */}
        {craftResult && (
          <div className={`rounded-lg p-2 mb-2 text-xs font-semibold text-center transition-all ${
            craftResult.success
              ? 'bg-green-100 text-green-700 border border-green-300 animate-pulse'
              : 'bg-red-100 text-red-600 border border-red-300'
          }`}>
            {craftResult.success ? '✨ ' : '❌ '}{craftResult.message}
          </div>
        )}

        {/* Materials inventory */}
        <div className="mb-3">
          <div className="text-xs font-semibold text-gray-500 mb-1">🌿 Materials</div>
          {foragedItems.length === 0 ? (
            <div className="text-xs text-gray-300 py-2 text-center">No materials yet. Forage plants!</div>
          ) : (
            <div className="flex flex-wrap gap-1">
              {foragedItems.map((item) => (
                <div key={item.id} className="bg-green-50 border border-green-200 rounded-lg px-2 py-1 text-xs flex items-center gap-1"
                  title={item.name}>
                  <span>{item.icon}</span>
                  <span className="text-gray-700">{item.name.split(' ')[0]}</span>
                  {item.count > 1 && <span className="text-green-600 font-bold">×{item.count}</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Crafted items */}
        {craftedItems.length > 0 && (
          <div className="mb-3">
            <div className="text-xs font-semibold text-gray-500 mb-1">✨ Crafted</div>
            <div className="flex flex-wrap gap-1">
              {craftedItems.map((item) => (
                <div key={item.id} className="bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 text-xs flex items-center gap-1">
                  <span>{item.icon}</span>
                  <span className="text-gray-700">{item.name.split(' ')[0]}</span>
                  {item.count > 1 && <span className="text-amber-600 font-bold">×{item.count}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recipes */}
        <div>
          <div className="text-xs font-semibold text-gray-500 mb-1">📖 Recipes</div>
          {recipes.map((recipe) => {
            const check = canCraft(recipe.id, inv);
            const ingredientNames = recipe.ingredients.map((id) => ITEMS[id]?.name || id);
            const resultItem = ITEMS[recipe.result];

            return (
              <div key={recipe.id} className={`rounded-lg border p-2 mb-1.5 transition-all ${
                check.canCraft
                  ? 'bg-green-50 border-green-300'
                  : 'bg-gray-50 border-gray-200 opacity-60'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-gray-800">
                      {resultItem?.icon || '📦'} {recipe.name}
                    </div>
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      {ingredientNames.join(' + ')} → {resultItem?.name || recipe.result}
                    </div>
                    {recipe.description && (
                      <div className="text-[10px] text-gray-400 mt-0.5">{recipe.description}</div>
                    )}
                  </div>
                  <button
                    onClick={() => check.canCraft && onCraft(recipe.id)}
                    disabled={!check.canCraft}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      check.canCraft
                        ? 'bg-green-500 text-white hover:bg-green-600 active:scale-95 cursor-pointer'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {check.canCraft ? 'Craft' : 'Need'}
                  </button>
                </div>
                {!check.canCraft && check.missing.length > 0 && (
                  <div className="text-[10px] text-red-400 mt-1">
                    Missing: {check.missing.map((id) => ITEMS[id]?.name || id).join(', ')}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="px-3 py-1.5 border-t border-gray-100 text-[10px] text-gray-400 text-center">
        Forage plants to get materials · Combine to craft
      </div>
    </div>
  );
}

function getAlertTitle(id) {
  const titles = {
    ai_hint: '💡 Hint',
    ai_failure: '⚠️ Failure Analysis',
    ai_quest: '📋 Quest',
    ai_language: '🗣️ Language',
    low_health: '❤️ Health',
    dehydration: '💧 Hydration',
    toxicity: '☠️ Toxicity',
    forage_hint: '🌿 Forage',
    heat_warning: '🌡️ Heat',
    dynamic_quest: '📜 New Quest',
    obstacle_hint: '🧩 Obstacle',
    craft_success: '⚗️ Crafted',
  };
  return titles[id] || '🧠 Assistant';
}

// ---------------------------------------------------------------------------
// AIAssistantPanel — real-time AI output feed
// ---------------------------------------------------------------------------
function AIAssistantPanel({ messages, status, onClose, onClear }) {
  const feedRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [messages.length]);

  const statusConfig = {
    idle: { label: 'Idle', color: 'bg-gray-300', dot: 'bg-gray-400' },
    analyzing: { label: 'Analyzing...', color: 'bg-blue-400', dot: 'bg-blue-500 animate-pulse' },
    warning: { label: 'Warning', color: 'bg-red-400', dot: 'bg-red-500 animate-pulse' },
  };
  const st = statusConfig[status] || statusConfig.idle;

  const priorityStyles = {
    high: 'border-l-4 border-red-400 bg-red-50',
    medium: 'border-l-4 border-amber-400 bg-amber-50',
    low: 'border-l-4 border-blue-300 bg-blue-50',
  };

  const typeIcons = {
    hint: '💡',
    failure: '⚠️',
    quest: '📋',
    language: '🗣️',
    system: '🧠',
    health: '❤️',
  };

  // Find highest-priority recent message for pinned card
  const recentHighPriority = messages
    .filter((m) => m.priority === 'high' && Date.now() - m.timestamp < 30000)
    .slice(-1)[0];

  return (
    <div className="absolute top-14 right-2 z-20 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg w-72 max-h-[420px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-700">🧠 Assistant</span>
          <span className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full text-white ${st.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
            {st.label}
          </span>
        </div>
        <div className="flex gap-1">
          {messages.length > 0 && (
            <button onClick={onClear} className="text-gray-300 hover:text-gray-500 text-xs px-1" title="Clear">🗑️</button>
          )}
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm px-1">✕</button>
        </div>
      </div>

      {/* Pinned high-priority card */}
      {recentHighPriority && (
        <div className="mx-2 mt-2 p-2 rounded-lg bg-red-100 border border-red-300">
          <div className="text-xs font-bold text-red-700 mb-0.5">
            {typeIcons[recentHighPriority.type] || '🚨'} {recentHighPriority.title}
          </div>
          <div className="text-xs text-red-800 leading-snug">{recentHighPriority.message}</div>
        </div>
      )}

      {/* Message feed */}
      <div ref={feedRef} className="flex-1 overflow-y-auto px-2 py-1.5 space-y-1.5 min-h-[80px]">
        {messages.length === 0 && (
          <div className="text-center text-gray-300 text-xs py-6">
            No messages yet. Explore to receive hints!
          </div>
        )}
        {messages.map((msg, i) => {
          const age = Date.now() - msg.timestamp;
          const fading = age > 25000;
          return (
            <div
              key={`${msg.id}-${msg.timestamp}`}
              className={`rounded-lg px-2.5 py-1.5 text-xs transition-opacity duration-500 ${
                priorityStyles[msg.priority] || priorityStyles.low
              } ${fading ? 'opacity-40' : 'opacity-100'}`}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-semibold text-gray-700">
                  {typeIcons[msg.type] || '💡'} {msg.title}
                </span>
                <span className="text-[9px] text-gray-400">
                  {age < 60000 ? `${Math.round(age / 1000)}s` : `${Math.round(age / 60000)}m`}
                </span>
              </div>
              <div className="text-gray-600 leading-snug">{msg.message}</div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-3 py-1.5 border-t border-gray-100 text-[10px] text-gray-400 text-center">
        {messages.length} message{messages.length !== 1 ? 's' : ''} · AI-powered guidance
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// VirtualJoystick — simple 4-direction pad for mobile
// ---------------------------------------------------------------------------
function VirtualJoystick({ onMove }) {
  const btnClass =
    'bg-white/60 backdrop-blur-sm rounded-xl shadow flex items-center justify-center text-xl ' +
    'select-none w-12 h-12 sm:w-14 sm:h-14 cursor-pointer ' +
    'transition-all duration-75 active:scale-90 active:bg-blue-300/80 hover:bg-white/80';

  const press = (x, y) => onMove(x, y);
  const release = () => onMove(0, 0);

  return (
    <div className="absolute bottom-4 left-4 z-20 grid grid-cols-3 gap-1" style={{ width: '156px', paddingBottom: 'env(safe-area-inset-bottom)', paddingLeft: 'env(safe-area-inset-left)' }}>
      <div />
      <button className={btnClass} onPointerDown={() => press(0, -1)} onPointerUp={release} onPointerLeave={release}>⬆</button>
      <div />
      <button className={btnClass} onPointerDown={() => press(-1, 0)} onPointerUp={release} onPointerLeave={release}>⬅</button>
      <div className="w-12 h-12 sm:w-14 sm:h-14" />
      <button className={btnClass} onPointerDown={() => press(1, 0)} onPointerUp={release} onPointerLeave={release}>➡</button>
      <div />
      <button className={btnClass} onPointerDown={() => press(0, 1)} onPointerUp={release} onPointerLeave={release}>⬇</button>
      <div />
    </div>
  );
}

// ---------------------------------------------------------------------------
// AudioSettingsPanel — compact, kid-friendly audio controls
// ---------------------------------------------------------------------------
function AudioSettingsPanel({ settings, onChangeSetting, onClose }) {
  const sliderRow = (label, emoji, prop, muteProp) => (
    <div className="flex items-center gap-2 py-1.5">
      <button
        onClick={() => onChangeSetting(muteProp, !settings[muteProp])}
        className="text-lg w-7 text-center active:scale-90"
        title={settings[muteProp] ? 'Unmute' : 'Mute'}
      >
        {settings[muteProp] ? '🔇' : emoji}
      </button>
      <div className="flex-1">
        <div className="text-xs text-gray-600 font-medium mb-0.5">{label}</div>
        <input
          type="range"
          min="0"
          max="100"
          value={Math.round((settings[prop] || 0) * 100)}
          onChange={(e) => onChangeSetting(prop, Number(e.target.value) / 100)}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer
                     bg-gray-200 accent-blue-500"
        />
      </div>
      <span className="text-xs text-gray-400 w-7 text-right">
        {Math.round((settings[prop] || 0) * 100)}
      </span>
    </div>
  );

  return (
    <div className="absolute top-14 right-2 z-20 bg-white/70 backdrop-blur-sm rounded-xl shadow-lg p-3 w-60">
      <div className="flex items-center justify-between mb-1">
        <div className="font-bold text-gray-700 text-sm">🔊 Audio</div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-sm px-1"
        >✕</button>
      </div>

      {/* Master mute */}
      <button
        onClick={() => onChangeSetting('masterMute', !settings.masterMute)}
        className={`w-full py-1.5 rounded-lg text-sm font-semibold mb-2 active:scale-[0.98]
          ${settings.masterMute
            ? 'bg-red-100 text-red-600 border border-red-200'
            : 'bg-green-100 text-green-700 border border-green-200'}`}
      >
        {settings.masterMute ? '🔇 Sound OFF' : '🔊 Sound ON'}
      </button>

      {sliderRow('Music', '🎵', 'musicVolume', 'musicMute')}
      {sliderRow('Effects', '🔔', 'sfxVolume', 'sfxMute')}
      {sliderRow('Ambient', '🌿', 'ambientVolume', 'ambientMute')}
    </div>
  );
}

// ---------------------------------------------------------------------------
// GameSettingsPanel — NPC speech & dialogue complexity settings
// ---------------------------------------------------------------------------
function GameSettingsPanel({ state, speechOn, onChangeSetting, onClose }) {
  const gs = state?.gameSettings || {};
  const complexityLabels = {
    adaptive: 'Adaptive (grows with you)',
    starter: 'Starter (simplest)',
    guided: 'Guided',
    builder: 'Builder',
    advanced: 'Advanced (most detailed)',
  };

  return (
    <div className="absolute top-14 right-2 z-20 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-3 w-64">
      <div className="flex items-center justify-between mb-2">
        <div className="font-bold text-gray-700 text-sm">🗣️ NPC & Dialogue</div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm px-1">✕</button>
      </div>

      {/* Speech toggle */}
      <button
        onClick={() => onChangeSetting('speechEnabled', !gs.speechEnabled)}
        className={`w-full py-1.5 rounded-lg text-sm font-semibold mb-2 active:scale-[0.98]
          ${gs.speechEnabled !== false
            ? 'bg-green-100 text-green-700 border border-green-200'
            : 'bg-red-100 text-red-600 border border-red-200'}`}
      >
        {gs.speechEnabled !== false ? '🗣️ NPC Voice ON' : '🔇 NPC Voice OFF'}
      </button>

      {/* Auto-speak toggle */}
      <div className="flex items-center justify-between py-1.5">
        <span className="text-xs text-gray-600">Auto-read dialogue</span>
        <button
          onClick={() => onChangeSetting('autoSpeak', !gs.autoSpeak)}
          className={`text-xs px-2 py-1 rounded-lg ${
            gs.autoSpeak !== false
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-400'
          }`}
        >
          {gs.autoSpeak !== false ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Complexity mode */}
      <div className="mt-2">
        <div className="text-xs text-gray-600 font-medium mb-1">Question Difficulty</div>
        {Object.entries(complexityLabels).map(([key, label]) => (
          <button
            key={key}
            onClick={() => onChangeSetting('complexityMode', key)}
            className={`w-full text-left text-xs py-1.5 px-2 rounded-lg mb-1 active:scale-[0.98]
              ${(gs.complexityMode || 'adaptive') === key
                ? 'bg-purple-100 text-purple-700 border border-purple-200 font-semibold'
                : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
          >
            {(gs.complexityMode || 'adaptive') === key ? '● ' : '○ '}{label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MilestonesPanel — shows progression phases, completed & available milestones
// ---------------------------------------------------------------------------
function MilestonesPanel({ state, onClose }) {
  const summary = getProgressionSummary(state.milestones);
  const available = getAvailableMilestones(state);
  const completed = getCompletedMilestones(state.milestones);

  // Group available milestones by phase
  const byPhase = {};
  for (const m of available) {
    const p = m.phase;
    if (!byPhase[p]) byPhase[p] = [];
    byPhase[p].push(m);
  }

  return (
    <div className="absolute top-14 right-2 z-20 bg-white/85 backdrop-blur-sm rounded-xl shadow-lg p-3 w-80 max-h-[440px] overflow-y-auto pointer-events-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="font-bold text-gray-700 text-sm">Milestones</div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-400">
            {summary.completed}/{summary.total} · Phase {summary.currentPhase}
          </span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm px-1">✕</button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
        <div className="bg-purple-500 h-1.5 rounded-full transition-all" style={{ width: `${summary.percentage}%` }} />
      </div>

      {/* Phase summary row */}
      <div className="flex gap-1 mb-2 flex-wrap">
        {Object.entries(summary.phases).sort(([a], [b]) => a - b).map(([phase, data]) => (
          <div
            key={phase}
            className={`text-[9px] px-1.5 py-0.5 rounded-md border ${
              data.completed === data.total && data.total > 0
                ? 'bg-purple-100 border-purple-300 text-purple-700'
                : data.completed > 0
                  ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
                  : 'bg-gray-50 border-gray-200 text-gray-400'
            }`}
            title={`${PHASE_NAMES[phase]}: ${data.completed}/${data.total}`}
          >
            {PHASE_NAMES[phase]?.slice(0, 5) || phase}
          </div>
        ))}
      </div>

      {/* Available milestones grouped by phase */}
      {Object.entries(byPhase).sort(([a], [b]) => a - b).map(([phase, milestones]) => (
        <div key={phase} className="mb-2">
          <div className="text-[10px] font-semibold text-gray-500 mb-1">
            Phase {phase}: {PHASE_NAMES[phase] || ''}
          </div>
          {milestones.map((m) => (
            <div
              key={m.id}
              className={`rounded-lg p-2 mb-1 border ${
                m.ready
                  ? 'bg-green-50 border-green-300'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-xs">{m.icon}</span>
                <span className={`font-semibold text-xs ${m.ready ? 'text-green-700' : 'text-gray-700'}`}>
                  {m.name}
                </span>
                {m.ready && <span className="text-[9px] text-green-600 ml-auto">Ready!</span>}
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5">{m.description}</div>
              {/* Progress bar per milestone */}
              <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                <div
                  className={`h-1 rounded-full transition-all ${m.ready ? 'bg-green-500' : 'bg-yellow-400'}`}
                  style={{ width: `${Math.round(m.progress * 100)}%` }}
                />
              </div>
              {/* Show failing conditions */}
              {!m.ready && m.conditions && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {m.conditions.filter(c => !c.met).map((c, i) => (
                    <span key={i} className="text-[9px] bg-red-50 text-red-500 px-1 rounded border border-red-200">
                      {c.type}: {c.target || ''} ({c.current}/{c.required})
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ))}

      {available.length === 0 && completed.length === 0 && (
        <div className="text-center text-gray-400 text-xs py-4">Complete quests to unlock milestones!</div>
      )}

      {/* Completed milestones (collapsed) */}
      {completed.length > 0 && (
        <div className="mt-2 border-t border-gray-200 pt-2">
          <div className="text-[10px] font-semibold text-gray-400 mb-1">
            Completed ({completed.length})
          </div>
          {completed.map((m) => (
            <div key={m.id} className="flex items-center gap-1.5 py-0.5">
              <span className="text-[10px]">{m.icon}</span>
              <span className="text-[10px] text-gray-400 line-through">{m.name}</span>
              <span className="text-[9px] text-gray-300 ml-auto">Phase {m.phase}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// QuestBoardPanel — shows available, active, completed, and locked quests
// ---------------------------------------------------------------------------
function QuestBoardPanel({ state, onClose }) {
  const board = getQuestBoard(state);
  const trackIcons = { repair: '🔧', ecology: '🌿', science: '🔬', materials: '🔩', biology: '🧬', language: '🗣️' };
  const tierLabels = { 1: 'Survival', 2: 'Understanding', 3: 'Application', 4: 'Engineering', 5: 'Mastery' };

  return (
    <div className="absolute top-14 right-2 z-20 bg-white/85 backdrop-blur-sm rounded-xl shadow-lg p-3 w-80 max-h-[400px] overflow-y-auto">
      {/* Header with progress */}
      <div className="flex items-center justify-between mb-2">
        <div className="font-bold text-gray-700 text-sm">📋 Quest Board</div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-400">{board.stats.percentage}% · T{board.stats.currentTier}</span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm px-1">✕</button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
        <div className="bg-green-500 h-1.5 rounded-full transition-all" style={{ width: `${board.stats.percentage}%` }} />
      </div>

      {/* Active quest */}
      {board.active && (
        <div className="rounded-lg bg-blue-50 border-2 border-blue-300 p-2 mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs">{trackIcons[board.active.track] || '📋'}</span>
            <span className="font-semibold text-blue-700 text-xs">Active · T{board.active.tier}</span>
          </div>
          <div className="text-sm font-bold text-gray-800 mt-0.5">{board.active.title}</div>
          <div className="text-xs text-gray-500">Step {board.active.stepIndex + 1}/{board.active.totalSteps} · {tierLabels[board.active.tier] || ''}</div>
        </div>
      )}

      {/* Suggested quests (prioritized, max 4) */}
      {board.suggested?.length > 0 && !board.active && (
        <div className="mb-2">
          <div className="font-semibold text-green-700 text-xs mb-1">⭐ Suggested ({board.suggested.length})</div>
          {board.suggested.map((q) => (
            <div key={q.id} className="rounded-lg bg-green-50 border border-green-200 p-2 mb-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs">{trackIcons[q.track] || '📋'}</span>
                <span className="text-sm font-bold text-gray-800">{q.title}</span>
                {q.type === 'main' && <span className="text-[9px] bg-green-200 text-green-700 px-1 rounded">main</span>}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                T{q.tier} {tierLabels[q.tier]} · {q.track} · 💰{q.reward?.zuzubucks || 0}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Other available (if more than suggested) */}
      {board.available.length > (board.suggested?.length || 0) && (
        <div className="mb-2">
          <div className="font-semibold text-green-600 text-xs mb-1">🟢 Also Available ({board.available.length - (board.suggested?.length || 0)})</div>
          {board.available
            .filter((q) => !board.suggested?.some((s) => s.id === q.id))
            .map((q) => (
            <div key={q.id} className="rounded-lg bg-green-50/50 border border-green-100 p-1.5 mb-1">
              <div className="flex items-center gap-1">
                <span className="text-[10px]">{trackIcons[q.track] || '📋'}</span>
                <span className="text-xs font-semibold text-gray-700">{q.title}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Completed */}
      {board.completed.length > 0 && (
        <div className="mb-2">
          <div className="font-semibold text-gray-500 text-xs mb-1">✅ Completed ({board.completed.length})</div>
          {board.completed.map((q) => (
            <div key={q.id} className="rounded-lg bg-gray-50 border border-gray-200 p-1.5 mb-1 opacity-60">
              <div className="flex items-center gap-1">
                <span className="text-[10px]">{trackIcons[q.track] || '📋'}</span>
                <span className="text-xs text-gray-500">{q.title}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upcoming */}
      {board.upcoming?.length > 0 && (
        <div className="mb-2">
          <div className="font-semibold text-purple-600 text-xs mb-1">🔮 Upcoming</div>
          {board.upcoming.map((q) => (
            <div key={q.id} className="rounded-lg bg-purple-50 border border-purple-200 p-1.5 mb-1 opacity-80">
              <div className="flex items-center gap-1">
                <span className="text-[10px]">{trackIcons[q.track] || q.icon}</span>
                <span className="text-xs font-semibold text-purple-700">{q.title}</span>
                <span className="text-[9px] text-purple-400 ml-auto">T{q.tier}</span>
              </div>
              <div className="text-[10px] text-purple-400">{q.hint}</div>
            </div>
          ))}
        </div>
      )}

      {/* Locked */}
      <div>
        <div className="font-semibold text-gray-400 text-xs mb-1">🔒 Locked</div>
        {board.locked.map((q) => (
          <div key={q.id} className="rounded-lg bg-gray-50 border border-gray-100 p-1.5 mb-1 opacity-50">
            <div className="text-xs text-gray-400">{q.icon} {q.title}</div>
            <div className="text-[10px] text-gray-300">{q.hint}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ShopPanel — Zuzubucks garage shop
// ---------------------------------------------------------------------------
function ShopPanel({ state, onBuy, onClose }) {
  const items = getShopItems(state);
  return (
    <div className="absolute top-14 right-2 z-20 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-3 w-72 max-h-80 overflow-y-auto">
      <div className="flex items-center justify-between mb-2">
        <div className="font-bold text-gray-700 text-sm">🏪 Garage Shop</div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-amber-600">💰 {state?.zuzubucks || 0}</span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm px-1">✕</button>
        </div>
      </div>

      {items.map((item) => (
        <div key={item.id} className={`rounded-lg border p-2 mb-2 ${
          item.owned ? 'bg-green-50 border-green-200' :
          item.canBuy ? 'bg-white border-slate-200' :
          'bg-gray-50 border-gray-100 opacity-60'
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-xl">{item.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-gray-800 truncate">{item.name}</div>
              <div className="text-xs text-gray-500">{item.description}</div>
            </div>
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-xs font-bold text-amber-600">💰 {item.cost}</span>
            {item.owned ? (
              <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">Owned ✓</span>
            ) : item.locked ? (
              <span className="text-xs text-gray-400">{item.lockReason}</span>
            ) : item.canBuy ? (
              <button
                onClick={() => onBuy(item.id, item.cost)}
                className="bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full active:scale-95 hover:bg-amber-600"
              >Buy</button>
            ) : (
              <span className="text-xs text-gray-400">Not enough 💰</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
