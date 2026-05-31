import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createAttempt, saveResult } from './services/gameHubApi';

// ── CONSTANTS ────────────────────────────────────────────────────
const TOTAL_TRIALS = 40;
const DISPLAY_MS = 1000;   // how long the face shows before answer buttons appear
const TIME_LIMIT = 2500;   // ms per trial (after face appears)

const EMOTIONS = ['happy', 'sad', 'angry', 'fearful', 'surprised', 'disgusted', 'contempt', 'excited', 'confused', 'calm'];

const EMOTION_LABELS = {
  happy:     'Happy',
  sad:       'Sad',
  angry:     'Angry',
  fearful:   'Fearful',
  surprised: 'Surprised',
  disgusted: 'Disgusted',
  contempt:  'Contempt',
  excited:   'Excited',
  confused:  'Confused',
  calm:      'Calm',
};

// ── SVG FACE RENDERER ────────────────────────────────────────────
function FaceSVG({ emotion, size = 180 }) {
  const c = size / 2;
  const r = size * 0.44;

  const faceBase = (
    <>
      <circle cx={c} cy={c} r={r} fill="#F5C88A" stroke="#C8996A" strokeWidth="2.5" />
      <ellipse cx={c - r * 0.3} cy={c - r * 0.18} rx={r * 0.12} ry={r * 0.14} fill="#3B2A1A" />
      <ellipse cx={c + r * 0.3} cy={c - r * 0.18} rx={r * 0.12} ry={r * 0.14} fill="#3B2A1A" />
      <circle cx={c - r * 0.27} cy={c - r * 0.22} r={r * 0.04} fill="white" />
      <circle cx={c + r * 0.33} cy={c - r * 0.22} r={r * 0.04} fill="white" />
      <ellipse cx={c} cy={c + r * 0.08} rx={r * 0.08} ry={r * 0.05} fill="#C8996A" />
    </>
  );

  const emotions = {
    happy: (
      <>
        {faceBase}
        <path
          d={`M ${c - r * 0.38} ${c + r * 0.22} Q ${c} ${c + r * 0.58} ${c + r * 0.38} ${c + r * 0.22}`}
          fill="none" stroke="#3B2A1A" strokeWidth="3" strokeLinecap="round"
        />
        <ellipse cx={c - r * 0.5} cy={c + r * 0.2} rx={r * 0.14} ry={r * 0.08} fill="#F0907A" opacity="0.5" />
        <ellipse cx={c + r * 0.5} cy={c + r * 0.2} rx={r * 0.14} ry={r * 0.08} fill="#F0907A" opacity="0.5" />
        <path d={`M ${c - r * 0.42} ${c - r * 0.38} Q ${c - r * 0.3} ${c - r * 0.44} ${c - r * 0.18} ${c - r * 0.38}`}
          fill="none" stroke="#3B2A1A" strokeWidth="2.5" strokeLinecap="round" />
        <path d={`M ${c + r * 0.18} ${c - r * 0.38} Q ${c + r * 0.3} ${c - r * 0.44} ${c + r * 0.42} ${c - r * 0.38}`}
          fill="none" stroke="#3B2A1A" strokeWidth="2.5" strokeLinecap="round" />
      </>
    ),
    sad: (
      <>
        {faceBase}
        <path
          d={`M ${c - r * 0.38} ${c + r * 0.4} Q ${c} ${c + r * 0.16} ${c + r * 0.38} ${c + r * 0.4}`}
          fill="none" stroke="#3B2A1A" strokeWidth="3" strokeLinecap="round"
        />
        <path d={`M ${c - r * 0.42} ${c - r * 0.32} Q ${c - r * 0.3} ${c - r * 0.44} ${c - r * 0.18} ${c - r * 0.34}`}
          fill="none" stroke="#3B2A1A" strokeWidth="2.5" strokeLinecap="round" />
        <path d={`M ${c + r * 0.18} ${c - r * 0.34} Q ${c + r * 0.3} ${c - r * 0.44} ${c + r * 0.42} ${c - r * 0.32}`}
          fill="none" stroke="#3B2A1A" strokeWidth="2.5" strokeLinecap="round" />
        <ellipse cx={c - r * 0.28} cy={c + r * 0.08} rx={r * 0.04} ry={r * 0.07} fill="#7ABFFF" opacity="0.8" />
      </>
    ),
    angry: (
      <>
        {faceBase}
        <path
          d={`M ${c - r * 0.32} ${c + r * 0.38} Q ${c} ${c + r * 0.22} ${c + r * 0.32} ${c + r * 0.38}`}
          fill="none" stroke="#3B2A1A" strokeWidth="3" strokeLinecap="round"
        />
        <path d={`M ${c - r * 0.44} ${c - r * 0.38} L ${c - r * 0.16} ${c - r * 0.28}`}
          fill="none" stroke="#3B2A1A" strokeWidth="3.5" strokeLinecap="round" />
        <path d={`M ${c + r * 0.16} ${c - r * 0.28} L ${c + r * 0.44} ${c - r * 0.38}`}
          fill="none" stroke="#3B2A1A" strokeWidth="3.5" strokeLinecap="round" />
        <ellipse cx={c - r * 0.48} cy={c + r * 0.12} rx={r * 0.12} ry={r * 0.07} fill="#FF6B4A" opacity="0.35" />
        <ellipse cx={c + r * 0.48} cy={c + r * 0.12} rx={r * 0.12} ry={r * 0.07} fill="#FF6B4A" opacity="0.35" />
      </>
    ),
    fearful: (
      <>
        {faceBase}
        <ellipse cx={c} cy={c + r * 0.35} rx={r * 0.18} ry={r * 0.12} fill="#3B2A1A" />
        <ellipse cx={c - r * 0.3} cy={c - r * 0.18} rx={r * 0.16} ry={r * 0.19} fill="white" stroke="#3B2A1A" strokeWidth="1.5" />
        <ellipse cx={c + r * 0.3} cy={c - r * 0.18} rx={r * 0.16} ry={r * 0.19} fill="white" stroke="#3B2A1A" strokeWidth="1.5" />
        <ellipse cx={c - r * 0.3} cy={c - r * 0.18} rx={r * 0.09} ry={r * 0.11} fill="#3B2A1A" />
        <ellipse cx={c + r * 0.3} cy={c - r * 0.18} rx={r * 0.09} ry={r * 0.11} fill="#3B2A1A" />
        <path d={`M ${c - r * 0.44} ${c - r * 0.44} Q ${c - r * 0.3} ${c - r * 0.52} ${c - r * 0.16} ${c - r * 0.44}`}
          fill="none" stroke="#3B2A1A" strokeWidth="2.5" strokeLinecap="round" />
        <path d={`M ${c + r * 0.16} ${c - r * 0.44} Q ${c + r * 0.3} ${c - r * 0.52} ${c + r * 0.44} ${c - r * 0.44}`}
          fill="none" stroke="#3B2A1A" strokeWidth="2.5" strokeLinecap="round" />
      </>
    ),
    surprised: (
      <>
        {faceBase}
        <ellipse cx={c} cy={c + r * 0.38} rx={r * 0.15} ry={r * 0.18} fill="#3B2A1A" />
        <path d={`M ${c - r * 0.44} ${c - r * 0.48} Q ${c - r * 0.3} ${c - r * 0.56} ${c - r * 0.16} ${c - r * 0.48}`}
          fill="none" stroke="#3B2A1A" strokeWidth="2.5" strokeLinecap="round" />
        <path d={`M ${c + r * 0.16} ${c - r * 0.48} Q ${c + r * 0.3} ${c - r * 0.56} ${c + r * 0.44} ${c - r * 0.48}`}
          fill="none" stroke="#3B2A1A" strokeWidth="2.5" strokeLinecap="round" />
        <ellipse cx={c - r * 0.3} cy={c - r * 0.18} rx={r * 0.15} ry={r * 0.18} fill="white" stroke="#3B2A1A" strokeWidth="1.5" />
        <ellipse cx={c + r * 0.3} cy={c - r * 0.18} rx={r * 0.15} ry={r * 0.18} fill="white" stroke="#3B2A1A" strokeWidth="1.5" />
        <ellipse cx={c - r * 0.3} cy={c - r * 0.18} rx={r * 0.08} ry={r * 0.1} fill="#3B2A1A" />
        <ellipse cx={c + r * 0.3} cy={c - r * 0.18} rx={r * 0.08} ry={r * 0.1} fill="#3B2A1A" />
      </>
    ),
    disgusted: (
      <>
        {faceBase}
        <path
          d={`M ${c - r * 0.36} ${c + r * 0.36} Q ${c - r * 0.1} ${c + r * 0.28} ${c + r * 0.05} ${c + r * 0.34} Q ${c + r * 0.22} ${c + r * 0.42} ${c + r * 0.34} ${c + r * 0.34}`}
          fill="none" stroke="#3B2A1A" strokeWidth="3" strokeLinecap="round"
        />
        <path d={`M ${c - r * 0.1} ${c + r * 0.0} Q ${c} ${c - r * 0.06} ${c + r * 0.1} ${c + r * 0.0}`}
          fill="none" stroke="#C8996A" strokeWidth="2" strokeLinecap="round" />
        <path d={`M ${c - r * 0.44} ${c - r * 0.3} L ${c - r * 0.16} ${c - r * 0.36}`}
          fill="none" stroke="#3B2A1A" strokeWidth="3" strokeLinecap="round" />
        <path d={`M ${c + r * 0.16} ${c - r * 0.3} Q ${c + r * 0.3} ${c - r * 0.38} ${c + r * 0.44} ${c - r * 0.32}`}
          fill="none" stroke="#3B2A1A" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx={c} cy={c} r={r} fill="#A8D88A" opacity="0.08" />
      </>
    ),
    contempt: (
      <>
        {faceBase}
        {/* One side raised, one neutral — asymmetric smirk */}
        <path
          d={`M ${c - r * 0.36} ${c + r * 0.3} Q ${c - r * 0.1} ${c + r * 0.28} ${c + r * 0.05} ${c + r * 0.24} Q ${c + r * 0.2} ${c + r * 0.2} ${c + r * 0.34} ${c + r * 0.26}`}
          fill="none" stroke="#3B2A1A" strokeWidth="3" strokeLinecap="round"
        />
        {/* Left brow flat, right brow slightly raised */}
        <path d={`M ${c - r * 0.42} ${c - r * 0.34} L ${c - r * 0.18} ${c - r * 0.34}`}
          fill="none" stroke="#3B2A1A" strokeWidth="2.5" strokeLinecap="round" />
        <path d={`M ${c + r * 0.18} ${c - r * 0.38} Q ${c + r * 0.3} ${c - r * 0.44} ${c + r * 0.42} ${c - r * 0.36}`}
          fill="none" stroke="#3B2A1A" strokeWidth="2.5" strokeLinecap="round" />
        {/* Half-lidded left eye */}
        <path d={`M ${c - r * 0.42} ${c - r * 0.18} L ${c - r * 0.18} ${c - r * 0.18}`}
          fill="none" stroke="#3B2A1A" strokeWidth="3" strokeLinecap="round" />
      </>
    ),
    excited: (
      <>
        {faceBase}
        {/* Wide open smile */}
        <path
          d={`M ${c - r * 0.42} ${c + r * 0.18} Q ${c} ${c + r * 0.65} ${c + r * 0.42} ${c + r * 0.18}`}
          fill="#3B2A1A" stroke="#3B2A1A" strokeWidth="2" strokeLinecap="round"
        />
        {/* Teeth */}
        <path
          d={`M ${c - r * 0.38} ${c + r * 0.22} Q ${c} ${c + r * 0.58} ${c + r * 0.38} ${c + r * 0.22}`}
          fill="white" stroke="none"
        />
        {/* Sparkling eyes — star-like pupils */}
        <ellipse cx={c - r * 0.3} cy={c - r * 0.18} rx={r * 0.15} ry={r * 0.17} fill="white" stroke="#3B2A1A" strokeWidth="1.5" />
        <ellipse cx={c + r * 0.3} cy={c - r * 0.18} rx={r * 0.15} ry={r * 0.17} fill="white" stroke="#3B2A1A" strokeWidth="1.5" />
        <ellipse cx={c - r * 0.3} cy={c - r * 0.18} rx={r * 0.08} ry={r * 0.09} fill="#3B2A1A" />
        <ellipse cx={c + r * 0.3} cy={c - r * 0.18} rx={r * 0.08} ry={r * 0.09} fill="#3B2A1A" />
        <circle cx={c - r * 0.25} cy={c - r * 0.22} r={r * 0.05} fill="white" />
        <circle cx={c + r * 0.35} cy={c - r * 0.22} r={r * 0.05} fill="white" />
        {/* High brows */}
        <path d={`M ${c - r * 0.44} ${c - r * 0.42} Q ${c - r * 0.3} ${c - r * 0.52} ${c - r * 0.16} ${c - r * 0.42}`}
          fill="none" stroke="#3B2A1A" strokeWidth="2.5" strokeLinecap="round" />
        <path d={`M ${c + r * 0.16} ${c - r * 0.42} Q ${c + r * 0.3} ${c - r * 0.52} ${c + r * 0.44} ${c - r * 0.42}`}
          fill="none" stroke="#3B2A1A" strokeWidth="2.5" strokeLinecap="round" />
        {/* Rosy cheeks */}
        <ellipse cx={c - r * 0.52} cy={c + r * 0.18} rx={r * 0.16} ry={r * 0.09} fill="#F0907A" opacity="0.6" />
        <ellipse cx={c + r * 0.52} cy={c + r * 0.18} rx={r * 0.16} ry={r * 0.09} fill="#F0907A" opacity="0.6" />
      </>
    ),
    confused: (
      <>
        {faceBase}
        {/* Wavy uncertain mouth */}
        <path
          d={`M ${c - r * 0.36} ${c + r * 0.32} Q ${c - r * 0.15} ${c + r * 0.42} ${c} ${c + r * 0.32} Q ${c + r * 0.15} ${c + r * 0.22} ${c + r * 0.36} ${c + r * 0.32}`}
          fill="none" stroke="#3B2A1A" strokeWidth="3" strokeLinecap="round"
        />
        {/* One brow raised, one furrowed */}
        <path d={`M ${c - r * 0.44} ${c - r * 0.28} Q ${c - r * 0.3} ${c - r * 0.46} ${c - r * 0.16} ${c - r * 0.32}`}
          fill="none" stroke="#3B2A1A" strokeWidth="3" strokeLinecap="round" />
        <path d={`M ${c + r * 0.16} ${c - r * 0.44} Q ${c + r * 0.3} ${c - r * 0.52} ${c + r * 0.44} ${c - r * 0.4}`}
          fill="none" stroke="#3B2A1A" strokeWidth="2.5" strokeLinecap="round" />
        {/* Small sweat drop */}
        <ellipse cx={c + r * 0.48} cy={c - r * 0.1} rx={r * 0.04} ry={r * 0.07} fill="#7ABFFF" opacity="0.7" />
        {/* Question-mark-like wrinkle on forehead */}
        <path d={`M ${c + r * 0.1} ${c - r * 0.58} Q ${c + r * 0.22} ${c - r * 0.66} ${c + r * 0.14} ${c - r * 0.72}`}
          fill="none" stroke="#C8996A" strokeWidth="1.5" strokeLinecap="round" />
      </>
    ),
    calm: (
      <>
        {faceBase}
        {/* Gentle, barely-there smile */}
        <path
          d={`M ${c - r * 0.28} ${c + r * 0.3} Q ${c} ${c + r * 0.38} ${c + r * 0.28} ${c + r * 0.3}`}
          fill="none" stroke="#3B2A1A" strokeWidth="2.5" strokeLinecap="round"
        />
        {/* Relaxed flat brows */}
        <path d={`M ${c - r * 0.42} ${c - r * 0.36} Q ${c - r * 0.3} ${c - r * 0.38} ${c - r * 0.18} ${c - r * 0.36}`}
          fill="none" stroke="#3B2A1A" strokeWidth="2" strokeLinecap="round" />
        <path d={`M ${c + r * 0.18} ${c - r * 0.36} Q ${c + r * 0.3} ${c - r * 0.38} ${c + r * 0.42} ${c - r * 0.36}`}
          fill="none" stroke="#3B2A1A" strokeWidth="2" strokeLinecap="round" />
        {/* Slightly narrowed/relaxed eyes */}
        <ellipse cx={c - r * 0.3} cy={c - r * 0.18} rx={r * 0.13} ry={r * 0.1} fill="#3B2A1A" />
        <ellipse cx={c + r * 0.3} cy={c - r * 0.18} rx={r * 0.13} ry={r * 0.1} fill="#3B2A1A" />
        <circle cx={c - r * 0.27} cy={c - r * 0.2} r={r * 0.04} fill="white" />
        <circle cx={c + r * 0.33} cy={c - r * 0.2} r={r * 0.04} fill="white" />
        {/* Soft blue aura */}
        <circle cx={c} cy={c} r={r} fill="#7ABFFF" opacity="0.05" />
      </>
    ),
  };

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {emotions[emotion] || faceBase}
    </svg>
  );
}

// ── HELPERS ──────────────────────────────────────────────────────
function generateTrials(count = TOTAL_TRIALS) {
  const trials = [];
  for (let i = 0; i < count; i++) {
    trials.push(EMOTIONS[i % EMOTIONS.length]);
  }
  for (let i = trials.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [trials[i], trials[j]] = [trials[j], trials[i]];
  }
  return trials;
}

function shuffleOptions() {
  const opts = [...EMOTIONS];
  for (let i = opts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [opts[i], opts[j]] = [opts[j], opts[i]];
  }
  return opts;
}

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
  introWrap: {
    background: '#16161e',
    border: '1px solid #2a2a3a',
    borderRadius: '12px',
    padding: '48px 56px',
    maxWidth: '560px',
    width: '90%',
  },
  introEyebrow: {
    fontSize: '11px', letterSpacing: '3px',
    textTransform: 'uppercase', color: '#5a5a7a', marginBottom: '12px',
  },
  introTitle: {
    fontSize: '30px', fontWeight: '700',
    color: '#f0f0ff', marginBottom: '6px', letterSpacing: '-0.5px',
  },
  introSubtitle: {
    fontSize: '13px', color: '#5a5a7a', marginBottom: '32px',
    letterSpacing: '1px', textTransform: 'uppercase',
  },
  divider: { height: '1px', background: '#2a2a3a', marginBottom: '28px' },
  introBody: { fontSize: '14px', color: '#9090b0', lineHeight: '1.8', marginBottom: '24px' },
  emotionRow: {
    display: 'flex', gap: '12px', flexWrap: 'wrap',
    marginBottom: '28px', justifyContent: 'center',
  },
  emotionChip: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
    background: '#1e1e2e', border: '1px solid #3a3a5a',
    borderRadius: '10px', padding: '12px 10px', minWidth: '72px',
  },
  chipLabel: { fontSize: '11px', color: '#5a5a7a', letterSpacing: '1px', textTransform: 'uppercase' },
  introNote: {
    background: '#1a1a24', border: '1px solid #2e2e42',
    borderRadius: '8px', padding: '12px 16px',
    fontSize: '13px', color: '#7070a0', marginBottom: '32px',
  },
  startBtn: {
    width: '100%', padding: '14px',
    background: '#4a4aff', color: '#fff',
    border: 'none', borderRadius: '8px',
    fontSize: '15px', fontWeight: '700',
    cursor: 'pointer', letterSpacing: '1px',
  },
  gameWrap: {
    width: '100%', maxWidth: '640px', padding: '0 20px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px',
  },
  topBar: {
    width: '100%', display: 'flex',
    justifyContent: 'space-between', alignItems: 'center',
  },
  timerBox: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end' },
  timerLabel: { fontSize: '10px', letterSpacing: '2px', color: '#5a5a7a', textTransform: 'uppercase' },
  timerVal: (urgent) => ({
    fontSize: '28px', fontWeight: '700',
    color: urgent ? '#ff4a4a' : '#c0c0ff',
    lineHeight: 1, transition: 'color 0.3s',
  }),
  progressBox: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start' },
  progressLabel: { fontSize: '10px', letterSpacing: '2px', color: '#5a5a7a', textTransform: 'uppercase' },
  progressVal: { fontSize: '28px', fontWeight: '700', color: '#c0c0ff', lineHeight: 1 },
  faceCard: {
    background: '#16161e',
    border: '2px solid #3a3a5a',
    borderRadius: '20px',
    padding: '32px 40px',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '12px',
    minWidth: '260px',
    transition: 'border-color 0.2s',
  },
  faceLabel: { fontSize: '11px', letterSpacing: '2px', color: '#5a5a7a', textTransform: 'uppercase' },
  timerBarWrap: { width: '100%', height: '4px', background: '#2a2a3a', borderRadius: '2px' },
  timerBarFill: (pct, urgent) => ({
    height: '100%', width: `${pct * 100}%`,
    background: urgent
      ? 'linear-gradient(90deg, #ff4a4a, #ff8a4a)'
      : 'linear-gradient(90deg, #4a4aff, #a040ff)',
    borderRadius: '2px',
    transition: 'width 0.1s linear',
  }),
  answerGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '10px',
    width: '100%',
  },
  ansBtn: (state) => ({
    padding: '14px 8px',
    background: state === 'correct' ? '#1a3a2a' : state === 'wrong' ? '#3a1a1a' : '#1e1e2e',
    border: `2px solid ${state === 'correct' ? '#4aff8a' : state === 'wrong' ? '#ff4a4a' : '#3a3a5a'}`,
    borderRadius: '10px',
    color: state === 'correct' ? '#4aff8a' : state === 'wrong' ? '#ff4a4a' : '#8080b0',
    fontSize: '13px', fontWeight: '700',
    cursor: state ? 'default' : 'pointer',
    letterSpacing: '1px', textTransform: 'uppercase',
    transition: 'all 0.15s',
  }),
  waitingText: {
    fontSize: '12px', color: '#4a4a6a',
    letterSpacing: '2px', textTransform: 'uppercase',
  },
  doneWrap: {
    background: '#16161e', border: '1px solid #2a2a3a',
    borderRadius: '12px', padding: '48px 56px',
    maxWidth: '480px', width: '90%', textAlign: 'center',
  },
  doneIcon: { fontSize: '48px', marginBottom: '16px' },
  doneTitle: { fontSize: '28px', fontWeight: '700', color: '#f0f0ff', marginBottom: '8px' },
  doneSub: { fontSize: '13px', color: '#5a5a7a', letterSpacing: '1px', marginBottom: '32px' },
  statsGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px',
  },
  statCard: {
    background: '#1e1e2e', border: '1px solid #2e2e44',
    borderRadius: '8px', padding: '16px',
    display: 'flex', flexDirection: 'column', gap: '4px',
  },
  statLabel: { fontSize: '10px', letterSpacing: '2px', color: '#5a5a7a', textTransform: 'uppercase' },
  statVal: { fontSize: '24px', fontWeight: '700', color: '#c0c0ff' },
  breakdownGrid: {
    display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '28px',
  },
  breakdownRow: { display: 'flex', alignItems: 'center', gap: '12px' },
  breakdownLabel: { fontSize: '11px', color: '#5a5a7a', width: '80px', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '1px' },
  breakdownBar: { flex: 1, height: '6px', background: '#2a2a3a', borderRadius: '3px' },
  breakdownFill: (pct) => ({
    height: '100%', width: `${pct * 100}%`,
    background: 'linear-gradient(90deg, #4a4aff, #a040ff)',
    borderRadius: '3px',
  }),
  breakdownPct: { fontSize: '12px', color: '#c0c0ff', width: '36px', textAlign: 'right' },
};

// ── COMPONENT ────────────────────────────────────────────────────
export default function EmotionRecognitionGame() {
  const [phase, setPhase] = useState('intro'); // intro | showing | answering | feedback | done
  const [trials, setTrials] = useState([]);
  const [tIndex, setTIndex] = useState(0);
  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [logs, setLogs] = useState([]);
  const [correct, setCorrect] = useState(0);
  const [errors, setErrors] = useState(0);

  const timerRef = useRef(null);
  const startRef = useRef(null);
  const attemptIdRef = useRef(null);
  const gameStartRef = useRef(null);

  const currentEmotion = trials[tIndex] ?? null;

  // Show face then reveal buttons
  useEffect(() => {
    if (phase !== 'showing') return;
    const t = setTimeout(() => {
      setTimeLeft(TIME_LIMIT);
      startRef.current = Date.now();
      setPhase('answering');
    }, DISPLAY_MS);
    return () => clearTimeout(t);
  }, [phase, tIndex]);

  // Per-trial countdown
  useEffect(() => {
    if (phase !== 'answering') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 100) {
          clearInterval(timerRef.current);
          recordAnswer(null);
          return 0;
        }
        return prev - 100;
      });
    }, 100);
    return () => clearInterval(timerRef.current);
  }, [phase, tIndex]);

  const recordAnswer = useCallback((chosen) => {
    clearInterval(timerRef.current);
    const rt = Date.now() - (startRef.current ?? Date.now());
    const isCorrect = chosen === currentEmotion;
    const entry = {
      trial: tIndex + 1,
      emotion: currentEmotion,
      chosen: chosen ?? 'timeout',
      isCorrect,
      reactionTime: rt,
    };
    setLogs(prev => [...prev, entry]);
    if (isCorrect) setCorrect(prev => prev + 1);
    else setErrors(prev => prev + 1);

    const next = tIndex + 1;
    if (next >= trials.length) {
      setPhase('done');
    } else {
      setTIndex(next);
      setSelected(null);
      setOptions(shuffleOptions());
      setPhase('showing');
    }
  }, [currentEmotion, tIndex, trials]);

  const handleAnswer = useCallback((emotion) => {
    if (phase !== 'answering') return;
    recordAnswer(emotion);
  }, [phase, recordAnswer]);

  const handleStart = async () => {
    const t = generateTrials(TOTAL_TRIALS);
    setTrials(t);
    setTIndex(0);
    setOptions(shuffleOptions());
    setSelected(null);
    setCorrect(0);
    setErrors(0);
    setLogs([]);
    gameStartRef.current = Date.now();
    try { const { data } = await createAttempt(); attemptIdRef.current = data.attemptId; } catch {}
    setPhase('showing');
  };

  const sendResults = async (finalLogs) => {
    try {
      const correctCount = finalLogs.filter(l => l.isCorrect).length;
      const acc = finalLogs.length > 0 ? Math.round((correctCount / finalLogs.length) * 100) : 0;
      const avgRt = finalLogs.length > 0
        ? finalLogs.reduce((s, l) => s + (l.reactionTime || 0), 0) / finalLogs.length : 0;
      const durationMs = gameStartRef.current ? Date.now() - gameStartRef.current : 0;
      await saveResult({
        attemptId: attemptIdRef.current,
        score: acc,
        accuracy: acc,
        reactionTimeMs: Math.round(avgRt),
        durationMs,
        rawData: { correct: correctCount, errors: finalLogs.filter(l => !l.isCorrect).length,
          totalTrials: TOTAL_TRIALS, logs: finalLogs }
      });
    } catch (e) {
      console.error('Failed to save results:', e);
    }
  };

  useEffect(() => {
    if (phase === 'done' && logs.length > 0) {
      sendResults(logs);
    }
  }, [phase]);

  const accuracy = logs.length > 0 ? Math.round((correct / logs.length) * 100) : 0;
  const timerPct = timeLeft / TIME_LIMIT;
  const urgent = timeLeft < 1500;

  const emotionStats = EMOTIONS.map(em => {
    const emLogs = logs.filter(l => l.emotion === em);
    const emCorrect = emLogs.filter(l => l.isCorrect).length;
    return { em, pct: emLogs.length > 0 ? emCorrect / emLogs.length : 0 };
  });

  // ── INTRO ──
  if (phase === 'intro') return (
    <div style={S.root}>
      <div style={S.introWrap}>
        <p style={S.introEyebrow}>Emotional Intelligence · Social Awareness</p>
        <h1 style={S.introTitle}>Emotion Recognition</h1>
        <p style={S.introSubtitle}>Cognitive Assessment · {TOTAL_TRIALS} trials</p>
        <div style={S.divider} />
        <p style={S.introBody}>
          A face will appear on screen. Study it briefly, then select
          the emotion you think it expresses. You have{' '}
          <strong style={{ color: '#c0c0ff' }}>{TIME_LIMIT / 1000} seconds</strong> to answer each trial.
          Speed and accuracy both matter.
        </p>
        <div style={S.emotionRow}>
          {EMOTIONS.map(em => (
            <div key={em} style={S.emotionChip}>
              <FaceSVG emotion={em} size={56} />
              <span style={S.chipLabel}>{EMOTION_LABELS[em]}</span>
            </div>
          ))}
        </div>
        <div style={S.introNote}>
          💡 The face will appear first — observe carefully. Answer buttons will appear after a moment.
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
        <div style={S.doneIcon}>🎭</div>
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
            <span style={S.statLabel}>Trials</span>
            <span style={S.statVal}>{logs.length}</span>
          </div>
          <div style={S.statCard}>
            <span style={S.statLabel}>Accuracy</span>
            <span style={S.statVal}>{accuracy}%</span>
          </div>
        </div>
        <p style={{ fontSize: '11px', color: '#5a5a7a', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px' }}>
          By Emotion
        </p>
        <div style={S.breakdownGrid}>
          {emotionStats.map(({ em, pct }) => (
            <div key={em} style={S.breakdownRow}>
              <span style={S.breakdownLabel}>{EMOTION_LABELS[em]}</span>
              <div style={S.breakdownBar}>
                <div style={S.breakdownFill(pct)} />
              </div>
              <span style={S.breakdownPct}>{Math.round(pct * 100)}%</span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: '13px', color: '#5a5a7a' }}>
          Results sent to TalentMind backend.
        </p>
      </div>
    </div>
  );

  // ── GAME ──
  const isShowing = phase === 'showing';

  return (
    <div style={S.root}>
      <div style={S.gameWrap}>

        <div style={S.topBar}>
          <div style={S.progressBox}>
            <span style={S.progressLabel}>Trial</span>
            <span style={S.progressVal}>{tIndex + 1} / {TOTAL_TRIALS}</span>
          </div>
          <div style={S.timerBox}>
            <span style={S.timerLabel}>{isShowing ? 'Observe' : 'Time'}</span>
            <span style={S.timerVal(!isShowing && urgent)}>
              {isShowing ? '👁' : `${(timeLeft / 1000).toFixed(1)}s`}
            </span>
          </div>
        </div>

        <div style={S.timerBarWrap}>
          <div style={S.timerBarFill(isShowing ? 1 : timerPct, urgent)} />
        </div>

        <div style={{
          ...S.faceCard,
          borderColor: '#3a3a5a',
        }}>
          <span style={S.faceLabel}>
            {isShowing ? 'What emotion is this?' : 'Choose an emotion'}
          </span>
          {currentEmotion && <FaceSVG emotion={currentEmotion} size={180} />}
        </div>

        {isShowing ? (
          <p style={S.waitingText}>Observe the face…</p>
        ) : (
          <div style={S.answerGrid}>
            {options.map(em => (
                <button
                  key={em}
                  style={S.ansBtn(null)}
                  onClick={() => handleAnswer(em)}
                  onMouseOver={e => {
                    e.currentTarget.style.background = '#2e2e4e';
                    e.currentTarget.style.borderColor = '#6060a0';
                    e.currentTarget.style.color = '#c0c0ff';
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.background = '#1e1e2e';
                    e.currentTarget.style.borderColor = '#3a3a5a';
                    e.currentTarget.style.color = '#8080b0';
                  }}
                >
                  {EMOTION_LABELS[em]}
                </button>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
