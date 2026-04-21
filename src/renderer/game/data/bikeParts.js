/**
 * Bike Parts — component definitions and dependency rules for the bike system graph.
 *
 * Used by systemGraph.buildGraphFromDefinition() to create a bike build.
 * Each part is a node; rules define edges (requires, supports, conflicts, feeds).
 */

export const BIKE_PARTS = [
  {
    id: 'frame',
    type: 'component',
    required: true,
    properties: {
      label: 'Frame',
      category: 'structure',
      icon: '🚲',
      weight: 3.5,
      material: 'steel',
      description: 'The backbone of the bike. Everything mounts to the frame.',
      cost: 50,
    },
  },
  {
    id: 'front_wheel',
    type: 'component',
    required: true,
    properties: {
      label: 'Front Wheel',
      category: 'wheels',
      icon: '⭕',
      weight: 1.2,
      tirePressure: 60,
      tireSize: 26,
      description: 'Front wheel with tire and tube. Steers the bike.',
      cost: 25,
    },
  },
  {
    id: 'rear_wheel',
    type: 'component',
    required: true,
    properties: {
      label: 'Rear Wheel',
      category: 'wheels',
      icon: '⭕',
      weight: 1.5,
      tirePressure: 60,
      tireSize: 26,
      description: 'Rear wheel — connected to the drivetrain.',
      cost: 25,
    },
  },
  {
    id: 'drivetrain',
    type: 'component',
    required: true,
    properties: {
      label: 'Drivetrain',
      category: 'power',
      icon: '⛓️',
      weight: 1.0,
      gears: 7,
      chainTension: 'normal',
      description: 'Chain, pedals, and gears. Transfers your pedaling power to the rear wheel.',
      cost: 35,
    },
  },
  {
    id: 'brakes',
    type: 'component',
    required: true,
    properties: {
      label: 'Brakes',
      category: 'safety',
      icon: '🛑',
      weight: 0.5,
      brakeType: 'rim',
      description: 'Rim brakes — squeeze the pads against the wheel rim to slow down.',
      cost: 20,
    },
  },
  {
    id: 'handlebars',
    type: 'component',
    required: false,
    properties: {
      label: 'Handlebars',
      category: 'controls',
      icon: '🎛️',
      weight: 0.8,
      description: 'Steering control. Also mounts brake levers and bell.',
      cost: 15,
    },
  },
  {
    id: 'seat',
    type: 'component',
    required: false,
    properties: {
      label: 'Seat',
      category: 'comfort',
      icon: '💺',
      weight: 0.4,
      description: 'Where you sit! Adjustable height for comfort.',
      cost: 10,
    },
  },
  {
    id: 'lights',
    type: 'component',
    required: false,
    properties: {
      label: 'Lights',
      category: 'safety',
      icon: '💡',
      weight: 0.2,
      description: 'Front and rear lights for visibility.',
      cost: 12,
    },
  },
];

export const BIKE_RULES = [
  // Wheels require frame
  { from: 'front_wheel', to: 'frame', relation: 'requires' },
  { from: 'rear_wheel', to: 'frame', relation: 'requires' },
  // Drivetrain requires rear wheel
  { from: 'drivetrain', to: 'rear_wheel', relation: 'requires' },
  // Brakes require wheels
  { from: 'brakes', to: 'front_wheel', relation: 'requires' },
  { from: 'brakes', to: 'rear_wheel', relation: 'requires' },
  // Handlebars require frame
  { from: 'handlebars', to: 'frame', relation: 'requires' },
  // Seat requires frame
  { from: 'seat', to: 'frame', relation: 'requires' },
  // Lights support safety
  { from: 'lights', to: 'frame', relation: 'requires' },
  // Handlebars support brakes
  { from: 'brakes', to: 'handlebars', relation: 'supports' },
];

/**
 * Bike conditions — problems that can occur.
 * Used by quests and simulation to create repair scenarios.
 */
export const BIKE_CONDITIONS = {
  flat_front: { nodeId: 'front_wheel', property: 'tirePressure', value: 0 },
  flat_rear: { nodeId: 'rear_wheel', property: 'tirePressure', value: 0 },
  low_pressure: { nodeId: 'front_wheel', property: 'tirePressure', value: 15 },
  loose_chain: { nodeId: 'drivetrain', property: 'chainTension', value: 'loose' },
  broken_brakes: { nodeId: 'brakes', property: 'installed', value: false },
  no_lights: { nodeId: 'lights', property: 'installed', value: false },
};
