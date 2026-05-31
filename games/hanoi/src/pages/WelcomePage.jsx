import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createAttempt } from '../services/gameHubApi';

function WelcomePage() {
    const [name, setName] = useState('');
    const [difficulty, setDifficulty] = useState(3);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleStart = async () => {
        if (!name.trim()) return;
        setLoading(true);

        const optimalMoveCount = Math.pow(2, difficulty) - 1;
        const sessionId = Date.now().toString();

        // Create a game-hub attempt — fail silently so the game still works
        // if the backend is unavailable.
        let attemptId = null;
        try {
            const { data } = await createAttempt();
            attemptId = data.attemptId;
        } catch {
            // backend unavailable — results won't be stored, game still runs
        }

        setTimeout(() => {
            navigate('/game', {
                state: { sessionId, name: name.trim(), difficulty, optimalMoveCount, attemptId }
            });
        }, 400);
    };

    return (
        <div className="page-container">
            <div className="welcome-card glass-card">
                <div className="welcome-header">
                    <div className="tower-icon">
                        <div className="tower-bar bar-1"></div>
                        <div className="tower-bar bar-2"></div>
                        <div className="tower-bar bar-3"></div>
                        <div className="tower-pole"></div>
                    </div>
                    <h1>Tower of Hanoi</h1>
                    <p className="subtitle">Logic Puzzle Assessment</p>
                </div>

                <div className="instructions-box">
                    <h3>📋 Instructions</h3>
                    <p>
                        Move all discs from <strong>Peg A</strong> to <strong>Peg C</strong>.
                        You may only move one disc at a time. A larger disc may never be
                        placed on top of a smaller disc.
                    </p>
                </div>

                <div className="form-group">
                    <label htmlFor="name-input">Your Name</label>
                    <input
                        id="name-input"
                        type="text"
                        placeholder="Enter your name..."
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleStart()}
                        autoFocus
                    />
                </div>

                <div className="form-group">
                    <label>Difficulty Level</label>
                    <div className="difficulty-selector">
                        {[3, 4, 5].map((n) => (
                            <button
                                key={n}
                                className={`diff-btn ${difficulty === n ? 'active' : ''}`}
                                onClick={() => setDifficulty(n)}
                            >
                                <span className="disc-count">{n}</span>
                                <span className="disc-label">Discs</span>
                                <span className="moves-label">{Math.pow(2, n) - 1} min moves</span>
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    className="btn-primary btn-start"
                    onClick={handleStart}
                    disabled={!name.trim() || loading}
                >
                    {loading ? (
                        <span className="spinner"></span>
                    ) : (
                        <>🚀 Start Puzzle</>
                    )}
                </button>
            </div>
        </div>
    );
}

export default WelcomePage;
