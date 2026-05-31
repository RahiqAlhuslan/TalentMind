import { memo } from 'react';

/**
 * Neutral progress bar — shows trial count without intimidating the user.
 */
function ProgressBar({ current, total }) {
    const pct = total > 0 ? (current / total) * 100 : 0;

    return (
        <div className="progress-wrapper">
            <div className="progress-track">
                <div
                    className="progress-fill"
                    style={{ width: `${pct}%` }}
                />
            </div>
            <span className="progress-text">{current} / {total}</span>
        </div>
    );
}

export default memo(ProgressBar);
