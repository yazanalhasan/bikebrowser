const TAU = Math.PI * 2;

export function computeGearRadius({
  baseRadius = 60,
  driverFactor = 1,
  drivenFactor = 1,
} = {}) {
  const normalizedBase = Number(baseRadius) > 0 ? Number(baseRadius) : 60;
  const driver = Number(driverFactor) > 0 ? Number(driverFactor) : 1;
  const driven = Number(drivenFactor) > 0 ? Number(drivenFactor) : 1;

  return normalizedBase * (driver / driven);
}

export function computeCircumference(radius) {
  const normalizedRadius = Number(radius) > 0 ? Number(radius) : 0;
  return TAU * normalizedRadius;
}

export function computeAngularVelocity({
  driverRadius,
  drivenRadius,
  driverAngularVelocity = 1,
} = {}) {
  const sourceRadius = Number(driverRadius) > 0 ? Number(driverRadius) : 1;
  const targetRadius = Number(drivenRadius) > 0 ? Number(drivenRadius) : 1;
  const sourceVelocity = Number(driverAngularVelocity) || 1;

  return sourceVelocity * (sourceRadius / targetRadius);
}

export function computeToothCount({
  radius,
  baseRadius = 60,
  baseTeeth = 40,
} = {}) {
  const normalizedBaseRadius = Number(baseRadius) > 0 ? Number(baseRadius) : 60;
  const normalizedBaseTeeth = Number(baseTeeth) > 0 ? Number(baseTeeth) : 40;
  const normalizedRadius = Number(radius) > 0 ? Number(radius) : normalizedBaseRadius;
  const teeth = Math.round(normalizedBaseTeeth * (computeCircumference(normalizedRadius) / computeCircumference(normalizedBaseRadius)));

  return Math.max(1, teeth);
}

export function computeRotationDirection(previousDirection = 1) {
  return previousDirection === -1 ? 1 : -1;
}

function normalizeGear({
  id,
  radius,
  baseRadius,
  baseTeeth,
  angularVelocity,
  rotationDirection,
  color,
  role,
  x,
  y,
}) {
  return {
    id,
    radius,
    circumference: computeCircumference(radius),
    teeth: computeToothCount({ radius, baseRadius, baseTeeth }),
    angularVelocity,
    rotationDirection,
    color,
    role,
    x,
    y,
  };
}

export function computeGearTrain({
  factorA = 1,
  factorB = 1,
  baseRadius = 60,
  baseTeeth = 40,
  driverAngularVelocity = 1,
  includeIdler = false,
  idlerRadius,
} = {}) {
  const driverRadius = Number(baseRadius) > 0 ? Number(baseRadius) : 60;
  const drivenRadius = computeGearRadius({
    baseRadius: driverRadius,
    driverFactor: factorA,
    drivenFactor: factorB,
  });
  const driverDirection = 1;

  const gears = [
    normalizeGear({
      id: 'driver',
      radius: driverRadius,
      baseRadius: driverRadius,
      baseTeeth,
      angularVelocity: driverAngularVelocity,
      rotationDirection: driverDirection,
      color: '#2459ff',
      role: 'driver',
      x: 125,
      y: 150,
    }),
  ];

  if (includeIdler) {
    const middleRadius = Number(idlerRadius) > 0 ? Number(idlerRadius) : Math.max(24, Math.min(driverRadius, drivenRadius));
    const idlerVelocity = computeAngularVelocity({
      driverRadius,
      drivenRadius: middleRadius,
      driverAngularVelocity,
    });
    const idlerDirection = computeRotationDirection(driverDirection);
    const outputVelocity = computeAngularVelocity({
      driverRadius: middleRadius,
      drivenRadius: drivenRadius,
      driverAngularVelocity: idlerVelocity,
    });

    gears.push(
      normalizeGear({
        id: 'idler',
        radius: middleRadius,
        baseRadius: driverRadius,
        baseTeeth,
        angularVelocity: idlerVelocity,
        rotationDirection: idlerDirection,
        color: '#ffb330',
        role: 'idler',
        x: 125 + driverRadius + middleRadius,
        y: 150,
      }),
      normalizeGear({
        id: 'output',
        radius: drivenRadius,
        baseRadius: driverRadius,
        baseTeeth,
        angularVelocity: outputVelocity,
        rotationDirection: computeRotationDirection(idlerDirection),
        color: '#22c55e',
        role: 'output',
        x: 125 + driverRadius + middleRadius * 2 + drivenRadius,
        y: 150,
      })
    );
  } else {
    gears.push(
      normalizeGear({
        id: 'driven',
        radius: drivenRadius,
        baseRadius: driverRadius,
        baseTeeth,
        angularVelocity: computeAngularVelocity({
          driverRadius,
          drivenRadius,
          driverAngularVelocity,
        }),
        rotationDirection: computeRotationDirection(driverDirection),
        color: '#22c55e',
        role: 'driven',
        x: 125 + driverRadius + drivenRadius,
        y: 150,
      })
    );
  }

  const outputGear = gears[gears.length - 1];

  return {
    baseRadius: driverRadius,
    baseTeeth,
    ratio: {
      input: Number(factorA) > 0 ? Number(factorA) : 1,
      output: Number(factorB) > 0 ? Number(factorB) : 1,
      speedMultiplier: outputGear.angularVelocity / gears[0].angularVelocity,
      sizeMultiplier: outputGear.radius / gears[0].radius,
    },
    gears,
  };
}
