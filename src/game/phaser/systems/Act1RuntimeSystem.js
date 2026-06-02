import { act1Dialogue } from '../../data/act1/index.js';
import { BikeSystem } from './BikeSystem.js';
import { ChemistrySystem } from './ChemistrySystem.js';
import { ConstructionSystem } from './ConstructionSystem.js';
import { DebugDiagnosticSystem } from './DebugDiagnosticSystem.js';
import { DiscoveryMapSystem } from './DiscoveryMapSystem.js';
import { EcologyObservationSystem } from './EcologyObservationSystem.js';
import { InventorySystem } from './InventorySystem.js';
import { LanguageSystem } from './LanguageSystem.js';
import { MaterialsLabSystem } from './MaterialsLabSystem.js';
import { NotebookSystem } from './NotebookSystem.js';
import { PredictionSystem } from './PredictionSystem.js';
import { QuestSystem } from './QuestSystem.js';
import { TrustSystem } from './TrustSystem.js';
import { PLACEHOLDER_ASSET_CONTRACT } from './AssetRegistry.js';
import { getAssetRegistryState } from './AssetRegistry.js';
import { clearRebuildState, loadRebuildState, saveRebuildState } from './SaveSystem.js';
import { Act1AudioSystem } from '../audio/Act1AudioSystem.js';

export class Act1RuntimeSystem {
  constructor(game = null) {
    this.game = game;
    this.sceneReady = false;
    this.requiredSystems = [
      'questSystem',
      'notebookSystem',
      'inventorySystem',
      'bikeSystem',
      'materialsLabSystem',
      'constructionSystem',
      'ecologySystem',
      'chemistrySystem',
      'trustSystem',
      'languageSystem',
      'discoveryMapSystem',
    ];
    this.questSystem = new QuestSystem();
    this.notebookSystem = new NotebookSystem();
    this.inventorySystem = new InventorySystem();
    this.bikeSystem = new BikeSystem();
    this.materialsLabSystem = new MaterialsLabSystem();
    this.predictionSystem = new PredictionSystem();
    this.constructionSystem = new ConstructionSystem(this.materialsLabSystem);
    this.ecologySystem = new EcologyObservationSystem();
    this.chemistrySystem = new ChemistrySystem();
    this.trustSystem = new TrustSystem();
    this.languageSystem = new LanguageSystem();
    this.discoveryMapSystem = new DiscoveryMapSystem();
    this.debugDiagnosticSystem = new DebugDiagnosticSystem(this);
    this.audioSystem = new Act1AudioSystem();
    this.assetContract = PLACEHOLDER_ASSET_CONTRACT;
    this.act1Complete = false;
    this.feedbackLog = [];
    this.lastFeedback = null;
  }

  bindRegistry(registry) {
    this.registry = registry;
    registry.set('act1Runtime', this);
    registry.set('questSystem', this.questSystem);
    registry.set('notebookSystem', this.notebookSystem);
    registry.set('inventorySystem', this.inventorySystem);
    registry.set('bikeSystem', this.bikeSystem);
    registry.set('materialsLabSystem', this.materialsLabSystem);
    registry.set('constructionSystem', this.constructionSystem);
    registry.set('ecologySystem', this.ecologySystem);
    registry.set('chemistrySystem', this.chemistrySystem);
    registry.set('trustSystem', this.trustSystem);
    registry.set('languageSystem', this.languageSystem);
    registry.set('discoveryMapSystem', this.discoveryMapSystem);
    registry.set('act1AudioSystem', this.audioSystem);
  }

  completeObjective(objectiveId) {
    return this.questSystem.completeObjective(objectiveId);
  }

  recordFeedback(kind, message, details = {}) {
    const entry = {
      id: `${Date.now()}-${this.feedbackLog.length}`,
      kind,
      message,
      details,
      createdAt: new Date().toISOString(),
    };
    this.feedbackLog.push(entry);
    this.feedbackLog = this.feedbackLog.slice(-20);
    this.lastFeedback = entry;
    this.registry?.events?.emit('act1:feedback', entry);
    this.routeFeedbackAudio(kind);
    return entry;
  }

  routeFeedbackAudio(kind) {
    const cueByKind = {
      notebook: 'notebook_open',
      bike: 'material_test',
      utm: 'material_test',
      bridge: 'bridge_confirm',
      map: 'map_unlock',
      chemistry: 'chemistry_success',
      ecology: 'ecology_observe',
      trust: 'trust_gain',
      language: 'trust_gain',
      discovery: 'map_unlock',
      inventory: 'material_test',
    };
    if (cueByKind[kind]) this.audioSystem.playInteractionCue(cueByKind[kind]);
  }

  unlockNotebookEntries(entryIds = []) {
    const results = this.notebookSystem.unlockMany(entryIds);
    for (const result of results) {
      if (result.ok && result.isNew) this.recordFeedback('notebook', `New field note: ${result.entry.title}`, result.entry);
    }
    return results;
  }

  applyDialogueEffects(dialogueId) {
    const entry = act1Dialogue.find((dialogue) => dialogue.id === dialogueId);
    if (!entry) return { ok: false, reason: 'unknown_dialogue', dialogueId };
    this.unlockNotebookEntries(entry.notebook || []);
    this.inventorySystem.addMany(entry.inventory || []);
    for (const objectiveId of entry.completes || []) this.completeObjective(objectiveId);
    for (const [characterId, amount] of Object.entries(entry.trust || {})) this.trustSystem.addTrust(characterId, amount, dialogueId);
    if (entry.language) {
      this.languageSystem.record(`${entry.language}_${dialogueId}`, {
        language: entry.language,
        speaker: entry.speaker,
        phrase: entry.language === 'spanish' ? 'Gracias' : 'Ahlan',
        translation: entry.language === 'spanish' ? 'Thank you' : 'Welcome',
        context: dialogueId,
      });
      this.recordFeedback('language', `${entry.speaker}: ${entry.language === 'spanish' ? 'Gracias' : 'Ahlan'} (${entry.language}).`);
    }
    return { ok: true, dialogueId };
  }

  handleInteraction(action) {
    const handlers = {
      bike_check: () => {
        this.bikeSystem.checkBike();
        this.unlockNotebookEntries(['bike_check']);
        this.completeObjective('inspect_bike');
        this.completeObjective('unlock_garage');
        this.recordFeedback('bike', 'Bike check complete: tires, brakes, chain, frame checked.');
        return { ok: true };
      },
      dry_wash: () => {
        this.audioSystem.transitionMusic('bridge_problem');
        this.audioSystem.setAmbient('dry_wash');
        this.discoveryMapSystem.discover('dry_wash');
        this.discoveryMapSystem.discover('bridge');
        this.unlockNotebookEntries(['broken_wash', 'bridge_problem']);
        this.completeObjective('find_bridge_path');
        this.completeObjective('discover_wash');
        this.completeObjective('inspect_bridge');
        this.recordFeedback('discovery', 'Dry wash mapped. The bridge needs proof before anyone crosses.');
        return { ok: true };
      },
      collect_materials: () => {
        this.inventorySystem.addMany(['steel', 'copper_brace', 'weak_scrap']);
        this.unlockNotebookEntries(['steel', 'copper_brace', 'weak_scrap']);
        ['collect_steel', 'collect_copper', 'collect_scrap'].forEach((id) => this.completeObjective(id));
        this.recordFeedback('inventory', 'Candidate materials collected: steel, copper brace, weak scrap.');
        return { ok: true };
      },
      ecology_patch: () => {
        this.inventorySystem.add('mesquite');
        this.completeObjective('collect_mesquite');
        // Observe all three desert plants respectfully: completes the
        // desert_helper objectives (observe_mesquite/creosote/saguaro) and
        // unlocks their ecology notebook entries (mesquite/creosote/saguaro).
        ['mesquite', 'creosote', 'saguaro'].forEach((species) => this.observeEcology(species));
        return { ok: true };
      },
      utm: () => ['mesquite', 'steel', 'copper_brace', 'weak_scrap'].map((id) => this.testMaterial(id)),
      bridge_plan: () => this.completeBridgePlan('tested_triangle_plan'),
      repair_bridge: () => this.repairBridge(),
      chemistry_station: () => this.runChemistryRecipe('sealant_patch'),
      spanish_neighbor: () => this.applyDialogueEffects('spanish_trust'),
      arabic_mentor: () => this.applyDialogueEffects('arabic_welcome'),
      wider_gate: () => this.unlockWiderMap(),
    };
    return handlers[action]?.() || { ok: false, reason: 'unknown_action', action };
  }

  testMaterial(materialId) {
    this.audioSystem.transitionMusic('utm_testing');
    this.audioSystem.setAmbient('garage_testing');
    const result = this.materialsLabSystem.testMaterial(materialId);
    if (!result.ok) return result;
    this.unlockNotebookEntries(['material_test_results']);
    const objectiveByMaterial = {
      mesquite: 'test_mesquite',
      steel: 'test_steel',
      copper_brace: 'test_copper',
      weak_scrap: 'test_scrap',
    };
    if (objectiveByMaterial[materialId]) this.completeObjective(objectiveByMaterial[materialId]);
    this.recordFeedback('utm', `${result.result.displayName}: ${result.result.verdict} (${result.result.loadResult}).`, result.result);
    // Phase 1.3: if the player predicted this material before testing, resolve
    // the prediction against the real verdict and record the reasoning outcome.
    const predicted = this.predictionSystem.resolve(materialId, result.result.bridgeSafe);
    if (predicted && predicted.resolved) {
      this.unlockNotebookEntries(['prediction_log']);
      const verdictWord = result.result.bridgeSafe ? 'safe' : 'not safe';
      this.recordFeedback(
        'reasoning',
        predicted.correct
          ? `Prediction checked: you said ${predicted.willHold ? 'safe' : 'not safe'} (${predicted.confidence}) and the test agrees — it is ${verdictWord}.`
          : `Prediction checked: you said ${predicted.willHold ? 'safe' : 'not safe'} (${predicted.confidence}), but the test shows ${verdictWord}. Evidence beats a guess.`,
        { ...predicted, materialId }
      );
    }
    return { ...result, prediction: predicted };
  }

  predictMaterial(materialId, willHold, confidence = 'medium') {
    if (!this.materialsLabSystem.materials.has(materialId)) {
      return { ok: false, reason: 'unknown_material', materialId };
    }
    const prediction = this.predictionSystem.record(materialId, willHold, confidence);
    this.recordFeedback(
      'reasoning',
      `Prediction recorded for ${materialId}: ${prediction.willHold ? 'will hold' : 'will not hold'} (${prediction.confidence}). Now test to check.`,
      prediction
    );
    return { ok: true, prediction };
  }

  completeBridgePlan(planId) {
    const result = this.constructionSystem.completeBridgePlan(planId);
    if (!result.ok) {
      this.recordFeedback('bridge', result.explanation || 'Bridge plan needs better evidence.', result);
      return result;
    }
    this.unlockNotebookEntries(['bridge_plan']);
    ['choose_deck', 'choose_support', 'choose_brace'].forEach((id) => this.completeObjective(id));
    this.recordFeedback('bridge', 'Bridge plan ready: triangles, supports, and tested materials.', result.plan);
    return result;
  }

  repairBridge() {
    const result = this.constructionSystem.repairBridge();
    if (!result.ok) {
      this.recordFeedback('bridge', 'The bridge still needs a tested plan before repair.', result);
      return result;
    }
    this.bikeSystem.upgradeBike();
    this.completeObjective('repair_bridge');
    const crossing = this.constructionSystem.crossBridge();
    this.completeObjective('cross_bridge');
    this.discoveryMapSystem.discover('wider_gate');
    this.unlockNotebookEntries(['bridge_repaired']);
    this.audioSystem.transitionMusic('map_unlock');
    this.recordFeedback(
      'bridge',
      'Bridge repaired: Zuzu tested, built, crossed, and the path feels safe again.',
      { ...result, crossingMoment: crossing.crossingMoment }
    );
    return { ...result, crossingMoment: crossing.crossingMoment };
  }

  observeEcology(speciesId) {
    this.audioSystem.transitionMusic('ecology_chemistry');
    this.audioSystem.setAmbient('ecology_patch');
    const result = this.ecologySystem.observe(speciesId);
    if (!result.ok) return result;
    // Unlock the shared desert_plant entry plus the species-specific entry so
    // each observation is a visible field note (notebook 13/16 -> 16/18 ecology).
    const notebookBySpecies = { mesquite: 'mesquite', creosote: 'creosote', saguaro: 'saguaro' };
    const entries = ['desert_plant'];
    if (notebookBySpecies[speciesId]) entries.push(notebookBySpecies[speciesId]);
    this.unlockNotebookEntries(entries);
    const objectiveBySpecies = {
      mesquite: 'observe_mesquite',
      creosote: 'observe_creosote',
      saguaro: 'observe_saguaro',
    };
    if (objectiveBySpecies[speciesId]) this.completeObjective(objectiveBySpecies[speciesId]);
    this.recordFeedback('ecology', `${result.observation.displayName}: ${result.observation.heat}, ${result.observation.water}.`, result.observation);
    return result;
  }

  runChemistryRecipe(recipeId) {
    this.audioSystem.transitionMusic('ecology_chemistry');
    this.audioSystem.setAmbient('chemistry_station');
    const result = this.chemistrySystem.runRecipe(recipeId);
    if (!result.ok) return result;
    this.unlockNotebookEntries(['chemistry_result']);
    this.completeObjective('mix_sealant');
    this.completeObjective('dry_sealant');
    this.recordFeedback('chemistry', 'Recipe tested: mix, wait, test before trusting the result.', result.result);
    return result;
  }

  recordLanguageInteraction(interactionId) {
    if (interactionId.includes('spanish')) return this.applyDialogueEffects('spanish_trust');
    if (interactionId.includes('arabic')) return this.applyDialogueEffects('arabic_welcome');
    return this.languageSystem.record(interactionId);
  }

  earnTrust() {
    this.trustSystem.addTrust('neighbor', 1, 'showed_bridge_evidence');
    this.unlockNotebookEntries(['trust_milestone']);
    this.completeObjective('earn_trust');
    this.recordFeedback('trust', 'Trust grew because Zuzu showed evidence, not guesses.');
    return { ok: true };
  }

  unlockWiderMap() {
    if (!this.constructionSystem.bridgeReconnected) {
      const result = { ok: false, reason: 'bridge_not_reconnected' };
      this.recordFeedback('map', 'The wider route waits until the crossing is safe.', result);
      return result;
    }
    this.discoveryMapSystem.unlockWiderMap();
    this.unlockNotebookEntries(['wider_map_unlocked']);
    this.completeObjective('unlock_gate');
    this.completeObjective('find_space_clue');
    this.act1Complete = true;
    this.recordFeedback('map', 'Wider map unlocked. A larger systems mystery is waiting.');
    return { ok: true, act1Complete: true };
  }

  canCompleteAct1() {
    return ['mesquite', 'steel', 'copper_brace', 'weak_scrap'].every((id) => this.materialsLabSystem.materials.has(id));
  }

  getAct1State() {
    return {
      schemaVersion: 2,
      sceneReady: this.sceneReady,
      act1Complete: this.act1Complete,
      quests: this.questSystem.getState(),
      notebook: this.notebookSystem.getState(),
      inventory: this.inventorySystem.getState(),
      bike: this.bikeSystem.getState(),
      materialTests: this.materialsLabSystem.getState(),
      prediction: this.predictionSystem.getState(),
      bridge: this.constructionSystem.getState(),
      ecology: this.ecologySystem.getState(),
      chemistry: this.chemistrySystem.getState(),
      trust: this.trustSystem.getState(),
      language: this.languageSystem.getState(),
      discovery: this.discoveryMapSystem.getState(),
      feedback: {
        last: this.lastFeedback,
        log: this.feedbackLog,
      },
    };
  }

  saveGame = () => saveRebuildState(this.getAct1State());

  loadGame = () => {
    const state = loadRebuildState();
    if (!state) return { ok: false, reason: 'no_save' };
    const validation = this.validateLoadedState(state);
    if (!validation.ok) {
      this.recordFeedback('save', 'Save could not be restored cleanly. Starting from a safe state.', validation);
      return { ok: false, reason: 'invalid_save', validation };
    }
    this.loadState(state);
    return { ok: true, state: this.getAct1State() };
  };

  validateLoadedState(state) {
    const requiredObjects = ['quests', 'notebook', 'inventory', 'bike', 'materialTests', 'bridge', 'ecology', 'chemistry', 'trust', 'language', 'discovery'];
    const missing = requiredObjects.filter((key) => !state || typeof state[key] !== 'object');
    return { ok: missing.length === 0, missing };
  }

  loadState(state = {}) {
    this.act1Complete = Boolean(state.act1Complete);
    this.feedbackLog = Array.isArray(state.feedback?.log) ? state.feedback.log.slice(-20) : [];
    this.lastFeedback = state.feedback?.last || this.feedbackLog.at(-1) || null;
    this.questSystem.loadState(state.quests);
    this.notebookSystem.loadState(state.notebook);
    this.inventorySystem.loadState(state.inventory);
    this.bikeSystem.loadState(state.bike);
    this.materialsLabSystem.loadState(state.materialTests);
    this.predictionSystem.loadState(state.prediction);
    this.constructionSystem.loadState(state.bridge);
    this.ecologySystem.loadState(state.ecology);
    this.chemistrySystem.loadState(state.chemistry);
    this.trustSystem.loadState(state.trust);
    this.languageSystem.loadState(state.language);
    this.discoveryMapSystem.loadState(state.discovery);
  }

  resetAct1 = () => {
    clearRebuildState();
    const fresh = new Act1RuntimeSystem(this.game);
    this.questSystem = fresh.questSystem;
    this.notebookSystem = fresh.notebookSystem;
    this.inventorySystem = fresh.inventorySystem;
    this.bikeSystem = fresh.bikeSystem;
    this.materialsLabSystem = fresh.materialsLabSystem;
    this.predictionSystem = fresh.predictionSystem;
    this.constructionSystem = fresh.constructionSystem;
    this.ecologySystem = fresh.ecologySystem;
    this.chemistrySystem = fresh.chemistrySystem;
    this.trustSystem = fresh.trustSystem;
    this.languageSystem = fresh.languageSystem;
    this.discoveryMapSystem = fresh.discoveryMapSystem;
    this.audioSystem.stopSpeech();
    this.act1Complete = false;
    this.feedbackLog = [];
    this.lastFeedback = null;
    this.debugDiagnosticSystem = new DebugDiagnosticSystem(this);
    if (this.registry) this.bindRegistry(this.registry);
    return { ok: true, state: this.getAct1State() };
  };

  runAct1Diagnostic = () => this.debugDiagnosticSystem.run();

  createDebugApi() {
    return {
      getAct1State: () => this.getAct1State(),
      runAct1Diagnostic: () => this.runAct1Diagnostic(),
      getQuestState: () => this.questSystem.getState(),
      getNotebookState: () => this.notebookSystem.getState(),
      getInventoryState: () => this.inventorySystem.getState(),
      getMaterialTestState: () => this.materialsLabSystem.getState(),
      getBridgeState: () => this.constructionSystem.getState(),
      getDiscoveryState: () => this.discoveryMapSystem.getState(),
      getTrustState: () => this.trustSystem.getState(),
      getLanguageState: () => this.languageSystem.getState(),
      getAudioState: () => this.audioSystem.getState(),
      getAssetRegistryState: () => getAssetRegistryState(),
      normalizeSpeech: (text, context) => this.audioSystem.normalizer.normalize(text, context),
      getVoiceProfile: (speakerOrVoiceId) => this.audioSystem.voiceRegistry.getProfile(speakerOrVoiceId),
      speakLine: (text, voiceId, options) => this.audioSystem.speakLine(text, voiceId, options),
      stopSpeech: () => this.audioSystem.stopSpeech(),
      replaySpeech: () => this.audioSystem.replayLast(),
      unlockAudio: () => this.audioSystem.unlockAudio(),
      setAudioSettings: (settings) => this.audioSystem.setSettings(settings),
      transitionMusic: (stateKey) => this.audioSystem.transitionMusic(stateKey),
      playInteractionCue: (cueId) => this.audioSystem.playInteractionCue(cueId),
      getFeedbackState: () => ({ last: this.lastFeedback, log: this.feedbackLog }),
      validateLoadedState: (state) => this.validateLoadedState(state),
      saveGame: () => this.saveGame(),
      loadGame: () => this.loadGame(),
      resetAct1: () => this.resetAct1(),
      testMaterial: (materialId) => this.testMaterial(materialId),
      predictMaterial: (materialId, willHold, confidence) => this.predictMaterial(materialId, willHold, confidence),
      completeBridgePlan: (planId) => this.completeBridgePlan(planId),
      observeEcology: (speciesId) => this.observeEcology(speciesId),
      runChemistryRecipe: (recipeId) => this.runChemistryRecipe(recipeId),
      recordLanguageInteraction: (interactionId) => this.recordLanguageInteraction(interactionId),
      earnTrust: () => this.earnTrust(),
      handleInteraction: (action) => this.handleInteraction(action),
      repairBridge: () => this.repairBridge(),
      unlockWiderMap: () => this.unlockWiderMap(),
      recordFeedback: (kind, message, details) => this.recordFeedback(kind, message, details),
    };
  }
}
