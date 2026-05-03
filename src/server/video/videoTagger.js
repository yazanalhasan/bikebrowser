const CONCEPT_KEYWORDS = {
  drivetrain: [
    'chain',
    'cassette',
    'derailleur',
    'drivetrain',
    'gear',
    'gears',
    'crank',
    'chainring'
  ],
  brakes: [
    'brake',
    'brakes',
    'rotor',
    'caliper',
    'brake pad',
    'hydraulic'
  ],
  motor: [
    'motor',
    'hub motor',
    'mid drive',
    'mid-drive',
    'brushless',
    'controller'
  ],
  battery: [
    'battery',
    'bms',
    'lithium',
    'voltage',
    'charger',
    'cells'
  ],
  suspension: [
    'suspension',
    'fork',
    'shock',
    'damper',
    'stanchion',
    'travel'
  ]
};

function normalize(value) {
  return String(value || '').toLowerCase();
}

function hasKeyword(text, keywords) {
  return keywords.some((keyword) => text.includes(keyword));
}

function tagVideo(video) {
  const text = normalize(`${video?.title || ''} ${video?.description || ''}`);
  const concepts = Object.entries(CONCEPT_KEYWORDS)
    .filter(([, keywords]) => hasKeyword(text, keywords))
    .map(([concept]) => concept);

  return {
    ...video,
    concepts
  };
}

module.exports = {
  tagVideo
};
