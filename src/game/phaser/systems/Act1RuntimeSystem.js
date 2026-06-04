import { act1Dialogue, act1WorldMapPoints } from '../../data/act1/index.js';
import { BikeSystem } from './BikeSystem.js';
import { BiomeSystem } from './BiomeSystem.js';
import { ChemistrySystem } from './ChemistrySystem.js';
import { ConstructionSystem } from './ConstructionSystem.js';
import { DebugDiagnosticSystem } from './DebugDiagnosticSystem.js';
import { DiscoveryMapSystem } from './DiscoveryMapSystem.js';
import { DiscoveryRegistrySystem } from './DiscoveryRegistrySystem.js';
import { EcologyObservationSystem } from './EcologyObservationSystem.js';
import { InventorySystem } from './InventorySystem.js';
import { InvestigationSystem } from './InvestigationSystem.js';
import { LanguageSystem } from './LanguageSystem.js';
import { MaterialsLabSystem } from './MaterialsLabSystem.js';
import { NotebookSystem } from './NotebookSystem.js';
import { PredictionSystem } from './PredictionSystem.js';
import { QuestSystem } from './QuestSystem.js';
import { ReasoningGrader } from './ReasoningGrader.js';
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
    this.investigationSystem = new InvestigationSystem();
    this.chemistrySystem = new ChemistrySystem();
    this.trustSystem = new TrustSystem();
    this.languageSystem = new LanguageSystem();
    this.discoveryMapSystem = new DiscoveryMapSystem();
    this.discoveryRegistry = new DiscoveryRegistrySystem();
    this.biomeSystem = new BiomeSystem();
    this.debugDiagnosticSystem = new DebugDiagnosticSystem(this);
    this.audioSystem = new Act1AudioSystem();
    this.assetContract = PLACEHOLDER_ASSET_CONTRACT;
    this.act1Complete = false;
    this.feedbackLog = [];
    this.lastFeedback = null;
    this.zuzuBucks = 0;           // reward currency, earned on first quest/objective completion
    this.saltRiverComplete = false;
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
    registry.set('discoveryRegistry', this.discoveryRegistry);
    registry.set('biomeSystem', this.biomeSystem);
    registry.set('act1AudioSystem', this.audioSystem);
    if (this._boundBiomeComplete && this._boundBiomeRegistry && this._boundBiomeRegistry !== registry) {
      this._boundBiomeRegistry.events.off('biome:complete', this._boundBiomeComplete);
    }
    if (!this._boundBiomeComplete) this._boundBiomeComplete = (event) => this.completeBiome(event);
    if (this._boundBiomeRegistry !== registry) {
      registry.events.on('biome:complete', this._boundBiomeComplete);
      this._boundBiomeRegistry = registry;
    }
  }

  completeObjective(objectiveId) {
    const result = this.questSystem.completeObjective(objectiveId);
    // Reward FIRST-time completion only (replays of a finished mini-game give no
    // repeat payout — fixes "redo over and over"). Objective = small payout;
    // finishing the whole quest = a bonus + fanfare.
    if (result.ok && result.newObjective) {
      this.awardZuzuBucks(5, { kind: 'objective', objectiveId });
    }
    if (result.ok && result.newQuest) {
      const quest = this.questSystem.quests.get(result.newQuest);
      this.awardZuzuBucks(25, { kind: 'quest', questId: result.newQuest, questName: quest?.name });
    }
    return result;
  }

  // Grant ZuzuBucks, play the reward chime, and surface a toast. `meta.kind`
  // 'quest' triggers the bigger fanfare.
  awardZuzuBucks(amount, meta = {}) {
    if (!amount) return this.zuzuBucks;
    this.zuzuBucks += amount;
    const isQuest = meta.kind === 'quest';
    this.audioSystem.playRewardChime(isQuest ? 'quest' : 'objective');
    this.audioSystem.playInteractionCue(isQuest ? 'map_unlock' : 'trust_gain');
    const message = isQuest
      ? `✦ Quest complete: ${meta.questName || 'done'}!  +${amount} ZuzuBucks`
      : `+${amount} ZuzuBucks`;
    this.recordFeedback('reward', message, { amount, total: this.zuzuBucks, ...meta });
    this.registry?.events?.emit('zuzubucks:changed', { total: this.zuzuBucks, delta: amount, meta });
    if (isQuest) this.registry?.events?.emit('reward:quest', { total: this.zuzuBucks, ...meta });
    return this.zuzuBucks;
  }

  spendZuzuBucks(amount) {
    if (amount > this.zuzuBucks) return { ok: false, reason: 'insufficient', total: this.zuzuBucks };
    this.zuzuBucks -= amount;
    this.registry?.events?.emit('zuzubucks:changed', { total: this.zuzuBucks, delta: -amount });
    return { ok: true, total: this.zuzuBucks };
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

  // Phase 2.2 (Fun) — discoveries MATTER: what each discovery unlocks/reveals.
  // Discovering the City Gate (by exploring to the map edge) reveals the Salt
  // River expedition, which is hidden until then — a discovery that affects
  // progression, not a collectible.
  getDiscoveryUnlocks() {
    const ids = new Set((this.discoveryRegistry.getState().entries || []).map((e) => e.id));
    return {
      saltRiverRevealed: ids.has('landmark_city_gate'),
    };
  }

  // Phase 2.2 — register a discovery. On a genuinely-new discovery, fire the
  // "NEW DISCOVERY" feedback + event so the player sees it, and the registry
  // persists it (connecting notebook/ecology/investigation/engineering).
  registerDiscovery(entry) {
    const result = this.discoveryRegistry.register(entry);
    if (result.ok && result.isNew) {
      this.recordFeedback('discovery', `NEW DISCOVERY — ${result.entry.title}`, result.entry);
      this.registry?.events?.emit('discovery:new', result.entry);
    }
    return result;
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
      this.registerDiscovery({ id: `language_${entry.language}`, category: 'language', title: `${entry.language === 'spanish' ? 'Spanish' : 'Arabic'}: ${entry.language === 'spanish' ? 'Gracias' : 'Ahlan'}`, detail: `${entry.speaker} — ${entry.language === 'spanish' ? '"thank you"' : '"welcome"'}.`, source: 'language' });
    }
    // Discovery: a fact learned from this person (any dialogue with notebook facts).
    if ((entry.notebook || []).length || entry.trust) {
      this.registerDiscovery({ id: `npc_${dialogueId}`, category: 'npc_fact', title: `${entry.speaker}'s account`, detail: (entry.lines && entry.lines[0]) || dialogueId, source: 'dialogue' });
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
        this.registerDiscovery({ id: 'landmark_dry_wash', category: 'landmark', title: 'The Dry Wash', detail: 'A monsoon channel that floods fast and runs dry — the broken crossing is here.', source: 'exploration' });
        this.registerDiscovery({ id: 'landmark_broken_bridge', category: 'landmark', title: 'The broken crossing', detail: 'The footbridge washed out in a flood — it needs a proven repair.', source: 'exploration' });
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
    // Phase 1.5: gate testing on collection — you can't test a material you
    // haven't gathered. Clear incomplete-state feedback, no skipping.
    if (!this.inventorySystem.has(materialId)) {
      const displayName = this.materialsLabSystem.materials.get(materialId)?.displayName || materialId;
      this.recordFeedback('utm', `Collect ${displayName} before you can test it in the UTM.`, { materialId, gated: 'not_collected' });
      return { ok: false, reason: 'not_collected', materialId };
    }
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
    // Discovery: a tested material (with its strength evidence).
    this.registerDiscovery({ id: `material_${materialId}`, category: 'material', title: result.result.displayName, detail: `${result.result.verdict} — ${result.result.strengthBand}.`, source: 'utm' });
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

  // Phase 1.6 — player chooses materials for the bridge; the outcome depends on
  // the choice. A weak material in a load-bearing role fails with a specific
  // reason; an all-safe design succeeds and creates the plan.
  designBridge(selection) {
    const result = this.constructionSystem.designBridge(selection);
    if (!result.ok) {
      this.recordFeedback('bridge', result.explanation || 'That bridge design is not safe yet — choose tested, strong materials.', result);
      return result;
    }
    this.unlockNotebookEntries(['bridge_plan']);
    ['choose_deck', 'choose_support', 'choose_brace'].forEach((id) => this.completeObjective(id));
    this.recordFeedback('bridge', `Bridge design accepted: ${result.explanation}`, result.plan);
    // Discovery: an engineering concept — a sound load path from tested parts.
    this.registerDiscovery({ id: 'concept_safe_load_path', category: 'engineering', title: 'Safe load path', detail: 'A bridge is only as strong as its weakest load-bearing part — choose tested, strong materials per role.', source: 'bridge' });
    return result;
  }

  predictMaterial(materialId, willHold, confidence = 'medium', explanation = '') {
    if (!this.materialsLabSystem.materials.has(materialId)) {
      return { ok: false, reason: 'unknown_material', materialId };
    }
    const prediction = this.predictionSystem.record(materialId, willHold, confidence, explanation);
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
    // Discovery: a landmark — the repaired crossing opens the wider map.
    this.registerDiscovery({ id: 'landmark_crossing', category: 'landmark', title: 'The repaired crossing', detail: 'The rebuilt bridge reconnects the neighborhood to the wider map.', source: 'engineering' });
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
    // Discovery: the plant itself (and the saguaro is also a landmark).
    const obs = result.observation;
    this.registerDiscovery({ id: `plant_${speciesId}`, category: 'plant', title: obs.displayName, detail: `${obs.heat}; ${obs.water}; ${obs.habitat}.`, source: 'ecology' });
    if (speciesId === 'saguaro') {
      this.registerDiscovery({ id: 'landmark_saguaro', category: 'landmark', title: 'Saguaro landmark', detail: 'A desert landmark — never harvested; used to navigate.', source: 'ecology' });
    }
    return result;
  }

  // Phase 1.95 — Ecology Reachability (observe -> predict -> outcome -> payoff).
  // The player reasons about which desert plant fits a site (water/shade/
  // habitat) and learns from being right OR wrong. Reuses the notebook + the
  // reasoning-style "wrong-but-corrected still teaches" framing.
  observeEcologyPlacement(id) {
    this.audioSystem.transitionMusic('ecology_chemistry');
    this.audioSystem.setAmbient('ecology_patch');
    const result = this.ecologySystem.observePlacement(id);
    if (result.ok) this.recordFeedback('ecology', `Site: ${result.placement.site}`, result.placement);
    return result;
  }

  predictEcologyPlacement(id, speciesId) {
    const result = this.ecologySystem.predictPlacement(id, speciesId);
    if (result.ok) this.recordFeedback('ecology', `You expect ${this.ecologySystem._speciesName(speciesId)} to thrive here.`, result);
    return result;
  }

  resolveEcologyPlacement(id) {
    const result = this.ecologySystem.resolvePlacement(id);
    if (!result.ok) {
      this.recordFeedback('ecology', 'Observe the site and predict a plant before you plant it.', result);
      return result;
    }
    this.unlockNotebookEntries(['desert_plant', result.notebookEntry].filter(Boolean));
    this.recordFeedback('ecology', `${result.thrives ? 'It thrives.' : 'It struggles.'} ${result.why}`, result);
    // Discovery: the ecology concept — which plant fits which site, and why.
    this.registerDiscovery({ id: `concept_fit_${id}`, category: 'engineering', title: `Right plant, right place: ${result.correctName}`, detail: result.correctWhy, source: 'ecology' });
    this.registerDiscovery({ id: `plant_${result.correct}`, category: 'plant', title: result.correctName, detail: result.correctWhy, source: 'ecology' });
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
      saltRiverComplete: this.saltRiverComplete,
      zuzuBucks: this.zuzuBucks,
      quests: this.questSystem.getState(),
      notebook: this.notebookSystem.getState(),
      inventory: this.inventorySystem.getState(),
      bike: this.bikeSystem.getState(),
      materialTests: this.materialsLabSystem.getState(),
      prediction: this.predictionSystem.getState(),
      bridge: this.constructionSystem.getState(),
      ecology: this.ecologySystem.getState(),
      investigation: this.investigationSystem.getState(),
      chemistry: this.chemistrySystem.getState(),
      trust: this.trustSystem.getState(),
      language: this.languageSystem.getState(),
      discovery: this.discoveryMapSystem.getState(),
      discoveryRegistry: this.discoveryRegistry.getState(),
      discoveryUnlocks: this.getDiscoveryUnlocks(),
      worldMap: this.getWorldMap(),
      biomes: this.biomeSystem.getState(),
      engineeringLoop: this.getEngineeringLoop(),
      reasoning: this.assessReasoning(),
      feedback: {
        last: this.lastFeedback,
        log: this.feedbackLog,
      },
    };
  }

  // Phase 1.7: grade HOW the player reasoned (prediction, evidence, correction,
  // calibration, explanation) — a learning assessment, not a correctness score.
  assessReasoning() {
    return ReasoningGrader.assess({
      predictions: this.predictionSystem.getState().predictions,
      testedCount: this.materialsLabSystem.getState().tested.length,
      bridgePlan: this.constructionSystem.getState().plan,
    });
  }

  // Phase 1.8 — Dry Wash investigation loop (Observe -> Hypothesize ->
  // Investigate -> Evidence -> Conclude). Reuses notebook + reasoning style.
  observeMystery(id) {
    const result = this.investigationSystem.observe(id);
    if (result.ok) this.recordFeedback('investigation', `Observation: ${result.observation}`, result);
    return result;
  }

  hypothesizeMystery(id, hypothesisId) {
    const result = this.investigationSystem.hypothesize(id, hypothesisId);
    if (result.ok) {
      this.recordFeedback('investigation', `Hypothesis: ${result.hypothesis.text}${result.misleading ? ' — do not assume; investigate it.' : ''}`, result);
    }
    return result;
  }

  investigateMystery(id) {
    const result = this.investigationSystem.investigate(id);
    if (result.ok) {
      this.recordFeedback('investigation', result.disprovesHypothesis ? 'The evidence contradicts your hypothesis.' : 'The evidence fits your hypothesis.', result);
    }
    return result;
  }

  concludeMystery(id) {
    const result = this.investigationSystem.conclude(id);
    if (!result.ok) {
      this.recordFeedback('investigation', 'Gather evidence before you conclude.', result);
      return result;
    }
    if (result.notebookEntry) this.unlockNotebookEntries([result.notebookEntry]);
    this.recordFeedback('investigation', `${result.correctedFromMisleading ? 'You changed your mind with evidence. ' : ''}Conclusion: ${result.conclusion.text}`, result);
    // Discovery: the solved investigation (engineering/ecology insight), plus
    // for the wash, the wildlife that uses it (an animal discovery).
    this.registerDiscovery({ id: `investigation_${id}`, category: 'investigation', title: `Solved: ${id.replace(/_/g, ' ')}`, detail: result.conclusion.text, source: 'investigation' });
    if (id === 'green_strip' || id === 'wash_out_cause') {
      this.registerDiscovery({ id: 'animal_wash_paths', category: 'animal', title: 'Wash wildlife paths', detail: 'Animals travel the wash for its subsurface water and cover — keep their paths clear.', source: 'investigation' });
    }
    return result;
  }

  // Phase 1.5: the player-visible engineering loop. Surfaces which step is done
  // and what is next, so no objective is hidden and incomplete states are clear.
  getEngineeringLoop() {
    const unlocked = this.notebookSystem.getState().unlocked || [];
    const bridge = this.constructionSystem.getState();
    const steps = {
      observe: unlocked.includes('desert_plant'),
      predict: this.predictionSystem.getState().made > 0,
      test: this.materialsLabSystem.getState().tested.length > 0,
      build: Boolean(bridge.plan),
      verify: Boolean(bridge.bridgeReconnected),
    };
    const nextStep = Object.entries(steps).find(([, done]) => !done);
    return { ...steps, complete: !nextStep, nextStep: nextStep ? nextStep[0] : 'complete' };
  }

  // Phase 2.3 — World Map. Classifies every real destination into Current /
  // Reachable / Locked from actual game state (discovery + wider-map unlock).
  // No fake destinations (catalog = real places) and no dead links (a place is
  // Reachable only when it is genuinely known and open). `currentLocationId` is
  // set by the scene from the player's position.
  setCurrentLocation(id) {
    if (id) this.currentLocationId = id;
  }

  getWorldMap() {
    const discovery = this.discoveryMapSystem.getState();
    const widerUnlocked = Boolean(discovery.widerMapUnlocked);
    const discovered = new Set(discovery.discovered || []);
    const current = this.currentLocationId || 'street';
    const reachable = [];
    const locked = [];
    const undiscovered = [];
    for (const p of act1WorldMapPoints) {
      const point = { id: p.id, label: p.label, region: p.region };
      const isCurrent = p.id === current;
      if (p.lockedByWiderMap) {
        // The frontier unlocks as a group when the wider map opens; once open,
        // those destinations are reachable (you can now travel there).
        if (widerUnlocked || isCurrent) reachable.push({ ...point, current: isCurrent });
        else locked.push({ ...point, unlocksBy: 'repair the bridge to open the wider map' });
      } else if (p.alwaysKnown || discovered.has(p.id)) {
        reachable.push({ ...point, current: isCurrent });
      } else {
        undiscovered.push(point); // exists, not yet found — not a dead link, just unseen
      }
    }
    return {
      current,
      currentLabel: act1WorldMapPoints.find((p) => p.id === current)?.label || current,
      reachable,
      locked,
      undiscovered,
      widerMapUnlocked: widerUnlocked,
      counts: { reachable: reachable.length, locked: locked.length, undiscovered: undiscovered.length, total: act1WorldMapPoints.length },
    };
  }

  // Phase 2.4 — Multi-Biome. A biome carries the full observe -> predict ->
  // outcome -> payoff loop and is gated behind the wider map (repair the bridge).
  biomeUnlocked() {
    return Boolean(this.discoveryMapSystem.getState().widerMapUnlocked);
  }

  enterBiome(biomeId) {
    if (!this.biomeUnlocked()) {
      this.recordFeedback('map', 'That biome is past the wider map — repair the bridge to open the route first.', { biomeId, locked: true });
      return { ok: false, reason: 'locked', biomeId };
    }
    const result = this.biomeSystem.enter(biomeId);
    if (!result.ok) return result;
    this.audioSystem.transitionMusic('ecology_chemistry');
    this.audioSystem.setAmbient('ecology_patch');
    const biome = this.biomeSystem.biomes.get(biomeId);
    if (biome?.landmark) this.registerDiscovery({ ...biome.landmark, category: 'landmark', source: 'biome' });
    this.recordFeedback('discovery', `Entered ${result.biome.name}. ${result.biome.intro}`, result.biome);
    return result;
  }

  observeBiomePlacement(biomeId, placementId) {
    const result = this.biomeSystem.observe(biomeId, placementId);
    if (result.ok) this.recordFeedback('ecology', `${result.placement.site}`, result.placement);
    return result;
  }

  predictBiomePlacement(biomeId, placementId, optionId) {
    const result = this.biomeSystem.predict(biomeId, placementId, optionId);
    if (result.ok) this.recordFeedback('ecology', `You expect ${optionId} to suit this site.`, result);
    return result;
  }

  resolveBiomePlacement(biomeId, placementId) {
    const result = this.biomeSystem.resolve(biomeId, placementId);
    if (!result.ok) {
      this.recordFeedback('ecology', 'Observe and predict before you decide.', result);
      return result;
    }
    if (result.discovery) this.registerDiscovery({ ...result.discovery, source: 'biome' });
    if (result.notebookEntry) {
      this.notebookSystem.ensureEntry(result.notebookEntry, 'Ecology');
      this.unlockNotebookEntries([result.notebookEntry.id || result.notebookEntry].filter(Boolean));
    }
    this.recordFeedback('ecology', `${result.thrives ? 'Good fit.' : 'Poor fit.'} ${result.why}`, result);
    return result;
  }

  completeBiome(event = {}) {
    if (event.biomeId !== 'salt_river' || this.saltRiverComplete) return { ok: false, reason: 'already_complete', biomeId: event.biomeId };
    this.saltRiverComplete = true;
    const total = this.awardZuzuBucks(25, { kind: 'quest', questId: 'salt_river', questName: 'Salt River field notes' });
    return { ok: true, biomeId: event.biomeId, total };
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
    this.saltRiverComplete = Boolean(state.saltRiverComplete);
    this.zuzuBucks = Number.isFinite(state.zuzuBucks) ? state.zuzuBucks : 0;
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
    this.investigationSystem.loadState(state.investigation);
    this.chemistrySystem.loadState(state.chemistry);
    this.trustSystem.loadState(state.trust);
    this.languageSystem.loadState(state.language);
    this.discoveryMapSystem.loadState(state.discovery);
    this.discoveryRegistry.loadState(state.discoveryRegistry);
    this.biomeSystem.loadState(state.biomes);
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
    this.investigationSystem = fresh.investigationSystem;
    this.chemistrySystem = fresh.chemistrySystem;
    this.trustSystem = fresh.trustSystem;
    this.languageSystem = fresh.languageSystem;
    this.discoveryMapSystem = fresh.discoveryMapSystem;
    this.discoveryRegistry = fresh.discoveryRegistry;
    this.biomeSystem = fresh.biomeSystem;
    this.audioSystem.stopSpeech();
    this.act1Complete = false;
    this.saltRiverComplete = false;
    this.zuzuBucks = 0;
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
      predictMaterial: (materialId, willHold, confidence, explanation) => this.predictMaterial(materialId, willHold, confidence, explanation),
      assessReasoning: () => this.assessReasoning(),
      completeBridgePlan: (planId) => this.completeBridgePlan(planId),
      designBridge: (selection) => this.designBridge(selection),
      observeEcology: (speciesId) => this.observeEcology(speciesId),
      registerDiscovery: (entry) => this.registerDiscovery(entry),
      markDiscoveriesSeen: () => this.discoveryRegistry.markSeen(),
      getWorldMap: () => this.getWorldMap(),
      setCurrentLocation: (id) => this.setCurrentLocation(id),
      enterBiome: (biomeId) => this.enterBiome(biomeId),
      observeBiomePlacement: (biomeId, placementId) => this.observeBiomePlacement(biomeId, placementId),
      predictBiomePlacement: (biomeId, placementId, optionId) => this.predictBiomePlacement(biomeId, placementId, optionId),
      resolveBiomePlacement: (biomeId, placementId) => this.resolveBiomePlacement(biomeId, placementId),
      completeBiome: (event) => this.completeBiome(event),
      observeEcologyPlacement: (id) => this.observeEcologyPlacement(id),
      predictEcologyPlacement: (id, speciesId) => this.predictEcologyPlacement(id, speciesId),
      resolveEcologyPlacement: (id) => this.resolveEcologyPlacement(id),
      observeMystery: (id) => this.observeMystery(id),
      hypothesizeMystery: (id, hypothesisId) => this.hypothesizeMystery(id, hypothesisId),
      investigateMystery: (id) => this.investigateMystery(id),
      concludeMystery: (id) => this.concludeMystery(id),
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
