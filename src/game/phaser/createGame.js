import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import PreloadScene from './scenes/PreloadScene.js';
import WorldMapScene from './scenes/WorldMapScene.js';
import NeighborhoodScene from './scenes/NeighborhoodScene.js';
import QuestScene from './scenes/QuestScene.js';
import DialogueScene from './scenes/DialogueScene.js';
import PredictionScene from './scenes/PredictionScene.js';
import BridgeDesignScene from './scenes/BridgeDesignScene.js';
import InvestigationScene from './scenes/InvestigationScene.js';
import EcologyScene from './scenes/EcologyScene.js';
import DebugScene from './scenes/DebugScene.js';

export function createGame(parent) {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: parent.clientWidth || 1280,
    height: parent.clientHeight || 720,
    backgroundColor: '#26322d',
    scale: {
      mode: Phaser.Scale.RESIZE,
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
      InvestigationScene,
      EcologyScene,
      DebugScene,
    ],
    audio: { noAudio: true },
    disableContextMenu: true,
  });
}
