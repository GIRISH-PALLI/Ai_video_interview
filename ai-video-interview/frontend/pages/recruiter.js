import { useEffect, useMemo, useState } from 'react';

const statusColors = {
  reviewed: '#22c55e',
  flagged: '#f59e0b',
  pending: '#38bdf8'
};

export default function Recruiter() {
  const [sessions, setSessions] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSessions() {
      const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${api}/sessions`);
      const data = await res.json();
      setSessions(data);
      setLoading(false);
    }
    fetchSessions();
  }, []);

  const filteredSessions = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return sessions;
    return sessions.filter((item) => {
      const candidateName = item.candidate?.name || 'unknown';
      return item.sessionId.toLowerCase().includes(value) || candidateName.toLowerCase().includes(value);
    });
  }, [search, sessions]);

  return (
    <div style={styles.page}>
      <div style={styles.glowA} />
      <div style={styles.glowB} />
      <div style={styles.shell}>
        <header style={styles.header}>
          <div>
            <div style={styles.kicker}>Recruiter workspace</div>
            <h1 style={styles.title}>Review candidate interviews in one place.</h1>
            <p style={styles.subtitle}>
              Search, inspect, and drill into each session to see the merged video, transcript, and proctoring flags.
            </p>
          </div>
          <div style={styles.headerStats}>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{sessions.length}</div>
              <div style={styles.statLabel}>Sessions</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{filteredSessions.length}</div>
              <div style={styles.statLabel}>Visible</div>
            </div>
          </div>
        </header>

        <section style={styles.toolbar}>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by session id or candidate name"
            style={styles.searchInput}
          />
          <a href="/" style={styles.backLink}>Back to home</a>
        </section>

        <section style={styles.grid}>
          {loading ? (
            <div style={styles.emptyState}>Loading sessions...</div>
          ) : filteredSessions.length === 0 ? (
            <div style={styles.emptyState}>No sessions found for that search.</div>
          ) : filteredSessions.map((session, index) => {
            const name = session.candidate?.name || 'Unknown candidate';
            const status = session.transcript ? 'reviewed' : session.flags && Object.keys(session.flags).length ? 'flagged' : 'pending';

            return (
              <a key={session.sessionId} href={`/recruiter/${session.sessionId}`} style={styles.card}>
                <div style={styles.cardTop}>
                  <div>
                    <div style={styles.sessionId}>{session.sessionId}</div>
                    <div style={styles.candidate}>{name}</div>
                  </div>
                  <div style={{ ...styles.badge, color: statusColors[status] }}>
                    {status}
                  </div>
                </div>

                <div style={styles.cardBody}>
                  <div style={styles.cardMetric}>
                    <span style={styles.metricLabel}>Index</span>
                    <strong>{String(index + 1).padStart(2, '0')}</strong>
                  </div>
                  <div style={styles.cardMetric}>
                    <span style={styles.metricLabel}>Flags</span>
                    <strong>{session.flags ? Object.keys(session.flags).length : 0}</strong>
                  </div>
                  <div style={styles.cardMetric}>
                    <span style={styles.metricLabel}>Transcript</span>
                    <strong>{session.transcript ? 'Ready' : 'Pending'}</strong>
                  </div>
                </div>
              </a>
            );
          })}
        </section>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    position: 'relative',
    overflow: 'hidden',
    background: 'radial-gradient(circle at top left, #1e293b 0%, #0f172a 45%, #020617 100%)',
    color: '#f8fafc',
    fontFamily: 'Inter, Segoe UI, Arial, sans-serif'
  },
  glowA: {
    position: 'absolute',
    top: '-8%',
    left: '-8%',
    width: 320,
    height: 320,
    borderRadius: '50%',
    background: 'rgba(34, 197, 94, 0.14)',
    filter: 'blur(28px)'
  },
  glowB: {
    position: 'absolute',
    right: '-8%',
    bottom: '-12%',
    width: 420,
    height: 420,
    borderRadius: '50%',
    background: 'rgba(56, 189, 248, 0.16)',
    filter: 'blur(28px)'
  },
  shell: {
    position: 'relative',
    zIndex: 1,
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    gap: 18
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 24,
    alignItems: 'flex-end',
    padding: 24,
    borderRadius: 28,
    background: 'rgba(15, 23, 42, 0.78)',
    border: '1px solid rgba(148, 163, 184, 0.18)',
    boxShadow: '0 28px 70px rgba(0, 0, 0, 0.28)'
  },
  kicker: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: '0.24em',
    color: '#38bdf8',
    marginBottom: 14
  },
  title: {
    fontSize: 42,
    lineHeight: 1.06,
    margin: 0,
    maxWidth: 760
  },
  subtitle: {
    maxWidth: 760,
    marginTop: 14,
    fontSize: 16,
    lineHeight: 1.7,
    color: '#cbd5e1'
  },
  headerStats: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap'
  },
  statCard: {
    minWidth: 120,
    padding: 16,
    borderRadius: 18,
    background: 'rgba(30, 41, 59, 0.72)',
    border: '1px solid rgba(148, 163, 184, 0.14)'
  },
  statValue: { fontSize: 30, fontWeight: 800 },
  statLabel: { marginTop: 6, color: '#94a3b8', fontSize: 13 },
  toolbar: {
    display: 'flex',
    gap: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap'
  },
  searchInput: {
    flex: 1,
    minWidth: 260,
    padding: '14px 16px',
    borderRadius: 16,
    border: '1px solid rgba(148, 163, 184, 0.22)',
    background: 'rgba(15, 23, 42, 0.82)',
    color: '#f8fafc',
    outline: 'none'
  },
  backLink: {
    color: '#cbd5e1',
    textDecoration: 'none',
    padding: '12px 16px',
    borderRadius: 16,
    border: '1px solid rgba(148, 163, 184, 0.22)',
    background: 'rgba(15, 23, 42, 0.7)'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: 16
  },
  card: {
    textDecoration: 'none',
    color: 'inherit',
    padding: 18,
    borderRadius: 24,
    background: 'rgba(15, 23, 42, 0.78)',
    border: '1px solid rgba(148, 163, 184, 0.18)',
    boxShadow: '0 24px 60px rgba(0, 0, 0, 0.22)',
    transition: 'transform 0.2s ease, border-color 0.2s ease'
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'flex-start'
  },
  sessionId: { fontSize: 18, fontWeight: 800, marginBottom: 6 },
  candidate: { color: '#cbd5e1', fontSize: 14 },
  badge: {
    padding: '8px 12px',
    borderRadius: 999,
    background: 'rgba(30, 41, 59, 0.9)',
    border: '1px solid rgba(148, 163, 184, 0.16)',
    textTransform: 'capitalize',
    fontWeight: 700,
    fontSize: 12
  },
  cardBody: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 12,
    marginTop: 18
  },
  cardMetric: {
    padding: 12,
    borderRadius: 16,
    background: 'rgba(30, 41, 59, 0.72)',
    display: 'flex',
    flexDirection: 'column',
    gap: 6
  },
  metricLabel: {
    color: '#94a3b8',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: '0.08em'
  },
  emptyState: {
    gridColumn: '1 / -1',
    padding: 28,
    borderRadius: 24,
    textAlign: 'center',
    color: '#cbd5e1',
    background: 'rgba(15, 23, 42, 0.78)',
    border: '1px solid rgba(148, 163, 184, 0.18)'
  }
};
