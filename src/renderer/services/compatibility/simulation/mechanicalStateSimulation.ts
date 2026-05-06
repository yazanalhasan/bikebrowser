import { speedFromCadenceMph } from './gearRatioEngine';

export type DrivetrainState = {
  chainringTeeth: number;
  cassetteCogTeeth: number;
  wheelSizeIn: number;
  crankLengthMm: number;
  cadenceRpm: number;
  riderTorqueNm: number;
};

function round(value: number, digits = 2): number {
  return Number(value.toFixed(digits));
}

function evaluateState(state: DrivetrainState) {
  const ratio = state.chainringTeeth / state.cassetteCogTeeth;
  const torqueMultiplier = state.cassetteCogTeeth / state.chainringTeeth;
  const wheelTorqueNm = state.riderTorqueNm * torqueMultiplier;
  const crankRadiusM = state.crankLengthMm / 1000;
  const chainTensionN = state.riderTorqueNm / torqueMultiplier / crankRadiusM;
  const speedMph = speedFromCadenceMph(state.chainringTeeth, state.cassetteCogTeeth, state.wheelSizeIn, state.cadenceRpm);

  return {
    ...state,
    gearRatio: round(ratio, 3),
    torqueMultiplier: round(torqueMultiplier, 3),
    wheelTorqueNm: round(wheelTorqueNm, 2),
    chainTensionN: round(chainTensionN, 2),
    speedMph: round(speedMph, 2),
  };
}

function direction(after: number, before: number, increaseWord = 'increases', decreaseWord = 'decreases') {
  if (after > before) return increaseWord;
  if (after < before) return decreaseWord;
  return 'unchanged';
}

export function simulateDrivetrainChange({ before, after }: { before: DrivetrainState; after: DrivetrainState }) {
  const beforeState = evaluateState(before);
  const afterState = evaluateState(after);

  return {
    before: beforeState,
    after: afterState,
    deltas: {
      torqueMultiplier: round(afterState.torqueMultiplier - beforeState.torqueMultiplier, 3),
      speedMph: round(afterState.speedMph - beforeState.speedMph, 2),
      chainTensionN: round(afterState.chainTensionN - beforeState.chainTensionN, 2),
    },
    changeSummary: {
      climbingTorque: direction(afterState.torqueMultiplier, beforeState.torqueMultiplier),
      topSpeed: direction(afterState.speedMph, beforeState.speedMph),
      cadenceEfficiency: direction(afterState.torqueMultiplier, beforeState.torqueMultiplier),
      chainTension: direction(afterState.chainTensionN, beforeState.chainTensionN),
    },
    educationalConcepts: ['Gear ratio', 'Torque multiplication', 'Cadence', 'Chain tension'],
  };
}

export default {
  simulateDrivetrainChange,
};
