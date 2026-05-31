export default function RoundIndicator({ currentRound, totalRounds }) {
    return (
        <div className="round-indicator">
            {Array.from({ length: totalRounds }, (_, i) => {
                const roundNum = i + 1;
                let cls = 'round-dot';
                if (roundNum < currentRound) cls += ' round-dot-done';
                else if (roundNum === currentRound) cls += ' round-dot-active';
                return (
                    <div key={i} className={cls}>
                        <span className="round-dot-label">{roundNum}</span>
                    </div>
                );
            })}
        </div>
    );
}
