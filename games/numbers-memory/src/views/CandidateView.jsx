import { useGameState } from '../hooks/useGameState';
import GameBoard from '../components/GameBoard';

export default function CandidateView() {
    const { cards, handleCardClick, elapsedMs, isComplete } = useGameState();

    const formatTime = ms => {
        const s = Math.floor(ms / 1000);
        const m = Math.floor(s / 60);
        return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    };

    // ── Completion Screen ──
    if (isComplete) {
        return (
            <>
                <div className="scene-bg" />
                <div className="completion-container">
                    <div className="completion-card glass">
                        <div className="completion-icon">✓</div>
                        <h1 className="completion-title">Assessment Complete!</h1>
                        <p className="completion-sub">
                            Your results have been recorded successfully.<br />
                            Thank you for completing the assessment.
                        </p>
                    </div>
                </div>
            </>
        );
    }

    // ── Game Screen ──
    return (
        <>
            <div className="scene-bg" />
            <div className="game-container">
                <div className="game-header">
                    <h1 className="game-title">Memory Assessment</h1>
                    <div className="game-timer">
                        <span className="timer-dot" />
                        {formatTime(elapsedMs)}
                    </div>
                </div>
                <GameBoard cards={cards} onCardClick={handleCardClick} />
            </div>
        </>
    );
}
