import { useState, useRef, useCallback } from 'react';
import { generateCards } from '../utils/gameUtils';
import { createAttempt, saveResult } from '../services/gameHubApi';

export function useGameState() {
    const [cards, setCards] = useState(generateCards());
    const [selected, setSelected] = useState([]);
    const [isLocked, setIsLocked] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const [elapsedMs, setElapsedMs] = useState(0);

    const startTimeRef = useRef(null);
    const pageLoadTimeRef = useRef(Date.now());
    const firstCardTimeRef = useRef(null);
    const timerRef = useRef(null);
    const attemptsRef = useRef([]);
    const attemptIdRef = useRef(null);
    const successCountRef = useRef(0);
    const wrongCountRef = useRef(0);
    const repeatMistakeRef = useRef(0);
    const seenWrongPairsRef = useRef(new Set());
    const lastClickTimeRef = useRef(null);
    const idleCountRef = useRef(0);
    const flipSequenceRef = useRef([]);

    const handleCardClick = useCallback((card) => {
        if (isLocked || card.isFlipped || card.isMatched) return;

        // Start timer + create attempt on first click
        if (!startTimeRef.current) {
            startTimeRef.current = Date.now();
            timerRef.current = setInterval(
                () => setElapsedMs(Date.now() - startTimeRef.current), 100
            );
            // Create attempt in background — store the ID when it resolves
            createAttempt()
                .then(({ data }) => { attemptIdRef.current = data.attemptId; })
                .catch(() => {});
        }

        // Track idle periods (gap > 3 seconds)
        if (lastClickTimeRef.current) {
            const gap = Date.now() - lastClickTimeRef.current;
            if (gap > 3000) idleCountRef.current += 1;
        }
        lastClickTimeRef.current = Date.now();
        flipSequenceRef.current.push(card.id);

        setCards(prev =>
            prev.map(c => c.id === card.id ? { ...c, isFlipped: true } : c)
        );

        if (selected.length === 0) {
            firstCardTimeRef.current = Date.now();
            setSelected([card]);
        } else {
            setIsLocked(true);
            const cardA = selected[0];
            const cardB = card;
            const reactionMs = Date.now() - firstCardTimeRef.current;
            const isMatch = cardA.value === cardB.value;
            const pairKey = [Math.min(cardA.value, cardB.value),
                Math.max(cardA.value, cardB.value)].join('-');

            const event = {
                attemptNumber: attemptsRef.current.length + 1,
                cardAPosition: cardA.id,
                cardBPosition: cardB.id,
                cardAValue: cardA.value,
                cardBValue: cardB.value,
                isMatch,
                reactionTimeMs: reactionMs,
                timestamp: new Date().toISOString(),
            };
            attemptsRef.current.push(event);

            if (isMatch) {
                successCountRef.current += 1;
                setCards(prev =>
                    prev.map(c =>
                        c.id === cardA.id || c.id === cardB.id
                            ? { ...c, isMatched: true } : c
                    )
                );
                setSelected([]);
                setIsLocked(false);

                if (successCountRef.current === 8) {
                    clearInterval(timerRef.current);
                    const endTime = Date.now();
                    buildAndSubmit(endTime);
                    setIsComplete(true);
                }
            } else {
                wrongCountRef.current += 1;
                if (seenWrongPairsRef.current.has(pairKey)) {
                    repeatMistakeRef.current += 1;
                }
                seenWrongPairsRef.current.add(pairKey);

                setTimeout(() => {
                    setCards(prev =>
                        prev.map(c =>
                            c.id === cardA.id || c.id === cardB.id
                                ? { ...c, isFlipped: false } : c
                        )
                    );
                    setSelected([]);
                    setIsLocked(false);
                }, 1000);
            }
        }
    }, [selected, isLocked]);

    function buildAndSubmit(endTime) {
        const events = attemptsRef.current;
        const allTimes = events.map(e => e.reactionTimeMs);
        const matchTimes = events.filter(e => e.isMatch).map(e => e.reactionTimeMs);
        const avg = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
        const stdDev = arr => {
            const m = avg(arr);
            return Math.sqrt(avg(arr.map(v => (v - m) ** 2)));
        };

        const total = wrongCountRef.current + successCountRef.current;
        const accuracy = Math.round((8 / total) * 100 * 10) / 10;
        const durationMs = endTime - startTimeRef.current;

        saveResult({
            attemptId: attemptIdRef.current,
            score: Math.round(accuracy),
            accuracy: Math.round(accuracy),
            reactionTimeMs: Math.round(avg(allTimes)),
            durationMs,
            rawData: {
                successfulPairs: successCountRef.current,
                wrongAttempts: wrongCountRef.current,
                totalAttempts: total,
                accuracyRate: accuracy,
                avgReactionTimeMs: Math.round(avg(allTimes)),
                fastestMatchMs: matchTimes.length ? Math.min(...matchTimes) : 0,
                slowestAttemptMs: allTimes.length ? Math.max(...allTimes) : 0,
                speedStdDev: Math.round(stdDev(allTimes)),
                repeatMistakeCount: repeatMistakeRef.current,
                idlePeriodCount: idleCountRef.current,
                flipSequence: flipSequenceRef.current,
                attempts: events,
            },
        }).catch(console.error);
    }

    return {
        cards,
        handleCardClick,
        elapsedMs,
        isComplete,
    };
}
