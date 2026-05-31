import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import StimulusDisplay from '../components/StimulusDisplay';
import FixationCross from '../components/FixationCross';
import ProgressBar from '../components/ProgressBar';
import {
    generateMainTrials, getStimulusChars, buildTrialRecord, TIMING
} from '../services/trialEngine';
import { submitTrialBatch, completeSession } from '../services/api';
import { saveResult } from '../services/gameHubApi';

/**
 * TestPage — Core 60-trial Flanker test.
 * NO per-trial feedback. Only neutral progress bar.
 * Submits trial data in batches of 10.
 */

const PHASES = { FIXATION: 'fixation', STIMULUS: 'stimulus', RESPONSE: 'response', ITI: 'iti' };
const BATCH_SIZE = 10;

export default function TestPage() {
    const navigate = useNavigate();
    const [trials] = useState(() => generateMainTrials());
    const [trialIdx, setTrialIdx] = useState(0);
    const [phase, setPhase] = useState(PHASES.FIXATION);
    const [responded, setResponded] = useState(false);
    const stimOnset = useRef(null);
    const timerRef = useRef(null);
    const resultsQueue = useRef([]);
    const allTrialResultsRef = useRef([]); // accumulates every record (not cleared on flush)
    const sessionId = sessionStorage.getItem('flankerSessionId');

    const currentTrial = trials[trialIdx];
    const isDone = trialIdx >= trials.length;

    // --- Submit batch of results ---
    const flushResults = useCallback(async () => {
        if (resultsQueue.current.length === 0) return;
        const batch = [...resultsQueue.current];
        resultsQueue.current = [];
        try {
            await submitTrialBatch(batch);
        } catch (e) {
            console.error('Failed to submit trial batch:', e);
            // Re-enqueue on failure
            resultsQueue.current = [...batch, ...resultsQueue.current];
        }
    }, []);

    // --- Complete session ---
    useEffect(() => {
        if (!isDone) return;

        async function finish() {
            await flushResults();
            try {
                await completeSession(sessionId);
            } catch (e) {
                console.error('Failed to complete session:', e);
            }
            try {
                const allResults = allTrialResultsRef.current;
                const correctCount = allResults.filter(r => r.isCorrect === true).length;
                const totalAnswered = allResults.filter(r => r.isCorrect !== null).length;
                const acc = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;
                const validRts = allResults.filter(r => r.reactionTimeMs !== null && !r.isAnticipatory && !r.isTimeout);
                const avgRt = validRts.length > 0
                    ? validRts.reduce((s, r) => s + r.reactionTimeMs, 0) / validRts.length : 0;
                const startTime = parseInt(sessionStorage.getItem('flankerStartTime') || '0');
                const durationMs = startTime ? Date.now() - startTime : 0;
                await saveResult({
                    attemptId: sessionStorage.getItem('flankerAttemptId'),
                    score: acc,
                    accuracy: acc,
                    reactionTimeMs: Math.round(avgRt),
                    durationMs,
                    rawData: { correct: correctCount, errors: totalAnswered - correctCount,
                        totalTrials: allResults.length, candidateName: sessionStorage.getItem('candidateName') }
                });
            } catch {}
            navigate('/complete');
        }
        finish();
    }, [isDone, navigate, sessionId, flushResults]);

    // --- Phase state machine ---
    useEffect(() => {
        if (isDone) return;

        clearTimeout(timerRef.current);
        setResponded(false);

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
                const record = buildTrialRecord(currentTrial, sessionId, stimOnset.current, null, null);
                resultsQueue.current.push(record);
                allTrialResultsRef.current.push(record);

                // Flush every BATCH_SIZE
                if (resultsQueue.current.length >= BATCH_SIZE) flushResults();

                setPhase(PHASES.ITI);
            }, TIMING.RESPONSE_WINDOW);
        } else if (phase === PHASES.ITI) {
            timerRef.current = setTimeout(() => {
                setTrialIdx(i => i + 1);
                setPhase(PHASES.FIXATION);
            }, currentTrial.iti);
        }

        return () => clearTimeout(timerRef.current);
    }, [phase, trialIdx, isDone, currentTrial, sessionId, flushResults]);

    // --- Input handler ---
    const handleResponse = useCallback((direction) => {
        if (responded) return;
        if (phase !== PHASES.STIMULUS && phase !== PHASES.RESPONSE) return;

        const responseTime = performance.now();
        setResponded(true);
        clearTimeout(timerRef.current);

        const record = buildTrialRecord(
            currentTrial, sessionId, stimOnset.current, responseTime, direction
        );
        resultsQueue.current.push(record);
        allTrialResultsRef.current.push(record);

        if (resultsQueue.current.length >= BATCH_SIZE) flushResults();

        setPhase(PHASES.ITI);
    }, [phase, responded, currentTrial, sessionId, flushResults]);

    // --- Keyboard handler ---
    useEffect(() => {
        function onKey(e) {
            if (e.key === 'ArrowLeft') handleResponse('Left');
            else if (e.key === 'ArrowRight') handleResponse('Right');
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [handleResponse]);

    if (isDone) return null;

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
                <ProgressBar current={trialIdx + 1} total={trials.length} />
            </div>

            <div className="test-arena">
                <FixationCross visible={phase === PHASES.FIXATION} />
                <StimulusDisplay
                    chars={getStimulusChars(currentTrial)}
                    visible={phase === PHASES.STIMULUS}
                />
                {(phase === PHASES.RESPONSE || phase === PHASES.ITI) && (
                    <div className="stimulus-container stimulus-blank" />
                )}
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
