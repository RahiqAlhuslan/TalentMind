// 9 vibrant tile colors
export const TILE_COLORS = [
    '#ef4444', // Red
    '#f97316', // Orange
    '#eab308', // Yellow
    '#22c55e', // Green
    '#14b8a6', // Teal
    '#0ea5e9', // Light Blue
    '#3b82f6', // Blue
    '#8b5cf6', // Violet
    '#d946ef'  // Fuchsia
];

// Round config: round number → sequence length
export const ROUND_CONFIG = [
    { round: 1, seqLength: 3 },
    { round: 2, seqLength: 4 },
    { round: 3, seqLength: 5 },
    { round: 4, seqLength: 6 },
    { round: 5, seqLength: 7 }
];

export const TOTAL_ROUNDS = 5;
export const TILE_LIT_MS = 600;
export const TILE_GAP_MS = 200;
export const CLICK_TIMEOUT_MS = 5000;
export const HESITATION_MULTIPLIER = 2;
export const IDLE_THRESHOLD_MS = 4000;

/**
 * Generate the next sequence by appending a random tile to the previous sequence.
 * For round 1, generates a fresh sequence of the given length.
 */
export function generateSequence(prevSequence, targetLength) {
    const seq = [...prevSequence];
    while (seq.length < targetLength) {
        seq.push(Math.floor(Math.random() * 9));
    }
    return seq;
}
