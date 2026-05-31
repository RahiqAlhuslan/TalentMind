import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { startSession, submitTrialBatch } from '../services/api';
import { detectDeviceType } from '../services/trialEngine';
import { createAttempt } from '../services/gameHubApi';

/**
 * WelcomePage — friendly greeting, consent, and start.
 * No mention of "test" or "assessment" to keep candidates comfortable.
 */
export default function WelcomePage() {
    const [name, setName] = useState('');
    const [consent, setConsent] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    async function handleStart() {
        if (!name.trim() || !consent) return;
        setLoading(true);

        try {
            const data = await startSession(
                name.trim(),
                detectDeviceType(),
                navigator.userAgent
            );
            // Store sessionId for use across pages
            sessionStorage.setItem('flankerSessionId', data.sessionId);
            sessionStorage.setItem('candidateName', name.trim());
            try {
                const { data: hub } = await createAttempt();
                sessionStorage.setItem('flankerAttemptId', hub.attemptId);
                sessionStorage.setItem('flankerStartTime', Date.now().toString());
            } catch {}
            navigate('/practice');
        } catch (err) {
            console.error('Failed to start session:', err);
            setLoading(false);
        }
    }

    return (
        <div className="page-container welcome-page">
            <div className="welcome-card glass-card">
                <div className="welcome-icon">🎯</div>
                <h1>Welcome to the Focus Activity</h1>
                <p className="welcome-subtitle">
                    This short exercise measures how quickly and accurately you can respond to visual cues.
                    It takes about <strong>3–5 minutes</strong>.
                </p>

                <div className="instructions-box">
                    <h3>How it works</h3>
                    <ul>
                        <li>You'll see a row of arrows on screen</li>
                        <li>Focus on the <strong>center arrow</strong> and ignore the others</li>
                        <li>Press <kbd>←</kbd> if the center arrow points left</li>
                        <li>Press <kbd>→</kbd> if the center arrow points right</li>
                        <li>Respond as <strong>quickly and accurately</strong> as you can</li>
                    </ul>
                    <p className="mobile-hint">On mobile: tap the left or right side of the screen</p>
                </div>

                <div className="name-input-group">
                    <label htmlFor="candidate-name">Your Name</label>
                    <input
                        id="candidate-name"
                        type="text"
                        placeholder="Enter your name"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleStart()}
                        autoFocus
                    />
                </div>

                <label className="consent-label">
                    <input
                        type="checkbox"
                        checked={consent}
                        onChange={e => setConsent(e.target.checked)}
                    />
                    <span>I understand that my responses will be recorded for evaluation purposes</span>
                </label>

                <button
                    className="btn-primary btn-start"
                    onClick={handleStart}
                    disabled={!name.trim() || !consent || loading}
                >
                    {loading ? 'Starting…' : "Let's Begin →"}
                </button>

                <p className="welcome-note">
                    You'll start with a short practice round to get comfortable.
                </p>
            </div>
        </div>
    );
}
