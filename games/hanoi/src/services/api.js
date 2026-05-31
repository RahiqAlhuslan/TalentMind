import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });

// Candidate APIs
export const startSession = (candidateName, difficultyLevel) =>
    api.post('/session/start', { candidateName, difficultyLevel });

export const recordMove = (sessionId, moveData) =>
    api.post(`/session/${sessionId}/move`, moveData);

export const recordUndo = (sessionId, moveData) =>
    api.post(`/session/${sessionId}/undo`, moveData);

export const recordPause = (sessionId) =>
    api.post(`/session/${sessionId}/pause`);

export const completeSession = (sessionId) =>
    api.post(`/session/${sessionId}/complete`);

// HR APIs
export const hrLogin = (username, password) =>
    api.post('/hr/login', { username, password });

export const getSessions = (token) =>
    api.get('/hr/sessions', { headers: { 'X-HR-Token': token } });

export const getSessionReport = (id, token) =>
    api.get(`/hr/session/${id}`, { headers: { 'X-HR-Token': token } });

export const getReplay = (id, token) =>
    api.get(`/hr/session/${id}/replay`, { headers: { 'X-HR-Token': token } });

export const getCohort = (token) =>
    api.get('/hr/cohort', { headers: { 'X-HR-Token': token } });
