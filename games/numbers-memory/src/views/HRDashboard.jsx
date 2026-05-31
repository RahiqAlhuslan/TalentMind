import { useEffect, useState, useMemo } from 'react';
import { fetchHRReport } from '../services/api';

const cols = [
    { key: 'rank', label: 'Rank' },
    { key: 'candidateName', label: 'Candidate' },
    { key: 'compositeScore', label: 'Score' },
    { key: 'totalTimeMs', label: 'Time' },
    { key: 'accuracyRate', label: 'Accuracy' },
    { key: 'successfulAttempts', label: 'Correct' },
    { key: 'wrongAttempts', label: 'Wrong' },
    { key: 'totalAttempts', label: 'Total Flips' },
    { key: 'avgReactionTimeMs', label: 'Avg React.' },
    { key: 'fastestMatchMs', label: 'Fastest' },
    { key: 'repeatMistakeCount', label: 'Repeats' },
    { key: 'idlePeriodCount', label: 'Idle' },
];

function scoreBadge(score) {
    if (score >= 80) return 'score-strong';
    if (score >= 60) return 'score-average';
    return 'score-weak';
}

function fmt(key, val, rank) {
    if (key === 'rank') return rank;
    if (key === 'totalTimeMs') {
        const s = Math.floor(val / 1000);
        return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    }
    if (key === 'compositeScore') return val.toFixed(1);
    if (key === 'accuracyRate') return `${val.toFixed(1)}%`;
    if (key === 'avgReactionTimeMs') return `${Math.round(val)}ms`;
    if (key === 'fastestMatchMs') return `${val}ms`;
    return val ?? '—';
}

export default function HRDashboard() {
    const [report, setReport] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(null);

    const load = () => {
        fetchHRReport()
            .then(data => {
                setReport(data);
                setLastUpdated(new Date().toLocaleTimeString());
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
        const interval = setInterval(load, 30000);
        return () => clearInterval(interval);
    }, []);

    const stats = useMemo(() => {
        if (report.length === 0) return null;
        const avgScore = (report.reduce((a, r) => a + r.compositeScore, 0) / report.length).toFixed(1);
        const topScore = Math.max(...report.map(r => r.compositeScore)).toFixed(1);
        const avgTime = Math.round(report.reduce((a, r) => a + r.totalTimeMs, 0) / report.length / 1000);
        return {
            total: report.length,
            avgScore,
            topScore,
            avgTime: `${Math.floor(avgTime / 60)}m ${avgTime % 60}s`,
        };
    }, [report]);

    return (
        <>
            <div className="scene-bg" />
            <div className="hr-container">
                {/* Header */}
                <div className="hr-header">
                    <div className="hr-header-left">
                        <div className="hr-badge">
                            <span className="hr-badge-dot" /> Assessment Dashboard
                        </div>
                        <h1 className="hr-title">Candidate Analytics</h1>
                        <p className="hr-subtitle">Numbers Memory Game — Behavioral Performance Report</p>
                    </div>
                    <div className="hr-header-right">
                        <button className="hr-refresh-btn" onClick={load}>
                            ↻ Refresh
                        </button>
                        {lastUpdated && (
                            <span className="hr-updated-text">Last updated: {lastUpdated}</span>
                        )}
                    </div>
                </div>

                {/* Stats Overview */}
                {stats && (
                    <div className="stats-row">
                        <div className="stat-card glass">
                            <div className="stat-label">Total Candidates</div>
                            <div className="stat-value accent">{stats.total}</div>
                        </div>
                        <div className="stat-card glass">
                            <div className="stat-label">Average Score</div>
                            <div className="stat-value warning">{stats.avgScore}</div>
                        </div>
                        <div className="stat-card glass">
                            <div className="stat-label">Top Score</div>
                            <div className="stat-value success">{stats.topScore}</div>
                        </div>
                        <div className="stat-card glass">
                            <div className="stat-label">Avg Completion</div>
                            <div className="stat-value accent">{stats.avgTime}</div>
                        </div>
                    </div>
                )}

                {/* Table */}
                {loading ? (
                    <div className="loading-spinner">
                        <div className="spinner-dot" />
                        <div className="spinner-dot" />
                        <div className="spinner-dot" />
                    </div>
                ) : report.length === 0 ? (
                    <div className="table-wrapper glass">
                        <div className="empty-state">
                            <div className="empty-icon">📋</div>
                            <div className="empty-title">No results yet</div>
                            <div className="empty-sub">Candidates who complete the assessment will appear here.</div>
                        </div>
                    </div>
                ) : (
                    <div className="table-wrapper glass">
                        <div style={{ overflowX: 'auto' }}>
                            <table className="hr-table">
                                <thead>
                                    <tr>
                                        {cols.map(c => (
                                            <th key={c.key}>{c.label}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {report.map((row, i) => (
                                        <tr key={row.sessionId}>
                                            {cols.map(c => {
                                                const val = fmt(c.key, row[c.key], i + 1);

                                                if (c.key === 'rank') {
                                                    return (
                                                        <td key={c.key} className={`rank-cell ${i < 3 ? 'top' : ''}`}>
                                                            #{val}
                                                        </td>
                                                    );
                                                }
                                                if (c.key === 'candidateName') {
                                                    return <td key={c.key} className="name-cell">{val}</td>;
                                                }
                                                if (c.key === 'compositeScore') {
                                                    return (
                                                        <td key={c.key}>
                                                            <span className={`score-badge ${scoreBadge(row.compositeScore)}`}>
                                                                {val}
                                                            </span>
                                                        </td>
                                                    );
                                                }
                                                if (c.key === 'wrongAttempts' && row.wrongAttempts > 5) {
                                                    return <td key={c.key} className="danger-cell">{val}</td>;
                                                }
                                                return <td key={c.key}>{val}</td>;
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
