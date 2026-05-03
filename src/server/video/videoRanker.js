function getSourceScore(source) {
  if (source === 'vimeo') return 3;
  if (source === 'youtube') return 2;
  if (source === 'internet_archive' || source === 'archive') return 1;
  return 0;
}

function rankVideos(videos, query) {
  const normalizedQuery = String(query || '').trim().toLowerCase();

  return [...(Array.isArray(videos) ? videos : [])]
    .map((video) => {
      let score = 0;
      const title = String(video?.title || '').toLowerCase();

      if (normalizedQuery && title.includes(normalizedQuery)) {
        score += 5;
      }

      if (Array.isArray(video?.concepts) && video.concepts.length > 0) {
        score += 3;
      }

      score += getSourceScore(video?.source);

      return {
        ...video,
        score
      };
    })
    .sort((a, b) => b.score - a.score);
}

module.exports = {
  rankVideos
};
