import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import StimulusDisplay from '../components/StimulusDisplay';
import FixationCross from '../components/FixationCross';
import ProgressBar from '../components/ProgressBar';
import {
    generatePracticeTrials, getStimulusChars, checkResponse, TIMING
} from '../services/trialEngine';

/**
 * PracticePage — 5 practice trials with feedback.
 * Acclimate the candidate before the real test.
 */

const PHASES = { FIXATION: 'fixation', STIMULUS: 'stimulus', RESPONSE: 'response', FEEDBACK: 'feedback', ITI: 'iti' };

export default function PracticePage() {
    const navigate = useNavigate();
    const [trials] = useState(() => generatePracticeTrials());
    const [trialIdx, setTrialIdx] = useState(0);
    const [phase, setPhase] = useState(PHASES.FIXATION);
    const [feedback, setFeedback] = useState(null);
    const [responded, setResponded] = useState(false);
    const stimOnset = useRef(null);
    const timerRef = useRef(null);

    const currentTrial = trials[trialIdx];
    const isDone = trialIdx >= trials.length;

    // --- Phase state machine ---
    useEffect(() => {
        if (isDone) {
            const t = setTimeout(() => navigate('/test'), 1500);
            return () => clearTimeout(t);
        }

        clearTimeout(timerRef.current);
        setResponded(false);
        setFeedback(null);

        if (phase === PHASES.FIXATION) {
            timerRef.current = setTimeout(() => {
                stimOnset.current = performance.now();
                setPhase(PHASES.STIMULUS);
            }, TIMING.FIXATION);
        } else if (phase === PHASES.STIMULUS) {
            timerRef.current = setTimeout(() => setPhase(PHASES.RESPONSE), TIMING.STIMULUS);
        } else if (phase === PHASES.RESPONSE) {
            timerRef.current = setTimeout(() => {
                // Timeout — no response
                setFeedback({ correct: false, message: 'Too slow — try to respond faster!' });
                setPhase(PHASES.FEEDBACK);
            }, TIMING.RESPONSE_WINDOW);
        } else if (phase === PHASES.FEEDBACK) {
            timerRef.current = setTimeout(() => setPhase(PHASES.ITI), 1200);
        } else if (phase === PHASES.ITI) {
            timerRef.current = setTimeout(() => {
                setTrialIdx(i => i + 1);
                setPhase(PHASES.FIXATION);
            }, currentTrial.iti);
        }

        return () => clearTimeout(timerRef.current);
    }, [phase, trialIdx, isDone, navigate]);

    // --- Input handler ---
    const handleResponse = useCallback((direction) => {
        if (responded) return;
        if (phase !== PHASES.STIMULUS && phase !== PHASES.RESPONSE) return;

        setResponded(true);
        clearTimeout(timerRef.current);

        const correct = checkResponse(currentTrial, direction);
        setFeedback({
            correct,
            message: correct ? 'Correct ✓' : 'Try again — focus on the center arrow'
        });
        setPhase(PHASES.FEEDBACK);
    }, [phase, responded, currentTrial]);

    // --- Keyboard handler ---
    useEffect(() => {
        function onKey(e) {
            if (e.key === 'ArrowLeft') handleResponse('Left');
            else if (e.key === 'ArrowRight') handleResponse('Right');
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [handleResponse]);

    if (isDone) {
        return (
            <div className="page-container test-page">
                <div className="practice-complete glass-card">
                    <div className="welcome-icon">✅</div>
                    <h2>Practice Complete!</h2>
                    <p>Great job! The main activity will begin momentarily.</p>
                    <p className="hint-text">Remember: focus on the <strong>center arrow</strong> only.</p>
                </div>
            </div>
        );
    }

    return (
        <div
            className="page-container test-page"
            onTouchStart={(e) => {
                const x = e.touches[0].clientX;
                const mid = window.innerWidth / 2;
                handleResponse(x < mid ? 'Left' : 'Right');
            }}
        >
            <div className="test-header">
                <span className="practice-badge">Practice</span>
                <ProgressBar current={trialIdx + 1} total={trials.length} />
            </div>

            <div className="test-arena">
                <FixationCross visible={phase === PHASES.FIXATION} />
                <StimulusDisplay
                    chars={getStimulusChars(currentTrial)}
                    visible={phase === PHASES.STIMULUS}
                />
                {phase === PHASES.RESPONSE && (
                    <div className="stimulus-container">
                        <div className="response-waiting">Respond now!</div>
                    </div>
                )}
                {phase === PHASES.FEEDBACK && feedback && (
                    <div className="stimulus-container">
                        <div className={`feedback-msg ${feedback.correct ? 'feedback-correct' : 'feedback-wrong'}`}>
                            {feedback.message}
                        </div>
                    </div>
                )}
                {phase === PHASES.ITI && <div className="stimulus-container stimulus-blank" />}
            </div>

            <div className="test-footer">
                <div className="key-hints">
                    <span className="key-hint"><kbd>←</kbd> Left</span>
                    <span className="key-hint"><kbd>→</kbd> Right</span>
                </div>
            </div>
        </div>
    );
}
