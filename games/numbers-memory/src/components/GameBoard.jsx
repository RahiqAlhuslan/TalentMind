import Card from './Card';

export default function GameBoard({ cards, onCardClick }) {
    return (
        <div className="card-grid">
            {cards.map(card => (
                <Card key={card.id} card={card} onClick={onCardClick} />
            ))}
        </div>
    );
}
