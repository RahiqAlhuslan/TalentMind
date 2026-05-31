import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    // Alternatively, if you want local development to point to localhost directly when VITE_API_URL is missing:
    // baseURL: import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5089/api' : '/api'),
    headers: { 'Content-Type': 'application/json' }
});

// ---- Candidate Endpoints ----

export async function startSession(candidateToken, deviceType, userAgent) {
    try {
        const res = await api.post('/session/start', {
            candidateToken,
            deviceType,
            userAgent
        });
        return res.data; // { sessionId, startedAt }
    } catch (error) {
        console.warn("Backend not found, using standalone mock session mode.");
        return { sessionId: 'mock-session-' + Date.now(), startedAt: new Date().toISOString() };
    }
}

export async function submitTrialBatch(trials) {
    try {
        const res = await api.post('/trial/batch', { trials });
        return res.data;
    } catch (error) {
        console.warn("Standalone mode: mock submitted trials.");
        const existingStr = sessionStorage.getItem('standaloneTrials') || '[]';
        const existing = JSON.parse(existingStr);
        sessionStorage.setItem('standaloneTrials', JSON.stringify([...existing, ...trials]));
        return { success: true, count: trials.length };
    }
}

export async function completeSession(sessionId) {
    try {
        const res = await api.post('/session/complete', { sessionId });
        return res.data;
    } catch (error) {
        console.warn("Standalone mode: mock completed session.");
        return { success: true, isMock: true };
    }
}

// ---- HR Endpoints ----

let hrToken = null;

export function setHRToken(token) {
    hrToken = token;
}

export function getHRToken() {
    return hrToken;
}

export function clearHRToken() {
    hrToken = null;
}

function hrHeaders() {
    return { 'X-HR-Token': hrToken || '' };
}

export async function hrLogin(username, password) {
    const res = await api.post('/hr/login', { username, password });
    hrToken = res.data.token;
    return res.data;
}

export async function fetchSessions() {
    const res = await api.get('/hr/sessions', { headers: hrHeaders() });
    return res.data;
}

export async function fetchSessionDetail(id) {
    const res = await api.get(`/hr/session/${id}`, { headers: hrHeaders() });
    return res.data;
}

export async function fetchCohort(from, to) {
    const params = {};
    if (from) params.from = from;
    if (to) params.to = to;
    const res = await api.get('/hr/cohort', { params, headers: hrHeaders() });
    return res.data;
}

export async function exportCSV() {
    const res = await api.get('/hr/export/csv', {
        headers: hrHeaders(),
        responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'flanker_report.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
}
