/**
 * Vimeo video source connector.
 *
 * Shape:
 * {
 *   id,
 *   title,
 *   description,
 *   thumbnail,
 *   url,
 *   source
 * }
 */

async function search(query) {
  const cleanedQuery = String(query || '').trim();
  if (!cleanedQuery) {
    return [];
  }

  const slug = cleanedQuery
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'bike-video';

  return [
    {
      id: `vimeo:mock-${slug}-workshop`,
      title: `Vimeo workshop video for ${cleanedQuery}`,
      description: `Mock Vimeo result for a workshop-style video about ${cleanedQuery}.`,
      thumbnail: `https://vumbnail.com/mock-${slug}.jpg`,
      url: `https://vimeo.com/search?q=${encodeURIComponent(cleanedQuery)}`,
      source: 'vimeo'
    }
  ];
}

module.exports = {
  search
};
