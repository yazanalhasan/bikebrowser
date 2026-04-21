/**
 * E-Bike Parts — motor, controller, and integration components.
 *
 * The e-bike system combines bike + battery + electrical components.
 * The system graph enforces: battery → controller → motor
 * with voltage/current matching constraints.
 */

export const EBIKE_PARTS = [
  {
    id: 'motor',
    type: 'component',
    properties: {
      label: 'Hub Motor',
      category: 'electrical',
      icon: '⚡',
      power: 250,        // watts
      ratedVoltage: 48,  // volts
      maxCurrent: 15,    // amps
      maxSpeed: 25,      // km/h
      efficiency: 0.82,
      weight: 3.0,
      description: 'Rear hub motor — 250W. Provides electric pedal assist.',
      cost: 120,
    },
  },
  {
    id: 'controller',
    type: 'component',
    properties: {
      label: 'Motor Controller',
      category: 'electrical',
      icon: '🖥️',
      ratedVoltage: 48,
      maxCurrent: 20,
      features: ['pedal_assist', 'throttle', 'regen_braking'],
      weight: 0.5,
      description: 'Manages power from battery to motor. Supports pedal assist and throttle.',
      cost: 60,
    },
  },
  {
    id: 'throttle',
    type: 'component',
    properties: {
      label: 'Thumb Throttle',
      category: 'controls',
      icon: '👍',
      weight: 0.05,
      description: 'Handlebar-mounted throttle for direct motor control.',
      cost: 15,
    },
  },
  {
    id: 'pedal_sensor',
    type: 'component',
    properties: {
      label: 'Pedal Assist Sensor',
      category: 'controls',
      icon: '🦶',
      weight: 0.1,
      description: 'Detects pedaling cadence and sends signal to controller for assist.',
      cost: 20,
    },
  },
  {
    id: 'display',
    type: 'component',
    properties: {
      label: 'LCD Display',
      category: 'controls',
      icon: '📟',
      weight: 0.15,
      description: 'Shows speed, battery level, assist mode, and trip data.',
      cost: 30,
    },
  },
];

/**
 * E-bike system rules — how electrical components connect.
 */
export const EBIKE_RULES = [
  // Motor requires controller
  { from: 'motor', to: 'controller', relation: 'requires' },
  // Controller requires battery wiring
  { from: 'controller', to: 'battery_wiring', relation: 'requires' },
  // Motor mounts to rear wheel
  { from: 'motor', to: 'rear_wheel', relation: 'requires' },
  // Controller mounts to frame
  { from: 'controller', to: 'frame', relation: 'requires' },
  // Throttle requires controller
  { from: 'throttle', to: 'controller', relation: 'supports' },
  { from: 'throttle', to: 'handlebars', relation: 'requires' },
  // Pedal sensor requires controller and drivetrain
  { from: 'pedal_sensor', to: 'controller', relation: 'supports' },
  { from: 'pedal_sensor', to: 'drivetrain', relation: 'requires' },
  // Display requires controller
  { from: 'display', to: 'controller', relation: 'requires' },
  { from: 'display', to: 'handlebars', relation: 'requires' },
  // Power feed chain: battery → controller → motor
  {
    from: 'battery_wiring', to: 'controller', relation: 'feeds',
    properties: { feedType: 'power', matchProperty: 'ratedVoltage' },
  },
  {
    from: 'controller', to: 'motor', relation: 'feeds',
    properties: { feedType: 'power', matchProperty: 'ratedVoltage' },
  },
];

/**
 * Motor variants for upgrades.
 */
export const MOTOR_VARIANTS = {
  basic_250w: {
    label: '250W Hub Motor',
    power: 250,
    ratedVoltage: 36,
    maxCurrent: 10,
    maxSpeed: 25,
    efficiency: 0.78,
    cost: 80,
  },
  standard_500w: {
    label: '500W Hub Motor',
    power: 500,
    ratedVoltage: 48,
    maxCurrent: 15,
    maxSpeed: 32,
    efficiency: 0.82,
    cost: 120,
  },
  performance_750w: {
    label: '750W Hub Motor',
    power: 750,
    ratedVoltage: 48,
    maxCurrent: 20,
    maxSpeed: 40,
    efficiency: 0.85,
    cost: 200,
  },
};
