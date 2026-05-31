import { memo } from 'react';

/**
 * Centered fixation cross — same size/position as stimulus to prevent eye movement.
 */
function FixationCross({ visible }) {
    if (!visible) return null;

    return (
        <div className="stimulus-container">
            <div className="fixation-cross">+</div>
        </div>
    );
}

export default memo(FixationCross);
