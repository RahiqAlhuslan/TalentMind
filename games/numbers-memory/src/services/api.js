const API_BASE = 'http://localhost:5118/api';

export async function submitSession(payload) {
    const response = await fetch(`${API_BASE}/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Session submission failed');
    return response.json();
}

export async function fetchHRReport() {
    const response = await fetch(`${API_BASE}/analytics/report`);
    if (!response.ok) throw new Error('Failed to fetch HR report');
    return response.json();
}
