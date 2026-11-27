/**
 * Draft dirt-bike and e-dirt parts. Every number is a teaching record
 * that still needs a human to confirm against the current maker sheet.
 * The rules compare these fields. A blank field cannot pass.
 */
const SURRON = 'https://www.sur-ron.com/';
const TALARIA = 'https://talariaglobal.com/';
const SEGWAY = 'https://www.segway.com/';
const STARK = 'https://www.starkfuture.com/';
const KTM = 'https://www.ktm.com/';
const STACYC = 'https://stacyc.com/';
const OSET = 'https://osetbikes.com/';
const KMC = 'https://www.kmcchain.com/';
const HONDA = 'https://powersports.honda.com/';

const FRAME_BASE = {
  hanger: null,
  brakeStyle: 'disc',
  caliperMount: null,
  maxRotorMm: null,
  bbShell: null,
  bbWidthMm: null,
  rearAxle: null,
  frontAxle: null,
  headset: null,
  seatpostMm: null,
  wheelSize: null,
};

function part(add, entry) {
  add({
    reviewStatus: 'draft',
    modelCode: null,
    quote: entry.quote || '',
    ...entry,
  });
}

function controllerPower(family) {
  if (family === 'surron') return 6000;
  if (family === 'stark') return 45000;
  if (family === 'stacyc') return 1200;
  return null;
}

export function addDirtParts(add) {
  const frames = [
    ['frame-surron-light-bee-x', 'Sur-Ron', 'Light Bee X frame', SURRON, {
      frontAxleDiameterMm: 15, frontHubWidthMm: 110, rearAxleDiameterMm: 15, rearHubWidthMm: 160,
      frontRimIn: 19, rearRimIn: 18, maxTireWidthMm: 90, chainlineMm: 42,
      bayLengthMm: 420, bayWidthMm: 160, bayHeightMm: 140,
      maxFrontRotorMm: 220, maxRearRotorMm: 220, frontCaliperMount: 'post-mount', rearCaliperMount: 'post-mount',
      maxForkTravelMm: 210, tripleOffsetMm: 30, shockEyeMm: 260, shockStrokeMm: 65, shockMount: 'surron-pin',
      footpegMount: 'surron-peg', ageClass: 'teen', maxPowerW: 8000, maxKidsWheelIn: null, modelYear: null,
    }],
    ['frame-talaria-sting', 'Talaria', 'Sting frame', TALARIA, {
      frontAxleDiameterMm: 15, frontHubWidthMm: 110, rearAxleDiameterMm: 17, rearHubWidthMm: 170,
      frontRimIn: 19, rearRimIn: 19, maxTireWidthMm: 100, chainlineMm: 48,
      bayLengthMm: 430, bayWidthMm: 165, bayHeightMm: 145,
      maxFrontRotorMm: 220, maxRearRotorMm: 220, frontCaliperMount: 'post-mount', rearCaliperMount: 'post-mount',
      maxForkTravelMm: 220, tripleOffsetMm: 28, shockEyeMm: 270, shockStrokeMm: 70, shockMount: 'talaria-pin',
      footpegMount: 'talaria-peg', ageClass: 'teen', maxPowerW: 8000, maxKidsWheelIn: null, modelYear: null,
    }],
    ['frame-segway-x260', 'Segway', 'X260 frame', SEGWAY, {
      frontAxleDiameterMm: 15, frontHubWidthMm: 110, rearAxleDiameterMm: 15, rearHubWidthMm: 155,
      frontRimIn: 19, rearRimIn: 18, maxTireWidthMm: 90, chainlineMm: 44,
      bayLengthMm: 410, bayWidthMm: 155, bayHeightMm: 135,
      maxFrontRotorMm: 203, maxRearRotorMm: 203, frontCaliperMount: 'post-mount', rearCaliperMount: 'post-mount',
      maxForkTravelMm: 200, tripleOffsetMm: 32, shockEyeMm: 250, shockStrokeMm: 60, shockMount: 'segway-pin',
      footpegMount: 'segway-peg', ageClass: 'teen', maxPowerW: 6000, maxKidsWheelIn: null, modelYear: null,
    }],
    ['frame-stark-varg', 'Stark', 'Varg frame', STARK, {
      frontAxleDiameterMm: 20, frontHubWidthMm: 110, rearAxleDiameterMm: 20, rearHubWidthMm: 180,
      frontRimIn: 21, rearRimIn: 19, maxTireWidthMm: 120, chainlineMm: 50,
      bayLengthMm: 500, bayWidthMm: 200, bayHeightMm: 180,
      maxFrontRotorMm: 270, maxRearRotorMm: 240, frontCaliperMount: 'radial', rearCaliperMount: 'post-mount',
      maxForkTravelMm: 300, tripleOffsetMm: 22, shockEyeMm: 290, shockStrokeMm: 75, shockMount: 'stark-pin',
      footpegMount: 'stark-peg', ageClass: 'adult', maxPowerW: 60000, maxKidsWheelIn: null, modelYear: null,
    }],
    ['frame-ktm-freeride-e', 'KTM', 'Freeride E frame', KTM, {
      frontAxleDiameterMm: 20, frontHubWidthMm: 110, rearAxleDiameterMm: 20, rearHubWidthMm: 175,
      frontRimIn: 21, rearRimIn: 18, maxTireWidthMm: 110, chainlineMm: 52,
      bayLengthMm: 460, bayWidthMm: 180, bayHeightMm: 160,
      maxFrontRotorMm: 260, maxRearRotorMm: 220, frontCaliperMount: 'post-mount', rearCaliperMount: 'post-mount',
      maxForkTravelMm: 250, tripleOffsetMm: 22, shockEyeMm: 280, shockStrokeMm: 72, shockMount: 'ktm-pin',
      footpegMount: 'ktm-peg', ageClass: 'teen', maxPowerW: 20000, maxKidsWheelIn: null, modelYear: null,
    }],
    ['frame-stacyc-16', 'STACYC', '16 eDRIVE frame', STACYC, {
      frontAxleDiameterMm: 12, frontHubWidthMm: 90, rearAxleDiameterMm: 12, rearHubWidthMm: 110,
      frontRimIn: 16, rearRimIn: 16, maxTireWidthMm: 60, chainlineMm: 30,
      bayLengthMm: 280, bayWidthMm: 120, bayHeightMm: 90,
      maxFrontRotorMm: 160, maxRearRotorMm: 160, frontCaliperMount: 'post-mount', rearCaliperMount: 'post-mount',
      maxForkTravelMm: 100, tripleOffsetMm: 20, shockEyeMm: 190, shockStrokeMm: 40, shockMount: 'stacyc-pin',
      footpegMount: 'stacyc-peg', ageClass: 'kids', maxPowerW: 1500, maxKidsWheelIn: 16, modelYear: null,
    }],
    ['frame-oset-16', 'OSET', '16.0 Racing frame', OSET, {
      frontAxleDiameterMm: 12, frontHubWidthMm: 95, rearAxleDiameterMm: 12, rearHubWidthMm: 120,
      frontRimIn: 16, rearRimIn: 16, maxTireWidthMm: 65, chainlineMm: 32,
      bayLengthMm: 300, bayWidthMm: 130, bayHeightMm: 100,
      maxFrontRotorMm: 180, maxRearRotorMm: 180, frontCaliperMount: 'post-mount', rearCaliperMount: 'post-mount',
      maxForkTravelMm: 120, tripleOffsetMm: 18, shockEyeMm: 200, shockStrokeMm: 45, shockMount: 'oset-pin',
      footpegMount: 'oset-peg', ageClass: 'kids', maxPowerW: 2000, maxKidsWheelIn: 16, modelYear: null,
    }],
  ];
  for (const [id, brand, model, sourceUrl, specs] of frames) {
    part(add, {
      id, category: 'frame', brand, model, sourceUrl,
      specs: { ...FRAME_BASE, ...specs },
      sourceRef: `Draft e-dirt frame. Axles, hub widths, rim sizes, bay, and power class need confirmation on the current ${brand} sheet.`,
      quote: brand,
    });
  }

  const wheels = [
    ['wheel-surron-front-19', 'front', 15, 110, 19, 25, null, '6-bolt', SURRON, 'Sur-Ron front wheel 19 in'],
    ['wheel-surron-rear-18', 'rear', 15, 160, 18, 32, '4x64', '6-bolt', SURRON, 'Sur-Ron rear wheel 18 in'],
    ['wheel-talaria-rear-19', 'rear', 17, 170, 19, 32, '4x80', '6-bolt', TALARIA, 'Talaria rear wheel 19 in'],
    ['wheel-stark-front-21', 'front', 20, 110, 21, 28, null, '6-bolt', STARK, 'Stark front wheel 21 in'],
    ['wheel-stacyc-front-16', 'front', 12, 90, 16, 22, null, '6-bolt', STACYC, 'STACYC front wheel 16 in'],
    ['wheel-blank-axle', 'front', null, 110, 19, 25, null, null, SURRON, 'Front wheel, axle not recorded'],
  ];
  for (const [id, position, axle, hub, rim, rimWidth, bolts, rotorMount, sourceUrl, model] of wheels) {
    part(add, {
      id, category: 'dirt_wheel', brand: 'Teaching', model, sourceUrl,
      specs: { position, axleDiameterMm: axle, hubWidthMm: hub, rimDiameterIn: rim, rimWidthMm: rimWidth, sprocketBoltPattern: bolts, rotorMount },
      sourceRef: 'Draft wheel. Axle diameter, hub width, rim size, and sprocket bolts need confirmation.',
      quote: String(rim),
    });
  }

  const tires = [
    ['tire-surron-front', 19, 70, 21, 32, SURRON],
    ['tire-surron-rear', 18, 80, 25, 40, SURRON],
    ['tire-wide-rear', 18, 120, 25, 45, SURRON],
    ['tire-stacyc-16', 16, 50, 18, 28, STACYC],
  ];
  for (const [id, rim, width, minW, maxW, sourceUrl] of tires) {
    part(add, {
      id, category: 'dirt_tire', brand: 'Teaching', model: `${width} mm tire for ${rim} in rim`, sourceUrl,
      specs: { rimDiameterIn: rim, widthMm: width, rimWidthMinMm: minW, rimWidthMaxMm: maxW },
      sourceRef: 'Draft tire. Rim diameter and the rim-width window need confirmation.',
      quote: `${rim} in`,
    });
  }

  for (const pitch of [420, 428, 520]) {
    part(add, {
      id: `chain-pitch-${pitch}`,
      category: 'chain',
      brand: 'Teaching',
      model: `${pitch} chain`,
      sourceUrl: KMC,
      specs: { speeds: null, chainType: 'standard', pitch },
      sourceRef: `Draft ${pitch} roller chain. 420, 428, and 520 do not mix. Confirm the series on the chain stamp.`,
      quote: String(pitch),
    });
  }

  const sprockets = [
    ['sprocket-surron-cs', 'countershaft', 420, null, 'surron-cs', 42, 13, SURRON],
    ['sprocket-surron-rear', 'rear', 420, '4x64', null, 42, 48, SURRON],
    ['sprocket-520-rear', 'rear', 520, '4x64', null, 42, 48, KMC],
    ['sprocket-talaria-rear', 'rear', 420, '4x80', null, 48, 48, TALARIA],
  ];
  for (const [id, position, pitch, bolt, spline, chainline, teeth, sourceUrl] of sprockets) {
    part(add, {
      id, category: 'sprocket', brand: 'Teaching', model: `${position} sprocket ${pitch} ${teeth}T`, sourceUrl,
      specs: { position, pitch, boltPattern: bolt, spline, chainlineMm: chainline, teeth },
      sourceRef: 'Draft sprocket. Pitch, bolt pattern or spline, and chainline need confirmation.',
      quote: String(pitch),
    });
  }

  part(add, {
    id: 'primary-surron-belt',
    category: 'primary_drive',
    brand: 'Sur-Ron',
    model: 'Light Bee belt primary',
    sourceUrl: SURRON,
    specs: { drive: 'belt' },
    sourceRef: 'Draft. Light Bee primary is recorded here as a belt. Confirm on the bike.',
    quote: 'belt',
  });
  part(add, {
    id: 'primary-chain',
    category: 'primary_drive',
    brand: 'Teaching',
    model: 'Chain primary',
    sourceUrl: TALARIA,
    specs: { drive: 'chain' },
    sourceRef: 'Draft chain primary. It does not match a belt-primary motor.',
    quote: 'chain',
  });

  const controllers = [
    ['controller-surron-lbx', 'Sur-Ron', 'Light Bee controller', 60, 80, 160, 'surron-phase', 'surron-hall', 'surron', 'open', SURRON],
    ['controller-stark-varg', 'Stark', 'Varg controller', 360, 200, 400, 'stark-phase', 'stark-hall', 'stark', 'locked', STARK],
    ['controller-stacyc', 'STACYC', '16 eDRIVE controller', 36, 20, 30, 'stacyc-phase', 'stacyc-hall', 'stacyc', 'open', STACYC],
  ];
  for (const [id, brand, model, voltage, continuous, peak, phase, hall, family, lock, sourceUrl] of controllers) {
    part(add, {
      id, category: 'controller', brand, model, sourceUrl,
      specs: {
        acceptedVoltages: [voltage], maxCurrent: continuous, peakCurrent: peak, powerW: controllerPower(family),
        batteryConnector: `${family}-pack`, protocol: family,
        throttleSignal: 'hall', throttleConnector: `${family}-throttle`, throttleProtocol: 'analog',
        displayConnector: `${family}-display`,
        pasKind: 'magnet', pasMagnets: [8], pasConnector: `${family}-pas`,
        brakeSwitch: 'normally-open', brakeConnector: `${family}-brake`,
        speedSensor: 'spoke-magnet', speedConnector: `${family}-speed`,
        lightVoltage: 12, lightConnector: `${family}-light`,
        phaseConnector: phase, hallConnector: hall, firmwareLock: lock, firmwareFamily: family,
      },
      sourceRef: `Draft ${brand} controller. Voltage, current, phase plug, hall plug, and firmware family need confirmation.`,
      quote: String(voltage),
    });
  }

  const motors = [
    ['motor-surron-lbx', 'Sur-Ron', 'Light Bee motor', 60, 5000, 100, 140, 'surron-phase', 'surron-hall', 'surron', 'open', 'belt', SURRON],
    ['motor-stark-varg', 'Stark', 'Varg motor', 360, 40000, 200, 400, 'stark-phase', 'stark-hall', 'stark', 'locked', 'chain', STARK],
    ['motor-stacyc', 'STACYC', '16 eDRIVE motor', 36, 1000, 20, 30, 'stacyc-phase', 'stacyc-hall', 'stacyc', 'open', 'chain', STACYC],
    ['motor-surron-power-unknown', 'Sur-Ron', 'Light Bee motor, peak current not recorded', 60, 5000, 100, null, 'surron-phase', 'surron-hall', 'surron', 'open', 'belt', SURRON],
  ];
  for (const [id, brand, model, voltage, powerW, continuous, peak, phase, hall, family, lock, primary, sourceUrl] of motors) {
    part(add, {
      id, category: 'motor', brand, model, sourceUrl,
      specs: {
        motorType: 'e-dirt', voltage, powerW, protocol: family, position: 'bottom',
        peakCurrent: peak, continuousCurrent: continuous,
        phaseConnector: phase, hallConnector: hall,
        firmwareLock: lock, firmwareFamily: family, primaryDrive: primary, countershaftSpline: `${family}-cs`,
      },
      sourceRef: `Draft ${brand} motor. Voltage, current, plugs, and primary drive need confirmation. Not a bicycle bottom-bracket mid-drive.`,
      quote: String(voltage),
    });
  }

  const batteries = [
    ['battery-surron-60', 'Sur-Ron', '60 V Light Bee pack', 60, 80, 380, 140, 110, 'NMC', SURRON],
    ['battery-stark-360', 'Stark', 'Varg pack', 360, 200, 480, 180, 160, 'NMC', STARK],
    ['battery-stacyc-36', 'STACYC', '36 V kids pack', 36, 25, 250, 100, 70, 'NMC', STACYC],
    ['battery-surron-too-big', 'Teaching', '60 V pack, too big for a Light Bee bay', 60, 80, 500, 200, 200, 'NMC', SURRON],
  ];
  for (const [id, brand, model, voltage, amps, length, width, height, chemistry, sourceUrl] of batteries) {
    part(add, {
      id, category: 'battery', brand, model, sourceUrl,
      specs: {
        voltage, maxCurrent: amps, connector: `${chemistry === 'NMC' && brand === 'Stark' ? 'stark' : brand === 'STACYC' ? 'stacyc' : 'surron'}-pack`,
        lengthMm: length, widthMm: width, heightMm: height, chemistry,
        chargeConnector: brand === 'Stark' ? 'stark-charge' : brand === 'STACYC' ? 'stacyc-charge' : 'surron-charge',
      },
      sourceRef: 'Draft pack. Voltage, BMS current, connector, chemistry, and bay size need confirmation.',
      quote: `${voltage} V`,
    });
  }

  part(add, {
    id: 'charger-surron-60', category: 'charger', brand: 'Sur-Ron', model: '60 V charger', sourceUrl: SURRON,
    specs: { voltage: 60, connector: 'surron-charge', chemistry: 'NMC' },
    sourceRef: 'Draft charger. Voltage, chemistry, and charge plug need confirmation.', quote: '60 V',
  });
  part(add, {
    id: 'charger-36', category: 'charger', brand: 'Teaching', model: '36 V charger', sourceUrl: STACYC,
    specs: { voltage: 36, connector: 'stacyc-charge', chemistry: 'NMC' },
    sourceRef: 'Draft 36 V charger. It does not match a 60 V pack.', quote: '36 V',
  });

  for (const [id, size, mount, sourceUrl, model] of [
    ['rotor-surron-front-203', 203, '6-bolt', SURRON, '203 mm front rotor'],
    ['rotor-surron-rear-203', 203, '6-bolt', SURRON, '203 mm rear rotor'],
    ['rotor-oversize-270', 270, '6-bolt', STARK, '270 mm rotor'],
    ['dirt-rotor-centerlock-203', 203, 'centerlock', SURRON, '203 mm centerlock rotor'],
  ]) {
    part(add, {
      id, category: 'dirt_rotor', brand: 'Teaching', model, sourceUrl,
      specs: { sizeMm: size, mount },
      sourceRef: 'Draft rotor diameter and mount. Confirm the millimeter size.', quote: String(size),
    });
  }

  for (const [id, mount, fluid, model] of [
    ['caliper-surron-front', 'post-mount', 'dot', 'Front post-mount caliper, DOT'],
    ['caliper-surron-rear', 'post-mount', 'dot', 'Rear post-mount caliper, DOT'],
    ['caliper-mineral-radial', 'radial', 'mineral', 'Radial caliper, mineral oil'],
  ]) {
    part(add, {
      id, category: 'dirt_caliper', brand: 'Teaching', model, sourceUrl: SURRON,
      specs: { caliperMount: mount, fluid },
      sourceRef: 'Draft caliper. Mount and fluid (DOT or mineral) need confirmation. Do not mix fluids.', quote: fluid,
    });
  }

  part(add, {
    id: 'fork-surron', category: 'fork', brand: 'Sur-Ron', model: 'Light Bee fork', sourceUrl: SURRON,
    specs: { travelMm: 200, steerer: 'surron-triple', offsetMm: 30, axleDiameterMm: 15 },
    sourceRef: 'Draft fork. Travel, steerer, offset, and axle need confirmation.', quote: '200 mm',
  });
  part(add, {
    id: 'fork-long', category: 'fork', brand: 'Teaching', model: 'Fork, 250 mm travel', sourceUrl: SURRON,
    specs: { travelMm: 250, steerer: 'surron-triple', offsetMm: 40, axleDiameterMm: 15 },
    sourceRef: 'Draft long fork. Travel is over a Light Bee frame maximum.', quote: '250 mm',
  });
  part(add, {
    id: 'shock-surron', category: 'shock', brand: 'Sur-Ron', model: 'Light Bee shock', sourceUrl: SURRON,
    specs: { eyeToEyeMm: 260, strokeMm: 65, mount: 'surron-pin', minRiderKg: 40, maxRiderKg: 90 },
    sourceRef: 'Draft shock. Eye-to-eye, stroke, mount, and rider window need confirmation.', quote: '260 mm',
  });
  part(add, {
    id: 'shock-wrong-length', category: 'shock', brand: 'Teaching', model: 'Shock, 290 mm eye-to-eye', sourceUrl: KTM,
    specs: { eyeToEyeMm: 290, strokeMm: 75, mount: 'stark-pin', minRiderKg: 70, maxRiderKg: 110 },
    sourceRef: 'Draft shock that does not match a Light Bee eye-to-eye length.', quote: '290 mm',
  });
  part(add, {
    id: 'stem-surron-fat', category: 'stem', brand: 'Sur-Ron', model: 'Fat-bar clamps', sourceUrl: SURRON,
    specs: { steerer: 'surron-triple', barClampMm: 28.6 },
    sourceRef: 'Draft 28.6 mm fat-bar clamps. Confirm the clamp diameter.', quote: '28.6',
  });
  part(add, {
    id: 'bar-fat-28-6', category: 'handlebar', brand: 'Teaching', model: '28.6 mm fat handlebar', sourceUrl: KTM,
    specs: { clampMm: 28.6 },
    sourceRef: 'Draft 28.6 mm bar center.', quote: '28.6',
  });
  part(add, {
    id: 'bar-22-2', category: 'handlebar', brand: 'Teaching', model: '22.2 mm handlebar', sourceUrl: KTM,
    specs: { clampMm: 22.2 },
    sourceRef: 'Draft 22.2 mm (7/8 in) bar. It does not clamp in a 28.6 mm fat-bar mount.', quote: '22.2',
  });
  part(add, {
    id: 'peg-surron', category: 'footpeg', brand: 'Sur-Ron', model: 'Light Bee footpegs', sourceUrl: SURRON,
    specs: { mount: 'surron-peg' },
    sourceRef: 'Draft peg mount. Confirm the bolt pattern.', quote: 'surron-peg',
  });
  part(add, {
    id: 'brake-sensor-surron', category: 'brake_sensor', brand: 'Sur-Ron', model: 'Light Bee brake switch', sourceUrl: SURRON,
    specs: { switchType: 'normally-open', connector: 'surron-brake', style: 'lever' },
    sourceRef: 'Draft normally-open brake cutoff on the Light Bee plug.', quote: 'normally-open',
  });
  part(add, {
    id: 'throttle-surron', category: 'throttle', brand: 'Sur-Ron', model: 'Light Bee hall thumb throttle', sourceUrl: SURRON,
    specs: { signal: 'hall', connector: 'surron-throttle', protocol: 'analog', style: 'thumb' },
    sourceRef: 'Draft hall throttle on the Light Bee plug. Pack voltage is not the fit test.', quote: 'hall',
  });
  part(add, {
    id: 'display-surron', category: 'display', brand: 'Sur-Ron', model: 'Light Bee display', sourceUrl: SURRON,
    specs: { protocol: 'surron', connector: 'surron-display' },
    sourceRef: 'Draft display. Protocol and plug need confirmation.', quote: 'surron',
  });
  part(add, {
    id: 'dcdc-surron-12', category: 'dc_dc', brand: 'Sur-Ron', model: '60 V to 12 V converter', sourceUrl: SURRON,
    specs: { inputVoltage: 60, outputVoltage: 12 },
    sourceRef: 'Draft DC-DC. Input is pack nominal voltage. Output is the light voltage.', quote: '12 V',
  });
  part(add, {
    id: 'light-surron-12', category: 'light', brand: 'Sur-Ron', model: '12 V light', sourceUrl: SURRON,
    specs: { voltage: 12, connector: 'surron-light' },
    sourceRef: 'Draft 12 V light on the Sur-Ron light plug.', quote: '12 V',
  });

  part(add, {
    id: 'sprocket-wrong-spline', category: 'sprocket', brand: 'Teaching', model: 'Front sprocket, other spline', sourceUrl: TALARIA,
    specs: { position: 'countershaft', pitch: 420, boltPattern: null, spline: 'talaria-cs', chainlineMm: 42, teeth: 13 },
    sourceRef: 'Draft front sprocket whose spline is not the Light Bee shaft.', quote: 'talaria-cs',
  });
  part(add, {
    id: 'sprocket-chainline-off', category: 'sprocket', brand: 'Teaching', model: 'Rear sprocket, chainline 50 mm', sourceUrl: SURRON,
    specs: { position: 'rear', pitch: 420, boltPattern: '4x64', spline: null, chainlineMm: 50, teeth: 48 },
    sourceRef: 'Draft rear sprocket. Bolts match a Light Bee hub. Chainline is 8 mm off.', quote: '50 mm',
  });
  part(add, {
    id: 'controller-locked-other', category: 'controller', brand: 'Teaching', model: 'Locked controller, other family', sourceUrl: STARK,
    specs: {
      acceptedVoltages: [360], maxCurrent: 200, peakCurrent: 400, powerW: 45000,
      batteryConnector: 'stark-pack', protocol: 'stark',
      throttleSignal: 'hall', throttleConnector: 'stark-throttle', throttleProtocol: 'analog',
      displayConnector: 'stark-display',
      pasKind: 'magnet', pasMagnets: [8], pasConnector: 'stark-pas',
      brakeSwitch: 'normally-open', brakeConnector: 'stark-brake',
      speedSensor: 'spoke-magnet', speedConnector: 'stark-speed',
      lightVoltage: 12, lightConnector: 'stark-light',
      phaseConnector: 'stark-phase', hallConnector: 'stark-hall', firmwareLock: 'locked', firmwareFamily: 'other',
    },
    sourceRef: 'Draft locked controller from a different firmware family than the Varg motor.', quote: 'locked',
  });
  part(add, {
    id: 'controller-surron-soft', category: 'controller', brand: 'Teaching', model: 'Light Bee controller, low peak current', sourceUrl: SURRON,
    specs: {
      acceptedVoltages: [60], maxCurrent: 80, peakCurrent: 50, powerW: 6000,
      batteryConnector: 'surron-pack', protocol: 'surron',
      throttleSignal: 'hall', throttleConnector: 'surron-throttle', throttleProtocol: 'analog',
      displayConnector: 'surron-display',
      pasKind: 'magnet', pasMagnets: [8], pasConnector: 'surron-pas',
      brakeSwitch: 'normally-open', brakeConnector: 'surron-brake',
      speedSensor: 'spoke-magnet', speedConnector: 'surron-speed',
      lightVoltage: 12, lightConnector: 'surron-light',
      phaseConnector: 'surron-phase', hallConnector: 'surron-hall', firmwareLock: 'open', firmwareFamily: 'surron',
    },
    sourceRef: 'Draft controller whose peak current is below the Light Bee motor peak. Warning only.', quote: '50 A',
  });
  part(add, {
    id: 'charger-lfp-60', category: 'charger', brand: 'Teaching', model: '60 V LFP charger', sourceUrl: SURRON,
    specs: { voltage: 60, connector: 'surron-charge', chemistry: 'LFP' },
    sourceRef: 'Draft charger for a different lithium chemistry than an NMC pack.', quote: 'LFP',
  });
  part(add, {
    id: 'fork-offset-only', category: 'fork', brand: 'Teaching', model: 'Fork, offset 40 mm', sourceUrl: SURRON,
    specs: { travelMm: 200, steerer: 'surron-triple', offsetMm: 40, axleDiameterMm: 15 },
    sourceRef: 'Draft fork with the Light Bee travel and axle, and a different offset.', quote: '40 mm',
  });
  part(add, {
    id: 'fork-axle-17', category: 'fork', brand: 'Teaching', model: 'Fork, 17 mm axle', sourceUrl: TALARIA,
    specs: { travelMm: 200, steerer: 'surron-triple', offsetMm: 30, axleDiameterMm: 17 },
    sourceRef: 'Draft fork whose axle is not the Light Bee front axle.', quote: '17 mm',
  });
  part(add, {
    id: 'stem-other', category: 'stem', brand: 'Teaching', model: 'Clamps for a different steerer', sourceUrl: TALARIA,
    specs: { steerer: 'talaria-triple', barClampMm: 28.6 },
    sourceRef: 'Draft clamps that do not match the Light Bee steerer.', quote: 'talaria-triple',
  });
  part(add, {
    id: 'shock-stroke-only', category: 'shock', brand: 'Teaching', model: 'Shock, stroke 80 mm', sourceUrl: SURRON,
    specs: { eyeToEyeMm: 260, strokeMm: 80, mount: 'surron-pin', minRiderKg: 40, maxRiderKg: 90 },
    sourceRef: 'Draft shock with the Light Bee length and a different stroke.', quote: '80 mm',
  });
  part(add, {
    id: 'shock-mount-only', category: 'shock', brand: 'Teaching', model: 'Shock, other mount', sourceUrl: TALARIA,
    specs: { eyeToEyeMm: 260, strokeMm: 65, mount: 'talaria-pin', minRiderKg: 40, maxRiderKg: 90 },
    sourceRef: 'Draft shock with the Light Bee length and different hardware.', quote: 'talaria-pin',
  });
  part(add, {
    id: 'peg-talaria', category: 'footpeg', brand: 'Talaria', model: 'Sting footpegs', sourceUrl: TALARIA,
    specs: { mount: 'talaria-peg' },
    sourceRef: 'Draft pegs that do not use the Light Bee mount.', quote: 'talaria-peg',
  });
  part(add, {
    id: 'dcdc-36-12', category: 'dc_dc', brand: 'Teaching', model: '36 V to 12 V converter', sourceUrl: STACYC,
    specs: { inputVoltage: 36, outputVoltage: 12 },
    sourceRef: 'Draft DC-DC for a 36 V pack. It does not match a 60 V battery.', quote: '36 V',
  });
  part(add, {
    id: 'motor-kids-too-strong', category: 'motor', brand: 'Teaching', model: '3000 W motor on a kids mount', sourceUrl: STACYC,
    specs: {
      motorType: 'e-dirt', voltage: 36, powerW: 3000, protocol: 'stacyc', position: 'bottom',
      peakCurrent: 80, continuousCurrent: 40, phaseConnector: 'stacyc-phase', hallConnector: 'stacyc-hall',
      firmwareLock: 'open', firmwareFamily: 'stacyc', primaryDrive: 'chain', countershaftSpline: 'stacyc-cs',
    },
    sourceRef: 'Draft motor whose power is over a STACYC-class frame limit. Used to show the kids power warning.',
    quote: '3000 W',
  });
}
