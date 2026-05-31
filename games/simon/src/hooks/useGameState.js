import { useState, useRef, useCallback, useEffect } from 'react';
import {
    ROUND_CONFIG, TOTAL_ROUNDS, TILE_LIT_MS, TILE_GAP_MS,
    CLICK_TIMEOUT_MS, HESITATION_MULTIPLIER, IDLE_THRESHOLD_MS,
    generateSequence
} from '../utils/gameUtils';

/**
 * Game phases:
 *  idle     — waiting to start
 *  watching — sequence is playing, clicks are locked
 *  recalling — player's turn to repeat the sequence
 *  roundEnd — brief pause between rounds
 *  failed   — player clicked wrong tile, game over
 *  complete — all 5 rounds passed
 */
export default function useGameState() {
    const [phase, setPhase] = useState('idle');
    const [currentRound, setCurrentRound] = useState(0);
    const [litTile, setLitTile] = useState(-1);
    const [feedbackTile, setFeedbackTile] = useState({ index: -1, type: '' });
    const [statusMessage, setStatusMessage] = useState('');

    // Refs for mutable game state (avoids stale closures)
    const sequenceRef = useRef([]);
    const playerInputRef = useRef([]);
    const roundsDataRef = useRef([]);
    const currentRoundClicksRef = useRef([]);

    // Timing refs
    const gameStartTimeRef = useRef(0);
    const recallStartTimeRef = useRef(0);
    const lastClickTimeRef = useRef(0);
    const clickTimeoutsRef = useRef(null);

    // Metrics refs
    const allResponseTimesRef = useRef([]);
    const earlyClickCountRef = useRef(0);
    const idlePeriodCountRef = useRef(0);
    const roundResponseTimesRef = useRef({}); // { roundNum: [times...] }

    const isPlayingRef = useRef(false);

    // Start the game
    const startGame = useCallback(() => {
        sequenceRef.current = [];
        playerInputRef.current = [];
        roundsDataRef.current = [];
        currentRoundClicksRef.current = [];
        allResponseTimesRef.current = [];
        earlyClickCountRef.current = 0;
        idlePeriodCountRef.current = 0;
        roundResponseTimesRef.current = {};
        gameStartTimeRef.current = Date.now();
        setCurrentRound(1);
        setPhase('watching');
        setStatusMessage('Get ready...');
        isPlayingRef.current = true;
        setTimeout(() => {
            startRound(1);
        }, 1500);
    }, []);

    // Start a round
    const startRound = useCallback((roundNum) => {
        const config = ROUND_CONFIG[roundNum - 1];
        sequenceRef.current = generateSequence(sequenceRef.current, config.seqLength);
        playerInputRef.current = [];
        currentRoundClicksRef.current = [];
        roundResponseTimesRef.current[roundNum] = [];
        setPhase('watching');
        setStatusMessage('Watch carefully...');
        isPlayingRef.current = true;
        setTimeout(() => {
            playSequence(sequenceRef.current, roundNum);
        }, 1500);
    }, []);

    // Play the sequence visually
    const playSequence = useCallback((sequence, roundNum) => {
        let i = 0;
        const play = () => {
            if (i < sequence.length) {
                setLitTile(sequence[i]);
                setTimeout(() => {
                    setLitTile(-1);
                    i++;
                    setTimeout(play, TILE_GAP_MS);
                }, TILE_LIT_MS);
            } else {
                // Sequence finished, switch to recall
                isPlayingRef.current = false;
                setPhase('recalling');
                setStatusMessage('Your turn!');
                recallStartTimeRef.current = Date.now();
                lastClickTimeRef.current = Date.now();
                startClickTimeout(roundNum);
            }
        };
        play();
    }, []);

    // 5-second timeout per click
    const startClickTimeout = useCallback((roundNum) => {
        if (clickTimeoutsRef.current) clearTimeout(clickTimeoutsRef.current);
        clickTimeoutsRef.current = setTimeout(() => {
            // Timeout counts as a miss → game ends
            handleGameEnd(roundNum, false);
        }, CLICK_TIMEOUT_MS);
    }, []);

    // Handle tile click
    const handleTileClick = useCallback((tileIndex) => {
        // Track early clicks (clicks during playback)
        if (isPlayingRef.current) {
            earlyClickCountRef.current++;
            return;
        }

        if (phase !== 'recalling') return;

        const now = Date.now();
        const responseTime = now - (lastClickTimeRef.current || recallStartTimeRef.current);
        const inputIndex = playerInputRef.current.length;
        const expectedTile = sequenceRef.current[inputIndex];
        const isCorrect = tileIndex === expectedTile;
        const roundNum = currentRound;

        // Check for idle period (> 4s between clicks)
        if (inputIndex > 0) {
            const gap = now - lastClickTimeRef.current;
            if (gap > IDLE_THRESHOLD_MS) {
                idlePeriodCountRef.current++;
            }
        }

        lastClickTimeRef.current = now;

        // Record click event
        const clickEvent = {
            tileIndex,
            expectedTileIndex: expectedTile,
            isCorrect,
            responseTimeMs: responseTime,
            clickedWhilePlaying: false
        };
        currentRoundClicksRef.current.push(clickEvent);

        if (isCorrect) {
            allResponseTimesRef.current.push(responseTime);
            roundResponseTimesRef.current[roundNum]?.push(responseTime);
            playerInputRef.current.push(tileIndex);

            // Visual feedback
            setFeedbackTile({ index: tileIndex, type: 'correct' });
            setTimeout(() => setFeedbackTile({ index: -1, type: '' }), 250);

            // Check if round is complete
            if (playerInputRef.current.length === sequenceRef.current.length) {
                if (clickTimeoutsRef.current) clearTimeout(clickTimeoutsRef.current);
                handleRoundComplete(roundNum);
            } else {
                // Reset timeout for next click
                startClickTimeout(roundNum);
            }
        } else {
            // Wrong click → game ends immediately
            if (clickTimeoutsRef.current) clearTimeout(clickTimeoutsRef.current);
            setFeedbackTile({ index: tileIndex, type: 'wrong' });
            setTimeout(() => setFeedbackTile({ index: -1, type: '' }), 500);
            handleGameEnd(roundNum, false);
        }
    }, [phase, currentRound]);

    // Round completed successfully
    const handleRoundComplete = useCallback((roundNum) => {
        roundsDataRef.current.push({
            roundNumber: roundNum,
            sequenceLength: sequenceRef.current.length,
            passed: true,
            clicks: [...currentRoundClicksRef.current]
        });

        if (roundNum >= TOTAL_ROUNDS) {
            // All rounds complete!
            handleGameEnd(roundNum, true);
        } else {
            // Brief pause then next round
            setPhase('roundEnd');
            setStatusMessage('Well done!');
            setTimeout(() => {
                const nextRound = roundNum + 1;
                setCurrentRound(nextRound);
                startRound(nextRound);
            }, 1500);
        }
    }, [startRound]);

    // Game ends (either completed or failed)
    const handleGameEnd = useCallback((roundNum, allPassed) => {
        // Record current round if not already recorded
        const alreadyRecorded = roundsDataRef.current.some(r => r.roundNumber === roundNum);
        if (!alreadyRecorded) {
            roundsDataRef.current.push({
                roundNumber: roundNum,
                sequenceLength: sequenceRef.current.length,
                passed: false,
                clicks: [...currentRoundClicksRef.current]
            });
        }

        setPhase(allPassed ? 'complete' : 'failed');
        setStatusMessage(allPassed ? 'Excellent! All rounds complete.' : 'Game over.');
        setLitTile(-1);
    }, []);

    // Build session data for API submission
    const buildSessionData = useCallback((candidateName) => {
        const allTimes = allResponseTimesRef.current;
        const totalCorrect = allTimes.length;
        const totalWrong = roundsDataRef.current
            .flatMap(r => r.clicks)
            .filter(c => !c.isCorrect).length;

        const avgResponseTime = allTimes.length > 0
            ? allTimes.reduce((a, b) => a + b, 0) / allTimes.length : 0;
        const fastestResponse = allTimes.length > 0 ? Math.min(...allTimes) : 0;
        const slowestResponse = allTimes.length > 0 ? Math.max(...allTimes) : 0;

        // Hesitation count: clicks > 2× candidate's own average
        const hesitationThreshold = avgResponseTime * HESITATION_MULTIPLIER;
        const hesitationCount = allTimes.filter(t => t > hesitationThreshold).length;

        const clickAccuracyRate = (totalCorrect + totalWrong) > 0
            ? (totalCorrect / (totalCorrect + totalWrong)) * 100 : 0;

        const roundsCompleted = roundsDataRef.current.filter(r => r.passed).length;
        const sequenceLength = roundsCompleted > 0
            ? roundsDataRef.current.filter(r => r.passed).reduce((max, r) => Math.max(max, r.sequenceLength), 0)
            : 0;

        // First round response avg
        const firstRoundTimes = roundResponseTimesRef.current[1] || [];
        const firstRoundAvg = firstRoundTimes.length > 0
            ? firstRoundTimes.reduce((a, b) => a + b, 0) / firstRoundTimes.length : 0;

        // Last completed round response avg
        const lastPassedRound = roundsDataRef.current
            .filter(r => r.passed)
            .reduce((max, r) => Math.max(max, r.roundNumber), 0);
        const lastRoundTimes = roundResponseTimesRef.current[lastPassedRound] || [];
        const lastRoundAvg = lastRoundTimes.length > 0
            ? lastRoundTimes.reduce((a, b) => a + b, 0) / lastRoundTimes.length : 0;

        const totalGameTime = Date.now() - gameStartTimeRef.current;

        return {
            candidateName,
            startedAt: new Date(gameStartTimeRef.current).toISOString(),
            rounds: roundsDataRef.current,
            roundsCompleted,
            sequenceLength,
            totalCorrectClicks: totalCorrect,
            totalWrongClicks: totalWrong,
            avgResponseTimeMs: avgResponseTime,
            fastestResponseMs: fastestResponse,
            slowestResponseMs: slowestResponse,
            hesitationCount,
            clickAccuracyRate,
            earlyClickCount: earlyClickCountRef.current,
            idlePeriodCount: idlePeriodCountRef.current,
            totalGameTimeMs: totalGameTime,
            firstRoundResponseAvgMs: firstRoundAvg,
            lastRoundResponseAvgMs: lastRoundAvg
        };
    }, []);

    // Cleanup timeouts on unmount
    useEffect(() => {
        return () => {
            if (clickTimeoutsRef.current) clearTimeout(clickTimeoutsRef.current);
        };
    }, []);

    return {
        phase,
        currentRound,
        litTile,
        feedbackTile,
        statusMessage,
        startGame,
        handleTileClick,
        buildSessionData,
        totalRounds: TOTAL_ROUNDS
    };
}
