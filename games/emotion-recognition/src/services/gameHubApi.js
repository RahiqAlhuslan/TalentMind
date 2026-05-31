import axios from 'axios';

// Capture userId at module load time before any navigation changes the URL
const _userId = (() => {
  const p = new URLSearchParams(window.location.search);
  const id = p.get('userId');
  return id ? parseInt(id) : null;
})();

const getUserId = () => _userId;

const GAME_ID = 'emotion-recognition';
const api = axios.create({ baseURL: import.meta.env.VITE_GAMEHUB_URL || 'http://localhost:3000' });

export const createAttempt = () => api.post('/api/attempts', { gameId: GAME_ID, userId: getUserId() });
export const saveResult = ({ attemptId, score, accuracy, reactionTimeMs, durationMs, rawData }) =>
  api.post('/api/results', { gameId: GAME_ID, attemptId, userId: getUserId(), score, accuracy, reactionTimeMs, durationMs, rawData });
