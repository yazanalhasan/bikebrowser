export class DebugDiagnosticSystem {
  constructor(runtime) {
    this.runtime = runtime;
  }

  run() {
    const state = this.runtime.getAct1State();
    const scene = this.runtime.game?.scene?.getScene?.('NeighborhoodScene');
    const sceneZones = scene?.interactions?.zones || [];
    const objectiveIds = new Set(state.quests.quests.flatMap((quest) => quest.objectives.map((objective) => objective.id)));
    const dialogueIds = new Set((this.runtime.game?.registry?.get('dialogueSystem')?.dialogue?.keys?.() || []));
    const dialogueEntries = [...(this.runtime.game?.registry?.get('dialogueSystem')?.dialogue?.values?.() || [])];
    const dialogueObjectiveRefs = dialogueEntries.flatMap((entry) => [...(entry.completes || []), entry.completesObjective].filter(Boolean));
    const invalidDialogueObjectives = dialogueObjectiveRefs.filter((objectiveId) => !objectiveIds.has(objectiveId));
    const duplicateNotebookEntries = findDuplicates(state.notebook.unlocked);
    const invalidQuestTransitions = state.quests.quests
      .filter((quest) => quest.next && !state.quests.quests.some((candidate) => candidate.id === quest.next))
      .map((quest) => quest.id);
    const missingInteractionActions = sceneZones.filter((zone) => !zone.dialogueId && !zone.action).map((zone) => zone.id);
    const unreachableInteractionZones = sceneZones.filter((zone) => zone.x < 0 || zone.y < 0 || zone.x > 1600 || zone.y > 1000).map((zone) => zone.id);
    const bridgeCorruption = state.bridge.bridgeReconnected && !state.bridge.plan;
    const checks = [
      ['routeReady', Boolean(window.__bikebrowserRebuildReady)],
      ['sceneReady', Boolean(this.runtime.sceneReady)],
      ['systemsLoaded', this.runtime.requiredSystems.every((systemName) => Boolean(this.runtime[systemName]))],
      ['questsRegistered', state.quests.quests.length >= 10],
      ['notebookEntriesRegistered', state.notebook.entries.length >= 15],
      ['materialsRegistered', state.materialTests.materials.length >= 4],
      ['saveSystemAvailable', typeof this.runtime.saveGame === 'function'],
      ['noLegacySceneDefaulted', !this.runtime.game?.scene?.getScene?.('StreetBlockScene')],
      ['act1Completable', this.runtime.canCompleteAct1()],
      ['questTransitionsValid', invalidQuestTransitions.length === 0],
      ['dialogueObjectiveRefsValid', invalidDialogueObjectives.length === 0],
      ['dialogueChainsPresent', ['mr_chen_bridge_intro', 'spanish_trust', 'arabic_welcome', 'wider_gate_clue'].every((id) => dialogueIds.has(id))],
      ['notebookHasNoDuplicates', duplicateNotebookEntries.length === 0],
      ['bridgeStateConsistent', !bridgeCorruption],
      ['interactionsReachable', unreachableInteractionZones.length === 0],
      ['interactionsHavePurpose', missingInteractionActions.length === 0],
      ['noGeneratedRuntimeArt', this.runtime.assetContract?.generatedArtDirectRuntime === false],
    ];
    return {
      ok: checks.every(([, ok]) => ok),
      checks: Object.fromEntries(checks),
      details: {
        invalidQuestTransitions,
        invalidDialogueObjectives,
        duplicateNotebookEntries,
        unreachableInteractionZones,
        missingInteractionActions,
        bridgeCorruption,
      },
      warnings: state.act1Complete ? [] : ['Act 1 is not complete in current save state yet.'],
    };
  }
}

function findDuplicates(values) {
  const seen = new Set();
  const duplicates = new Set();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates];
}
