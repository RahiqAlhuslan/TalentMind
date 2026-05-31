import React, { useState, useEffect, useRef } from 'react';
import { createAttempt, saveResult } from './services/gameHubApi';

const TRIAL_TIME_LIMIT = 1.2; // saniye — buradan kolayca değiştirebilirsiniz

const styles = {
  gameContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    width: '100vw',
    backgroundColor: '#1a1a1a',
    color: 'white',
    margin: 0,
    padding: 0,
    fontFamily: 'Arial, sans-serif',
    overflow: 'hidden',
    position: 'fixed',
    top: 0,
    left: 0
  },
  gameContent: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  stimulus: {
    fontSize: '80px',
    fontWeight: 'bold',
    marginBottom: '40px',
    textTransform: 'uppercase'
  },
  buttonGroup: {
    display: 'flex',
    gap: '20px',
    justifyContent: 'center'
  },
  gameButton: {
    padding: '15px 30px',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    backgroundColor: '#333',
    color: 'white',
    border: '2px solid #555',
    borderRadius: '8px',
    transition: 'all 0.2s',
    outline: 'none'
  },
  trialCounter: {
    marginTop: '30px',
    color: '#888',
    fontSize: '16px'
  },
  // --- INTRO SCREEN ---
  introBox: {
    backgroundColor: '#2a2a2a',
    border: '1px solid #444',
    borderRadius: '16px',
    padding: '50px 60px',
    maxWidth: '560px',
    textAlign: 'center'
  },
  introTitle: {
    fontSize: '32px',
    fontWeight: 'bold',
    marginBottom: '10px',
    color: '#ffffff'
  },
  introSubtitle: {
    fontSize: '16px',
    color: '#aaa',
    marginBottom: '30px',
    letterSpacing: '1px',
    textTransform: 'uppercase'
  },
  introDivider: {
    height: '1px',
    backgroundColor: '#444',
    marginBottom: '28px'
  },
  introText: {
    fontSize: '15px',
    color: '#ccc',
    lineHeight: '1.8',
    marginBottom: '16px',
    textAlign: 'left'
  },
  introList: {
    textAlign: 'left',
    color: '#ccc',
    fontSize: '15px',
    lineHeight: '2',
    paddingLeft: '20px',
    marginBottom: '28px'
  },
  introNote: {
    backgroundColor: '#1e1e1e',
    border: '1px solid #555',
    borderRadius: '8px',
    padding: '12px 16px',
    fontSize: '14px',
    color: '#aaa',
    marginBottom: '32px',
    textAlign: 'left'
  },
  startButton: {
    padding: '14px 48px',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    transition: 'background-color 0.2s',
    outline: 'none'
  },
  // --- TIMER ---
  timerBar: {
    width: '320px',
    height: '6px',
    backgroundColor: '#333',
    borderRadius: '3px',
    marginTop: '24px',
    overflow: 'hidden'
  },
  timerFill: (pct, urgent) => ({
    height: '100%',
    width: `${pct * 100}%`,
    backgroundColor: urgent ? '#e53935' : '#4CAF50',
    borderRadius: '3px',
    transition: 'width 0.1s linear, background-color 0.3s'
  }),
  timerLabel: (urgent) => ({
    marginTop: '8px',
    fontSize: '14px',
    color: urgent ? '#e53935' : '#888'
  })
};

const colors = ['RED', 'BLUE', 'GREEN', 'YELLOW'];
const maxTrials = 20;

function App() {
  const [phase, setPhase] = useState('intro'); // 'intro' | 'game' | 'done'
  const [currentText, setCurrentText] = useState('');
  const [currentDisplayColor, setCurrentDisplayColor] = useState('');
  const [trialCount, setTrialCount] = useState(0);
  const [logs, setLogs] = useState([]);
  const [startTime, setStartTime] = useState(null);

  // Timer state
  const [timeLeft, setTimeLeft] = useState(TRIAL_TIME_LIMIT);
  const timerRef = useRef(null);
  const attemptIdRef = useRef(null);
  const gameStartRef = useRef(null);

  const generateTrial = () => {
    const randomText = colors[Math.floor(Math.random() * colors.length)];
    // Kelime ile renk hiçbir zaman aynı olmasın (incongruent)
    const otherColors = colors.filter(c => c !== randomText);
    const randomColor = otherColors[Math.floor(Math.random() * otherColors.length)];
    setCurrentText(randomText);
    setCurrentDisplayColor(randomColor);
    setStartTime(performance.now());
    setTimeLeft(TRIAL_TIME_LIMIT);
  };

  // Countdown ticker
  useEffect(() => {
    if (phase !== 'game') return;
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0.1) {
          clearInterval(timerRef.current);
          handleTimeout();
          return 0;
        }
        return parseFloat((prev - 0.1).toFixed(2));
      });
    }, 100);

    return () => clearInterval(timerRef.current);
  }, [trialCount, phase]); // her yeni trial'da yeniden başlar

  const handleTimeout = () => {
    const newLog = {
      trial: trialCount + 1,
      text: currentText,
      color: currentDisplayColor,
      selected: null,
      isCorrect: false,
      responseTime: TRIAL_TIME_LIMIT * 1000,
      timedOut: true
    };
    const updatedLogs = [...logs, newLog];
    setLogs(updatedLogs);

    if (trialCount + 1 < maxTrials) {
      setTrialCount(prev => prev + 1);
      generateTrial();
    } else {
      setPhase('done');
      sendResultsToBackend(updatedLogs);
    }
  };

  const handleResponse = (selectedColor) => {
    clearInterval(timerRef.current);
    const endTime = performance.now();
    const reactionTime = endTime - startTime;

    const newLog = {
      trial: trialCount + 1,
      text: currentText,
      color: currentDisplayColor,
      selected: selectedColor,
      isCorrect: selectedColor === currentDisplayColor,
      responseTime: reactionTime,
      timedOut: false
    };
    const updatedLogs = [...logs, newLog];
    setLogs(updatedLogs);

    if (trialCount + 1 < maxTrials) {
      setTrialCount(prev => prev + 1);
      generateTrial();
    } else {
      setPhase('done');
      sendResultsToBackend(updatedLogs);
    }
  };

  const sendResultsToBackend = async (finalLogs) => {
    try {
      const response = await fetch('http://localhost:5062/api/game/submit-stroop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalLogs)
      });
      if (response.ok) {
        console.log("Data successfully sent to TalentMind API");
      }
    } catch (error) {
      console.error("Error sending data to backend:", error);
    }
    try {
      const correctCount = finalLogs.filter(l => l.isCorrect).length;
      const acc = finalLogs.length > 0 ? Math.round((correctCount / finalLogs.length) * 100) : 0;
      const avgRt = finalLogs.length > 0
        ? finalLogs.reduce((s, l) => s + (l.responseTime || 0), 0) / finalLogs.length : 0;
      const durationMs = gameStartRef.current ? Date.now() - gameStartRef.current : 0;
      await saveResult({
        attemptId: attemptIdRef.current,
        score: acc,
        accuracy: acc,
        reactionTimeMs: Math.round(avgRt),
        durationMs,
        rawData: { correct: correctCount, errors: finalLogs.filter(l => !l.isCorrect).length,
          timeouts: finalLogs.filter(l => l.timedOut).length, totalTrials: finalLogs.length, logs: finalLogs }
      });
    } catch {}
  };

  const handleStart = async () => {
    gameStartRef.current = Date.now();
    try { const { data } = await createAttempt(); attemptIdRef.current = data.attemptId; } catch {}
    setPhase('game');
    generateTrial();
  };

  // ── INTRO SCREEN ──────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div style={styles.gameContainer}>
        <div style={styles.introBox}>
          <h1 style={styles.introTitle}>Stroop Test</h1>
          <p style={styles.introSubtitle}>Attention &amp; Cognitive Control</p>
          <div style={styles.introDivider} />
          <p style={styles.introText}>
            In this test, you will see a <strong>color word</strong> displayed on the screen.
            You need to click the button that matches the <strong>ink color</strong> of the word —
            the meaning of the word does not matter, only its <em>color</em> does.
          </p>
          <ul style={styles.introList}>
            <li>There are <strong>{maxTrials} trials</strong> in total.</li>
            <li>You have <strong>{TRIAL_TIME_LIMIT} seconds</strong> per trial.</li>
            <li>If time runs out, the trial is automatically skipped.</li>
            <li>Respond as <strong>quickly and accurately</strong> as possible.</li>
          </ul>
          <div style={styles.introNote}>
            💡 Example: If you see "<span style={{ color: 'blue', fontWeight: 'bold' }}>RED</span>",
            the correct answer is the <strong>BLUE</strong> button.
          </div>
          <button
            style={styles.startButton}
            onClick={handleStart}
            onMouseOver={e => e.target.style.backgroundColor = '#45a049'}
            onMouseOut={e => e.target.style.backgroundColor = '#4CAF50'}
          >
            Start Game
          </button>
        </div>
      </div>
    );
  }

  // ── DONE SCREEN ───────────────────────────────────────────────
  if (phase === 'done') {
    return (
      <div style={styles.gameContainer}>
        <div style={styles.gameContent}>
          <h1 style={{ color: '#4CAF50', fontSize: '40px' }}>Assessment Completed!</h1>
          <p>Your results have been sent to the TalentMind Backend.</p>
          <p>Thank you for participating.</p>
        </div>
      </div>
    );
  }

  // ── GAME SCREEN ───────────────────────────────────────────────
  return (
    <div style={styles.gameContainer}>
      <div style={styles.gameContent}>
        <h1 style={{ ...styles.stimulus, color: currentDisplayColor.toLowerCase() }}>
          {currentText}
        </h1>

        <div style={styles.buttonGroup}>
          {colors.map((color) => (
            <button
              key={color}
              style={styles.gameButton}
              onClick={() => handleResponse(color)}
              onMouseOver={e => {
                e.target.style.backgroundColor = '#444';
                e.target.style.borderColor = '#fff';
              }}
              onMouseOut={e => {
                e.target.style.backgroundColor = '#333';
                e.target.style.borderColor = '#555';
              }}
            >
              {color}
            </button>
          ))}
        </div>

        <p style={styles.trialCounter}>Trial: {trialCount + 1} / {maxTrials}</p>
      </div>
    </div>
  );
}

export default App;