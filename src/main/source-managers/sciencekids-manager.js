const path = require('path');
const { CuratedSourceManager } = require('./curated-manager');

class ScienceKidsManager extends CuratedSourceManager {
  constructor() {
    super('Science Kids', path.join(__dirname, '../../../data/curated-sources/sciencekids-index.json'));
    this.sourceId = 'sciencekids';
  }

  supportsIntent(intent) {
    return intent === 'watch' || intent === 'build' || intent === 'mixed';
  }
}

module.exports = {
  ScienceKidsManager
};