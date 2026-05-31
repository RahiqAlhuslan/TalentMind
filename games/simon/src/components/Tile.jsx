import { TILE_COLORS } from '../utils/gameUtils';

export default function Tile({ index, isLit, feedback, onClick }) {
    const color = TILE_COLORS[index];
    const isActive = isLit || feedback === 'correct';
    const isWrong = feedback === 'wrong';

    let className = 'tile';
    if (isActive) className += ' tile-lit';
    if (isWrong) className += ' tile-wrong';

    return (
        <button
            className={className}
            style={{
                '--tile-color': color,
                '--tile-glow': color
            }}
            onClick={() => onClick(index)}
            aria-label={`Tile ${index + 1}`}
        >
            <div className="tile-inner" />
        </button>
    );
}
