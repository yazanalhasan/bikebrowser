const path = require('path');
const { CuratedSourceManager } = require('./curated-manager');

class ToyMakerManager extends CuratedSourceManager {
  constructor() {
    super('The ToyMaker', path.join(__dirname, '../../../data/curated-sources/toymaker-index.json'));
    this.sourceId = 'toymaker';
  }

  supportsIntent(intent) {
    return intent === 'build' || intent === 'mixed';
  }
}

module.exports = {
  ToyMakerManager
};