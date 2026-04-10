const { YouTubeManager } = require('../source-managers/youtube-manager');
const { YouTubeKidsManager } = require('../source-managers/youtube-kids-manager');
const { ScienceKidsManager } = require('../source-managers/sciencekids-manager');
const { ToyMakerManager } = require('../source-managers/toymaker-manager');
const { KrokotakManager } = require('../source-managers/krokotak-manager');
const { DIYOrgManager } = require('../source-managers/diyorg-manager');
const { TiinkerManager } = require('../source-managers/tiinker-manager');
const { NDLIManager } = require('../source-managers/ndli-manager');
const { ShoppingManager } = require('./shopping-manager');

class SourceRegistry {
  constructor(config = {}) {
    this.managers = {
      youtube: new YouTubeManager(config.youtubeApiKey),
      youtubeKids: new YouTubeKidsManager(config.youtubeApiKey),
      sciencekids: new ScienceKidsManager(),
      toymaker: new ToyMakerManager(),
      krokotak: new KrokotakManager(),
      diyorg: new DIYOrgManager(),
      tiinker: new TiinkerManager(),
      ndli: new NDLIManager(),
      shopping: new ShoppingManager(config)
    };

    this.intentSourceMap = {
      build: ['youtube', 'youtubeKids', 'sciencekids', 'toymaker', 'krokotak', 'diyorg', 'tiinker', 'shopping'],
      watch: ['youtube', 'sciencekids'],
      buy: ['shopping'],
      mixed: ['youtube', 'youtubeKids', 'sciencekids', 'toymaker', 'krokotak', 'diyorg', 'tiinker', 'ndli', 'shopping']
    };
  }

  getSourcesForIntent(intent) {
    const names = this.intentSourceMap[intent] || this.intentSourceMap.watch;
    return names
      .map((name) => {
        const manager = this.managers[name];
        if (!manager) {
          return null;
        }

        return {
          name,
          manager
        };
      })
      .filter(Boolean);
  }
}

module.exports = {
  SourceRegistry
};