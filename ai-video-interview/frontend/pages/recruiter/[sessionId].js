import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';

export default function SessionDetail() {
  const router = useRouter();
  const { sessionId } = router.query;
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;
    async function fetchDetail() {
      const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${api}/sessions/${sessionId}`);
      const data = await res.json();
      setSession(data);
      setLoading(false);
    }
    fetchDetail();
  }, [sessionId]);

  const flagCount = useMemo(() => {
    if (!session?.flags) return 0;
    return Object.keys(session.flags).length;
  }, [session]);

  const transcriptSummary = session?.transcript
    ? JSON.stringify(session.transcript, null, 2)
    : 'Transcript will appear here once the worker finishes Deepgram processing.';

  return (
    <div style={styles.page}>
      <div style={styles.glowA} />
      <div style={styles.glowB} />
      <div style={styles.shell}>
        <header style={styles.header}>
          <div>
            <div style={styles.kicker}>Recruiter review</div>
            <h1 style={styles.title}>Session {sessionId}</h1>
            <p style={styles.subtitle}>
              Review the interview video, transcript, and proctoring flags in one unified screen.
            </p>
          </div>
          <a href="/recruiter" style={styles.backLink}>Back to sessions</a>
        </header>

        {loading ? (
          <div style={styles.loadingCard}>Loading session details...</div>
        ) : !session ? (
          <div style={styles.loadingCard}>Session not found.</div>
        ) : (
          <div style={styles.grid}>
            <section style={styles.mainCard}>
              <div style={styles.cardLabel}>Candidate</div>
              <div style={styles.candidateName}>{session.candidate?.name || 'Unknown candidate'}</div>
              <div style={styles.metaRow}>
                <div style={styles.metaItem}>
                  <span style={styles.metaLabel}>Flags</span>
                  <strong>{flagCount}</strong>
                </div>
                <div style={styles.metaItem}>
                  <span style={styles.metaLabel}>Transcript</span>
                  <strong>{session.transcript ? 'Ready' : 'Pending'}</strong>
                </div>
                <div style={styles.metaItem}>
                  <span style={styles.metaLabel}>Merged video</span>
                  <strong>{session.mergedUrl ? 'Available' : 'Pending'}</strong>
                </div>
              </div>

              <div style={styles.sectionBlock}>
                <div style={styles.cardLabel}>Transcript</div>
                <pre style={styles.pre}>{transcriptSummary}</pre>
              </div>
            </section>

            <aside style={styles.sideStack}>
              <div style={styles.sideCard}>
                <div style={styles.cardLabel}>Interview video</div>
                {session.mergedUrl ? (
                  <video src={session.mergedUrl} controls style={styles.video} />
                ) : (
                  <div style={styles.placeholder}>Merged video not ready yet.</div>
                )}
              </div>

              <div style={styles.sideCard}>
                <div style={styles.cardLabel}>Suspicious activity</div>
                <div style={styles.flagBox}>
                  {flagCount === 0 ? (
                    <div style={styles.placeholder}>No suspicious events stored for this session.</div>
                  ) : (
                    <pre style={styles.pre}>{JSON.stringify(session.flags, null, 2)}</pre>
                  )}
                </div>
              </div>
            </aside>
          </div>
        )}
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
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
    padding: 24
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
  title: { fontSize: 42, lineHeight: 1.06, margin: 0 },
  subtitle: { maxWidth: 760, marginTop: 14, fontSize: 16, lineHeight: 1.7, color: '#cbd5e1' },
  backLink: {
    color: '#e2e8f0',
    textDecoration: 'none',
    padding: '12px 16px',
    borderRadius: 16,
    border: '1px solid rgba(148, 163, 184, 0.22)',
    background: 'rgba(15, 23, 42, 0.7)'
  },
  loadingCard: {
    padding: 28,
    borderRadius: 24,
    textAlign: 'center',
    color: '#cbd5e1',
    background: 'rgba(15, 23, 42, 0.78)',
    border: '1px solid rgba(148, 163, 184, 0.18)'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 0.8fr',
    gap: 18
  },
  mainCard: {
    padding: 22,
    borderRadius: 24,
    background: 'rgba(15, 23, 42, 0.78)',
    border: '1px solid rgba(148, 163, 184, 0.18)'
  },
  sideStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: 18
  },
  sideCard: {
    padding: 18,
    borderRadius: 24,
    background: 'rgba(15, 23, 42, 0.78)',
    border: '1px solid rgba(148, 163, 184, 0.18)'
  },
  cardLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: '0.2em',
    color: '#94a3b8',
    marginBottom: 12
  },
  candidateName: { fontSize: 28, fontWeight: 800, marginBottom: 16 },
  metaRow: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 },
  metaItem: {
    padding: 14,
    borderRadius: 18,
    background: 'rgba(30, 41, 59, 0.72)',
    display: 'flex',
    flexDirection: 'column',
    gap: 6
  },
  metaLabel: { color: '#94a3b8', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' },
  sectionBlock: { marginTop: 18 },
  pre: {
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    margin: 0,
    padding: 16,
    borderRadius: 18,
    background: 'rgba(30, 41, 59, 0.72)',
    color: '#e2e8f0',
    lineHeight: 1.7,
    minHeight: 120
  },
  video: {
    width: '100%',
    borderRadius: 18,
    background: '#000',
    aspectRatio: '16 / 9'
  },
  placeholder: {
    padding: 18,
    borderRadius: 18,
    color: '#cbd5e1',
    background: 'rgba(30, 41, 59, 0.72)',
    lineHeight: 1.6
  },
  flagBox: { minHeight: 140 }
};
