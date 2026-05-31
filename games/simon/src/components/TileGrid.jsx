import Tile from './Tile';

export default function TileGrid({ litTile, feedbackTile, onTileClick }) {
    return (
        <div className="tile-grid">
            {Array.from({ length: 9 }, (_, i) => (
                <Tile
                    key={i}
                    index={i}
                    isLit={litTile === i}
                    feedback={feedbackTile.index === i ? feedbackTile.type : ''}
                    onClick={onTileClick}
                />
            ))}
        </div>
    );
}
