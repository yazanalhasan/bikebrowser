import {
  createPlaceholderTextures,
  loadAct1CharacterAnimationSheets,
  loadAct1FinalAssets,
  loadAct1MaterialPartsSheet,
  loadAct1RouteMarkerSheet,
} from '../systems/AssetRegistry.js';
import { Act1RuntimeSystem } from '../systems/Act1RuntimeSystem.js';

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    this.load.json('act1NeighborhoodLayout', 'layouts/neighborhood.layout.json');
    // Skate Park (arc.md §4) level layouts — data-driven; consumed by the SkateScene (Phase 3).
    this.load.json('skateparkLevel1', 'layouts/skatepark.level1.json');
    // Anime character portraits (GPU-generated; shown when a character speaks).
    ['zuzu', 'dex', 'chen', 'ramirez', 'mariam'].forEach((c) => this.load.image(`portrait_${c}`, `portraits/${c}.png`));
    // Anime WORLD sprites (front + back cutouts) — the walking/moving characters.
    ['zuzu', 'dex', 'chen', 'ramirez', 'mariam'].forEach((c) => {
      this.load.image(`${c}_front`, `sprites/${c}_front.png`);
      this.load.image(`${c}_back`, `sprites/${c}_back.png`);
    });
    // Anime painted backdrops (GPU-generated scenery).
    ['crossing', 'skatepark', 'ground', 'utm', 'ecology', 'investigation', 'biome'].forEach((b) => this.load.image(`bg_${b}`, `backdrops/${b}.png`));
    loadAct1FinalAssets(this);
    loadAct1CharacterAnimationSheets(this);
    loadAct1RouteMarkerSheet(this);
    loadAct1MaterialPartsSheet(this);
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
    this.scene.launch('SkateScene');
    this.scene.launch('ChapterMapScene');
    this.scene.launch('CircuitBenchScene');
    this.scene.launch('ExtractionBenchScene');
    this.scene.launch('EngineDynoScene');
    this.scene.launch('CrashTestScene');
    this.scene.launch('BoatTankScene');
    this.scene.launch('PlaneTunnelScene');
    this.scene.launch('VacuumChamberScene');
    this.scene.launch('PhytoLabScene');
    this.scene.launch('MicroscopeScene');
    this.scene.launch('FermentBenchScene');
    this.scene.launch('MechanismScene');
    this.scene.launch('DebugScene');
  }
}
