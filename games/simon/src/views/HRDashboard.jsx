import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchReports, fetchReport, exportCSV } from '../services/api';
import ProtectedRoute from '../components/ProtectedRoute';
import {
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

// ==================== SCORE BADGE ====================
function ScoreBadge({ score }) {
    let cls = 'badge-red';
    let label = 'Weak';
    if (score >= 90) { cls = 'badge-green'; label = 'Exceptional'; }
    else if (score >= 75) { cls = 'badge-green'; label = 'Strong'; }
    else if (score >= 60) { cls = 'badge-yellow'; label = 'Competent'; }
    else if (score >= 45) { cls = 'badge-yellow'; label = 'Below Avg'; }
    return <span className={`rating-badge ${cls}`}>{label} ({score})</span>;
}

function RatingBadge({ rating }) {
    const cls = rating === 'Excellent' ? 'badge-green'
        : rating === 'Average' ? 'badge-yellow'
            : rating === 'Improving' ? 'badge-green'
                : rating === 'Stable' ? 'badge-yellow'
                    : rating === 'N/A' ? 'badge-gray'
                        : 'badge-red';
    return <span className={`rating-badge ${cls}`}>{rating}</span>;
}

// ==================== RANKED TABLE ====================
function RankedTable({ reports, onSelect }) {
    const [sortKey, setSortKey] = useState('compositeScore');
    const [sortDir, setSortDir] = useState(-1);

    function toggleSort(key) {
        if (sortKey === key) setSortDir(d => -d);
        else { setSortKey(key); setSortDir(-1); }
    }

    const sorted = [...reports].sort((a, b) => {
        const va = a[sortKey] ?? 0;
        const vb = b[sortKey] ?? 0;
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
                        <th>#</th>
                        <SortHeader label="Name" field="candidateName" />
                        <SortHeader label="Score" field="compositeScore" />
                        <SortHeader label="Rounds" field="roundsCompleted" />
                        <SortHeader label="Correct" field="totalCorrectClicks" />
                        <SortHeader label="Wrong" field="totalWrongClicks" />
                        <SortHeader label="Avg RT (ms)" field="avgResponseTimeMs" />
                        <SortHeader label="Fastest (ms)" field="fastestResponseMs" />
                        <SortHeader label="Accuracy %" field="clickAccuracyRate" />
                        <SortHeader label="Hesitations" field="hesitationCount" />
                        <SortHeader label="Focus" field="focusScore" />
                        <SortHeader label="Completed" field="completedAt" />
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {sorted.map((r, idx) => (
                        <tr key={r.sessionId}>
                            <td className="td-rank">{idx + 1}</td>
                            <td className="td-name">{r.candidateName}</td>
                            <td><ScoreBadge score={r.compositeScore} /></td>
                            <td>{r.roundsCompleted} / 5</td>
                            <td>{r.totalCorrectClicks}</td>
                            <td className={r.totalWrongClicks > 0 ? 'td-red' : ''}>{r.totalWrongClicks}</td>
                            <td>{r.avgResponseTimeMs?.toFixed(0)}</td>
                            <td>{r.fastestResponseMs?.toFixed(0)}</td>
                            <td>{r.clickAccuracyRate?.toFixed(1)}%</td>
                            <td>{r.hesitationCount}</td>
                            <td><RatingBadge rating={r.focusRating} /></td>
                            <td>{new Date(r.completedAt).toLocaleDateString()}</td>
                            <td><button className="btn-sm" onClick={() => onSelect(r.sessionId)}>View</button></td>
                        </tr>
                    ))}
                    {sorted.length === 0 && (
                        <tr><td colSpan={14} className="td-empty">No completed sessions yet</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

// ==================== CANDIDATE DETAIL ====================
function CandidateDetail({ report, onBack }) {
    const radarData = [
        { metric: 'Memory', value: report.memoryScore, fullMark: 100 },
        { metric: 'Accuracy', value: report.accuracyScore, fullMark: 100 },
        { metric: 'Speed', value: report.speedScore, fullMark: 100 },
        { metric: 'Focus', value: report.focusScore, fullMark: 100 }
    ];

    const breakdownData = [
        { name: 'Memory', score: report.memoryScore, weight: '35%' },
        { name: 'Accuracy', score: report.accuracyScore, weight: '30%' },
        { name: 'Speed', score: report.speedScore, weight: '20%' },
        { name: 'Focus', score: report.focusScore, weight: '15%' }
    ];

    const barColors = ['#6366f1', '#22c55e', '#eab308', '#f97316'];

    return (
        <div className="candidate-detail">
            <button className="btn-back" onClick={onBack}>← Back to All Candidates</button>

            <div className="detail-header">
                <h2>{report.candidateName}</h2>
                <ScoreBadge score={report.compositeScore} />
                <span className="detail-date">
                    {new Date(report.completedAt).toLocaleString()}
                </span>
            </div>

            <p className="interpretation-text">{report.scoreInterpretation}</p>

            <div className="detail-grid">
                {/* Radar Chart */}
                <div className="chart-card glass-card">
                    <h3>Performance Profile</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <RadarChart data={radarData}>
                            <PolarGrid stroke="#334155" />
                            <PolarAngleAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 13 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
                            <Radar name="Score" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>

                {/* Score Breakdown */}
                <div className="chart-card glass-card">
                    <h3>Score Breakdown</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={breakdownData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis type="number" domain={[0, 100]} tick={{ fill: '#94a3b8' }} />
                            <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8' }} width={80} />
                            <Tooltip
                                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                                formatter={(v, _, entry) => [`${v.toFixed(1)} (×${entry.payload.weight})`, 'Score']}
                            />
                            <Bar dataKey="score" radius={[0, 6, 6, 0]}>
                                {breakdownData.map((_, i) => (
                                    <Cell key={i} fill={barColors[i]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Core Metrics Table */}
            <div className="detail-table-wrapper">
                <h3>Core Metrics</h3>
                <table className="detail-table">
                    <tbody>
                        <DetailRow label="Rounds Completed" value={`${report.roundsCompleted} / 5`} />
                        <DetailRow label="Longest Sequence" value={`${report.sequenceLength} tiles`} />
                        <DetailRow label="Total Correct Clicks" value={report.totalCorrectClicks} />
                        <DetailRow label="Total Wrong Clicks" value={report.totalWrongClicks} />
                        <DetailRow label="Click Accuracy" value={`${report.clickAccuracyRate?.toFixed(1)}%`} />
                        <DetailRow label="Avg Response Time" value={`${report.avgResponseTimeMs?.toFixed(1)} ms`} />
                        <DetailRow label="Fastest Response" value={`${report.fastestResponseMs?.toFixed(1)} ms`} />
                        <DetailRow label="Slowest Response" value={`${report.slowestResponseMs?.toFixed(1)} ms`} />
                        <DetailRow label="Total Game Time" value={`${(report.totalGameTimeMs / 1000).toFixed(1)}s`} />
                    </tbody>
                </table>

                <h3>Behavioral Indicators</h3>
                <table className="detail-table">
                    <tbody>
                        <tr>
                            <td className="detail-label">Memory Capacity</td>
                            <td className="detail-value"><RatingBadge rating={report.memoryRating} /></td>
                        </tr>
                        <tr>
                            <td className="detail-label">Impulse Control</td>
                            <td className="detail-value"><RatingBadge rating={report.impulseRating} /></td>
                        </tr>
                        <tr>
                            <td className="detail-label">Focus & Attention</td>
                            <td className="detail-value"><RatingBadge rating={report.focusRating} /></td>
                        </tr>
                        <tr>
                            <td className="detail-label">Learning Curve</td>
                            <td className="detail-value"><RatingBadge rating={report.learningCurve} /></td>
                        </tr>
                        <DetailRow label="Hesitation Count" value={report.hesitationCount} hint="Clicks > 2× own avg" />
                        <DetailRow label="Early Clicks" value={report.earlyClickCount} hint="Clicks during playback" />
                        <DetailRow label="Idle Periods" value={report.idlePeriodCount} hint="Gaps > 4s between clicks" />
                        <DetailRow label="1st Round Avg RT" value={`${report.firstRoundResponseAvgMs?.toFixed(1)} ms`} hint="Baseline speed" />
                        <DetailRow label="Last Round Avg RT" value={`${report.lastRoundResponseAvgMs?.toFixed(1)} ms`} hint="Fatigue indicator" />
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function DetailRow({ label, value, hint, highlight }) {
    return (
        <tr className={highlight ? 'row-highlight' : ''}>
            <td className="detail-label">
                {label}
                {hint && <span className="detail-hint"> ({hint})</span>}
            </td>
            <td className="detail-value">{value ?? '—'}</td>
        </tr>
    );
}

// ==================== MAIN DASHBOARD ====================
export default function HRDashboard() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') || '';

    const [reports, setReports] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(false);

    const loadReports = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchReports(token);
            setReports(data);
        } catch (err) {
            console.error('Failed to load reports:', err);
        }
        setLoading(false);
    }, [token]);

    useEffect(() => {
        if (token === 'hr-access-2024') {
            loadReports();
        }
    }, [token, loadReports]);

    async function handleSelectSession(id) {
        setLoading(true);
        try {
            const data = await fetchReport(id, token);
            setDetail(data);
            setSelectedId(id);
        } catch (err) {
            console.error('Failed to load detail:', err);
        }
        setLoading(false);
    }

    return (
        <ProtectedRoute token={token}>
            <div className="hr-dashboard">
                <header className="hr-header">
                    <div className="hr-header-left">
                        <h1>🧠 Simon Says — HR Analytics</h1>
                    </div>
                    <div className="hr-header-right">
                        <span className="hr-candidate-count">{reports.length} candidate{reports.length !== 1 ? 's' : ''}</span>
                        <button className="btn-sm btn-export" onClick={() => exportCSV(token)}>📥 Export CSV</button>
                        <button className="btn-sm btn-refresh" onClick={loadReports}>🔄 Refresh</button>
                    </div>
                </header>

                <main className="hr-main">
                    {loading && <div className="loading-spinner">Loading…</div>}

                    {!selectedId && (
                        <RankedTable reports={reports} onSelect={handleSelectSession} />
                    )}

                    {selectedId && detail && (
                        <CandidateDetail
                            report={detail}
                            onBack={() => { setSelectedId(null); setDetail(null); }}
                        />
                    )}
                </main>
            </div>
        </ProtectedRoute>
    );
}
