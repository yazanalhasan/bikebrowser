import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import PreloadScene from './scenes/PreloadScene.js';
import WorldMapScene from './scenes/WorldMapScene.js';
import NeighborhoodScene from './scenes/NeighborhoodScene.js';
import QuestScene from './scenes/QuestScene.js';
import DialogueScene from './scenes/DialogueScene.js';
import PredictionScene from './scenes/PredictionScene.js';
import BridgeDesignScene from './scenes/BridgeDesignScene.js';
import LoadTestScene from './scenes/LoadTestScene.js';
import CrossingScene from './scenes/CrossingScene.js';
import InvestigationScene from './scenes/InvestigationScene.js';
import EcologyScene from './scenes/EcologyScene.js';
import BiomeScene from './scenes/BiomeScene.js';
import SkateScene from './scenes/SkateScene.js';
import ChapterMapScene from './scenes/ChapterMapScene.js';
import DebugScene from './scenes/DebugScene.js';

export function createGame(parent) {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    // Fixed 1280x720 logical view scaled to FIT the window and centered, so the
    // game fills the screen (bigger on large monitors) instead of rendering the
    // world at native size with empty margins. Keeps in-game coords stable.
    width: 1280,
    height: 720,
    backgroundColor: '#26322d',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 0 },
        debug: false,
      },
    },
    scene: [
      BootScene,
      PreloadScene,
      WorldMapScene,
      NeighborhoodScene,
      QuestScene,
      DialogueScene,
      PredictionScene,
      BridgeDesignScene,
      LoadTestScene,
      CrossingScene,
      InvestigationScene,
      EcologyScene,
      BiomeScene,
      SkateScene,
      ChapterMapScene,
      DebugScene,
    ],
    audio: { noAudio: true },
    disableContextMenu: true,
  });
}
