export function generateCards() {
  const pairs = [1, 2, 3, 4, 5, 6, 7, 8];
  const deck = [...pairs, ...pairs].map((val, idx) => ({
    id: idx,
    value: val,
    isFlipped: false,
    isMatched: false,
  }));
  return shuffle(deck);
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
