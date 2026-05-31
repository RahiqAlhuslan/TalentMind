import axios from 'axios';

// Capture userId at module load time before React Router navigation changes the URL
const _userId = (() => {
  const p = new URLSearchParams(window.location.search);
  const id = p.get('userId');
  return id ? parseInt(id) : null;
})();

const getUserId = () => _userId;

const gameHubApi = axios.create({
  baseURL: import.meta.env.VITE_GAMEHUB_URL || 'http://localhost:3000'
});

export const GAME_ID = 'tower-of-hanoi';

export const registerGame = () =>
  gameHubApi.post('/api/games', {
    gameId: GAME_ID,
    name: 'Tower of Hanoi',
    category: 'logic',
    owner: 'assessment-team'
  });

export const createAttempt = () =>
  gameHubApi.post('/api/attempts', { gameId: GAME_ID, userId: getUserId() });

export const saveResult = ({ attemptId, score, accuracy, reactionTimeMs, durationMs, rawData }) =>
  gameHubApi.post('/api/results', {
    gameId: GAME_ID, attemptId, userId: getUserId(),
    score, accuracy, reactionTimeMs, durationMs, rawData
  });
