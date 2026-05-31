import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createGameEngine } from '../services/gameEngine';
import { saveResult } from '../services/gameHubApi';

const DISC_COLORS = [
    '#ff6b6b', '#ffa06b', '#ffd93d', '#6bff8d', '#6bcfff',
    '#a06bff', '#ff6bb5'
];

function GamePage() {
    const location = useLocation();
    const navigate = useNavigate();
    const { sessionId, name, difficulty, optimalMoveCount, attemptId } = location.state || {};

    const engineRef = useRef(null);
    const pauseTimerRef = useRef(null);
    const timerRef = useRef(null);
    const startTimeRef = useRef(null);

    const [gameState, setGameState] = useState(null);
    const [selectedPeg, setSelectedPeg] = useState(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [shakeDisc, setShakeDisc] = useState(null);
    const [isComplete, setIsComplete] = useState(false);
    const [moveLog, setMoveLog] = useState([]);

    useEffect(() => {
        if (!sessionId) {
            navigate('/');
            return;
        }
        const engine = createGameEngine(difficulty);
        engineRef.current = engine;
        setGameState(engine.getState());

        const start = Date.now();
        startTimeRef.current = start;

        timerRef.current = setInterval(() => {
            setElapsedTime(Math.floor((Date.now() - start) / 1000));
        }, 100);

        return () => {
            clearInterval(timerRef.current);
        };
    }, [sessionId, difficulty, navigate]);

    const submitResult = useCallback(async (finalMoveCount, finalElapsedSecs, moveHistory) => {
        const durationMs = finalElapsedSecs * 1000;
        const efficiency = finalMoveCount > 0
            ? Math.min(100, (optimalMoveCount / finalMoveCount) * 100)
            : 0;

        const legalMoves = moveHistory.filter(m => m.isLegal && !m.isUndo);
        const avgReactionMs = legalMoves.length > 1
            ? legalMoves.slice(1).reduce((sum, m) => sum + (m.timeSinceLastMoveMs || 0), 0) / (legalMoves.length - 1)
            : 0;

        const illegalAttempts = moveHistory.filter(m => !m.isLegalMove && !m.isUndo).length;
        const undoCount = moveHistory.filter(m => m.isUndo).length;
        const errorRate = finalMoveCount > 0 ? (illegalAttempts / finalMoveCount) * 100 : 0;

        const rawData = {
            candidateName: name,
            difficulty,
            optimalMoveCount,
            actualMoveCount: finalMoveCount,
            illegalAttempts,
            undoCount,
            errorRate: Math.round(errorRate * 10) / 10,
            completionTimeSeconds: finalElapsedSecs,
            moveHistory: moveHistory.map(m => ({
                fromPeg: m.fromPeg,
                toPeg: m.toPeg,
                discSize: m.discSize,
                isLegalMove: m.isLegalMove,
                isOptimalMove: m.isOptimalMove,
                isUndo: m.isUndo,
                timeSinceLastMoveMs: Math.round(m.timeSinceLastMoveMs || 0)
            }))
        };

        try {
            await saveResult({
                attemptId: attemptId || null,
                score: Math.round(efficiency * 10) / 10,
                accuracy: Math.round(efficiency * 10) / 10,
                reactionTimeMs: Math.round(avgReactionMs),
                durationMs,
                rawData
            });
        } catch {
            // backend unavailable — game still completes normally
        }
    }, [attemptId, name, difficulty, optimalMoveCount]);

    const handlePegClick = useCallback(async (pegName) => {
        if (isComplete || !engineRef.current) return;

        if (selectedPeg === null) {
            const topDisc = engineRef.current.getTopDisc(pegName);
            if (topDisc !== null) {
                setSelectedPeg(pegName);
            }
        } else if (selectedPeg === pegName) {
            setSelectedPeg(null);
        } else {
            const result = engineRef.current.makeMove(selectedPeg, pegName);
            setSelectedPeg(null);

            if (result.success) {
                setGameState(result.state);
                setMoveLog(prev => [...prev, {
                    from: result.moveData.fromPeg,
                    to: result.moveData.toPeg,
                    disc: result.moveData.discSize,
                    optimal: result.moveData.isOptimalMove
                }]);

                if (result.state.isComplete) {
                    setIsComplete(true);
                    clearInterval(timerRef.current);

                    const finalElapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
                    const history = engineRef.current.getMoveHistory();
                    await submitResult(result.state.moveCount, finalElapsed, history);

                    setTimeout(() => navigate('/thankyou'), 2000);
                }
            } else {
                setShakeDisc(pegName);
                setTimeout(() => setShakeDisc(null), 500);
            }
        }
    }, [selectedPeg, isComplete, navigate, submitResult]);

    const handleUndo = useCallback(() => {
        if (isComplete || !engineRef.current) return;
        const result = engineRef.current.undo();
        if (result) {
            setGameState(result.state);
            setMoveLog(prev => [...prev.slice(0, -1)]);
        }
    }, [isComplete]);

    const handleReset = useCallback(() => {
        if (!engineRef.current) return;
        engineRef.current.reset();
        setGameState(engineRef.current.getState());
        setSelectedPeg(null);
        setMoveLog([]);
        setIsComplete(false);
    }, []);

    const formatTime = (secs) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    if (!gameState) return null;

    const maxDisc = difficulty;

    return (
        <div className="page-container game-page">
            <div className="game-header">
                <div className="game-title">
                    <h2>Tower of Hanoi</h2>
                    <span className="player-name">{name}</span>
                </div>
                <div className="game-stats">
                    <div className="stat-box">
                        <span className="stat-label">Moves</span>
                        <span className="stat-value">{gameState.moveCount}</span>
                    </div>
                    <div className="stat-box">
                        <span className="stat-label">Optimal</span>
                        <span className="stat-value">{optimalMoveCount}</span>
                    </div>
                    <div className="stat-box timer-box">
                        <span className="stat-label">Time</span>
                        <span className="stat-value">{formatTime(elapsedTime)}</span>
                    </div>
                </div>
            </div>

            {isComplete && (
                <div className="completion-overlay">
                    <div className="completion-badge">
                        <span className="trophy">🏆</span>
                        <h2>Puzzle Complete!</h2>
                        <p>{gameState.moveCount} moves in {formatTime(elapsedTime)}</p>
                    </div>
                </div>
            )}

            <div className="game-board">
                {['A', 'B', 'C'].map((pegName) => {
                    const discs = gameState.pegs[pegName];
                    const isSelected = selectedPeg === pegName;
                    const isShaking = shakeDisc === pegName;
                    const hasDiscs = discs.length > 0;

                    return (
                        <div
                            key={pegName}
                            className={`peg-container ${isSelected ? 'selected' : ''} ${isShaking ? 'shake' : ''}`}
                            onClick={() => handlePegClick(pegName)}
                        >
                            <div className="peg-label">{pegName}</div>
                            <div className="peg-area">
                                <div className="peg-pole"></div>
                                <div className="peg-base"></div>
                                <div className="disc-stack">
                                    {discs.map((discSize, idx) => {
                                        const widthPercent = 30 + (discSize / maxDisc) * 65;
                                        const color = DISC_COLORS[discSize - 1] || DISC_COLORS[0];
                                        const isTop = idx === discs.length - 1;
                                        return (
                                            <div
                                                key={`${pegName}-${discSize}`}
                                                className={`disc ${isTop && isSelected ? 'disc-lifted' : ''}`}
                                                style={{
                                                    width: `${widthPercent}%`,
                                                    background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                                                    boxShadow: `0 2px 8px ${color}44`,
                                                    '--disc-index': idx
                                                }}
                                            >
                                                <span className="disc-number">{discSize}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            {isSelected && hasDiscs && (
                                <div className="select-indicator">▲ Selected</div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="game-controls">
                <button className="btn-secondary" onClick={handleUndo} disabled={isComplete || gameState.moveCount === 0}>
                    ↩ Undo
                </button>
                <button className="btn-secondary btn-reset" onClick={handleReset} disabled={isComplete}>
                    🔄 Reset
                </button>
            </div>

            {moveLog.length > 0 && (
                <div className="move-log glass-card">
                    <h4>Move History</h4>
                    <div className="log-entries">
                        {moveLog.slice(-8).map((m, i) => (
                            <span key={i} className={`log-entry ${m.optimal ? 'optimal' : ''}`}>
                                {m.disc}: {m.from}→{m.to}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default GamePage;
