const CONCEPT_KEYWORDS = {
  drivetrain: ['chain', 'cassette', 'derailleur', 'drivetrain', 'gear', 'crank'],
  brakes: ['brake', 'brakes', 'rotor', 'caliper', 'brake pad', 'hydraulic'],
  motor: ['motor', 'hub motor', 'mid drive', 'brushless', 'controller'],
  battery: ['battery', 'bms', 'lithium', 'voltage', 'charger', 'cells'],
  suspension: ['suspension', 'fork', 'shock', 'damper', 'stanchion', 'travel']
};

const SOURCES = [
  {
    source: 'youtube',
    title: 'Park Tool, RJ The Bike Guy, and GCN Tech results',
    description: 'Structured bicycle repair videos for drivetrain, brakes, torque, and diagnosis.',
    thumbnail: 'https://placehold.co/640x360/dbeafe/1e3a8a?text=YouTube+Videos',
    baseUrl: 'https://www.youtube.com/results?search_query='
  },
  {
    source: 'youtube',
    title: 'Johnny Nerd Out and Grin Technologies e-bike results',
    description: 'E-bike battery, controller, wiring, motor, and conversion troubleshooting.',
    thumbnail: 'https://placehold.co/640x360/dbeafe/1e3a8a?text=E-Bike+Videos',
    baseUrl: 'https://www.youtube.com/results?search_query='
  },
  {
    source: 'vimeo',
    title: 'Vimeo technical bike and repair videos',
    description: 'Alternate video source for bike mechanics, build planning, and repair.',
    thumbnail: 'https://placehold.co/640x360/dbeafe/1e3a8a?text=Vimeo+Videos',
    baseUrl: 'https://vimeo.com/search?q='
  },
  {
    source: 'internet_archive',
    title: 'Internet Archive bicycle and motorcycle repair media',
    description: 'Archival shop, maintenance, and educational repair videos.',
    thumbnail: 'https://placehold.co/640x360/e0f2fe/075985?text=Archive+Videos',
    baseUrl: 'https://archive.org/search?query='
  }
];

function normalize(value) {
  return String(value || '').toLowerCase();
}

function getConcepts(video) {
  const text = normalize(`${video.title} ${video.description}`);
  return Object.entries(CONCEPT_KEYWORDS)
    .filter(([, keywords]) => keywords.some((keyword) => text.includes(keyword)))
    .map(([concept]) => concept);
}

function scoreVideo(video, query) {
  const normalizedQuery = normalize(query);
  let score = 0;

  if (normalizedQuery && normalize(video.title).includes(normalizedQuery)) score += 5;
  if (video.concepts.length > 0) score += 3;
  if (video.source === 'vimeo') score += 3;
  if (video.source === 'youtube') score += 2;
  if (video.source === 'internet_archive') score += 1;

  return score;
}

export function onRequestGet({ request }) {
  const url = new URL(request.url);
  const query = String(url.searchParams.get('q') || '').trim();

  if (!query) {
    return Response.json({ success: true, total: 0, results: [] });
  }

  const results = SOURCES.map((source, index) => {
    const sourceQuery = `${query} ${source.title}`;
    const video = {
      id: `${source.source}:${index}:${query.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 48)}`,
      title: source.title,
      description: source.description,
      thumbnail: source.thumbnail,
      url: `${source.baseUrl}${encodeURIComponent(sourceQuery)}`,
      source: source.source,
      concepts: []
    };

    video.concepts = getConcepts(video);
    video.score = scoreVideo(video, query);
    return video;
  }).sort((a, b) => b.score - a.score);

  return Response.json({
    success: true,
    total: results.length,
    results
  });
}
