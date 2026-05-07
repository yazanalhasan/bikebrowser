export interface MechanicalScenario {
  expression: string;
  result: number;
  theme: string;
  visualModel: string;
  story: string;
  unitLabel: string;
}

export function createMechanicalScenario({
  factorA,
  factorB,
  type = 'gears',
}: {
  factorA: number;
  factorB: number;
  type?: 'gears' | 'spokes' | 'bridge' | 'chainrings' | 'ramps';
}): MechanicalScenario {
  const result = factorA * factorB;
  const expression = `${factorA} x ${factorB}`;
  const scenarios = {
    gears: {
      theme: 'drivetrain',
      visualModel: 'gear-transfer',
      story: `${factorA} pedal rotations transfer ${factorB} rear gear movements each, making ${result} wheel movement units.`,
      unitLabel: 'wheel movement units',
    },
    spokes: {
      theme: 'wheel geometry',
      visualModel: 'spoke-groups',
      story: `${factorA} spoke groups with ${factorB} spokes each build a ${result}-spoke wheel pattern.`,
      unitLabel: 'spokes',
    },
    bridge: {
      theme: 'bridge construction',
      visualModel: 'beam-bolts',
      story: `${factorA} beams each need ${factorB} bolts, so the bridge section uses ${result} bolts.`,
      unitLabel: 'bolts',
    },
    chainrings: {
      theme: 'gear planning',
      visualModel: 'cassette-zones',
      story: `${factorA} chainrings across ${factorB} cassette zones create ${result} drivetrain combinations to compare.`,
      unitLabel: 'gear combinations',
    },
    ramps: {
      theme: 'BMX geometry',
      visualModel: 'ramp-panels',
      story: `${factorA} ramp ribs with ${factorB} deck panels each create ${result} panel mounts.`,
      unitLabel: 'panel mounts',
    },
  } as const;

  return { expression, result, ...scenarios[type] };
}

export function createScenarioForPattern(factorA: number, factorB: number): MechanicalScenario {
  if (factorA === 12 || factorB === 12) return createMechanicalScenario({ factorA, factorB, type: 'spokes' });
  if (factorA >= 7 || factorB >= 7) return createMechanicalScenario({ factorA, factorB, type: 'bridge' });
  if (factorA === 4 || factorB === 4) return createMechanicalScenario({ factorA, factorB, type: 'gears' });
  return createMechanicalScenario({ factorA, factorB, type: 'chainrings' });
}
