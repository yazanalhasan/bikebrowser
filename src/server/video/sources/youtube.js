/**
 * YouTube video source connector.
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
      id: `youtube:mock-${slug}-mechanic`,
      title: `YouTube tutorial for ${cleanedQuery}`,
      description: `Mock YouTube result for learning about ${cleanedQuery}.`,
      thumbnail: `https://i.ytimg.com/vi/mock-${slug}/hqdefault.jpg`,
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(cleanedQuery)}`,
      source: 'youtube'
    }
  ];
}

module.exports = {
  search
};
