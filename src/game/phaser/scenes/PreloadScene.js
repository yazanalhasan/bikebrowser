import {
  createPlaceholderTextures,
  loadAct1CharacterAnimationSheets,
  loadAct1FinalAssets,
  loadAct1RouteMarkerSheet,
} from '../systems/AssetRegistry.js';
import { Act1RuntimeSystem } from '../systems/Act1RuntimeSystem.js';

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    this.load.json('act1NeighborhoodLayout', 'layouts/neighborhood.layout.json');
    loadAct1FinalAssets(this);
    loadAct1CharacterAnimationSheets(this);
    loadAct1RouteMarkerSheet(this);
  }

  create() {
    createPlaceholderTextures(this);
    const runtime = new Act1RuntimeSystem(this.game);
    runtime.bindRegistry(this.registry);
    window.__GAME__ = runtime.createDebugApi();
    this.scene.start('NeighborhoodScene');
    this.scene.launch('QuestScene');
    this.scene.launch('DialogueScene');
    this.scene.launch('PredictionScene');
    this.scene.launch('BridgeDesignScene');
    this.scene.launch('LoadTestScene');
    this.scene.launch('CrossingScene');
    this.scene.launch('InvestigationScene');
    this.scene.launch('EcologyScene');
    this.scene.launch('BiomeScene');
    this.scene.launch('DebugScene');
  }
}
