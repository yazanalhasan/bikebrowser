import { useEffect, useState } from 'react';

const API_CANDIDATES = ['', 'http://localhost:3001'];

const CONCEPT_LABELS = {
  drivetrain: 'Drivetrain',
  brakes: 'Brakes',
  motor: 'Motor',
  battery: 'Battery',
  suspension: 'Suspension',
  uncategorized: 'Other Videos'
};

function groupVideosByFirstConcept(videos) {
  return videos.reduce((groups, video) => {
    const firstConcept = Array.isArray(video.concepts) && video.concepts[0]
      ? video.concepts[0]
      : 'uncategorized';

    if (!groups[firstConcept]) {
      groups[firstConcept] = [];
    }

    groups[firstConcept].push(video);
    return groups;
  }, {});
}

function VideoResults({ query }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const cleanedQuery = String(query || '').trim();
    if (!cleanedQuery) {
      setVideos([]);
      setError('');
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchVideos() {
      setLoading(true);
      setError('');

      let lastError = null;
      for (const base of API_CANDIDATES) {
        try {
          const response = await fetch(`${base}/api/videos?q=${encodeURIComponent(cleanedQuery)}`, {
            cache: 'no-store'
          });

          if (!response.ok) {
            throw new Error(`Video search failed with ${response.status}`);
          }

          const data = await response.json();
          if (!cancelled) {
            setVideos(Array.isArray(data.results) ? data.results : []);
            setLoading(false);
          }
          return;
        } catch (fetchError) {
          lastError = fetchError;
        }
      }

      if (!cancelled) {
        setVideos([]);
        setError(lastError?.message || 'Video search failed');
        setLoading(false);
      }
    }

    fetchVideos();

    return () => {
      cancelled = true;
    };
  }, [query]);

  if (!query) {
    return null;
  }

  return (
    <section style={styles.section} aria-label="Multi-source video results">
      <div style={styles.headerRow}>
        <div>
          <h2 style={styles.heading}>Multi-source videos</h2>
          <p style={styles.subheading}>YouTube, Vimeo, and Internet Archive results</p>
        </div>
        {loading && <span style={styles.status}>Loading...</span>}
      </div>

      {error && <p style={styles.error}>{error}</p>}

      {!loading && !error && videos.length === 0 && (
        <p style={styles.empty}>No multi-source videos found yet.</p>
      )}

      {videos.length > 0 && Object.entries(groupVideosByFirstConcept(videos)).map(([concept, conceptVideos]) => (
        <div key={concept} style={styles.conceptSection}>
          <h3 style={styles.conceptHeading}>{CONCEPT_LABELS[concept] || concept}</h3>
          <div style={styles.grid}>
            {conceptVideos.map((video) => (
              <article key={`${video.source}:${video.id}`} style={styles.card}>
                <a href={video.url} target="_blank" rel="noreferrer" style={styles.thumbnailLink}>
                  <img
                    src={video.thumbnail}
                    alt=""
                    style={styles.thumbnail}
                    loading="lazy"
                  />
                </a>
                <div style={styles.cardBody}>
                  <div style={styles.source}>
                    {video.channelName || video.source}
                    <span style={styles.sourcePill}>{video.source}</span>
                  </div>
                  <a href={video.url} target="_blank" rel="noreferrer" style={styles.title}>
                    {video.title}
                  </a>
                  {video.description && (
                    <p style={styles.description}>{video.description}</p>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

const styles = {
  section: {
    marginBottom: 24,
    padding: 16,
    border: '2px solid #bfdbfe',
    borderRadius: 12,
    background: '#ffffff'
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'flex-start',
    marginBottom: 12
  },
  heading: {
    margin: 0,
    color: '#1e3a8a',
    fontSize: 20,
    lineHeight: 1.2
  },
  subheading: {
    margin: '4px 0 0',
    color: '#475569',
    fontSize: 14
  },
  status: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: 700
  },
  error: {
    margin: 0,
    color: '#b91c1c',
    fontWeight: 700
  },
  empty: {
    margin: 0,
    color: '#475569'
  },
  conceptSection: {
    marginTop: 16
  },
  conceptHeading: {
    margin: '0 0 10px',
    color: '#0f172a',
    fontSize: 18,
    lineHeight: 1.25
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 12
  },
  card: {
    overflow: 'hidden',
    border: '1px solid #dbeafe',
    borderRadius: 10,
    background: '#f8fafc'
  },
  thumbnailLink: {
    display: 'block',
    background: '#e2e8f0'
  },
  thumbnail: {
    display: 'block',
    width: '100%',
    aspectRatio: '16 / 9',
    objectFit: 'cover'
  },
  cardBody: {
    padding: 10
  },
  source: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
    color: '#0369a1',
    fontSize: 12,
    fontWeight: 800,
    textTransform: 'uppercase'
  },
  sourcePill: {
    flex: '0 0 auto',
    border: '1px solid #bae6fd',
    borderRadius: 999,
    padding: '2px 6px',
    color: '#075985',
    background: '#e0f2fe',
    fontSize: 10
  },
  title: {
    display: 'block',
    color: '#0f172a',
    fontSize: 15,
    fontWeight: 800,
    lineHeight: 1.3,
    textDecoration: 'none'
  },
  description: {
    margin: '8px 0 0',
    color: '#475569',
    fontSize: 13,
    lineHeight: 1.35
  }
};

export default VideoResults;
