const path = require('path');
const { CuratedSourceManager } = require('./curated-manager');

class KrokotakManager extends CuratedSourceManager {
  constructor() {
    super('Krokotak', path.join(__dirname, '../../../data/curated-sources/krokotak-index.json'));
  }

  supportsIntent(intent) {
    return intent === 'build' || intent === 'mixed';
  }
}

module.exports = {
  KrokotakManager
};