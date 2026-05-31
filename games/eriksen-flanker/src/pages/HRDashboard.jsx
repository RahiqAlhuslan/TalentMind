import { useState, useEffect, useCallback } from 'react';
import {
    hrLogin, fetchSessions, fetchSessionDetail, fetchCohort,
    exportCSV, getHRToken, clearHRToken
} from '../services/api';
import {
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

// ==================== LOGIN ====================
function LoginForm({ onLogin }) {
    const [user, setUser] = useState('');
    const [pass, setPass] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await hrLogin(user, pass);
            onLogin();
        } catch {
            setError('Invalid credentials');
        }
        setLoading(false);
    }

    return (
        <div className="page-container welcome-page">
            <div className="welcome-card glass-card hr-login-card">
                <div className="welcome-icon">🔒</div>
                <h1>HR Analytics</h1>
                <p className="welcome-subtitle">Sign in with your HR credentials</p>
                <form onSubmit={handleSubmit} className="hr-login-form">
                    <input
                        type="text" placeholder="Username" value={user}
                        onChange={e => setUser(e.target.value)} autoFocus
                    />
                    <input
                        type="password" placeholder="Password" value={pass}
                        onChange={e => setPass(e.target.value)}
                    />
                    {error && <p className="error-text">{error}</p>}
                    <button className="btn-primary" disabled={loading}>
                        {loading ? 'Signing in…' : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
}

// ==================== RATING BADGE ====================
function RatingBadge({ rating }) {
    const cls = rating === 'Excellent' ? 'badge-green'
        : rating === 'Average' ? 'badge-yellow'
            : rating === 'Below Avg' ? 'badge-red' : 'badge-gray';
    return <span className={`rating-badge ${cls}`}>{rating}</span>;
}

// ==================== SESSIONS TABLE ====================
function SessionsTable({ sessions, onSelect }) {
    const [sortKey, setSortKey] = useState('completedAt');
    const [sortDir, setSortDir] = useState(-1);

    function toggleSort(key) {
        if (sortKey === key) setSortDir(d => -d);
        else { setSortKey(key); setSortDir(-1); }
    }

    const sorted = [...sessions].sort((a, b) => {
        const va = a[sortKey] ?? '';
        const vb = b[sortKey] ?? '';
        if (va < vb) return -sortDir;
        if (va > vb) return sortDir;
        return 0;
    });

    const SortHeader = ({ label, field }) => (
        <th onClick={() => toggleSort(field)} className="sortable-th">
            {label} {sortKey === field ? (sortDir > 0 ? '▲' : '▼') : ''}
        </th>
    );

    return (
        <div className="table-wrapper">
            <table className="hr-table">
                <thead>
                    <tr>
                        <SortHeader label="Candidate" field="candidateToken" />
                        <SortHeader label="Date" field="completedAt" />
                        <SortHeader label="Overall Acc %" field="overallAccuracy" />
                        <SortHeader label="RT CON (ms)" field="meanRT_Congruent" />
                        <SortHeader label="RT INC (ms)" field="meanRT_Incongruent" />
                        <SortHeader label="Interference (ms)" field="flankerInterferenceEffect" />
                        <SortHeader label="INC Accuracy %" field="accuracy_Incongruent" />
                        <th>Rating</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {sorted.map(s => (
                        <tr key={s.id}>
                            <td className="td-name">{s.candidateToken}</td>
                            <td>{new Date(s.completedAt).toLocaleDateString()}</td>
                            <td>{s.overallAccuracy?.toFixed(1) ?? '—'}</td>
                            <td>{s.meanRT_Congruent?.toFixed(0) ?? '—'}</td>
                            <td>{s.meanRT_Incongruent?.toFixed(0) ?? '—'}</td>
                            <td className="td-highlight">{s.flankerInterferenceEffect?.toFixed(1) ?? '—'}</td>
                            <td>{s.accuracy_Incongruent?.toFixed(1) ?? '—'}</td>
                            <td><RatingBadge rating={s.interferenceRating} /></td>
                            <td><button className="btn-sm" onClick={() => onSelect(s.id)}>View</button></td>
                        </tr>
                    ))}
                    {sorted.length === 0 && (
                        <tr><td colSpan={9} className="td-empty">No completed sessions yet</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

// ==================== CANDIDATE DETAIL ====================
function CandidateDetail({ detail, onBack }) {
    const { report, rawTrials } = detail;
    const [tab, setTab] = useState('overview');

    // Radar chart data
    const radarData = [
        { metric: 'RT CON', value: report.meanRT_Congruent || 0, fullMark: 800 },
        { metric: 'RT INC', value: report.meanRT_Incongruent || 0, fullMark: 800 },
        { metric: 'RT NEU', value: report.meanRT_Neutral || 0, fullMark: 800 },
        { metric: 'Acc CON %', value: report.accuracy_Congruent || 0, fullMark: 100 },
        { metric: 'Acc INC %', value: report.accuracy_Incongruent || 0, fullMark: 100 },
        { metric: 'Acc NEU %', value: report.accuracy_Neutral || 0, fullMark: 100 },
    ];

    // Timeline data for RT over trials
    const timelineData = rawTrials
        .filter(t => t.reactionTimeMs !== null && !t.isAnticipatory)
        .map(t => ({
            trial: t.trialNumber,
            rt: t.reactionTimeMs,
            condition: t.condition
        }));

    return (
        <div className="candidate-detail">
            <button className="btn-back" onClick={onBack}>← Back to All Sessions</button>
            <div className="detail-header">
                <h2>{report.candidateToken}</h2>
                <span className="detail-date">
                    {new Date(report.startedAt).toLocaleString()}
                    {report.completedAt && ` — ${new Date(report.completedAt).toLocaleString()}`}
                </span>
                <span className="detail-device">{report.deviceType}</span>
            </div>

            {/* Tabs */}
            <div className="tab-bar">
                {['overview', 'detailed', 'timeline', 'raw'].map(t => (
                    <button
                        key={t}
                        className={`tab-btn ${tab === t ? 'tab-active' : ''}`}
                        onClick={() => setTab(t)}
                    >
                        {t === 'overview' ? 'Overview' : t === 'detailed' ? 'Detailed Metrics' : t === 'timeline' ? 'Timeline' : 'Raw Data'}
                    </button>
                ))}
            </div>

            {/* Overview Tab */}
            {tab === 'overview' && (
                <div className="tab-content">
                    <div className="metrics-grid">
                        <MetricCard label="Flanker Interference" value={`${report.flankerInterferenceEffect?.toFixed(1) ?? '—'} ms`} rating={report.interferenceRating} description="RT difference between incongruent and congruent trials" />
                        <MetricCard label="Incongruent Accuracy" value={`${report.accuracy_Incongruent?.toFixed(1) ?? '—'}%`} rating={report.accuracyRating} description="Accuracy under interference" />
                        <MetricCard label="RT Variability (SD)" value={`${report.rtStandardDeviation?.toFixed(1) ?? '—'} ms`} rating={report.variabilityRating} description="Consistency of response timing" />
                        <MetricCard label="Post-Error Slowing" value={`${report.postErrorSlowing?.toFixed(1) ?? '—'} ms`} rating={report.pesRating} description="Self-correction ability after errors" />
                        <MetricCard label="Fatigue Effect" value={`H1: ${report.firstHalfAccuracy?.toFixed(1) ?? '—'}% → H2: ${report.secondHalfAccuracy?.toFixed(1) ?? '—'}%`} rating={report.fatigueRating} description="Sustained attention across test duration" />
                        <MetricCard label="Overall Accuracy" value={`${report.overallAccuracy?.toFixed(1) ?? '—'}%`} description={`${report.totalCorrect} correct, ${report.totalWrong} wrong, ${report.totalMisses} missed`} />
                    </div>

                    <div className="chart-section">
                        <h3>Condition Performance Profile</h3>
                        <ResponsiveContainer width="100%" height={350}>
                            <RadarChart data={radarData}>
                                <PolarGrid stroke="#334155" />
                                <PolarAngleAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fill: '#64748b', fontSize: 10 }} />
                                <Radar name="Performance" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Detailed Metrics Tab */}
            {tab === 'detailed' && (
                <div className="tab-content">
                    <div className="detail-table-wrapper">
                        <h3>Primary Metrics</h3>
                        <table className="detail-table">
                            <tbody>
                                <DetailRow label="Mean RT — Congruent" value={fmt(report.meanRT_Congruent, ' ms')} />
                                <DetailRow label="Mean RT — Incongruent" value={fmt(report.meanRT_Incongruent, ' ms')} />
                                <DetailRow label="Mean RT — Neutral" value={fmt(report.meanRT_Neutral, ' ms')} />
                                <DetailRow label="Flanker Interference Effect" value={fmt(report.flankerInterferenceEffect, ' ms')} highlight />
                                <DetailRow label="Accuracy — Congruent" value={fmt(report.accuracy_Congruent, '%')} />
                                <DetailRow label="Accuracy — Incongruent" value={fmt(report.accuracy_Incongruent, '%')} />
                                <DetailRow label="Accuracy — Neutral" value={fmt(report.accuracy_Neutral, '%')} />
                                <DetailRow label="Flanker Accuracy Cost" value={fmt(report.flankerAccuracyCost, '%')} />
                                <DetailRow label="Overall Accuracy" value={fmt(report.overallAccuracy, '%')} />
                                <DetailRow label="Total Correct" value={report.totalCorrect} />
                                <DetailRow label="Total Wrong" value={report.totalWrong} />
                                <DetailRow label="Total Misses" value={report.totalMisses} />
                            </tbody>
                        </table>

                        <h3>Extended Metrics</h3>
                        <table className="detail-table">
                            <tbody>
                                <DetailRow label="RT Standard Deviation" value={fmt(report.rtStandardDeviation, ' ms')} />
                                <DetailRow label="Coefficient of Variation" value={fmt(report.coefficientOfVariation)} />
                                <DetailRow label="Inverse Efficiency Score" value={fmt(report.inverseEfficiencyScore)} />
                                <DetailRow label="Post-Error Slowing" value={fmt(report.postErrorSlowing, ' ms')} />
                                <DetailRow label="Post-Error Accuracy" value={fmt(report.postErrorAccuracy, '%')} />
                                <DetailRow label="Sequential Error Streaks" value={report.sequentialErrorStreaks} />
                                <DetailRow label="1st Half Accuracy" value={fmt(report.firstHalfAccuracy, '%')} />
                                <DetailRow label="2nd Half Accuracy" value={fmt(report.secondHalfAccuracy, '%')} />
                                <DetailRow label="1st Half Mean RT" value={fmt(report.firstHalfMeanRT, ' ms')} />
                                <DetailRow label="2nd Half Mean RT" value={fmt(report.secondHalfMeanRT, ' ms')} />
                                <DetailRow label="Fastest 10% RT (P10)" value={fmt(report.fastestTenPercentRT, ' ms')} />
                                <DetailRow label="Slowest 10% RT (P90)" value={fmt(report.slowestTenPercentRT, ' ms')} />
                                <DetailRow label="Anticipatory Responses" value={report.anticipatoryResponses} />
                                <DetailRow label="Late Responses (>1200ms)" value={report.lateResponses} />
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Timeline Tab */}
            {tab === 'timeline' && (
                <div className="tab-content">
                    <h3>Reaction Time Over Trial Sequence</h3>
                    <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={timelineData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="trial" label={{ value: 'Trial #', position: 'insideBottom', offset: -5, fill: '#94a3b8' }} tick={{ fill: '#94a3b8' }} />
                            <YAxis label={{ value: 'RT (ms)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} tick={{ fill: '#94a3b8' }} />
                            <Tooltip
                                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                                labelFormatter={v => `Trial ${v}`}
                                formatter={(v, _, entry) => [`${v} ms`, entry.payload.condition]}
                            />
                            <Line type="monotone" dataKey="rt" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 3 }} activeDot={{ r: 5 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Raw Data Tab */}
            {tab === 'raw' && (
                <div className="tab-content">
                    <div className="table-wrapper">
                        <table className="hr-table raw-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Condition</th>
                                    <th>Target</th>
                                    <th>RT (ms)</th>
                                    <th>Correct</th>
                                    <th>Timeout</th>
                                    <th>Anticipatory</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rawTrials.map(t => (
                                    <tr key={t.trialNumber} className={t.isCorrect === false ? 'row-error' : t.isTimeout ? 'row-timeout' : ''}>
                                        <td>{t.trialNumber}</td>
                                        <td><span className={`cond-badge cond-${t.condition.toLowerCase()}`}>{t.condition}</span></td>
                                        <td>{t.targetDirection}</td>
                                        <td>{t.reactionTimeMs ?? '—'}</td>
                                        <td>{t.isCorrect === true ? '✓' : t.isCorrect === false ? '✗' : '—'}</td>
                                        <td>{t.isTimeout ? '⏱' : ''}</td>
                                        <td>{t.isAnticipatory ? '⚡' : ''}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

function MetricCard({ label, value, rating, description }) {
    return (
        <div className="metric-card glass-card">
            <div className="metric-label">{label}</div>
            <div className="metric-value">{value}</div>
            {rating && <RatingBadge rating={rating} />}
            {description && <div className="metric-desc">{description}</div>}
        </div>
    );
}

function DetailRow({ label, value, highlight }) {
    return (
        <tr className={highlight ? 'row-highlight' : ''}>
            <td className="detail-label">{label}</td>
            <td className="detail-value">{value ?? '—'}</td>
        </tr>
    );
}

function fmt(val, suffix = '') {
    if (val === null || val === undefined) return '—';
    return typeof val === 'number' ? val.toFixed(1) + suffix : val + suffix;
}

// ==================== COHORT VIEW ====================
function CohortView({ cohort }) {
    if (!cohort || cohort.count === 0) {
        return <p className="td-empty">No cohort data available</p>;
    }

    return (
        <div className="cohort-section">
            <h3>Cohort Aggregates ({cohort.count} sessions)</h3>
            <div className="metrics-grid">
                <MetricCard label="Avg Flanker Interference" value={fmt(cohort.avgFlankerInterference, ' ms')} />
                <MetricCard label="Avg Overall Accuracy" value={fmt(cohort.avgOverallAccuracy, '%')} />
                <MetricCard label="Avg RT — Congruent" value={fmt(cohort.avgMeanRT_CON, ' ms')} />
                <MetricCard label="Avg RT — Incongruent" value={fmt(cohort.avgMeanRT_INC, ' ms')} />
                <MetricCard label="Avg RT — Neutral" value={fmt(cohort.avgMeanRT_NEU, ' ms')} />
                <MetricCard label="Avg RT Variability" value={fmt(cohort.avgRTSD, ' ms')} />
            </div>
        </div>
    );
}

// ==================== MAIN DASHBOARD ====================
export default function HRDashboard() {
    const [authenticated, setAuthenticated] = useState(!!getHRToken());
    const [sessions, setSessions] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [detail, setDetail] = useState(null);
    const [cohort, setCohort] = useState(null);
    const [view, setView] = useState('sessions'); // sessions | cohort
    const [loading, setLoading] = useState(false);

    const loadSessions = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchSessions();
            setSessions(data);
        } catch (e) {
            if (e.response?.status === 401) {
                clearHRToken();
                setAuthenticated(false);
            }
        }
        setLoading(false);
    }, []);

    const loadCohort = useCallback(async () => {
        try {
            const data = await fetchCohort();
            setCohort(data);
        } catch { }
    }, []);

    useEffect(() => {
        if (authenticated) {
            loadSessions();
            loadCohort();
        }
    }, [authenticated, loadSessions, loadCohort]);

    async function handleSelectSession(id) {
        setLoading(true);
        try {
            const data = await fetchSessionDetail(id);
            setDetail(data);
            setSelectedId(id);
        } catch { }
        setLoading(false);
    }

    function handleLogout() {
        clearHRToken();
        setAuthenticated(false);
        setSessions([]);
        setDetail(null);
        setCohort(null);
    }

    if (!authenticated) {
        return <LoginForm onLogin={() => setAuthenticated(true)} />;
    }

    return (
        <div className="hr-dashboard">
            <header className="hr-header">
                <div className="hr-header-left">
                    <h1>🧠 Flanker Test — HR Analytics</h1>
                </div>
                <div className="hr-header-right">
                    <button
                        className={`tab-btn ${view === 'sessions' ? 'tab-active' : ''}`}
                        onClick={() => { setView('sessions'); setSelectedId(null); setDetail(null); }}
                    >
                        Sessions
                    </button>
                    <button
                        className={`tab-btn ${view === 'cohort' ? 'tab-active' : ''}`}
                        onClick={() => setView('cohort')}
                    >
                        Cohort
                    </button>
                    <button className="btn-sm btn-export" onClick={exportCSV}>📥 Export CSV</button>
                    <button className="btn-sm btn-refresh" onClick={loadSessions}>🔄 Refresh</button>
                    <button className="btn-sm btn-logout" onClick={handleLogout}>Logout</button>
                </div>
            </header>

            <main className="hr-main">
                {loading && <div className="loading-spinner">Loading…</div>}

                {view === 'sessions' && !selectedId && (
                    <SessionsTable sessions={sessions} onSelect={handleSelectSession} />
                )}

                {view === 'sessions' && selectedId && detail && (
                    <CandidateDetail
                        detail={detail}
                        onBack={() => { setSelectedId(null); setDetail(null); }}
                    />
                )}

                {view === 'cohort' && <CohortView cohort={cohort} />}
            </main>
        </div>
    );
}
