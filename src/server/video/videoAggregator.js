const youtube = require('./sources/youtube');
const vimeo = require('./sources/vimeo');
const archive = require('./sources/archive');
const { VideoResult } = require('./videoResult');
const { tagVideo } = require('./videoTagger');
const { rankVideos } = require('./videoRanker');

const CONNECTORS = [
  youtube,
  vimeo,
  archive
];

async function searchAllVideos(query) {
  const settledResults = await Promise.allSettled(
    CONNECTORS.map((connector) => connector.search(query))
  );

  const videos = settledResults
    .filter((result) => result.status === 'fulfilled')
    .flatMap((result) => Array.isArray(result.value) ? result.value : [])
    .map((result) => new VideoResult(tagVideo(result)));

  return rankVideos(videos, query).map((result) => new VideoResult(result));
}

module.exports = {
  searchAllVideos
};
