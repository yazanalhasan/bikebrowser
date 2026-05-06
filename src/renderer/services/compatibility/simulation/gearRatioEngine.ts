export type GearRatioInput = {
  chainringTeeth: number;
  cassetteCogs: number[];
  wheelSizeIn: number;
  cadenceRpm: number;
};

export type GearPoint = {
  cogTeeth: number;
  ratio: number;
  rolloutFeet: number;
  speedMph: number;
  torqueMultiplier: number;
};

function round(value: number, digits = 2): number {
  return Number(value.toFixed(digits));
}

export function wheelCircumferenceFeet(wheelSizeIn: number): number {
  return Math.PI * wheelSizeIn / 12;
}

export function speedFromCadenceMph(chainringTeeth: number, cogTeeth: number, wheelSizeIn: number, cadenceRpm: number): number {
  const ratio = chainringTeeth / cogTeeth;
  const feetPerMinute = ratio * wheelCircumferenceFeet(wheelSizeIn) * cadenceRpm;
  return feetPerMinute * 60 / 5280;
}

export function buildGearRatioCurve(input: GearRatioInput) {
  const points: GearPoint[] = input.cassetteCogs.map((cogTeeth) => {
    const ratio = input.chainringTeeth / cogTeeth;
    return {
      cogTeeth,
      ratio: round(ratio, 3),
      rolloutFeet: round(ratio * wheelCircumferenceFeet(input.wheelSizeIn), 2),
      speedMph: round(speedFromCadenceMph(input.chainringTeeth, cogTeeth, input.wheelSizeIn, input.cadenceRpm), 2),
      torqueMultiplier: round(cogTeeth / input.chainringTeeth, 3),
    };
  });

  const climbingPoint = points[points.length - 1];
  const topSpeedPoint = points[0];

  return {
    points,
    summary: {
      climbingRatio: climbingPoint?.ratio || 0,
      topSpeedRatio: topSpeedPoint?.ratio || 0,
      climbingSpeedMph: climbingPoint?.speedMph || 0,
      topSpeedMph: topSpeedPoint?.speedMph || 0,
      torqueMultiplication: climbingPoint?.torqueMultiplier || 0,
    },
  };
}

export default {
  wheelCircumferenceFeet,
  speedFromCadenceMph,
  buildGearRatioCurve,
};
