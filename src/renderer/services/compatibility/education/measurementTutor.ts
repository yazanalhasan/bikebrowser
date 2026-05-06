export const MEASUREMENT_TUTOR_STEPS = {
  seatpostDiameter: [
    'Remove the seatpost and wipe the lower section clean.',
    'Use calipers to measure the outside diameter.',
    'Match the number exactly, such as 31.6mm.',
  ],
  hubSpacing: [
    'Remove the wheel.',
    'Measure inside dropout spacing.',
    'Confirm axle standard, such as 12x148 Boost.',
  ],
  rotorSize: [
    'Read the number printed on the rotor if visible.',
    'Measure outside diameter across the disc.',
    'Common MTB sizes are 160mm, 180mm, and 203mm.',
  ],
  bottomBracket: [
    'Measure shell width across the frame.',
    'Identify threaded or press-fit interface.',
    'This bike uses an external 73mm bottom bracket.',
  ],
};

export function getMeasurementSteps(key: keyof typeof MEASUREMENT_TUTOR_STEPS) {
  return MEASUREMENT_TUTOR_STEPS[key] || [];
}

export default {
  MEASUREMENT_TUTOR_STEPS,
  getMeasurementSteps,
};
