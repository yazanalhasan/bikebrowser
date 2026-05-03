class VideoResult {
  constructor({
    id,
    title,
    description = '',
    thumbnail = '',
    url,
    source,
    concepts = [],
    score = 0
  }) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.thumbnail = thumbnail;
    this.url = url;
    this.source = source;
    this.concepts = Array.isArray(concepts) ? concepts : [];
    this.score = Number.isFinite(Number(score)) ? Number(score) : 0;
  }
}

module.exports = {
  VideoResult
};
