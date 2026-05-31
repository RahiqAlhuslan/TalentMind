import { memo } from 'react';

/**
 * Displays the 5-character stimulus row (flankers + target).
 * Uses monospace font at 72px+, centered in viewport.
 */
function StimulusDisplay({ chars, visible }) {
    if (!visible || !chars) return <div className="stimulus-container stimulus-blank" />;

    return (
        <div className="stimulus-container">
            <div className="stimulus-row">
                {chars.map((ch, i) => (
                    <span
                        key={i}
                        className={`stimulus-char ${i === 2 ? 'stimulus-target' : 'stimulus-flanker'}`}
                    >
                        {ch}
                    </span>
                ))}
            </div>
        </div>
    );
}

export default memo(StimulusDisplay);
