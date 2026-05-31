import axios from 'axios';

const getUserId = () => {
  const p = new URLSearchParams(window.location.search);
  return p.get('userId') ? parseInt(p.get('userId')) : null;
};

const GAME_ID = 'digit-symbol-game';
const api = axios.create({ baseURL: import.meta.env.VITE_GAMEHUB_URL || 'http://localhost:3000' });

export const createAttempt = () => api.post('/api/attempts', { gameId: GAME_ID, userId: getUserId() });
export const saveResult = ({ attemptId, score, accuracy, reactionTimeMs, durationMs, rawData }) =>
  api.post('/api/results', { gameId: GAME_ID, attemptId, userId: getUserId(), score, accuracy, reactionTimeMs, durationMs, rawData });
