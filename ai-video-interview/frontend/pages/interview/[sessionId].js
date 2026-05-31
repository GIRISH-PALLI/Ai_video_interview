import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Recorder from '../../components/Recorder';

const questions = [
  'Tell me about yourself and the work you enjoy most.',
  'Walk me through a project where you solved a difficult bug.',
  'How do you handle deadlines when multiple tasks are urgent?',
  'What would you improve in this interview platform?'
];

const statusLabels = {
  'requesting-media': 'Requesting camera and microphone...',
  ready: 'Ready to start',
  recording: 'Recording live',
  processing: 'Uploading and processing',
  stopped: 'Session stopped'
};

export default function Interview() {
  const router = useRouter();
  const { sessionId } = router.query;
  const [status, setStatus] = useState('requesting-media');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [proctorLog, setProctorLog] = useState([]);
  const [started, setStarted] = useState(true);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!started) return;
    const timer = setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [started]);

  useEffect(() => {
    const questionTimer = setInterval(() => {
      setQuestionIndex((index) => (index + 1) % questions.length);
    }, 12000);
    return () => clearInterval(questionTimer);
  }, []);

  const currentQuestion = useMemo(() => questions[questionIndex], [questionIndex]);

  const timeLabel = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;

  const handleProctorEvent = (event) => {
    const label = event.type === 'face'
      ? event.present ? 'Face detected' : 'Face not visible'
      : event.visible ? 'Tab active' : 'Tab switched away';

    setProctorLog((items) => [{ label, time: new Date(event.ts).toLocaleTimeString(), type: event.type }, ...items].slice(0, 6));
  };

  return (
    <div style={styles.page}>
      <div style={styles.glowA} />
      <div style={styles.glowB} />
      <div style={styles.shell}>
        <aside style={styles.sidebar}>
          <div style={styles.brandRow}>
            <div style={styles.brandDot} />
            <div>
              <div style={styles.brandTitle}>AI Interview Room</div>
              <div style={styles.brandSub}>Session {sessionId}</div>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardLabel}>Current Question</div>
            <div style={styles.questionText}>{currentQuestion}</div>
            <div style={styles.progressRow}>
              {questions.map((_, index) => (
                <span key={index} style={{ ...styles.progressDot, opacity: index === questionIndex ? 1 : 0.35 }} />
              ))}
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardLabel}>Session Status</div>
            <div style={styles.statusPill}>{statusLabels[status] || status}</div>
            <div style={styles.metaGrid}>
              <div>
                <div style={styles.metaValue}>{timeLabel}</div>
                <div style={styles.metaLabel}>Elapsed</div>
              </div>
              <div>
                <div style={styles.metaValue}>{started ? 'Live' : 'Paused'}</div>
                <div style={styles.metaLabel}>Mode</div>
              </div>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardLabel}>Proctoring Log</div>
            <div style={styles.logList}>
              {proctorLog.length === 0 ? (
                <div style={styles.logEmpty}>No proctoring alerts yet.</div>
              ) : proctorLog.map((item, index) => (
                <div key={`${item.time}-${index}`} style={styles.logItem}>
                  <div style={styles.logItemLabel}>{item.label}</div>
                  <div style={styles.logItemTime}>{item.time}</div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <main style={styles.main}>
          <div style={styles.hero}>
            <div>
              <div style={styles.heroKicker}>Interview in progress</div>
              <h1 style={styles.heroTitle}>Ready for the AI interviewer</h1>
              <p style={styles.heroText}>
                This demo records your webcam and mic, tracks proctoring events, and prepares the session for upload and transcription.
              </p>
            </div>

            <div style={styles.actions}>
              <button style={styles.primaryButton} onClick={() => setStarted((value) => !value)}>
                {started ? 'Pause view' : 'Resume view'}
              </button>
              <button style={styles.secondaryButton} onClick={() => router.push('/recruiter')}>
                Open recruiter view
              </button>
            </div>
          </div>

          <div style={styles.videoCard}>
            <div style={styles.videoHeader}>
              <span style={styles.liveBadge} /> Live camera feed
              <span style={styles.videoHint}>Keep your face centered and stay on this tab</span>
            </div>
            <Recorder
              sessionId={sessionId || 'test-session'}
              onStatusChange={({ status: nextStatus }) => setStatus(nextStatus)}
              onProctorEvent={handleProctorEvent}
            />
          </div>

          <div style={styles.footerCards}>
            <div style={styles.miniCard}>
              <div style={styles.cardLabel}>How it works</div>
              <p style={styles.miniText}>The browser records in chunks, the backend stores them, workers merge and transcribe, and recruiters review everything in one place.</p>
            </div>
            <div style={styles.miniCard}>
              <div style={styles.cardLabel}>What to test</div>
              <p style={styles.miniText}>Switch tabs, move away from the camera, and come back to see proctoring events appear in the log.</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    position: 'relative',
    overflow: 'hidden',
    background: 'radial-gradient(circle at top left, #223046 0%, #111827 45%, #090b11 100%)',
    color: '#f8fafc',
    fontFamily: 'Inter, Segoe UI, Arial, sans-serif'
  },
  glowA: {
    position: 'absolute',
    inset: '-10% auto auto -8%',
    width: 360,
    height: 360,
    borderRadius: '50%',
    background: 'rgba(56, 189, 248, 0.18)',
    filter: 'blur(30px)'
  },
  glowB: {
    position: 'absolute',
    right: '-6%',
    bottom: '-10%',
    width: 420,
    height: 420,
    borderRadius: '50%',
    background: 'rgba(99, 102, 241, 0.16)',
    filter: 'blur(30px)'
  },
  shell: {
    position: 'relative',
    zIndex: 1,
    display: 'grid',
    gridTemplateColumns: '320px minmax(0, 1fr)',
    gap: 24,
    padding: 24
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16
  },
  brandRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '18px 18px 14px',
    borderRadius: 20,
    background: 'rgba(15, 23, 42, 0.78)',
    border: '1px solid rgba(148, 163, 184, 0.18)',
    boxShadow: '0 24px 60px rgba(0, 0, 0, 0.22)'
  },
  brandDot: {
    width: 14,
    height: 14,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #22c55e, #06b6d4)',
    boxShadow: '0 0 18px rgba(34, 197, 94, 0.7)'
  },
  brandTitle: { fontSize: 16, fontWeight: 700 },
  brandSub: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  card: {
    padding: 18,
    borderRadius: 20,
    background: 'rgba(15, 23, 42, 0.78)',
    border: '1px solid rgba(148, 163, 184, 0.18)',
    boxShadow: '0 24px 60px rgba(0, 0, 0, 0.22)'
  },
  cardLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: '0.18em',
    color: '#94a3b8',
    marginBottom: 12
  },
  questionText: {
    fontSize: 18,
    lineHeight: 1.45,
    fontWeight: 600,
    color: '#f8fafc'
  },
  progressRow: {
    display: 'flex',
    gap: 8,
    marginTop: 16
  },
  progressDot: {
    width: 30,
    height: 6,
    borderRadius: 999,
    background: 'linear-gradient(135deg, #38bdf8, #8b5cf6)'
  },
  statusPill: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '10px 14px',
    borderRadius: 999,
    background: 'rgba(34, 197, 94, 0.14)',
    color: '#86efac',
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 14
  },
  metaGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12
  },
  metaValue: { fontSize: 22, fontWeight: 700 },
  metaLabel: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  logList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    minHeight: 120
  },
  logEmpty: { color: '#64748b', fontSize: 14 },
  logItem: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 16,
    padding: '10px 12px',
    borderRadius: 14,
    background: 'rgba(30, 41, 59, 0.7)'
  },
  logItemLabel: { fontSize: 14, color: '#e2e8f0' },
  logItemTime: { fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' },
  main: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16
  },
  hero: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 24,
    alignItems: 'flex-end',
    padding: '24px 26px',
    borderRadius: 24,
    background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.72))',
    border: '1px solid rgba(148, 163, 184, 0.18)',
    boxShadow: '0 24px 60px rgba(0, 0, 0, 0.22)'
  },
  heroKicker: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: '0.2em',
    color: '#60a5fa',
    marginBottom: 10
  },
  heroTitle: {
    margin: 0,
    fontSize: 36,
    lineHeight: 1.1,
    maxWidth: 520
  },
  heroText: {
    marginTop: 12,
    maxWidth: 640,
    color: '#cbd5e1',
    fontSize: 16,
    lineHeight: 1.6
  },
  actions: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap'
  },
  primaryButton: {
    border: 'none',
    borderRadius: 14,
    padding: '12px 16px',
    background: 'linear-gradient(135deg, #38bdf8, #8b5cf6)',
    color: '#fff',
    fontWeight: 700,
    cursor: 'pointer'
  },
  secondaryButton: {
    border: '1px solid rgba(148, 163, 184, 0.3)',
    borderRadius: 14,
    padding: '12px 16px',
    background: 'rgba(15, 23, 42, 0.55)',
    color: '#e2e8f0',
    fontWeight: 700,
    cursor: 'pointer'
  },
  videoCard: {
    padding: 18,
    borderRadius: 24,
    background: 'rgba(15, 23, 42, 0.82)',
    border: '1px solid rgba(148, 163, 184, 0.18)',
    boxShadow: '0 24px 60px rgba(0, 0, 0, 0.22)'
  },
  videoHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    fontSize: 14,
    color: '#e2e8f0'
  },
  liveBadge: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    background: '#f43f5e',
    boxShadow: '0 0 14px rgba(244, 63, 94, 0.8)'
  },
  videoHint: { color: '#94a3b8' },
  footerCards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 16
  },
  miniCard: {
    padding: 18,
    borderRadius: 20,
    background: 'rgba(15, 23, 42, 0.72)',
    border: '1px solid rgba(148, 163, 184, 0.18)'
  },
  miniText: {
    margin: 0,
    color: '#cbd5e1',
    lineHeight: 1.6,
    fontSize: 14
  }
};
