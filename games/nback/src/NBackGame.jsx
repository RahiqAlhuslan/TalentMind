import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createAttempt, saveResult } from './services/gameHubApi';

const N = 2;
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'K', 'L', 'M', 'P', 'R', 'S', 'T'];
const TOTAL_TRIALS = 30;
const DISPLAY_MS = 1500;
const BLANK_MS = 500;
const MATCH_RATE = 0.40;

function generateSequence(count) {
  const seq = [];
  for (let i = 0; i < count; i++) {
    if (i >= N && Math.random() < MATCH_RATE) {
      seq.push(seq[i - N]);
    } else {
      let letter;
      do {
        letter = LETTERS[Math.floor(Math.random() * LETTERS.length)];
      } while (i >= N && letter === seq[i - N]);
      seq.push(letter);
    }
  }
  return seq;
}

const S = {
  root: {
    position: 'fixed', inset: 0,
    background: '#0f0f13', color: '#e8e8f0',
    fontFamily: "'Courier New', Courier, monospace",
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  introWrap: {
    background: '#16161e', border: '1px solid #2a2a3a',
    borderRadius: '12px', padding: '48px 56px', maxWidth: '560px', width: '90%',
  },
  introEyebrow: { fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', color: '#5a5a7a', marginBottom: '12px' },
  introTitle: { fontSize: '30px', fontWeight: '700', color: '#f0f0ff', marginBottom: '6px', letterSpacing: '-0.5px' },
  introSubtitle: { fontSize: '13px', color: '#5a5a7a', marginBottom: '32px', letterSpacing: '1px', textTransform: 'uppercase' },
  divider: { height: '1px', background: '#2a2a3a', marginBottom: '28px' },
  introBody: { fontSize: '14px', color: '#9090b0', lineHeight: '1.8', marginBottom: '24px' },
  exampleRow: { display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap' },
  exampleBox: (highlight) => ({
    width: '52px', height: '52px',
    background: highlight ? '#1a2a4a' : '#1e1e2e',
    border: `2px solid ${highlight ? '#4a8aff' : '#3a3a5a'}`,
    borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '22px', fontWeight: '700', color: highlight ? '#7ab4ff' : '#6060a0',
  }),
  exampleArrow: { fontSize: '16px', color: '#3a3a5a' },
  exampleLabel: { fontSize: '12px', color: '#4aff8a', marginLeft: '4px', letterSpacing: '1px' },
  introNote: {
    background: '#1a1a24', border: '1px solid #2e2e42',
    borderRadius: '8px', padding: '12px 16px',
    fontSize: '13px', color: '#7070a0', marginBottom: '32px',
  },
  startBtn: {
    width: '100%', padding: '14px', background: '#4a4aff', color: '#fff',
    border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '700',
    cursor: 'pointer', letterSpacing: '1px',
  },
  gameWrap: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '28px',
  },
  counter: {
    fontSize: '13px', color: '#5a5a7a', letterSpacing: '3px',
  },
  progressWrap: { width: '240px', height: '4px', background: '#2a2a3a', borderRadius: '2px' },
  progressFill: (pct) => ({
    height: '100%', width: `${pct * 100}%`,
    background: 'linear-gradient(90deg, #4a4aff, #a040ff)',
    borderRadius: '2px', transition: 'width 0.3s linear',
  }),
  letterCard: (visible) => ({
    background: visible ? '#1a1a3a' : '#16161e',
    border: `2px solid ${visible ? '#4a4aff' : '#2a2a3a'}`,
    borderRadius: '20px', width: '180px', height: '180px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
  }),
  letterText: (visible) => ({
    fontSize: '96px', fontWeight: '700',
    color: visible ? '#c0c0ff' : 'transparent',
    lineHeight: 1, transition: 'color 0.1s',
    fontFamily: "'Courier New', Courier, monospace",
  }),
  btnRow: { display: 'flex', gap: '16px' },
  matchBtn: (pressed) => ({
    padding: '18px 36px',
    background: pressed ? '#2a5a3a' : '#1a3a2a',
    border: `2px solid ${pressed ? '#4aff8a' : '#2a5a3a'}`,
    borderRadius: '12px',
    color: pressed ? '#4aff8a' : '#4aff8a',
    fontSize: '15px', fontWeight: '700',
    cursor: 'pointer', letterSpacing: '1px',
    transform: pressed ? 'scale(0.96)' : 'scale(1)',
    transition: 'all 0.1s',
  }),
  noMatchBtn: (pressed) => ({
    padding: '18px 36px',
    background: pressed ? '#2a2a5a' : '#1e1e2e',
    border: `2px solid ${pressed ? '#8080ff' : '#3a3a5a'}`,
    borderRadius: '12px',
    color: pressed ? '#c0c0ff' : '#8080b0',
    fontSize: '15px', fontWeight: '700',
    cursor: 'pointer', letterSpacing: '1px',
    transform: pressed ? 'scale(0.96)' : 'scale(1)',
    transition: 'all 0.1s',
  }),
  hintText: { fontSize: '12px', color: '#4a4a6a', letterSpacing: '2px', textTransform: 'uppercase' },
  doneWrap: {
    background: '#16161e', border: '1px solid #2a2a3a',
    borderRadius: '12px', padding: '48px 56px', maxWidth: '480px', width: '90%', textAlign: 'center',
  },
  doneIcon: { fontSize: '48px', marginBottom: '16px' },
  doneTitle: { fontSize: '28px', fontWeight: '700', color: '#f0f0ff', marginBottom: '8px' },
  doneSub: { fontSize: '13px', color: '#5a5a7a', letterSpacing: '1px', marginBottom: '32px' },
  statsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '28px' },
  statCard: {
    background: '#1e1e2e', border: '1px solid #2e2e44',
    borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px',
  },
  statCardLabel: { fontSize: '10px', letterSpacing: '2px', color: '#5a5a7a', textTransform: 'uppercase' },
  statCardVal: { fontSize: '24px', fontWeight: '700', color: '#c0c0ff' },
};

export default function NBackGame() {
  const [phase, setPhase] = useState('intro');
  const [sequence, setSequence] = useState([]);
  const [trialIndex, setTrialIndex] = useState(0);
  const [showLetter, setShowLetter] = useState(false);
  const [responded, setResponded] = useState(false);
  const [pressed, setPressed] = useState(null); // 'match' | 'nomatch' | null
  const [logs, setLogs] = useState([]);
  const [correct, setCorrect] = useState(0);
  const [errors, setErrors] = useState(0);
  const [misses, setMisses] = useState(0);

  const timerRef = useRef(null);
  const responseRef = useRef(false);
  const attemptIdRef = useRef(null);
  const startTimeRef = useRef(null);
  const stimulusOnsetRef = useRef(null);

  const currentLetter = sequence[trialIndex] ?? null;
  const nBackLetter = trialIndex >= N ? sequence[trialIndex - N] : null;
  const isMatch = currentLetter !== null && currentLetter === nBackLetter;
  const canRespond = trialIndex >= N;

  useEffect(() => {
    if (phase !== 'showing') return;
    responseRef.current = false;
    setResponded(false);
    setPressed(null);
    stimulusOnsetRef.current = Date.now();
    setShowLetter(true);

    timerRef.current = setTimeout(() => {
      if (!responseRef.current && isMatch && canRespond) {
        setMisses(prev => prev + 1);
        setLogs(prev => [...prev, {
          trial: trialIndex + 1, letter: currentLetter,
          nBackLetter, isMatch, userSaidMatch: null, correct: false, isMiss: true,
        }]);
      }
      setShowLetter(false);
      setPhase('blank');
    }, DISPLAY_MS);

    return () => clearTimeout(timerRef.current);
  }, [phase, trialIndex]);

  useEffect(() => {
    if (phase !== 'blank') return;
    timerRef.current = setTimeout(() => {
      const next = trialIndex + 1;
      if (next >= TOTAL_TRIALS) {
        setPhase('done');
      } else {
        setTrialIndex(next);
        setPhase('showing');
      }
    }, BLANK_MS);
    return () => clearTimeout(timerRef.current);
  }, [phase, trialIndex]);

  const handleResponse = useCallback((userSaidMatch) => {
    if (phase !== 'showing' || responded || !canRespond) return;
    responseRef.current = true;
    setResponded(true);
    setPressed(userSaidMatch ? 'match' : 'nomatch');
    const isCorrect = userSaidMatch === isMatch;
    const reactionTimeMs = stimulusOnsetRef.current ? Date.now() - stimulusOnsetRef.current : 0;
    setLogs(prev => [...prev, {
      trial: trialIndex + 1, letter: currentLetter,
      nBackLetter, isMatch, userSaidMatch, correct: isCorrect, isMiss: false, reactionTimeMs,
    }]);
    if (isCorrect) setCorrect(prev => prev + 1);
    else setErrors(prev => prev + 1);
  }, [phase, responded, canRespond, isMatch, trialIndex, currentLetter, nBackLetter]);

  useEffect(() => {
    if (phase !== 'showing') return;
    const onKey = (e) => {
      if (e.key === ' ' || e.key === 'm' || e.key === 'M') handleResponse(true);
      if (e.key === 'x' || e.key === 'X' || e.key === 'n' || e.key === 'N') handleResponse(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, handleResponse]);

  const handleStart = async () => {
    const seq = generateSequence(TOTAL_TRIALS);
    setSequence(seq);
    setTrialIndex(0);
    setShowLetter(false);
    setResponded(false);
    setPressed(null);
    setCorrect(0);
    setErrors(0);
    setMisses(0);
    setLogs([]);
    startTimeRef.current = Date.now();
    try { const { data } = await createAttempt(); attemptIdRef.current = data.attemptId; } catch {}
    setPhase('showing');
  };

  const sendResults = async (finalLogs) => {
    try {
      const attempted = finalLogs.filter(l => !l.isMiss).length;
      const correctCount = finalLogs.filter(l => l.correct).length;
      const acc = attempted > 0 ? Math.round((correctCount / attempted) * 100) : 0;
      const avgRt = finalLogs.length > 0
        ? finalLogs.reduce((s, l) => s + (l.reactionTimeMs || 0), 0) / finalLogs.length : 0;
      const durationMs = startTimeRef.current ? Date.now() - startTimeRef.current : 0;
      await saveResult({
        attemptId: attemptIdRef.current,
        score: acc,
        accuracy: acc,
        reactionTimeMs: Math.round(avgRt),
        durationMs,
        rawData: { correct: correctCount, errors: finalLogs.filter(l => !l.correct && !l.isMiss).length,
          misses: finalLogs.filter(l => l.isMiss).length, totalTrials: TOTAL_TRIALS, logs: finalLogs }
      });
    } catch {}
  };

  useEffect(() => {
    if (phase === 'done' && logs.length > 0) sendResults(logs);
  }, [phase]);

  const attempted = correct + errors;
  const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
  const remaining = TOTAL_TRIALS - trialIndex;

  if (phase === 'intro') return (
    <div style={S.root}>
      <div style={S.introWrap}>
        <p style={S.introEyebrow}>Working Memory · Cognitive Control</p>
        <h1 style={S.introTitle}>2-Back Task</h1>
        <p style={S.introSubtitle}>Cognitive Assessment · {TOTAL_TRIALS} Trials</p>
        <div style={S.divider} />
        <p style={S.introBody}>
          Letters appear one by one. Press <strong style={{ color: '#c0c0ff' }}>MATCH</strong> if
          the current letter is the same as the one shown{' '}
          <strong style={{ color: '#c0c0ff' }}>2 steps ago</strong>.
          Otherwise press <strong style={{ color: '#c0c0ff' }}>NO MATCH</strong>.
        </p>
        <p style={{ fontSize: '11px', color: '#5a5a7a', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '10px' }}>
          Example
        </p>
        <div style={S.exampleRow}>
          {['A', 'C', 'A', 'B', 'C'].map((l, i) => (
            <React.Fragment key={i}>
              <div style={S.exampleBox(i === 2 || i === 4)}>{l}</div>
              {i < 4 && <span style={S.exampleArrow}>→</span>}
            </React.Fragment>
          ))}
          <span style={S.exampleLabel}>✓ MATCH</span>
        </div>
        <div style={S.introNote}>
          💡 <strong style={{ color: '#c0c0ff' }}>Space / M</strong> = MATCH &nbsp;·&nbsp;
          <strong style={{ color: '#c0c0ff' }}>X / N</strong> = NO MATCH — or click the buttons.
          No response needed for the first 2 letters.
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

  if (phase === 'done') return (
    <div style={S.root}>
      <div style={S.doneWrap}>
        <div style={S.doneIcon}>✦</div>
        <h2 style={S.doneTitle}>Assessment Complete</h2>
        <p style={S.doneSub}>YOUR RESULTS</p>
        <div style={S.statsGrid}>
          <div style={S.statCard}>
            <span style={S.statCardLabel}>Correct</span>
            <span style={S.statCardVal}>{correct}</span>
          </div>
          <div style={S.statCard}>
            <span style={S.statCardLabel}>Accuracy</span>
            <span style={S.statCardVal}>{accuracy}%</span>
          </div>
          <div style={S.statCard}>
            <span style={S.statCardLabel}>Misses</span>
            <span style={S.statCardVal}>{misses}</span>
          </div>
          <div style={S.statCard}>
            <span style={S.statCardLabel}>Errors</span>
            <span style={S.statCardVal}>{errors}</span>
          </div>
        </div>
        <p style={{ fontSize: '13px', color: '#5a5a7a' }}>Results sent to TalentMind backend.</p>
      </div>
    </div>
  );

  return (
    <div style={S.root}>
      <div style={S.gameWrap}>

        <p style={S.counter}>{remaining} remaining</p>

        <div style={S.progressWrap}>
          <div style={S.progressFill((TOTAL_TRIALS - remaining) / TOTAL_TRIALS)} />
        </div>

        <div style={S.letterCard(showLetter)}>
          <span style={S.letterText(showLetter)}>
            {showLetter ? currentLetter : '·'}
          </span>
        </div>

        {!canRespond ? (
          <p style={S.hintText}>Memorize — no response yet</p>
        ) : (
          <>
            <div style={S.btnRow}>
              <button
                style={S.matchBtn(pressed === 'match')}
                onClick={() => handleResponse(true)}
                disabled={responded || !showLetter}
              >
                ✓ MATCH
              </button>
              <button
                style={S.noMatchBtn(pressed === 'nomatch')}
                onClick={() => handleResponse(false)}
                disabled={responded || !showLetter}
              >
                ✗ NO MATCH
              </button>
            </div>
            <p style={S.hintText}>Space / M = match · X / N = no match</p>
          </>
        )}

      </div>
    </div>
  );
}
