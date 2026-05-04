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
  vimeo: 3,
  youtube: 2,
  internet_archive: 1
};

const CURATED_RESULTS = [
  {
    id: 'build-planning-toolkit',
    title: 'Build Planning: parts, tools, torque, and compatibility checklist',
    channelName: 'BikeBrowser Curated Build Plan',
    source: 'youtube',
    concepts: ['build_planning'],
    tags: ['build planning', 'parts', 'compatibility', 'tools', 'torque', 'step by step', 'assembly', 'checklist'],
    description: 'A curated search path for planning a bike or e-bike build before buying parts or turning wrenches.',
    thumbnail: 'https://placehold.co/640x360/fef9c3/854d0e?text=Build+Planning',
    urlQuery: 'Park Tool Johnny Nerd Out bike build parts compatibility tools torque step by step checklist'
  },
  {
    id: 'park-tool-drivetrain',
    title: 'Park Tool: derailleur, chain, cassette, and drivetrain repair',
    channelName: 'Park Tool',
    source: 'youtube',
    concepts: ['drivetrain'],
    tags: ['park tool', 'derailleur', 'chain', 'cassette', 'drivetrain', 'adjustment', 'repair', 'tutorial'],
    description: 'Professional shop-style bicycle drivetrain lessons with clear setup, diagnosis, and adjustment steps.',
    thumbnail: 'https://placehold.co/640x360/dbeafe/1e3a8a?text=Park+Tool+Drivetrain',
    urlQuery: 'Park Tool derailleur adjustment chain cassette drivetrain repair'
  },
  {
    id: 'park-tool-brakes',
    title: 'Park Tool: brake adjustment, pads, rotors, and hydraulic service',
    channelName: 'Park Tool',
    source: 'youtube',
    concepts: ['brakes'],
    tags: ['park tool', 'brake', 'brakes', 'pads', 'rotor', 'caliper', 'hydraulic', 'bleed', 'torque'],
    description: 'Structured brake repair searches for rim brakes, disc brakes, pad alignment, rotors, and hydraulic service.',
    thumbnail: 'https://placehold.co/640x360/e0f2fe/075985?text=Park+Tool+Brakes',
    urlQuery: 'Park Tool bicycle brake adjustment disc brake pads rotor hydraulic bleed'
  },
  {
    id: 'rj-bike-guy-problem-solving',
    title: 'RJ The Bike Guy: practical bicycle repair problem solving',
    channelName: 'RJ The Bike Guy',
    source: 'youtube',
    concepts: ['drivetrain', 'brakes'],
    tags: ['rj the bike guy', 'repair', 'problem solving', 'cheap fix', 'derailleur', 'brake', 'bearing', 'wheel'],
    description: 'Hands-on repairs and diagnostics for real bikes, useful when the problem is messy or parts are older.',
    thumbnail: 'https://placehold.co/640x360/ecfccb/365314?text=RJ+The+Bike+Guy',
    urlQuery: 'RJ The Bike Guy bicycle repair derailleur brake troubleshooting'
  },
  {
    id: 'gcn-tech-standards',
    title: 'GCN Tech: bike standards, setup, torque, and component explainers',
    channelName: 'GCN Tech',
    source: 'youtube',
    concepts: ['drivetrain', 'brakes'],
    tags: ['gcn tech', 'torque', 'standards', 'setup', 'explain', 'drivetrain', 'brakes', 'maintenance'],
    description: 'Polished explainers that help connect repair steps to bike standards, torque, compatibility, and setup.',
    thumbnail: 'https://placehold.co/640x360/fef3c7/92400e?text=GCN+Tech',
    urlQuery: 'GCN Tech bicycle torque drivetrain brakes maintenance setup'
  },
  {
    id: 'berm-peak-builds',
    title: 'Berm Peak: real-world mountain bike builds and failure testing',
    channelName: 'Berm Peak',
    source: 'youtube',
    concepts: ['drivetrain', 'suspension'],
    tags: ['berm peak', 'mountain bike', 'build', 'trail', 'suspension', 'drivetrain', 'test'],
    description: 'Builds, trail testing, and practical MTB decisions that make repairs feel connected to real riding.',
    thumbnail: 'https://placehold.co/640x360/dcfce7/166534?text=Berm+Peak+Builds',
    urlQuery: 'Berm Peak mountain bike build suspension drivetrain repair'
  },
  {
    id: 'johnny-nerd-out-controller',
    title: 'Johnny Nerd Out: e-bike controller, throttle, wiring, and conversions',
    channelName: 'Johnny Nerd Out',
    source: 'youtube',
    concepts: ['motor', 'battery'],
    tags: ['johnny nerd out', 'ebike', 'e-bike', 'controller', 'throttle', 'wiring', 'conversion', 'motor'],
    description: 'DIY e-bike conversion searches focused on controllers, throttles, wiring harnesses, kits, and troubleshooting.',
    thumbnail: 'https://placehold.co/640x360/ede9fe/5b21b6?text=Johnny+Nerd+Out',
    urlQuery: 'Johnny Nerd Out ebike controller throttle wiring conversion troubleshooting'
  },
  {
    id: 'grin-technologies-motor-systems',
    title: 'Grin Technologies: e-bike motors, batteries, and system physics',
    channelName: 'Grin Technologies',
    source: 'youtube',
    concepts: ['motor', 'battery'],
    tags: ['grin technologies', 'ebikes.ca', 'ebike', 'motor', 'battery', 'controller', 'torque', 'efficiency', 'voltage'],
    description: 'Advanced e-bike system lessons for motor behavior, battery limits, controller choices, and efficiency tradeoffs.',
    thumbnail: 'https://placehold.co/640x360/fae8ff/86198f?text=Grin+Technologies',
    urlQuery: 'Grin Technologies ebike motor battery controller efficiency torque'
  },
  {
    id: 'rocky-mountain-atv-shop',
    title: 'Rocky Mountain ATV MC: dirt bike maintenance, engines, and suspension',
    channelName: 'Rocky Mountain ATV MC',
    source: 'youtube',
    concepts: ['suspension'],
    tags: ['rocky mountain atv mc', 'dirt bike', 'motorcycle', 'engine', 'suspension', 'fork', 'maintenance', 'rebuild'],
    description: 'The closest dirt-bike equivalent to shop-class tutorials: tools, service intervals, rebuilds, and upgrades.',
    thumbnail: 'https://placehold.co/640x360/fee2e2/991b1b?text=Rocky+Mountain+ATV+MC',
    urlQuery: 'Rocky Mountain ATV MC dirt bike maintenance engine suspension rebuild tutorial'
  },
  {
    id: 'dirt-bike-channel-decisions',
    title: 'DirtBikeChannel: real-world dirt bike maintenance decisions',
    channelName: 'DirtBikeChannel',
    source: 'youtube',
    concepts: ['suspension'],
    tags: ['dirtbikechannel', 'dirt bike', 'maintenance', 'upgrade', 'trail', 'suspension', 'engine'],
    description: 'Real-world riding and maintenance decisions that help connect shop work to what happens on the trail.',
    thumbnail: 'https://placehold.co/640x360/ffedd5/9a3412?text=DirtBikeChannel',
    urlQuery: 'DirtBikeChannel dirt bike maintenance suspension upgrade decisions'
  },
  {
    id: 'learn-electronics-repair-diagnostics',
    title: 'Learn Electronics Repair: MOSFETs, capacitors, boards, and diagnostics',
    channelName: 'Learn Electronics Repair',
    source: 'youtube',
    concepts: ['motor', 'battery'],
    tags: ['learn electronics repair', 'mosfet', 'capacitor', 'multimeter', 'circuit', 'controller', 'diagnostics', 'repair'],
    description: 'Core electronics diagnostics for understanding why controllers, battery boards, and power circuits fail.',
    thumbnail: 'https://placehold.co/640x360/ccfbf1/115e59?text=Electronics+Diagnostics',
    urlQuery: 'Learn Electronics Repair MOSFET capacitor controller diagnostics multimeter'
  },
  {
    id: 'big-clive-reverse-engineering',
    title: 'Big Clive: reverse engineering and electrical failure analysis',
    channelName: 'Big Clive',
    source: 'youtube',
    concepts: ['battery', 'motor'],
    tags: ['big clive', 'reverse engineering', 'electronics', 'failure', 'circuit', 'power', 'battery', 'wiring'],
    description: 'Clear electrical teardown searches that build intuition for circuits, power paths, and failure modes.',
    thumbnail: 'https://placehold.co/640x360/cffafe/155e75?text=Big+Clive',
    urlQuery: 'Big Clive reverse engineering electronics power failure battery wiring'
  },
  {
    id: 'vimeo-bike-technique',
    title: 'Vimeo: technical bike repair and maintenance lectures',
    channelName: 'Vimeo',
    source: 'vimeo',
    concepts: ['drivetrain', 'brakes'],
    tags: ['vimeo', 'bike repair', 'maintenance', 'drivetrain', 'brakes', 'lecture', 'training'],
    description: 'Alternate source for longer-form or course-like bike repair videos outside YouTube.',
    thumbnail: 'https://placehold.co/640x360/dbeafe/1e40af?text=Vimeo+Bike+Repair',
    urlQuery: 'bicycle repair maintenance drivetrain brakes training'
  },
  {
    id: 'archive-shop-class',
    title: 'Internet Archive: bicycle and motorcycle shop-class media',
    channelName: 'Internet Archive',
    source: 'internet_archive',
    concepts: ['shop_class', 'drivetrain', 'brakes'],
    tags: ['archive', 'shop class', 'bicycle', 'motorcycle', 'maintenance', 'repair', 'training'],
    description: 'Archival repair and shop-class media for slower, deeper background learning.',
    thumbnail: 'https://placehold.co/640x360/e0f2fe/075985?text=Archive+Shop+Class',
    urlQuery: 'bicycle motorcycle repair maintenance shop class'
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

function sourceSearchUrl(entry, query) {
  const searchQuery = `${entry.urlQuery} ${query}`.trim();
  if (entry.source === 'vimeo') {
    return `https://vimeo.com/search?q=${encodeURIComponent(searchQuery)}`;
  }
  if (entry.source === 'internet_archive') {
    return `https://archive.org/search?query=${encodeURIComponent(searchQuery)}&and[]=mediatype%3A%22movies%22`;
  }
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`;
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
        url: sourceSearchUrl(entry, query),
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
      url: sourceSearchUrl(entry, query),
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
