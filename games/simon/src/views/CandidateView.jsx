import { useState, useRef } from 'react';
import useGameState from '../hooks/useGameState';
import TileGrid from '../components/TileGrid';
import RoundIndicator from '../components/RoundIndicator';
import { submitSession } from '../services/api';
import { createAttempt, saveResult } from '../services/gameHubApi';

export default function CandidateView() {
    const [screen, setScreen] = useState('welcome'); // welcome | playing | thankyou
    const [name, setName] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const attemptIdRef = useRef(null);
    const startTimeRef = useRef(null);

    const {
        phase, currentRound, litTile, feedbackTile,
        statusMessage, startGame, handleTileClick,
        buildSessionData, totalRounds
    } = useGameState();

    async function handleStart() {
        if (!name.trim()) return;
        startTimeRef.current = Date.now();
        try { const { data } = await createAttempt(); attemptIdRef.current = data.attemptId; } catch {}
        setScreen('playing');
        startGame();
    }

    async function handleSubmit() {
        setSubmitting(true);
        const sessionData = buildSessionData(name.trim());
        try { await submitSession(sessionData); } catch (err) { console.error('Failed to submit:', err); }
        try {
            const roundsCompleted = sessionData.roundsCompleted ?? 0;
            const totalRoundsVal = sessionData.totalRounds ?? 5;
            const score = Math.round((roundsCompleted / totalRoundsVal) * 100);
            const avgRt = sessionData.avgResponseTimeMs ?? 0;
            const durationMs = startTimeRef.current ? Date.now() - startTimeRef.current : 0;
            await saveResult({
                attemptId: attemptIdRef.current,
                score,
                accuracy: score,
                reactionTimeMs: Math.round(avgRt),
                durationMs,
                rawData: { ...sessionData, candidateName: name.trim() }
            });
        } catch {}
        setSubmitting(false);
        setScreen('thankyou');
    }

    // Auto-submit when game ends
    if (screen === 'playing' && (phase === 'complete' || phase === 'failed')) {
        if (!submitting && screen !== 'thankyou') {
            handleSubmit();
        }
    }

    // ==================== WELCOME SCREEN ====================
    if (screen === 'welcome') {
        return (
            <div className="page-container">
                <div className="welcome-card glass-card">
                    <div className="welcome-icon">🧠</div>
                    <h1>Pattern Memory Challenge</h1>
                    <p className="welcome-subtitle">
                        Test your pattern recognition and memory skills
                    </p>

                    <div className="instructions-box">
                        <h3>How it works</h3>
                        <ul>
                            <li>Colored tiles will light up in a sequence</li>
                            <li>Watch carefully, then repeat the pattern</li>
                            <li>Each round adds one more tile to remember</li>
                            <li>You have 5 seconds per tile to respond</li>
                            <li>One mistake ends the game</li>
                        </ul>
                    </div>

                    <div className="name-input-group">
                        <label htmlFor="candidate-name">Your Name</label>
                        <input
                            id="candidate-name"
                            type="text"
                            placeholder="Enter your full name"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleStart()}
                            autoFocus
                        />
                    </div>

                    <button
                        className="btn-primary"
                        onClick={handleStart}
                        disabled={!name.trim()}
                    >
                        Start Challenge →
                    </button>

                    <p className="welcome-note">
                        This activity takes approximately 2–3 minutes.
                    </p>
                </div>
            </div>
        );
    }

    // ==================== THANK YOU SCREEN ====================
    if (screen === 'thankyou') {
        return (
            <div className="page-container">
                <div className="welcome-card glass-card thankyou-card">
                    <div className="welcome-icon thankyou-icon">✅</div>
                    <h1>Thank You!</h1>
                    <p className="welcome-subtitle">
                        Your results have been recorded.
                    </p>
                    <p className="welcome-note">
                        You may now close this window.
                    </p>
                </div>
            </div>
        );
    }

    // ==================== GAME SCREEN ====================
    return (
        <div className="page-container game-page">
            <div className="game-container glass-card">
                <div className="game-header">
                    <RoundIndicator currentRound={currentRound} totalRounds={totalRounds} />
                    <div className="game-status">
                        <span className={`status-label status-${phase}`}>
                            {statusMessage}
                        </span>
                    </div>
                </div>

                <div className="game-arena">
                    <TileGrid
                        litTile={litTile}
                        feedbackTile={feedbackTile}
                        onTileClick={handleTileClick}
                    />
                </div>

                <div className="game-footer">
                    <span className="round-label">
                        Round {currentRound} of {totalRounds}
                    </span>
                </div>
            </div>
        </div>
    );
}
