export default function Card({ card, onClick }) {
    const handleClick = () => {
        if (!card.isFlipped && !card.isMatched) onClick(card);
    };

    const cls = [
        'card-wrapper',
        card.isFlipped ? 'flipped' : '',
        card.isMatched ? 'matched' : '',
    ].filter(Boolean).join(' ');

    return (
        <div className={cls} onClick={handleClick}>
            <div className="card-inner">
                <div className="card-face card-back" />
                <div className="card-face card-front">
                    {card.value}
                </div>
            </div>
        </div>
    );
}
