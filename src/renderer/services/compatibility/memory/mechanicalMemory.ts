export type MechanicalMemory = {
  bikeProfileId: string;
  wearState: {
    chainWear?: number;
    cassetteMileage?: number;
    tireWear?: number;
    brakePadWear?: number;
  };
  measurements: {
    hangerAlignmentAdjusted?: boolean;
    seatpostDiameter?: number;
    hubSpacingVerified?: boolean;
    rotorSizeVerified?: boolean;
  };
  compatibilityDecisions: Array<{
    component: string;
    decision: string;
    createdAt: string;
  }>;
  upgradeHistory: Array<{
    component: string;
    from?: string;
    to?: string;
    createdAt: string;
  }>;
};

export function createMechanicalMemory(bikeProfileId: string): MechanicalMemory {
  return {
    bikeProfileId,
    wearState: {},
    measurements: {},
    compatibilityDecisions: [],
    upgradeHistory: [],
  };
}

export function recordWearMeasurement(memory: MechanicalMemory, update: Partial<MechanicalMemory['wearState'] & MechanicalMemory['measurements']>): MechanicalMemory {
  return {
    ...memory,
    wearState: {
      ...memory.wearState,
      chainWear: update.chainWear ?? memory.wearState.chainWear,
      cassetteMileage: update.cassetteMileage ?? memory.wearState.cassetteMileage,
      tireWear: update.tireWear ?? memory.wearState.tireWear,
      brakePadWear: update.brakePadWear ?? memory.wearState.brakePadWear,
    },
    measurements: {
      ...memory.measurements,
      hangerAlignmentAdjusted: update.hangerAlignmentAdjusted ?? memory.measurements.hangerAlignmentAdjusted,
      seatpostDiameter: update.seatpostDiameter ?? memory.measurements.seatpostDiameter,
      hubSpacingVerified: update.hubSpacingVerified ?? memory.measurements.hubSpacingVerified,
      rotorSizeVerified: update.rotorSizeVerified ?? memory.measurements.rotorSizeVerified,
    },
  };
}

export function recordUpgrade(memory: MechanicalMemory, upgrade: { component: string; from?: string; to?: string }): MechanicalMemory {
  return {
    ...memory,
    upgradeHistory: [
      {
        ...upgrade,
        createdAt: new Date().toISOString(),
      },
      ...memory.upgradeHistory,
    ],
  };
}

export function recordCompatibilityDecision(memory: MechanicalMemory, decision: { component: string; decision: string }): MechanicalMemory {
  return {
    ...memory,
    compatibilityDecisions: [
      {
        ...decision,
        createdAt: new Date().toISOString(),
      },
      ...memory.compatibilityDecisions,
    ],
  };
}

export default {
  createMechanicalMemory,
  recordWearMeasurement,
  recordUpgrade,
  recordCompatibilityDecision,
};
