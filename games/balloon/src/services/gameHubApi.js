// Capture userId at module load time before any navigation changes the URL
const _userId = (() => {
  const p = new URLSearchParams(window.location.search);
  const id = p.get('userId');
  return id ? parseInt(id) : null;
})();

const getUserId = () => _userId;

const GAME_ID  = 'balloon-task';
const BASE_URL = process.env.REACT_APP_GAMEHUB_URL || 'http://localhost:3000';

const post = (path, body) =>
  fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

export const createAttempt = () =>
  post('/api/attempts', { gameId: GAME_ID, userId: getUserId() })
    .then(r => r.json());

export const saveResult = ({ attemptId, score, accuracy, reactionTimeMs, durationMs, rawData }) =>
  post('/api/results', {
    gameId: GAME_ID,
    attemptId,
    userId: getUserId(),
    score,
    accuracy,
    reactionTimeMs,
    durationMs,
    rawData,
  });
