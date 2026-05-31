import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createAttempt, saveResult } from './services/gameHubApi';

// ── CONSTANTS ────────────────────────────────────────────────────
const GAME_DURATION = 90; // seconds
const SYMBOL_MAP = {
  '★': '1',
  '♦': '2',
  '▲': '3',
  '●': '4',
  '✦': '5',
  '⬟': '6',
  '⬡': '7',
  '✸': '8',
};
const SYMBOLS = Object.keys(SYMBOL_MAP);

const generateQueue = (count = 60) =>
  Array.from({ length: count }, () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);

// ── STYLES ───────────────────────────────────────────────────────
const S = {
  root: {
    position: 'fixed', inset: 0,
    background: '#0f0f13',
    color: '#e8e8f0',
    fontFamily: "'Courier New', Courier, monospace",
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },

  // INTRO
  introWrap: {
    background: '#16161e',
    border: '1px solid #2a2a3a',
    borderRadius: '12px',
    padding: '48px 56px',
    maxWidth: '580px',
    width: '90%',
  },
  introEyebrow: {
    fontSize: '11px',
    letterSpacing: '3px',
    textTransform: 'uppercase',
    color: '#5a5a7a',
    marginBottom: '12px',
  },
  introTitle: {
    fontSize: '30px',
    fontWeight: '700',
    color: '#f0f0ff',
    marginBottom: '6px',
    letterSpacing: '-0.5px',
  },
  introSubtitle: {
    fontSize: '13px',
    color: '#5a5a7a',
    marginBottom: '32px',
    letterSpacing: '1px',
    textTransform: 'uppercase',
  },
  divider: { height: '1px', background: '#2a2a3a', marginBottom: '28px' },
  introBody: { fontSize: '14px', color: '#9090b0', lineHeight: '1.8', marginBottom: '20px' },
  keyRow: {
    display: 'flex', gap: '10px', flexWrap: 'wrap',
    marginBottom: '28px',
  },
  keyChip: {
    background: '#1e1e2e',
    border: '1px solid #3a3a5a',
    borderRadius: '6px',
    padding: '8px 12px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
    minWidth: '48px',
  },
  keySymbol: { fontSize: '20px', color: '#c0c0ff' },
  keyDigit: { fontSize: '12px', color: '#5a5a7a', fontWeight: '700' },
  introNote: {
    background: '#1a1a24',
    border: '1px solid #2e2e42',
    borderRadius: '8px',
    padding: '12px 16px',
    fontSize: '13px',
    color: '#7070a0',
    marginBottom: '32px',
  },
  startBtn: {
    width: '100%',
    padding: '14px',
    background: '#4a4aff',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
    letterSpacing: '1px',
  },

  // GAME
  gameWrap: {
    width: '100%', maxWidth: '720px', padding: '0 20px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px',
  },
  topBar: {
    width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  scoreBox: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start' },
  scoreLabel: { fontSize: '10px', letterSpacing: '2px', color: '#5a5a7a', textTransform: 'uppercase' },
  scoreVal: { fontSize: '28px', fontWeight: '700', color: '#c0c0ff', lineHeight: 1 },
  timerBox: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end' },
  timerLabel: { fontSize: '10px', letterSpacing: '2px', color: '#5a5a7a', textTransform: 'uppercase' },
  timerVal: (urgent) => ({
    fontSize: '28px', fontWeight: '700',
    color: urgent ? '#ff4a4a' : '#c0c0ff',
    lineHeight: 1,
    transition: 'color 0.3s',
  }),

  // Reference table
  refTable: {
    display: 'flex', gap: '8px',
    background: '#16161e',
    border: '1px solid #2a2a3a',
    borderRadius: '10px',
    padding: '12px 16px',
  },
  refCell: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
    padding: '6px 10px',
    borderRight: '1px solid #2a2a3a',
  },
  refCellLast: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
    padding: '6px 10px',
  },
  refSymbol: { fontSize: '18px', color: '#a0a0d0' },
  refDigit: { fontSize: '11px', color: '#5a5a7a', fontWeight: '700' },

  // Stimulus
  stimulusBox: {
    background: '#16161e',
    border: '2px solid #3a3a5a',
    borderRadius: '16px',
    padding: '32px 48px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
    minWidth: '220px',
  },
  stimLabel: { fontSize: '11px', letterSpacing: '2px', color: '#5a5a7a', textTransform: 'uppercase' },
  stimSymbol: { fontSize: '64px', color: '#e0e0ff', lineHeight: 1 },
  stimQuestion: { fontSize: '13px', color: '#5a5a7a' },

  // Answer buttons
  answerGrid: {
    display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center',
  },
  ansBtn: (active) => ({
    width: '60px', height: '60px',
    background: active ? '#4a4aff' : '#1e1e2e',
    border: `2px solid ${active ? '#7a7aff' : '#3a3a5a'}`,
    borderRadius: '10px',
    color: active ? '#fff' : '#8080b0',
    fontSize: '22px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.12s',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }),

  // Feedback flash
  feedbackText: (correct) => ({
    fontSize: '13px',
    color: correct ? '#4aff8a' : '#ff4a4a',
    letterSpacing: '1px',
    height: '18px',
    transition: 'opacity 0.2s',
  }),

  // Progress bar
  progressWrap: { width: '100%', height: '4px', background: '#2a2a3a', borderRadius: '2px' },
  progressFill: (pct) => ({
    height: '100%', width: `${pct * 100}%`,
    background: 'linear-gradient(90deg, #4a4aff, #a040ff)',
    borderRadius: '2px',
    transition: 'width 0.1s linear',
  }),

  // DONE
  doneWrap: {
    background: '#16161e',
    border: '1px solid #2a2a3a',
    borderRadius: '12px',
    padding: '48px 56px',
    maxWidth: '480px',
    width: '90%',
    textAlign: 'center',
  },
  doneIcon: { fontSize: '48px', marginBottom: '16px' },
  doneTitle: { fontSize: '28px', fontWeight: '700', color: '#f0f0ff', marginBottom: '8px' },
  doneSub: { fontSize: '13px', color: '#5a5a7a', letterSpacing: '1px', marginBottom: '32px' },
  statsGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '32px',
  },
  statCard: {
    background: '#1e1e2e', border: '1px solid #2e2e44',
    borderRadius: '8px', padding: '16px',
    display: 'flex', flexDirection: 'column', gap: '4px',
  },
  statLabel: { fontSize: '10px', letterSpacing: '2px', color: '#5a5a7a', textTransform: 'uppercase' },
  statVal: { fontSize: '24px', fontWeight: '700', color: '#c0c0ff' },
};

// ── COMPONENT ────────────────────────────────────────────────────
export default function DigitSymbolGame() {
  const [phase, setPhase] = useState('intro'); // intro | game | done
  const [queue, setQueue] = useState([]);
  const [qIndex, setQIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [correct, setCorrect] = useState(0);
  const [errors, setErrors] = useState(0);

  const [logs, setLogs] = useState([]);
  const timerRef = useRef(null);
  const attemptIdRef = useRef(null);
  const startTimeRef = useRef(null);


  const currentSymbol = queue[qIndex] ?? null;

  // Timer
  useEffect(() => {
    if (phase !== 'game') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setPhase('done');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  const handleAnswer = useCallback((digit) => {
    if (phase !== 'game' || !currentSymbol) return;
    const isCorrect = SYMBOL_MAP[currentSymbol] === digit;
    const entry = {
      trial: qIndex + 1,
      symbol: currentSymbol,
      expected: SYMBOL_MAP[currentSymbol],
      given: digit,
      isCorrect,
      timeLeft,
    };
    setLogs(prev => [...prev, entry]);

    if (isCorrect) setCorrect(prev => prev + 1);
    else setErrors(prev => prev + 1);

    // Advance
    if (qIndex + 1 >= queue.length) {
      clearInterval(timerRef.current);
      setPhase('done');
    } else {
      setQIndex(prev => prev + 1);
    }
  }, [phase, currentSymbol, qIndex, queue.length, timeLeft]);

  // Keyboard support
  useEffect(() => {
    if (phase !== 'game') return;
    const onKey = (e) => {
      if (['1','2','3','4','5','6','7','8'].includes(e.key)) {
        handleAnswer(e.key);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, handleAnswer]);

  const handleStart = async () => {
    setQueue(generateQueue(80));
    setQIndex(0);
    setTimeLeft(GAME_DURATION);
    setCorrect(0);
    setErrors(0);
    setLogs([]);
    startTimeRef.current = Date.now();
    try { const { data } = await createAttempt(); attemptIdRef.current = data.attemptId; } catch {}
    setPhase('game');
  };

  const sendResults = async (finalLogs) => {
    try {
      await fetch('http://localhost:5062/api/game/submit-digit-symbol', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalLogs),
      });
    } catch (e) {
      console.error('Backend error:', e);
    }
    try {
      const correctCount = finalLogs.filter(l => l.isCorrect).length;
      const acc = finalLogs.length > 0 ? Math.round((correctCount / finalLogs.length) * 100) : 0;
      const durationMs = startTimeRef.current ? Date.now() - startTimeRef.current : GAME_DURATION * 1000;
      await saveResult({
        attemptId: attemptIdRef.current,
        score: acc,
        accuracy: acc,
        reactionTimeMs: null,
        durationMs,
        rawData: { correct: correctCount, errors: finalLogs.filter(l => !l.isCorrect).length,
          attempted: finalLogs.length, gameDurationSeconds: GAME_DURATION, logs: finalLogs }
      });
    } catch {}
  };

  useEffect(() => {
    if (phase === 'done' && logs.length > 0) {
      sendResults(logs);
    }
  }, [phase]);

  const accuracy = logs.length > 0 ? Math.round((correct / logs.length) * 100) : 0;
  const attempted = correct + errors;

  // ── INTRO ──
  if (phase === 'intro') return (
    <div style={S.root}>
      <div style={S.introWrap}>
        <p style={S.introEyebrow}>Analytical Thinking · Processing Speed</p>
        <h1 style={S.introTitle}>Digit Symbol Coding</h1>
        <p style={S.introSubtitle}>Cognitive Assessment · 90 seconds</p>
        <div style={S.divider} />
        <p style={S.introBody}>
          A symbol will appear on screen. Using the reference table below,
          find the matching digit and press the correct button as fast as you can.
          You have <strong style={{ color: '#c0c0ff' }}>90 seconds</strong> — answer as many as possible.
        </p>
        <div style={S.keyRow}>
          {Object.entries(SYMBOL_MAP).map(([sym, dig]) => (
            <div key={sym} style={S.keyChip}>
              <span style={S.keySymbol}>{sym}</span>
              <span style={S.keyDigit}>{dig}</span>
            </div>
          ))}
        </div>
        <div style={S.introNote}>
          💡 You can use keyboard keys <strong style={{ color: '#c0c0ff' }}>1–8</strong> or click the buttons on screen.
          Speed and accuracy both matter.
        </div>
        <button
          style={S.startBtn}
          onClick={handleStart}
          onMouseOver={e => e.currentTarget.style.background = '#3a3aee'}
          onMouseOut={e => e.currentTarget.style.background = '#4a4aff'}
        >
          START
        </button>
      </div>
    </div>
  );

  // ── DONE ──
  if (phase === 'done') return (
    <div style={S.root}>
      <div style={S.doneWrap}>
        <div style={S.doneIcon}>✦</div>
        <h2 style={S.doneTitle}>Assessment Complete</h2>
        <p style={S.doneSub}>YOUR RESULTS</p>
        <div style={S.statsGrid}>
          <div style={S.statCard}>
            <span style={S.statLabel}>Correct</span>
            <span style={S.statVal}>{correct}</span>
          </div>
          <div style={S.statCard}>
            <span style={S.statLabel}>Errors</span>
            <span style={S.statVal}>{errors}</span>
          </div>
          <div style={S.statCard}>
            <span style={S.statLabel}>Attempted</span>
            <span style={S.statVal}>{attempted}</span>
          </div>
          <div style={S.statCard}>
            <span style={S.statLabel}>Accuracy</span>
            <span style={S.statVal}>{accuracy}%</span>
          </div>
        </div>
        <p style={{ fontSize: '13px', color: '#5a5a7a' }}>
          Results sent to TalentMind backend.
        </p>
      </div>
    </div>
  );

  // ── GAME ──
  const urgent = timeLeft <= 10;
  const progress = timeLeft / GAME_DURATION;

  return (
    <div style={S.root}>
      <div style={S.gameWrap}>

        {/* Top bar */}
        <div style={S.topBar}>
          <div style={S.timerBox}>
            <span style={S.timerLabel}>Time</span>
            <span style={S.timerVal(urgent)}>{timeLeft}s</span>
          </div>
        </div>

        {/* Reference table */}
        <div style={S.refTable}>
          {Object.entries(SYMBOL_MAP).map(([sym, dig], i) => (
            <div key={sym} style={i < SYMBOLS.length - 1 ? S.refCell : S.refCellLast}>
              <span style={S.refSymbol}>{sym}</span>
              <span style={S.refDigit}>{dig}</span>
            </div>
          ))}
        </div>

        {/* Stimulus */}
        <div style={S.stimulusBox}>
          <span style={S.stimLabel}>Which digit?</span>
          <span style={S.stimSymbol}>{currentSymbol}</span>

        </div>

        {/* Answer buttons */}
        <div style={S.answerGrid}>
          {['1','2','3','4','5','6','7','8'].map(d => (
            <button
              key={d}
              style={S.ansBtn(false)}
              onClick={() => handleAnswer(d)}
              onMouseOver={e => {
                e.currentTarget.style.background = '#2e2e4e';
                e.currentTarget.style.borderColor = '#6060a0';
              }}
              onMouseOut={e => {
                e.currentTarget.style.background = '#1e1e2e';
                e.currentTarget.style.borderColor = '#3a3a5a';
              }}
            >
              {d}
            </button>
          ))}
        </div>


      </div>
    </div>
  );
}
