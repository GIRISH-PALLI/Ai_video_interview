import { useRouter } from 'next/router';

const highlights = [
  { title: 'Chunked recording', text: 'MediaRecorder sends small live chunks instead of one big upload.' },
  { title: 'Background processing', text: 'S3, SQS, FFmpeg, and Deepgram handle the heavy work off the UI thread.' },
  { title: 'Recruiter review', text: 'Video, transcript, resume, and suspicious events stay in one dashboard.' }
];

export default function Home() {
  const router = useRouter();

  return (
    <div style={styles.page}>
      <div style={styles.glowA} />
      <div style={styles.glowB} />
      <div style={styles.shell}>
        <section style={styles.hero}>
          <div style={styles.kicker}>AI Video Interview System</div>
          <h1 style={styles.title}>Screen candidates with a live AI interview flow.</h1>
          <p style={styles.subtitle}>
            This project captures interview responses in chunks, merges them in the background,
            transcribes them automatically, and gives recruiters a clean review experience.
          </p>
          <div style={styles.actions}>
            <button style={styles.primaryButton} onClick={() => router.push('/hardware-check')}>
              Start demo interview
            </button>
            <button style={styles.secondaryButton} onClick={() => router.push('/recruiter')}>
              Open recruiter dashboard
            </button>
          </div>
          <div style={styles.statRow}>
            <div style={styles.statCard}>
              <div style={styles.statValue}>01</div>
              <div style={styles.statLabel}>Hardware check</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>02</div>
              <div style={styles.statLabel}>Chunked interview</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>03</div>
              <div style={styles.statLabel}>Recruiter review</div>
            </div>
          </div>
        </section>

        <aside style={styles.panel}>
          <div style={styles.panelHeader}>What this system does</div>
          <div style={styles.featureList}>
            {highlights.map((item) => (
              <div key={item.title} style={styles.featureCard}>
                <div style={styles.featureTitle}>{item.title}</div>
                <div style={styles.featureText}>{item.text}</div>
              </div>
            ))}
          </div>
          <div style={styles.noteBox}>
            Tip: open <strong>/hardware-check</strong> to begin the candidate flow, or <strong>/recruiter</strong> to review sessions.
          </div>
        </aside>
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
    top: '-6%',
    left: '-8%',
    width: 360,
    height: 360,
    borderRadius: '50%',
    background: 'rgba(56, 189, 248, 0.18)',
    filter: 'blur(28px)'
  },
  glowB: {
    position: 'absolute',
    right: '-8%',
    bottom: '-12%',
    width: 420,
    height: 420,
    borderRadius: '50%',
    background: 'rgba(139, 92, 246, 0.18)',
    filter: 'blur(28px)'
  },
  shell: {
    position: 'relative',
    zIndex: 1,
    minHeight: '100vh',
    display: 'grid',
    gridTemplateColumns: '1.2fr 0.8fr',
    gap: 24,
    alignItems: 'center',
    padding: 28
  },
  hero: {
    padding: 28,
    borderRadius: 28,
    background: 'rgba(15, 23, 42, 0.72)',
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
    fontSize: 54,
    lineHeight: 1.02,
    margin: 0,
    maxWidth: 780
  },
  subtitle: {
    maxWidth: 720,
    marginTop: 18,
    fontSize: 18,
    lineHeight: 1.7,
    color: '#cbd5e1'
  },
  actions: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
    marginTop: 26
  },
  primaryButton: {
    border: 'none',
    borderRadius: 16,
    padding: '14px 20px',
    background: 'linear-gradient(135deg, #38bdf8, #8b5cf6)',
    color: '#fff',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer'
  },
  secondaryButton: {
    border: '1px solid rgba(148, 163, 184, 0.28)',
    borderRadius: 16,
    padding: '14px 20px',
    background: 'rgba(15, 23, 42, 0.5)',
    color: '#e2e8f0',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer'
  },
  statRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 12,
    marginTop: 26
  },
  statCard: {
    padding: 18,
    borderRadius: 18,
    background: 'rgba(30, 41, 59, 0.72)',
    border: '1px solid rgba(148, 163, 184, 0.14)'
  },
  statValue: { fontSize: 28, fontWeight: 800, color: '#38bdf8' },
  statLabel: { marginTop: 8, color: '#cbd5e1', fontSize: 14 },
  panel: {
    padding: 22,
    borderRadius: 28,
    background: 'rgba(15, 23, 42, 0.78)',
    border: '1px solid rgba(148, 163, 184, 0.18)',
    boxShadow: '0 28px 70px rgba(0, 0, 0, 0.28)'
  },
  panelHeader: {
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: '0.2em',
    color: '#94a3b8',
    marginBottom: 16
  },
  featureList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12
  },
  featureCard: {
    padding: 16,
    borderRadius: 18,
    background: 'rgba(30, 41, 59, 0.72)',
    border: '1px solid rgba(148, 163, 184, 0.12)'
  },
  featureTitle: { fontWeight: 700, fontSize: 16, marginBottom: 6 },
  featureText: { color: '#cbd5e1', lineHeight: 1.6, fontSize: 14 },
  noteBox: {
    marginTop: 18,
    padding: 16,
    borderRadius: 18,
    background: 'rgba(56, 189, 248, 0.12)',
    border: '1px solid rgba(56, 189, 248, 0.16)',
    color: '#e2e8f0',
    lineHeight: 1.6
  }
};
