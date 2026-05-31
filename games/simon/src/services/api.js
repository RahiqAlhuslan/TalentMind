const API_BASE = import.meta.env.VITE_API_URL || '/api';

export async function submitSession(data) {
    const res = await fetch(`${API_BASE}/session/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to submit session');
    return res.json();
}

export async function fetchReports(token) {
    const res = await fetch(`${API_BASE}/analytics/reports?token=${encodeURIComponent(token)}`);
    if (!res.ok) throw new Error('Failed to fetch reports');
    return res.json();
}

export async function fetchReport(id, token) {
    const res = await fetch(`${API_BASE}/analytics/report/${id}?token=${encodeURIComponent(token)}`);
    if (!res.ok) throw new Error('Failed to fetch report');
    return res.json();
}

export async function exportCSV(token) {
    const res = await fetch(`${API_BASE}/analytics/export/csv?token=${encodeURIComponent(token)}`);
    if (!res.ok) throw new Error('Failed to export CSV');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'simon_says_report.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
}
