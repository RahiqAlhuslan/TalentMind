import { useState, useEffect, useCallback } from 'react';
import { hrLogin, getSessions, getSessionReport, getReplay, getCohort } from '../services/api';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    ScatterChart, Scatter, Cell, PieChart, Pie, Legend
} from 'recharts';

const TIER_COLORS = { A: '#22c55e', B: '#84cc16', C: '#eab308', D: '#f97316', F: '#ef4444' };
const TIER_LABELS = {
    A: 'Exceptional Planner',
    B: 'Proficient',
    C: 'Average',
    D: 'Below Average',
    F: 'Needs Development'
};

function HRDashboard() {
    const [token, setToken] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [sessions, setSessions] = useState([]);
    const [selectedSession, setSelectedSession] = useState(null);
    const [cohort, setCohort] = useState(null);
    const [replayData, setReplayData] = useState(null);
    const [replayIndex, setReplayIndex] = useState(0);
    const [activeTab, setActiveTab] = useState('sessions');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        setLoginError('');
        try {
            const res = await hrLogin(username, password);
            setToken(res.data.token);
        } catch {
            setLoginError('Invalid credentials');
        }
    };

    const fetchData = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const [sessRes, cohortRes] = await Promise.all([
                getSessions(token),
                getCohort(token)
            ]);
            setSessions(sessRes.data);
            setCohort(cohortRes.data);
        } catch (err) {
            console.error('Failed to fetch data:', err);
        }
        setLoading(false);
    }, [token]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const viewSession = async (session) => {
        setSelectedSession(session);
        setActiveTab('detail');
        try {
            const res = await getReplay(session.sessionId, token);
            setReplayData(res.data);
            setReplayIndex(0);
        } catch (err) {
            console.error('Failed to load replay:', err);
        }
    };

    const renderMetricBar = (label, value, max = 100, unit = '') => {
        const pct = Math.min(100, (value / max) * 100);
        const color = pct >= 70 ? '#22c55e' : pct >= 40 ? '#eab308' : '#ef4444';
        return (
            <div className="metric-bar-row">
                <span className="metric-label">{label}</span>
                <div className="metric-bar-track">
                    <div className="metric-bar-fill" style={{ width: `${pct}%`, background: color }}></div>
                </div>
                <span className="metric-value">{typeof value === 'number' ? value.toFixed(1) : value}{unit}</span>
            </div>
        );
    };

    // Login form
    if (!token) {
        return (
            <div className="page-container">
                <div className="login-card glass-card">
                    <h2>🔐 HR Dashboard</h2>
                    <p>Sign in to view candidate assessments</p>
                    <div className="form-group">
                        <label>Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Username"
                            autoFocus
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                        />
                    </div>
                    {loginError && <p className="error-text">{loginError}</p>}
                    <button className="btn-primary" onClick={handleLogin}>Sign In</button>
                </div>
            </div>
        );
    }

    return (
        <div className="hr-dashboard">
            {/* Sidebar */}
            <aside className="hr-sidebar">
                <div className="sidebar-header">
                    <h3>📊 HR Analytics</h3>
                    <span className="session-count">{sessions.length} sessions</span>
                </div>
                <nav className="sidebar-nav">
                    {[
                        { id: 'sessions', icon: '📋', label: 'Sessions' },
                        { id: 'cohort', icon: '📈', label: 'Cohort' },
                        { id: 'guide', icon: '📖', label: 'Guide' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            className={`nav-btn ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <span>{tab.icon}</span> {tab.label}
                        </button>
                    ))}
                </nav>
                <button className="btn-logout" onClick={() => { setToken(''); setSessions([]); }}>
                    🚪 Logout
                </button>
            </aside>

            {/* Main Content */}
            <main className="hr-main">
                {loading && <div className="loading-bar"></div>}

                {/* Sessions Tab */}
                {activeTab === 'sessions' && (
                    <div className="tab-content">
                        <div className="tab-header">
                            <h2>Assessment Sessions</h2>
                            <button className="btn-secondary btn-sm" onClick={fetchData}>🔄 Refresh</button>
                        </div>
                        {sessions.length === 0 ? (
                            <div className="empty-state glass-card">
                                <p>📭 No assessment sessions yet.</p>
                                <p>Sessions will appear here as candidates complete the puzzle.</p>
                            </div>
                        ) : (
                            <div className="sessions-table-wrap">
                                <table className="sessions-table">
                                    <thead>
                                        <tr>
                                            <th>Candidate</th>
                                            <th>Discs</th>
                                            <th>Score</th>
                                            <th>Tier</th>
                                            <th>Efficiency</th>
                                            <th>Time</th>
                                            <th>Errors</th>
                                            <th>Strategy</th>
                                            <th>Status</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sessions.map(s => (
                                            <tr key={s.sessionId} onClick={() => viewSession(s)}>
                                                <td className="td-name">{s.candidateName || s.candidateId}</td>
                                                <td>{s.difficultyLevel}</td>
                                                <td className="td-score">{s.overallScore.toFixed(1)}</td>
                                                <td>
                                                    <span className="tier-badge" style={{ background: TIER_COLORS[s.tier] }}>
                                                        {s.tier}
                                                    </span>
                                                </td>
                                                <td>{s.efficiencyScore.toFixed(0)}%</td>
                                                <td>{s.completionTimeSeconds.toFixed(0)}s</td>
                                                <td>{s.illegalMoveAttempts}</td>
                                                <td className="td-strategy">{s.strategyPattern}</td>
                                                <td>{s.completed ? '✅' : '⏳'}</td>
                                                <td><button className="btn-view">View →</button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Detail Tab */}
                {activeTab === 'detail' && selectedSession && (
                    <div className="tab-content">
                        <button className="btn-back" onClick={() => setActiveTab('sessions')}>← Back to Sessions</button>

                        <div className="detail-header">
                            <div>
                                <h2>{selectedSession.candidateName || selectedSession.candidateId}</h2>
                                <p>{selectedSession.difficultyLevel} discs | {selectedSession.actualMoveCount} moves |
                                    {selectedSession.completionTimeSeconds.toFixed(0)}s</p>
                            </div>
                            <div className="score-display">
                                <div className="score-circle" style={{
                                    borderColor: TIER_COLORS[selectedSession.tier],
                                    color: TIER_COLORS[selectedSession.tier]
                                }}>
                                    <span className="score-number">{selectedSession.overallScore.toFixed(0)}</span>
                                    <span className="score-tier">{selectedSession.tier}</span>
                                </div>
                                <span className="tier-label">{TIER_LABELS[selectedSession.tier]}</span>
                            </div>
                        </div>

                        {/* Metrics Grid */}
                        <div className="metrics-grid">
                            <div className="metric-card glass-card">
                                <h4>📊 Core Metrics</h4>
                                {renderMetricBar('Efficiency', selectedSession.efficiencyScore, 100, '%')}
                                {renderMetricBar('Speed', selectedSession.speedScore, 100)}
                                {renderMetricBar('Error Score', selectedSession.errorScore, 100)}
                                {renderMetricBar('Strategy', selectedSession.strategyScore, 100)}
                            </div>

                            <div className="metric-card glass-card">
                                <h4>⏱ Timing</h4>
                                <div className="metric-stat">
                                    <span>Completion Time</span>
                                    <strong>{selectedSession.completionTimeSeconds.toFixed(1)}s</strong>
                                </div>
                                <div className="metric-stat">
                                    <span>Avg Time/Move</span>
                                    <strong>{(selectedSession.timePerMoveMs / 1000).toFixed(1)}s</strong>
                                </div>
                                <div className="metric-stat">
                                    <span>Longest Pause</span>
                                    <strong>{(selectedSession.longestPauseMs / 1000).toFixed(1)}s</strong>
                                </div>
                                <div className="metric-stat">
                                    <span>Pause Count (5s+)</span>
                                    <strong>{selectedSession.pauseFrequency}</strong>
                                </div>
                            </div>

                            <div className="metric-card glass-card">
                                <h4>🎯 Accuracy</h4>
                                <div className="metric-stat">
                                    <span>Moves (Actual/Optimal)</span>
                                    <strong>{selectedSession.actualMoveCount} / {selectedSession.optimalMoveCount}</strong>
                                </div>
                                <div className="metric-stat">
                                    <span>Error Rate</span>
                                    <strong>{selectedSession.errorRate.toFixed(1)}%</strong>
                                </div>
                                <div className="metric-stat">
                                    <span>Undo Ratio</span>
                                    <strong>{selectedSession.undoRatio.toFixed(1)}%</strong>
                                </div>
                                <div className="metric-stat">
                                    <span>Recovery Score</span>
                                    <strong>{selectedSession.recoveryScore.toFixed(1)}</strong>
                                </div>
                            </div>

                            <div className="metric-card glass-card">
                                <h4>🧠 Strategy</h4>
                                <div className="metric-stat">
                                    <span>Pattern</span>
                                    <strong className="strategy-tag">{selectedSession.strategyPattern}</strong>
                                </div>
                                <div className="metric-stat">
                                    <span>Opening Score</span>
                                    <strong>{selectedSession.openingStrategyScore.toFixed(1)}%</strong>
                                </div>
                                {selectedSession.behavioralFlags?.length > 0 && (
                                    <div className="flags-list">
                                        <span className="flags-title">Flags:</span>
                                        {selectedSession.behavioralFlags.map((f, i) => (
                                            <span key={i} className="flag-chip">{f}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Replay */}
                        {replayData && replayData.moves && replayData.moves.length > 0 && (
                            <div className="replay-section glass-card">
                                <h4>🔄 Move-by-Move Replay</h4>
                                <div className="replay-controls">
                                    <button onClick={() => setReplayIndex(Math.max(0, replayIndex - 1))} disabled={replayIndex === 0}>
                                        ◀ Prev
                                    </button>
                                    <span className="replay-counter">
                                        Move {replayIndex + 1} / {replayData.moves.length}
                                    </span>
                                    <button onClick={() => setReplayIndex(Math.min(replayData.moves.length - 1, replayIndex + 1))}
                                        disabled={replayIndex >= replayData.moves.length - 1}>
                                        Next ▶
                                    </button>
                                </div>
                                {replayData.moves[replayIndex] && (
                                    <div className="replay-detail">
                                        <div className={`replay-move ${replayData.moves[replayIndex].isOptimalMove ? 'optimal' : ''} ${!replayData.moves[replayIndex].isLegalMove ? 'illegal' : ''} ${replayData.moves[replayIndex].isUndo ? 'undo' : ''}`}>
                                            <span className="move-disc">Disc {replayData.moves[replayIndex].discSize}</span>
                                            <span className="move-arrow">
                                                {replayData.moves[replayIndex].fromPeg} → {replayData.moves[replayIndex].toPeg}
                                            </span>
                                            <span className="move-time">
                                                {(replayData.moves[replayIndex].timeSinceLastMoveMs / 1000).toFixed(1)}s
                                            </span>
                                            <span className="move-tags">
                                                {replayData.moves[replayIndex].isOptimalMove && <span className="tag tag-optimal">Optimal</span>}
                                                {!replayData.moves[replayIndex].isLegalMove && <span className="tag tag-illegal">Illegal</span>}
                                                {replayData.moves[replayIndex].isUndo && <span className="tag tag-undo">Undo</span>}
                                                {replayData.moves[replayIndex].timeSinceLastMoveMs > 5000 && <span className="tag tag-pause">Pause</span>}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Cohort Tab */}
                {activeTab === 'cohort' && (
                    <div className="tab-content">
                        <h2>Cohort Analysis</h2>
                        {cohort && cohort.totalSessions > 0 ? (
                            <div className="cohort-grid">
                                <div className="cohort-summary glass-card">
                                    <h4>📊 Overview</h4>
                                    <div className="cohort-stats">
                                        <div className="cohort-stat">
                                            <span className="big-number">{cohort.totalSessions}</span>
                                            <span>Total Sessions</span>
                                        </div>
                                        <div className="cohort-stat">
                                            <span className="big-number">{cohort.avgOverallScore}</span>
                                            <span>Avg Score</span>
                                        </div>
                                        <div className="cohort-stat">
                                            <span className="big-number">{cohort.avgEfficiency}%</span>
                                            <span>Avg Efficiency</span>
                                        </div>
                                        <div className="cohort-stat">
                                            <span className="big-number">{cohort.avgCompletionTime}s</span>
                                            <span>Avg Time</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="chart-card glass-card">
                                    <h4>Tier Distribution</h4>
                                    <ResponsiveContainer width="100%" height={250}>
                                        <PieChart>
                                            <Pie
                                                data={Object.entries(cohort.tierDistribution || {}).filter(([, v]) => v > 0).map(([k, v]) => ({
                                                    name: `Tier ${k}`, value: v
                                                }))}
                                                cx="50%" cy="50%"
                                                outerRadius={80}
                                                dataKey="value"
                                                label={({ name, value }) => `${name}: ${value}`}
                                            >
                                                {Object.entries(cohort.tierDistribution || {}).filter(([, v]) => v > 0).map(([k]) => (
                                                    <Cell key={k} fill={TIER_COLORS[k]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>

                                {sessions.length > 1 && (
                                    <div className="chart-card glass-card wide">
                                        <h4>Speed vs Efficiency</h4>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <ScatterChart>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" />
                                                <XAxis dataKey="completionTimeSeconds" name="Time (s)" stroke="#94a3b8" />
                                                <YAxis dataKey="efficiencyScore" name="Efficiency %" stroke="#94a3b8" />
                                                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                                                <Scatter data={sessions} fill="#6bcfff">
                                                    {sessions.map((s, i) => (
                                                        <Cell key={i} fill={TIER_COLORS[s.tier]} />
                                                    ))}
                                                </Scatter>
                                            </ScatterChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="empty-state glass-card">
                                <p>📭 No completed sessions for cohort analysis yet.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Guide Tab */}
                {activeTab === 'guide' && (
                    <div className="tab-content">
                        <h2>Interpretation Guide</h2>
                        <div className="guide-grid">
                            <div className="guide-card glass-card">
                                <h4>🏷 Tier Classification</h4>
                                <table className="guide-table">
                                    <thead><tr><th>Tier</th><th>Score</th><th>Label</th></tr></thead>
                                    <tbody>
                                        {Object.entries(TIER_LABELS).map(([t, l]) => (
                                            <tr key={t}>
                                                <td><span className="tier-badge" style={{ background: TIER_COLORS[t] }}>{t}</span></td>
                                                <td>{t === 'A' ? '85–100' : t === 'B' ? '70–84' : t === 'C' ? '55–69' : t === 'D' ? '40–54' : '< 40'}</td>
                                                <td>{l}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="guide-card glass-card">
                                <h4>🧠 Pattern Interpretations</h4>
                                <table className="guide-table">
                                    <thead><tr><th>Pattern</th><th>Interpretation</th></tr></thead>
                                    <tbody>
                                        <tr><td>High efficiency + low time</td><td>Strong analytical thinking</td></tr>
                                        <tr><td>High efficiency + high time</td><td>Methodical, careful planner</td></tr>
                                        <tr><td>Low efficiency + many undos</td><td>Self-aware but uncertain</td></tr>
                                        <tr><td>Many illegal moves</td><td>Did not read instructions / impulsive</td></tr>
                                        <tr><td>Gave up before completion</td><td>Low task persistence</td></tr>
                                        <tr><td>Long pauses mid-puzzle</td><td>Deep thinking OR disengagement</td></tr>
                                        <tr><td>Perfect score</td><td>Possibly knew the algorithm</td></tr>
                                    </tbody>
                                </table>
                            </div>
                            <div className="guide-card glass-card">
                                <h4>📐 Scoring Formula</h4>
                                <pre className="formula-block">
                                    {`OVERALL SCORE =
  Efficiency × 0.35
+ Speed      × 0.20
+ Error      × 0.25
+ Strategy   × 0.20

Optimal Moves Reference:
  3 discs →  7 moves (~30s)
  4 discs → 15 moves (~60s)
  5 discs → 31 moves (~120s)`}
                                </pre>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default HRDashboard;
