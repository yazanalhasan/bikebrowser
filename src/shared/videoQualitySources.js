const CURATED_CHANNELS = [
  {
    name: 'Park Tool',
    aliases: ['park tool', 'parktool'],
    systems: ['bike_mechanics'],
    note: 'Professional bike repair tutorials'
  },
  {
    name: 'RJ The Bike Guy',
    aliases: ['rj the bike guy', 'rj bike guy'],
    systems: ['bike_mechanics', 'problem_solving'],
    note: 'Practical repair and troubleshooting'
  },
  {
    name: 'GCN Tech',
    aliases: ['gcn tech'],
    systems: ['bike_mechanics'],
    note: 'Structured cycling technology explanations'
  },
  {
    name: 'Berm Peak',
    aliases: ['berm peak', 'seth bike hacks', 'seth’s bike hacks'],
    systems: ['mountain_bike', 'builds'],
    note: 'Real-world mountain bike builds and stress testing'
  },
  {
    name: 'Johnny Nerd Out',
    aliases: ['johnny nerd out', 'johnnynerdout'],
    systems: ['ebike_power', 'builds'],
    note: 'DIY e-bike conversions, controllers, throttles, and wiring'
  },
  {
    name: 'Grin Technologies',
    aliases: ['grin technologies', 'grin tech', 'ebikes.ca'],
    systems: ['ebike_power', 'advanced_physics'],
    note: 'Advanced e-bike motors, battery systems, and efficiency testing'
  },
  {
    name: 'Rocky Mountain ATV MC',
    aliases: ['rocky mountain atv mc', 'rockymountainatvmc', 'rocky mountain atv/mc'],
    systems: ['dirt_bike_mechanics'],
    note: 'Structured dirt bike maintenance, rebuilds, and tool-based repair'
  },
  {
    name: 'DirtBikeChannel',
    aliases: ['dirtbikechannel', 'dirt bike channel'],
    systems: ['dirt_bike_mechanics', 'real_world'],
    note: 'Real-world dirt bike maintenance and upgrade decisions'
  },
  {
    name: 'Learn Electronics Repair',
    aliases: ['learn electronics repair'],
    systems: ['electrical_diagnostics'],
    note: 'Electronics troubleshooting for MOSFETs, capacitors, and boards'
  },
  {
    name: 'Big Clive',
    aliases: ['big clive', 'bigclivedotcom', 'bigclive'],
    systems: ['electrical_diagnostics'],
    note: 'Electrical reverse engineering and failure analysis'
  }
];

const QUALITY_PRESETS = [
  {
    id: 'bike-mechanics',
    label: 'Bike Mechanics',
    description: 'Park Tool-style repair, torque, brakes, drivetrain, and diagnosis.',
    query: 'Park Tool RJ The Bike Guy GCN Tech bicycle derailleur brake torque drivetrain repair tutorial',
    systems: ['bike_mechanics']
  },
  {
    id: 'ebike-power',
    label: 'E-Bike Power',
    description: 'Motors, controllers, batteries, wiring, conversions, and troubleshooting.',
    query: 'Johnny Nerd Out Grin Technologies ebike controller battery motor wiring troubleshooting conversion',
    systems: ['ebike_power', 'electrical_diagnostics']
  },
  {
    id: 'dirt-bike-shop',
    label: 'Dirt Bike Shop',
    description: 'Rocky Mountain ATV MC-style maintenance, suspension, engines, and rebuilds.',
    query: 'Rocky Mountain ATV MC dirt bike maintenance engine suspension rebuild troubleshooting tutorial',
    systems: ['dirt_bike_mechanics']
  },
  {
    id: 'electrical-diagnostics',
    label: 'Electrical Diagnostics',
    description: 'Controllers, MOSFETs, capacitors, battery faults, and failure analysis.',
    query: 'Learn Electronics Repair Big Clive ebike controller MOSFET capacitor battery diagnostics repair',
    systems: ['electrical_diagnostics']
  },
  {
    id: 'build-planning',
    label: 'Build Planning',
    description: 'Parts, compatibility, tools, and step-by-step project planning.',
    query: 'Park Tool Johnny Nerd Out bike build parts compatibility tools torque step by step',
    systems: ['builds', 'bike_mechanics', 'ebike_power']
  }
];

const SYSTEM_KEYWORDS = {
  bike_mechanics: [
    'derailleur', 'brake', 'brakes', 'hydraulic', 'cable', 'torque', 'bottom bracket',
    'cassette', 'chain', 'drivetrain', 'headset', 'wheel truing', 'hub', 'caliper'
  ],
  ebike_power: [
    'ebike', 'e-bike', 'controller', 'throttle', 'bms', 'battery', 'lithium',
    'motor', 'hub motor', 'mid drive', 'phase wire', 'hall sensor', 'voltage',
    'amp', 'watt', 'display', 'pas sensor', 'conversion'
  ],
  dirt_bike_mechanics: [
    'dirt bike', 'motorcycle', 'carburetor', 'fork seal', 'top end', 'rebuild',
    'clutch', 'chain adjustment', 'air filter', 'valve clearance', 'suspension',
    'shock', 'engine', 'piston'
  ],
  electrical_diagnostics: [
    'mosfet', 'capacitor', 'multimeter', 'continuity', 'solder', 'circuit',
    'pcb', 'controller', 'diagnostic', 'short circuit', 'voltage', 'current',
    'connector', 'wiring'
  ],
  builds: [
    'build', 'parts list', 'compatibility', 'tools', 'assembly', 'install',
    'conversion', 'setup', 'step by step'
  ]
};

const LOW_DEPTH_PATTERNS = [
  /\btop\s+\d+\b/i,
  /\bcheap\b/i,
  /\bbest\s+ever\b/i,
  /\binsane\b/i,
  /\byou won'?t believe\b/i,
  /\bcompilation\b/i,
  /\breaction\b/i,
  /\bvlog\b/i
];

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function getResultText(item = {}) {
  return [
    item.title,
    item.description,
    item.summary,
    item.channelName,
    item.sourceMetadata?.author,
    item.sourceMetadata?.channelTitle
  ].filter(Boolean).join(' ');
}

function getChannelName(item = {}) {
  return item.channelName || item.sourceMetadata?.author || item.sourceMetadata?.channelTitle || '';
}

function findCuratedChannel(item = {}) {
  const channelName = normalize(getChannelName(item));
  if (!channelName) return null;

  return CURATED_CHANNELS.find((channel) =>
    channel.aliases.some((alias) => channelName.includes(normalize(alias)))
  ) || null;
}

function getSystemsForQuery(query = '') {
  const normalizedQuery = normalize(query);
  const systems = new Set();

  for (const preset of QUALITY_PRESETS) {
    if (preset.systems.some((system) => normalizedQuery.includes(system.replace(/_/g, ' ')))) {
      preset.systems.forEach((system) => systems.add(system));
    }
  }

  for (const [system, keywords] of Object.entries(SYSTEM_KEYWORDS)) {
    if (keywords.some((keyword) => normalizedQuery.includes(normalize(keyword)))) {
      systems.add(system);
    }
  }

  if (normalizedQuery.includes('electric bike') || normalizedQuery.includes('ebike')) {
    systems.add('ebike_power');
  }
  if (normalizedQuery.includes('dirt bike') || normalizedQuery.includes('motorcycle')) {
    systems.add('dirt_bike_mechanics');
  }
  if (normalizedQuery.includes('repair') || normalizedQuery.includes('maintenance')) {
    systems.add('bike_mechanics');
  }

  return [...systems];
}

function countKeywordMatches(text, keywords = []) {
  const normalizedText = normalize(text);
  return keywords.reduce((count, keyword) => (
    normalizedText.includes(normalize(keyword)) ? count + 1 : count
  ), 0);
}

function scoreQualityFit(item = {}, query = '') {
  const curatedChannel = findCuratedChannel(item);
  const text = getResultText(item);
  const querySystems = getSystemsForQuery(query);
  const allSystems = querySystems.length > 0
    ? querySystems
    : ['bike_mechanics', 'ebike_power', 'dirt_bike_mechanics', 'electrical_diagnostics', 'builds'];

  let sourceBonus = curatedChannel ? 0.2 : 0;
  if (curatedChannel && querySystems.some((system) => curatedChannel.systems.includes(system))) {
    sourceBonus += 0.18;
  }

  const technicalMatches = allSystems.reduce((sum, system) => (
    sum + countKeywordMatches(text, SYSTEM_KEYWORDS[system] || [])
  ), 0);
  const depthBonus = Math.min(0.18, technicalMatches * 0.025);

  const lowDepthPenalty = LOW_DEPTH_PATTERNS.some((pattern) => pattern.test(text)) ? 0.08 : 0;

  return {
    curatedChannel,
    sourceBonus,
    depthBonus,
    lowDepthPenalty,
    total: Math.max(0, sourceBonus + depthBonus - lowDepthPenalty),
    technicalMatches,
    querySystems
  };
}

module.exports = {
  CURATED_CHANNELS,
  QUALITY_PRESETS,
  SYSTEM_KEYWORDS,
  normalize,
  getChannelName,
  findCuratedChannel,
  scoreQualityFit
};
