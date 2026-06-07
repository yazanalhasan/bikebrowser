export class ConstructionSystem {
  static carryForward = {
    environmentalPrimitives: ['span_distance', 'load_path', 'terrain_gap'],
    progressionPrimitives: ['plan_created', 'bridge_reconnected', 'route_unlocked'],
    actScalingPath: 'Bridge repair introduces rule-checked design before later simulations and larger vehicle frames.',
  };

  constructor(materialsLab) {
    this.materialsLab = materialsLab;
    this.plan = null;
    this.bridgeReconnected = false;
    this.crossed = false;
    this.repairMoment = null;
    this.crossingMoment = null;
  }

  completeBridgePlan(planId = 'tested_triangle_plan') {
    if (planId === 'weak_scrap_only') {
      return {
        ok: false,
        reason: 'weak_materials_fail',
        explanation: 'Weak scrap alone bends too much and does not create a trustworthy load path.',
      };
    }
    const requiredTests = ['balsa', 'pine', 'bamboo', 'brick', 'concrete', 'iron', 'steel', 'carbon_fiber'];
    const missingTests = requiredTests.filter((materialId) => !this.materialsLab.hasTested(materialId));
    if (missingTests.length) return { ok: false, reason: 'missing_tests', missingTests };
    this.plan = {
      id: planId,
      deck: 'bamboo',
      supports: 'steel',
      braces: 'carbon_fiber',
      rejects: ['balsa', 'brick', 'concrete'],
      lesson: 'A deck, supports, and triangular braces carry load better when the UTM proves they can handle tension and compression.',
      loadPath: ['deck', 'support', 'triangle_brace', 'ground'],
    };
    return { ok: true, plan: this.plan };
  }

  // Phase 1.6 — player-chosen bridge design with real consequences.
  // The player assigns a tested material to each load-bearing role (deck,
  // support, brace). All bridge-safe -> the bridge holds. Any weak material in a
  // load-bearing role -> the load path fails (a bridge is only as strong as its
  // weakest part). The player can be wrong, learn exactly which role failed and
  // why, and improve by re-choosing.
  designBridge(selection = {}) {
    // Phase 2 — Leonardo's 5-role builder. deck/supports/braces are always load-
    // bearing; cables (tension) and foundations (compression) are added when the
    // player fills those slots. Optional so existing 3-role debug designs still work.
    // Phase (bridge families) — `bridgeType` is carried through to the plan so the
    // payoff/notebook can name the family. The solver stays material-driven; the UI
    // owns geometry (e.g. the Da Vinci arch validates its interlock before calling).
    const bridgeType = selection.bridgeType || 'truss';
    const roles = [
      ['deck', selection.deck],
      ['support', selection.support],
      ['brace', selection.brace],
    ];
    if (selection.cable) roles.push(['cable', selection.cable]);
    if (selection.foundation) roles.push(['foundation', selection.foundation]);
    const missingRoles = roles.filter(([, materialId]) => !materialId).map(([role]) => role);
    if (missingRoles.length) {
      return { ok: false, reason: 'incomplete_selection', missingRoles, explanation: `Choose a material for: ${missingRoles.join(', ')}.` };
    }
    const evaluated = roles.map(([role, materialId]) => {
      const test = this.materialsLab.getTest(materialId);
      return { role, materialId, tested: Boolean(test), bridgeSafe: Boolean(test && test.bridgeSafe) };
    });
    const untested = evaluated.filter((part) => !part.tested);
    if (untested.length) {
      return { ok: false, reason: 'untested_materials', untested: untested.map((part) => part.materialId), explanation: 'Test a material in the UTM before trusting it in the bridge.' };
    }
    const unsafe = evaluated.filter((part) => !part.bridgeSafe);
    if (unsafe.length === roles.length) {
      return { ok: false, reason: 'all_unsafe', outcome: 'collapse', evaluated, explanation: 'Every part uses material that failed the load test — the bridge would collapse.' };
    }
    if (unsafe.length > 0) {
      // Mixed: some good parts, but a weak load-bearing role makes the whole path unsafe.
      return {
        ok: false,
        reason: 'mixed_unsafe',
        outcome: 'unsafe',
        evaluated,
        explanation: `The ${unsafe.map((part) => part.role).join(' and ')} use material that fails under load, so the load path is unsafe. A bridge is only as strong as its weakest part.`,
      };
    }
    // All parts bridge-safe -> a trustworthy load path.
    this.plan = {
      id: 'player_designed',
      bridgeType,
      deck: selection.deck,
      supports: selection.support,
      braces: selection.brace,
      cables: selection.cable,
      foundations: selection.foundation,
      safe: true,
      loadPath: ['deck', 'support', 'triangle_brace', 'cable', 'foundation', 'ground'],
      lesson: 'Each load-bearing part used a material the test proved safe, so the load path holds.',
    };
    return { ok: true, outcome: 'safe', plan: this.plan, evaluated, explanation: 'All parts passed the load test — the bridge has a safe load path.' };
  }

  repairBridge() {
    if (!this.plan) return { ok: false, reason: 'missing_plan' };
    this.bridgeReconnected = true;
    this.repairMoment = {
      before: 'Broken planks and a washed-out gap made the path feel unsafe.',
      transition: ['fit tested deck', 'tighten triangle braces', 'settle support feet'],
      after: 'The new deck and braces make one clear safe crossing.',
      socialAcknowledgement: 'Mr. Chen nods: "You did not guess. You tested, then built."',
      childSummary: 'I fixed the crossing because my evidence made the plan safe.',
    };
    return { ok: true, bridgeReconnected: true, repairMoment: this.repairMoment };
  }

  crossBridge() {
    if (!this.bridgeReconnected) return { ok: false, reason: 'bridge_not_repaired' };
    this.crossed = true;
    this.crossingMoment = {
      witnessedBy: ['Zuzu', 'Mr. Chen'],
      feeling: 'The bike rolls across slowly, then the bridge stays steady.',
      unlockHint: 'A wider route can open because the crossing is safe again.',
    };
    return { ok: true, crossed: true, crossingMoment: this.crossingMoment };
  }

  getState() {
    return {
      plan: this.plan,
      bridgeReconnected: this.bridgeReconnected,
      crossed: this.crossed,
      repairMoment: this.repairMoment,
      crossingMoment: this.crossingMoment,
    };
  }

  loadState(state = {}) {
    this.plan = state.plan || null;
    this.bridgeReconnected = Boolean(state.bridgeReconnected);
    this.crossed = Boolean(state.crossed);
    this.repairMoment = state.repairMoment || null;
    this.crossingMoment = state.crossingMoment || null;
  }
}

