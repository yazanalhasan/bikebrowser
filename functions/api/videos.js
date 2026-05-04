const CONCEPT_KEYWORDS = {
  drivetrain: ['chain', 'cassette', 'derailleur', 'drivetrain', 'gear', 'shifter', 'crank'],
  brakes: ['brake', 'brakes', 'rotor', 'caliper', 'brake pad', 'hydraulic', 'bleed'],
  motor: ['motor', 'hub motor', 'mid drive', 'mid-drive', 'brushless', 'controller', 'throttle'],
  battery: ['battery', 'bms', 'lithium', 'voltage', 'charger', 'cells', 'wiring'],
  suspension: ['suspension', 'fork', 'shock', 'damper', 'stanchion', 'travel', 'rebuild'],
  build_planning: ['build', 'parts', 'compatibility', 'tools', 'torque', 'step by step', 'assembly'],
  shop_class: ['shop class', 'archive', 'training', 'course', 'lecture', 'reference']
};

const SOURCE_BONUS = {
  youtube: 2
};

const CURATED_RESULTS = [
  {
    id: 'build-planning-toolkit',
    title: 'Build Planning: parts, tools, torque, and compatibility checklist',
    channelName: 'Park Tool',
    source: 'youtube',
    videoId: 'UkZxPIZ1ngY',
    concepts: ['build_planning'],
    tags: ['build planning', 'parts', 'compatibility', 'tools', 'torque', 'step by step', 'assembly', 'checklist'],
    description: 'Start build planning with the core repair skill: identify parts, understand adjustments, and plan the tools before turning bolts.',
    thumbnail: 'https://i.ytimg.com/vi/UkZxPIZ1ngY/hqdefault.jpg'
  },
  {
    id: 'park-tool-drivetrain',
    title: 'Park Tool: rear derailleur adjustment, indexing, and drivetrain repair',
    channelName: 'Park Tool',
    source: 'youtube',
    videoId: 'UkZxPIZ1ngY',
    concepts: ['drivetrain'],
    tags: ['park tool', 'derailleur', 'indexing', 'limit screws', 'chain', 'drivetrain', 'adjustment', 'repair', 'tutorial'],
    description: 'Professional shop-style rear derailleur setup with limit screws, indexing, diagnosis, and adjustment steps.',
    thumbnail: 'https://i.ytimg.com/vi/UkZxPIZ1ngY/hqdefault.jpg'
  },
  {
    id: 'park-tool-cassette-removal-installation',
    title: 'Park Tool: cassette removal and installation step-by-step',
    channelName: 'Park Tool',
    source: 'youtube',
    videoId: '9KAaP7pbFV0',
    concepts: ['drivetrain', 'shop_class'],
    tags: ['park tool', 'cassette', 'cassette removal', 'cassette installation', 'lockring', 'chain whip', 'sprocket', 'freehub', 'drivetrain', 'maintenance', 'step by step'],
    description: 'Calvin demonstrates how to remove and install cassette cogs, choose the correct lockring tool, and keep track of spacers and orientation.',
    thumbnail: 'https://i.ytimg.com/vi/9KAaP7pbFV0/hqdefault.jpg'
  },
  {
    id: 'park-tool-chain-replacement',
    title: 'Park Tool: chain replacement, sizing, routing, and installation',
    channelName: 'Park Tool',
    source: 'youtube',
    videoId: 'VdUQKVMPF5I',
    concepts: ['drivetrain', 'shop_class'],
    tags: ['park tool', 'chain', 'chain replacement', 'chain sizing', 'master link', 'connecting rivet', 'routing', 'installation', 'drivetrain', 'maintenance'],
    description: 'Step-by-step chain replacement, including checking the old chain, sizing the new chain, routing it correctly, and connecting it safely.',
    thumbnail: 'https://i.ytimg.com/vi/VdUQKVMPF5I/hqdefault.jpg'
  },
  {
    id: 'park-tool-derailleurs-shifting-guide',
    title: 'Park Tool: guide to derailleurs and shifting',
    channelName: 'Park Tool',
    source: 'youtube',
    videoId: 'B37TW_YVC8E',
    concepts: ['drivetrain', 'shop_class'],
    tags: ['park tool', 'derailleur', 'shifting', 'shifter', 'drivetrain', 'gears', 'indexing', 'cable tension', 'maintenance', 'diagnosis'],
    description: 'A structured drivetrain foundation lesson that explains derailleurs, shifting parts, and how the system works before repair adjustments.',
    thumbnail: 'https://i.ytimg.com/vi/B37TW_YVC8E/hqdefault.jpg'
  },
  {
    id: 'park-tool-chain-cleaner',
    title: 'Park Tool: clean and lube a bicycle chain with a chain cleaner',
    channelName: 'Park Tool',
    source: 'youtube',
    videoId: 'MuwS_nSevy4',
    concepts: ['drivetrain'],
    tags: ['park tool', 'chain cleaner', 'clean chain', 'lube chain', 'degreaser', 'drivetrain', 'maintenance', 'chain wear'],
    description: 'A clear maintenance lesson on cleaning and lubricating the chain so the drivetrain runs smoother and wears more slowly.',
    thumbnail: 'https://i.ytimg.com/vi/MuwS_nSevy4/hqdefault.jpg'
  },
  {
    id: 'park-tool-brakes',
    title: 'Park Tool: brake adjustment, pads, rotors, and hydraulic service',
    channelName: 'Park Tool',
    source: 'youtube',
    videoId: 'mAEeAKmCLFU',
    concepts: ['brakes'],
    tags: ['park tool', 'brake', 'brakes', 'pads', 'rotor', 'caliper', 'hydraulic', 'bleed', 'torque'],
    description: 'Structured brake repair searches for rim brakes, disc brakes, pad alignment, rotors, and hydraulic service.',
    thumbnail: 'https://i.ytimg.com/vi/mAEeAKmCLFU/hqdefault.jpg'
  },
  {
    id: 'rj-bike-guy-problem-solving',
    title: 'RJ The Bike Guy: practical bicycle repair problem solving',
    channelName: 'RJ The Bike Guy',
    source: 'youtube',
    videoId: 'gwBQxhZhKnE',
    concepts: ['drivetrain', 'brakes'],
    tags: ['rj the bike guy', 'repair', 'problem solving', 'cheap fix', 'derailleur', 'brake', 'bearing', 'wheel'],
    description: 'Hands-on repairs and diagnostics for real bikes, useful when the problem is messy or parts are older.',
    thumbnail: 'https://i.ytimg.com/vi/gwBQxhZhKnE/hqdefault.jpg'
  },
  {
    id: 'gcn-tech-standards',
    title: 'GCN Tech: bike standards, setup, torque, and component explainers',
    channelName: 'GCN Tech',
    source: 'youtube',
    videoId: 'wQFfPvmYCfY',
    concepts: ['drivetrain', 'brakes'],
    tags: ['gcn tech', 'torque', 'standards', 'setup', 'explain', 'drivetrain', 'brakes', 'maintenance'],
    description: 'Polished explainers that help connect repair steps to bike standards, torque, compatibility, and setup.',
    thumbnail: 'https://i.ytimg.com/vi/wQFfPvmYCfY/hqdefault.jpg'
  },
  {
    id: 'berm-peak-builds',
    title: 'Berm Peak: real-world mountain bike builds and failure testing',
    channelName: 'Berm Peak',
    source: 'youtube',
    videoId: 'XCv0n0sPWJk',
    concepts: ['drivetrain', 'suspension'],
    tags: ['berm peak', 'mountain bike', 'build', 'trail', 'suspension', 'drivetrain', 'test'],
    description: 'Builds, trail testing, and practical MTB decisions that make repairs feel connected to real riding.',
    thumbnail: 'https://i.ytimg.com/vi/XCv0n0sPWJk/hqdefault.jpg'
  },
  {
    id: 'johnny-nerd-out-controller',
    title: 'Johnny Nerd Out: e-bike controller, throttle, wiring, and conversions',
    channelName: 'JohnnyNerdOut',
    source: 'youtube',
    videoId: 'WJ95ZmqEsss',
    concepts: ['motor', 'battery'],
    tags: ['johnny nerd out', 'ebike', 'e-bike', 'controller', 'throttle', 'wiring', 'conversion', 'motor'],
    description: 'DIY e-bike conversion searches focused on controllers, throttles, wiring harnesses, kits, and troubleshooting.',
    thumbnail: 'https://i.ytimg.com/vi/WJ95ZmqEsss/hqdefault.jpg'
  },
  {
    id: 'grin-technologies-motor-systems',
    title: 'Grin Technologies: e-bike motors, batteries, and system physics',
    channelName: 'Grin Technologies',
    source: 'youtube',
    videoId: 'CGGcfw1BU-Q',
    concepts: ['motor', 'battery'],
    tags: ['grin technologies', 'ebikes.ca', 'ebike', 'motor', 'battery', 'controller', 'torque', 'efficiency', 'voltage'],
    description: 'Advanced e-bike system lessons for motor behavior, battery limits, controller choices, and efficiency tradeoffs.',
    thumbnail: 'https://i.ytimg.com/vi/CGGcfw1BU-Q/hqdefault.jpg'
  },
  {
    id: 'rocky-mountain-atv-shop',
    title: 'Rocky Mountain ATV MC: dirt bike maintenance, engines, and suspension',
    channelName: 'Rocky Mountain ATV MC',
    source: 'youtube',
    videoId: 'ZJFN9M_EoRM',
    concepts: ['suspension'],
    tags: ['rocky mountain atv mc', 'dirt bike', 'motorcycle', 'engine', 'suspension', 'fork', 'maintenance', 'rebuild'],
    description: 'The closest dirt-bike equivalent to shop-class tutorials: tools, service intervals, rebuilds, and upgrades.',
    thumbnail: 'https://i.ytimg.com/vi/ZJFN9M_EoRM/hqdefault.jpg'
  },
  {
    id: 'dirt-bike-channel-decisions',
    title: 'Dirt bike suspension tips and real-world maintenance decisions',
    channelName: 'Dirt Bike TV',
    source: 'youtube',
    videoId: 'db5oAAAUVm0',
    concepts: ['suspension'],
    tags: ['dirtbikechannel', 'dirt bike', 'maintenance', 'upgrade', 'trail', 'suspension', 'engine'],
    description: 'Real-world riding and maintenance decisions that help connect shop work to what happens on the trail.',
    thumbnail: 'https://i.ytimg.com/vi/db5oAAAUVm0/hqdefault.jpg'
  },
  {
    id: 'learn-electronics-repair-diagnostics',
    title: 'Learn Electronics Repair: MOSFETs, capacitors, boards, and diagnostics',
    channelName: 'Learn Electronics Repair',
    source: 'youtube',
    videoId: 'zIzEm-YDdyA',
    concepts: ['motor', 'battery'],
    tags: ['learn electronics repair', 'mosfet', 'capacitor', 'multimeter', 'circuit', 'controller', 'diagnostics', 'repair'],
    description: 'Core electronics diagnostics for understanding why controllers, battery boards, and power circuits fail.',
    thumbnail: 'https://i.ytimg.com/vi/zIzEm-YDdyA/hqdefault.jpg'
  },
  {
    id: 'big-clive-reverse-engineering',
    title: 'Big Clive: reverse engineering and electrical failure analysis',
    channelName: 'bigclivedotcom',
    source: 'youtube',
    videoId: 'JEczJP7UoRU',
    concepts: ['battery', 'motor'],
    tags: ['big clive', 'reverse engineering', 'electronics', 'failure', 'circuit', 'power', 'battery', 'wiring'],
    description: 'Clear electrical teardown searches that build intuition for circuits, power paths, and failure modes.',
    thumbnail: 'https://i.ytimg.com/vi/JEczJP7UoRU/hqdefault.jpg'
  },
  {
    id: 'shop-class-bike-repair',
    title: 'Shop-class bike repair: repair training and maintenance practice',
    channelName: 'RJ The Bike Guy',
    source: 'youtube',
    videoId: 'gwBQxhZhKnE',
    concepts: ['shop_class', 'drivetrain', 'brakes'],
    tags: ['shop class', 'bicycle', 'maintenance', 'repair', 'training', 'derailleur', 'brake'],
    description: 'A shop-class style entry point for practicing diagnosis, maintenance steps, and clear repair thinking inside BikeBrowser.',
    thumbnail: 'https://i.ytimg.com/vi/gwBQxhZhKnE/hqdefault.jpg'
  }
];

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function tokenize(value) {
  return normalize(value)
    .split(/\s+/)
    .filter((token) => token.length >= 3);
}

function internalWatchUrl(entry) {
  return `/youtube/watch/${encodeURIComponent(entry.videoId)}`;
}

function getConcepts(entry) {
  const text = normalize(`${entry.title} ${entry.description} ${(entry.tags || []).join(' ')}`);
  const detectedConcepts = Object.entries(CONCEPT_KEYWORDS)
    .filter(([, keywords]) => keywords.some((keyword) => text.includes(normalize(keyword))))
    .map(([concept]) => concept);

  return [...new Set([...(entry.concepts || []), ...detectedConcepts])];
}

function scoreEntry(entry, query) {
  const queryTokens = tokenize(query);
  const haystack = normalize(`${entry.title} ${entry.description} ${(entry.tags || []).join(' ')} ${entry.channelName}`);

  const tokenScore = queryTokens.reduce((score, token) => (
    haystack.includes(token) ? score + 2 : score
  ), 0);
  const conceptScore = (entry.concepts || []).some((concept) => haystack.includes(concept)) ? 3 : 0;
  const channelScore = queryTokens.some((token) => normalize(entry.channelName).includes(token)) ? 4 : 0;

  return tokenScore + conceptScore + channelScore + (SOURCE_BONUS[entry.source] || 0);
}

export function onRequestGet({ request }) {
  const url = new URL(request.url);
  const query = String(url.searchParams.get('q') || '').trim();

  if (!query) {
    return Response.json({ success: true, total: 0, results: [] });
  }

  const results = CURATED_RESULTS
    .map((entry) => {
      const concepts = getConcepts(entry);
      return {
        id: entry.id,
        title: entry.title,
        description: entry.description,
        thumbnail: entry.thumbnail,
        url: internalWatchUrl(entry),
        videoId: entry.videoId,
        source: entry.source,
        channelName: entry.channelName,
        concepts,
        score: scoreEntry({ ...entry, concepts }, query)
      };
    })
    .filter((entry) => entry.score >= 5)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  const fallbackResults = results.length > 0
    ? results
    : CURATED_RESULTS.slice(0, 6).map((entry) => ({
      id: entry.id,
      title: entry.title,
      description: entry.description,
      thumbnail: entry.thumbnail,
      url: internalWatchUrl(entry),
      videoId: entry.videoId,
      source: entry.source,
      channelName: entry.channelName,
      concepts: getConcepts(entry),
      score: scoreEntry(entry, query)
    }));

  return Response.json({
    success: true,
    total: fallbackResults.length,
    results: fallbackResults
  });
}
