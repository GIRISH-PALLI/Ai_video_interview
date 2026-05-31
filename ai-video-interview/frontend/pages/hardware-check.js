import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function HardwareCheck() {
  const [cameraOk, setCameraOk] = useState(false);
  const [micOk, setMicOk] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    async function testDevices() {
      try {
        setChecking(true);
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        const audioTracks = stream.getAudioTracks();
        const videoTracks = stream.getVideoTracks();
        setMicOk(audioTracks.length > 0);
        setCameraOk(videoTracks.length > 0);
        setError('');
        stream.getTracks().forEach((track) => track.stop());
      } catch (e) {
        setMicOk(false);
        setCameraOk(false);
        setError('Camera or microphone permission was blocked. Please allow access and try again.');
      } finally {
        setChecking(false);
      }
    }

    testDevices();
  }, []);

  const isReady = cameraOk && micOk;

  return (
    <div style={styles.page}>
      <div style={styles.glowA} />
      <div style={styles.glowB} />
      <div style={styles.shell}>
        <section style={styles.hero}>
          <div style={styles.kicker}>Candidate setup</div>
          <h1 style={styles.title}>Check your camera and microphone before starting.</h1>
          <p style={styles.subtitle}>
            This step makes sure the interview can record clean video/audio and that the proctoring flow is ready.
          </p>

          <div style={styles.statusGrid}>
            <div style={styles.statusCard}>
              <div style={styles.statusLabel}>Camera</div>
              <div style={{ ...styles.statusValue, color: cameraOk ? '#22c55e' : '#f97316' }}>
                {checking ? 'Checking...' : cameraOk ? 'Ready' : 'Not detected'}
              </div>
            </div>
            <div style={styles.statusCard}>
              <div style={styles.statusLabel}>Microphone</div>
              <div style={{ ...styles.statusValue, color: micOk ? '#22c55e' : '#f97316' }}>
                {checking ? 'Checking...' : micOk ? 'Ready' : 'Not detected'}
              </div>
            </div>
            <div style={styles.statusCard}>
              <div style={styles.statusLabel}>Interview mode</div>
              <div style={{ ...styles.statusValue, color: isReady ? '#38bdf8' : '#94a3b8' }}>
                {isReady ? 'Available' : 'Waiting'}
              </div>
            </div>
          </div>

          {error ? <div style={styles.errorBox}>{error}</div> : null}

          <div style={styles.actions}>
            <button
              disabled={!isReady}
              onClick={() => router.push('/interview/test-session')}
              style={{ ...styles.primaryButton, opacity: isReady ? 1 : 0.5, cursor: isReady ? 'pointer' : 'not-allowed' }}
            >
              Start interview
            </button>
            <button onClick={() => router.push('/')} style={styles.secondaryButton}>
              Back to home
            </button>
          </div>
        </section>

        <aside style={styles.panel}>
          <div style={styles.panelHeader}>What happens next</div>
          <div style={styles.stepList}>
            <div style={styles.stepCard}>
              <div style={styles.stepNumber}>01</div>
              <div>
                <div style={styles.stepTitle}>Grant access</div>
                <div style={styles.stepText}>Allow camera and microphone so the browser can record the session.</div>
              </div>
            </div>
            <div style={styles.stepCard}>
              <div style={styles.stepNumber}>02</div>
              <div>
                <div style={styles.stepTitle}>Join interview room</div>
                <div style={styles.stepText}>Open the interview page with live recording and proctoring signals.</div>
              </div>
            </div>
            <div style={styles.stepCard}>
              <div style={styles.stepNumber}>03</div>
              <div>
                <div style={styles.stepTitle}>Review session</div>
                <div style={styles.stepText}>Recruiters can later inspect the merged video, transcript, and flags.</div>
              </div>
            </div>
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
    top: '-8%',
    left: '-8%',
    width: 320,
    height: 320,
    borderRadius: '50%',
    background: 'rgba(56, 189, 248, 0.16)',
    filter: 'blur(28px)'
  },
  glowB: {
    position: 'absolute',
    right: '-10%',
    bottom: '-12%',
    width: 420,
    height: 420,
    borderRadius: '50%',
    background: 'rgba(139, 92, 246, 0.16)',
    filter: 'blur(28px)'
  },
  shell: {
    position: 'relative',
    zIndex: 1,
    minHeight: '100vh',
    display: 'grid',
    gridTemplateColumns: '1.1fr 0.9fr',
    gap: 24,
    alignItems: 'center',
    padding: 28
  },
  hero: {
    padding: 28,
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
    fontSize: 46,
    lineHeight: 1.04,
    margin: 0,
    maxWidth: 760
  },
  subtitle: {
    maxWidth: 720,
    marginTop: 16,
    fontSize: 17,
    lineHeight: 1.7,
    color: '#cbd5e1'
  },
  statusGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 12,
    marginTop: 24
  },
  statusCard: {
    padding: 18,
    borderRadius: 18,
    background: 'rgba(30, 41, 59, 0.72)',
    border: '1px solid rgba(148, 163, 184, 0.14)'
  },
  statusLabel: { color: '#94a3b8', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' },
  statusValue: { marginTop: 8, fontSize: 22, fontWeight: 800 },
  errorBox: {
    marginTop: 18,
    padding: 14,
    borderRadius: 16,
    background: 'rgba(248, 113, 113, 0.12)',
    border: '1px solid rgba(248, 113, 113, 0.18)',
    color: '#fecaca'
  },
  actions: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
    marginTop: 24
  },
  primaryButton: {
    border: 'none',
    borderRadius: 16,
    padding: '14px 20px',
    background: 'linear-gradient(135deg, #38bdf8, #8b5cf6)',
    color: '#fff',
    fontSize: 15,
    fontWeight: 700
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
  stepList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12
  },
  stepCard: {
    display: 'flex',
    gap: 14,
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 18,
    background: 'rgba(30, 41, 59, 0.72)',
    border: '1px solid rgba(148, 163, 184, 0.12)'
  },
  stepNumber: {
    minWidth: 42,
    height: 42,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(56, 189, 248, 0.14)',
    color: '#7dd3fc',
    fontWeight: 800
  },
  stepTitle: { fontSize: 16, fontWeight: 700, marginBottom: 6 },
  stepText: { color: '#cbd5e1', lineHeight: 1.6, fontSize: 14 }
};
