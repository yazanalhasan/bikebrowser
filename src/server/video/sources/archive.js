/**
 * Internet Archive video source connector.
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
      id: `archive:mock-${slug}-collection`,
      title: `Internet Archive video for ${cleanedQuery}`,
      description: `Mock Internet Archive result for archived educational media about ${cleanedQuery}.`,
      thumbnail: `https://archive.org/services/img/mock-${slug}`,
      url: `https://archive.org/search?query=${encodeURIComponent(cleanedQuery)}&and[]=mediatype%3A%22movies%22`,
      source: 'internet_archive'
    }
  ];
}

module.exports = {
  search
};
