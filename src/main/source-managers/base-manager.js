class BaseSourceManager {
  constructor(sourceName) {
    this.sourceName = sourceName;
    this.sourceId = sourceName.toLowerCase().replace(/\s/g, '-');
  }

  async search() {
    throw new Error('search() must be implemented by subclass');
  }

  async getById() {
    throw new Error('getById() must be implemented by subclass');
  }

  normalize() {
    throw new Error('normalize() must be implemented by subclass');
  }

  supportsIntent() {
    return true;
  }
}

module.exports = {
  BaseSourceManager
};