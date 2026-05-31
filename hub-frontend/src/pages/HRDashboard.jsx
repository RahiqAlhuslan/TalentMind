import { useState, useEffect, Fragment } from "react";

const API     = import.meta.env.VITE_API_URL || "http://localhost:3000";
const HR_PASS = "hr2024";

const GAME_META = {
  "tower-of-hanoi":       { name: "Tower of Hanoi" },
  "balloon-task":         { name: "Balloon Task" },
  "n-back-task":          { name: "N-Back Task" },
  "emotion-recognition":  { name: "Emotion Recognition" },
  "digit-symbol-game":    { name: "Digit Symbol Task" },
  "colour-stroop-task":   { name: "Colour Stroop Task" },
  "eriksen-flanker-test": { name: "Eriksen Flanker Test" },
  "simon-says-game":      { name: "Simon Says Task" },
  "numbers-memory-game":  { name: "Numbers Memory Task" },
  "target-tracking-game": { name: "Target Tracking Task" },
  "typing-pressure-test": { name: "Typing Pressure Test" },
  "go-no-go-game":        { name: "Go / No-Go Task" },
};

const COMPETENCY_LABELS = {
  attention:             "Attention & Focus",
  workingMemory:         "Memory & Recall",
  processingSpeed:       "Processing Speed",
  decisionMaking:        "Decision Making",
  emotionalIntelligence: "Emotional Intelligence",
  impulseControl:        "Impulse Control",
  stressResistance:      "Stress Resistance",
  cognitiveFlexibility:  "Cognitive Flexibility",
};

const RADAR_LABELS = {
  attention:             ["Attention", "& Focus"],
  workingMemory:         ["Memory", "& Recall"],
  processingSpeed:       ["Processing", "Speed"],
  decisionMaking:        ["Decision", "Making"],
  emotionalIntelligence: ["Emotional", "Intelligence"],
  impulseControl:        ["Impulse", "Control"],
  stressResistance:      ["Stress", "Resistance"],
  cognitiveFlexibility:  ["Cognitive", "Flexibility"],
};

// ── Design tokens (light theme) ───────────────────────────────────────────────
const C = {
  sidebarBg:   "#FFFFFF",
  mainBg:      "#F2F3F9",
  cardDark:    "#FFFFFF",
  cardDarker:  "#F7F8FD",
  cardLight:   "#F0EFFF",
  headerCard:  "#FFFFFF",
  purple:      "#6C63FF",
  purpleDim:   "#6C63FF12",
  purpleMid:   "#6C63FF35",
  purpleLight: "#ede9fe",
  blue:        "#4F8EF7",
  textWhite:   "#0F1120",
  textMid:     "#374151",
  textSoft:    "#9CA3AF",
  textDark:    "#0F1120",
  green:       "#059669",
  greenBg:     "#ECFDF5",
  amber:       "#D97706",
  amberBg:     "#FFFBEB",
  red:         "#E11D48",
  redBg:       "#FFF1F2",
  borderDark:  "#E5E7EB",
  borderMid:   "#D1D5DB",
  font:        "'Plus Jakarta Sans','Inter','Helvetica Neue',Arial,sans-serif",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
function pad2(n) { return String(Math.round(n ?? 0)).padStart(2, "0"); }
function scoreColor(v) {
  if (v == null) return C.textSoft;
  if (v >= 70)   return C.green;
  if (v >= 45)   return C.amber;
  return C.red;
}
function isCritical(v) { return v != null && v < 35; }

// ── Radar Chart ───────────────────────────────────────────────────────────────
function RadarChart({ competencies }) {
  const W = 260, H = 260, cx = W / 2, cy = H / 2, r = 74;
  const keys  = Object.keys(COMPETENCY_LABELS);
  const n     = keys.length;
  const angle = (i) => (Math.PI * 2 * i / n) - Math.PI / 2;
  const axPt  = (i, s = 1) => ({ x: cx + r * s * Math.cos(angle(i)), y: cy + r * s * Math.sin(angle(i)) });
  const dataPt = (i) => axPt(i, (competencies[keys[i]] ?? 0) / 100);

  const lblCfg = (i) => {
    const cos = Math.cos(angle(i)), sin = Math.sin(angle(i));
    return {
      x: cx + r * 1.56 * cos,
      y: cy + r * 1.56 * sin,
      anchor: cos > 0.2 ? "start" : cos < -0.2 ? "end" : "middle",
    };
  };

  const polyPts    = (s) => keys.map((_, i) => `${axPt(i, s).x},${axPt(i, s).y}`).join(" ");
  const dataPoints = keys.map((_, i) => dataPt(i));
  const dataPoly   = dataPoints.map(p => `${p.x},${p.y}`).join(" ");

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block", flexShrink: 0 }}>
      {[0.25, 0.5, 0.75, 1].map(s => (
        <polygon key={s} points={polyPts(s)} fill="none"
          stroke={s === 1 ? "#D1D5DB" : "#E5E7EB"}
          strokeWidth={s === 1 ? 1.2 : 0.8}
          strokeDasharray={s < 1 ? "3 4" : "none"} />
      ))}
      {keys.map((_, i) => {
        const e = axPt(i);
        return <line key={i} x1={cx} y1={cy} x2={e.x} y2={e.y} stroke="#E5E7EB" strokeWidth="1" />;
      })}
      <polygon points={dataPoly} fill="#6C63FF15" stroke="#6C63FF" strokeWidth="1.8" strokeLinejoin="round" />
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#6C63FF" stroke="#FFFFFF" strokeWidth="2" />
      ))}
      {keys.map((k, i) => {
        const { x, y, anchor } = lblCfg(i);
        const lines = RADAR_LABELS[k];
        return (
          <g key={k}>
            <text x={x} y={y - 4} textAnchor={anchor} fontSize="7.5" fontWeight="600"
              fill="#6B7280" fontFamily={C.font} letterSpacing="0.01em">{lines[0]}</text>
            <text x={x} y={y + 5} textAnchor={anchor} fontSize="7.5" fontWeight="600"
              fill="#6B7280" fontFamily={C.font} letterSpacing="0.01em">{lines[1]}</text>
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r="4" fill="#6C63FF" opacity="0.6" />
    </svg>
  );
}

// ── Competency Row (anchor panel) ─────────────────────────────────────────────
function CompetencyRow({ label, value, percentile }) {
  const crit  = isCritical(value);
  const color = crit ? C.red : C.purple;
  return (
    <div style={{ marginBottom: 15 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: crit ? C.red : "#111827", fontFamily: C.font }}>
          {label}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          {crit && (
            <span style={{
              fontSize: 8.5, fontWeight: 800, color: "#BE123C",
              background: "#FFE4E6", border: "1px solid #FDA4AF",
              borderRadius: 3, padding: "2px 6px",
              textTransform: "uppercase", letterSpacing: "0.08em",
            }}>Critical: {value != null ? `${value}%` : "—"}</span>
          )}
          {!crit && percentile != null && (
            <span style={{ fontSize: 10, color: "#9CA3AF", fontFamily: C.font }}>Top {100 - percentile}%</span>
          )}
          {!crit && (
            <span style={{ fontSize: 12, fontWeight: 700, color: "#111827", fontVariantNumeric: "tabular-nums" }}>
              {value != null ? `${value}%` : "—"}
            </span>
          )}
        </div>
      </div>
      <div style={{ height: 4, background: "#E5E7EB", borderRadius: 2, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${value ?? 0}%`,
          background: crit ? C.red : color,
          borderRadius: 2, transition: "width 0.7s ease",
        }} />
      </div>
    </div>
  );
}

// ── Match Vector Badge ─────────────────────────────────────────────────────────
function MatchVectorBadge({ role }) {
  return (
    <span style={{
      display: "inline-block",
      background: "transparent",
      border: `1px solid ${C.purple}`,
      borderRadius: 4,
      padding: "3px 10px",
      fontSize: 9.5,
      fontWeight: 700,
      color: C.purple,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      fontFamily: C.font,
      whiteSpace: "nowrap",
    }}>
      Match Vector: {role}
    </span>
  );
}

// ── Insight Findings Row ──────────────────────────────────────────────────────
function InsightRow({ insight, index }) {
  const variants = {
    strength: { strip: C.green,     tag: "#DCFCE7", tagText: "#15803D", label: "Strength",         code: "STR" },
    concern:  { strip: C.red,       tag: "#FFE4E6", tagText: "#BE123C", label: "Development Area",  code: "DEV" },
    neutral:  { strip: C.borderMid, tag: "#F3F4F6", tagText: "#6B7280", label: "Observation",       code: "OBS" },
  };
  const v = variants[insight.type] || variants.neutral;

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "3px 72px 1fr",
      gap: "0 14px",
      alignItems: "start",
      padding: "13px 0",
      borderBottom: `1px solid #F3F4F6`,
    }}>
      {/* Severity strip */}
      <div style={{ width: 3, borderRadius: 2, background: v.strip, alignSelf: "stretch", minHeight: 20 }} />

      {/* Type tag */}
      <div style={{ paddingTop: 1 }}>
        <span style={{
          display: "inline-block",
          background: v.tag,
          color: v.tagText,
          fontSize: 8.5, fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          borderRadius: 3,
          padding: "2px 7px",
          whiteSpace: "nowrap",
        }}>{v.code}</span>
      </div>

      {/* Finding text */}
      <p style={{
        margin: 0,
        fontSize: 12.5,
        color: "#374151",
        lineHeight: 1.65,
        fontWeight: 400,
      }}>{insight.text}</p>
    </div>
  );
}

// ── Role Row (segmented track + rank) ─────────────────────────────────────────
function RoleRow({ role, score, rank }) {
  const color = score >= 70 ? C.green : score >= 50 ? C.amber : C.red;
  const filled = Math.round((score ?? 0) / 10);
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "18px 1fr auto",
      gap: "6px 10px",
      alignItems: "center",
      padding: "9px 0",
      borderBottom: `1px solid ${C.borderDark}20`,
    }}>
      <span style={{
        fontSize: 9, fontWeight: 700, color: C.textSoft,
        letterSpacing: "0.04em", fontVariantNumeric: "tabular-nums",
      }}>{String(rank).padStart(2, "0")}</span>
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: C.textMid, marginBottom: 5 }}>{role}</div>
        <div style={{ display: "flex", gap: 2 }}>
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} style={{
              width: 13, height: 4, borderRadius: 2,
              background: i < filled ? color : C.borderDark,
              transition: `background 0.3s ease ${i * 25}ms`,
            }} />
          ))}
        </div>
      </div>
      <span style={{
        fontSize: 12, fontWeight: 700, color,
        fontVariantNumeric: "tabular-nums", textAlign: "right",
      }}>
        {score != null ? `${score}%` : "—"}
      </span>
    </div>
  );
}

// ── Raw Detail Chips ───────────────────────────────────────────────────────────
function RawDetails({ data }) {
  if (!data || typeof data !== "object") return null;
  const flat = Object.entries(data).filter(([, v]) => v !== null && typeof v !== "object");
  if (!flat.length) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, padding: "10px 0" }}>
      {flat.map(([k, v]) => (
        <span key={k} style={{
          background: C.cardDarker, border: `1px solid ${C.borderDark}`,
          borderRadius: 4, padding: "2px 8px", fontSize: 10.5, color: C.textMid,
        }}>
          <span style={{ color: C.textSoft }}>{k.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase())}: </span>
          <strong style={{ color: C.textWhite }}>{typeof v === "number" ? (Number.isInteger(v) ? v : v.toFixed(2)) : String(v)}</strong>
        </span>
      ))}
    </div>
  );
}

// ── Label ─────────────────────────────────────────────────────────────────────
function Label({ children, color }) {
  return (
    <div style={{
      fontSize: 9, fontWeight: 700, letterSpacing: "0.15em",
      textTransform: "uppercase", color: color || C.textSoft,
      fontFamily: C.font, marginBottom: 5,
    }}>{children}</div>
  );
}

// ── User Panel ────────────────────────────────────────────────────────────────
function UserPanel({ user }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [expanded, setExpanded]   = useState({});

  useEffect(() => {
    setLoading(true);
    setAnalytics(null);
    fetch(`${API}/api/hr/analytics/${user.id}`)
      .then(r => r.json())
      .then(setAnalytics)
      .catch(() => setAnalytics(null))
      .finally(() => setLoading(false));
  }, [user.id]);

  const results     = user.results || [];
  const withScore   = results.filter(r => r.score != null);
  const withRT      = results.filter(r => r.reactionTimeMs != null);
  const avgScore    = withScore.length ? Math.round(withScore.reduce((s, r) => s + r.score, 0) / withScore.length) : null;
  const avgRT       = withRT.length   ? Math.round(withRT.reduce((s, r) => s + r.reactionTimeMs, 0) / withRT.length) : null;
  const uniqueGames = new Set(results.map(r => r.gameId)).size;

  const comp     = analytics?.competencies || {};
  const hasComp  = Object.keys(comp).length > 0;
  const compKeys = Object.keys(COMPETENCY_LABELS);

  const compVals     = compKeys.map(k => comp[k]).filter(v => v != null);
  const overallScore = compVals.length ? Math.round(compVals.reduce((a, b) => a + b, 0) / compVals.length) : null;
  const roleScores   = analytics?.roleScores || {};
  const sortedRoles  = Object.entries(roleScores).sort((a, b) => b[1] - a[1]);
  const bestRole     = sortedRoles[0];

  // Table column styles
  const TH = {
    padding: "10px 16px",
    fontSize: 9, fontWeight: 700,
    color: C.textSoft,
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    textAlign: "left",
    borderBottom: `1px solid ${C.borderDark}`,
    background: C.cardDark,
    whiteSpace: "nowrap",
    fontFamily: C.font,
  };

  const tdBase = {
    fontSize: 12.5, color: C.textMid,
    borderBottom: `1px solid ${C.borderDark}`,
    verticalAlign: "middle",
    fontFamily: C.font,
  };

  const cols = {
    name:  { ...tdBase, padding: "11px 16px", width: "22%" },
    score: { ...tdBase, padding: "11px 12px", width: "13%" },
    prec:  { ...tdBase, padding: "11px 14px", width: "18%" },
    react: { ...tdBase, padding: "11px 12px", width: "12%", fontVariantNumeric: "tabular-nums" },
    date:  { ...tdBase, padding: "11px 12px", width: "13%", color: C.textSoft, fontSize: 11.5 },
    diag:  { ...tdBase, padding: "11px 16px", width: "22%" },
  };

  return (
    <div style={{ flex: 1, overflow: "auto", background: C.mainBg, fontFamily: C.font }}>
      <div style={{ padding: "32px 40px", maxWidth: 1200 }}>

        {/* ── Command Strip Header ── */}
        <div style={{
          display: "flex",
          alignItems: "stretch",
          borderRadius: 10,
          overflow: "hidden",
          border: `1px solid ${C.borderDark}`,
          background: C.headerCard,
          marginBottom: 24,
        }}>
          {/* Identity Cell */}
          <div style={{
            flex: "0 0 38%",
            padding: "24px 28px",
            borderRight: `1px solid ${C.borderDark}`,
            background: "#F0EFFF",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: 12,
          }}>
            <div>
              <div style={{
                fontSize: 9, fontWeight: 700, letterSpacing: "0.18em",
                textTransform: "uppercase", color: C.purple,
                fontFamily: C.font, marginBottom: 8,
              }}>
                {bestRole ? `Match Vector: ${bestRole[0]}` : "Candidate Profile"}
              </div>
              <div style={{
                fontSize: 30, fontWeight: 800, color: C.textWhite,
                letterSpacing: "-0.035em", lineHeight: 1.05,
                fontFamily: C.font,
              }}>
                {user.username}
              </div>
            </div>
            <div style={{ fontSize: 11, fontWeight: 400, color: C.textSoft, letterSpacing: "0.02em", lineHeight: 1.6 }}>
              Recorded {fmtDate(user.createdAt)}&nbsp;&bull;&nbsp;{uniqueGames} assessment module{uniqueGames !== 1 ? "s" : ""}
            </div>
          </div>

          {/* Stat Cells */}
          {[
            { label: "Cognitive Score", value: overallScore != null ? `${overallScore}` : avgScore != null ? `${avgScore}` : "—", unit: "/100", color: C.textWhite },
            { label: "Sessions",        value: pad2(results.length), unit: "",    color: C.textWhite },
            { label: "Avg Accuracy",    value: avgScore != null ? `${avgScore}` : "—", unit: avgScore != null ? "%" : "", color: avgScore != null ? scoreColor(avgScore) : C.textSoft },
            { label: "Avg Reaction",    value: avgRT != null ? `${avgRT}` : "—", unit: avgRT != null ? "ms" : "", color: C.textWhite },
          ].map(({ label, value, unit, color }, i, arr) => (
            <div key={i} style={{
              flex: 1,
              padding: "20px 20px",
              borderRight: i < arr.length - 1 ? `1px solid ${C.borderDark}` : "none",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}>
              <div style={{
                fontSize: 9, fontWeight: 600, letterSpacing: "0.15em",
                textTransform: "uppercase", color: C.textSoft, marginBottom: 10,
                fontFamily: C.font,
              }}>{label}</div>
              <div style={{
                fontSize: 30, fontWeight: 800, letterSpacing: "-0.04em",
                lineHeight: 1, fontVariantNumeric: "tabular-nums", color,
                fontFamily: C.font,
              }}>
                {value}
                <span style={{ fontSize: 12, fontWeight: 500, color: C.textSoft, marginLeft: 2 }}>{unit}</span>
              </div>
            </div>
          ))}
        </div>

        {loading && (
          <div style={{ textAlign: "center", padding: "60px 0", color: C.textSoft, fontSize: 13, letterSpacing: "0.05em" }}>
            Computing behavioral analytics...
          </div>
        )}

        {!loading && !hasComp && results.length === 0 && (
          <div style={{ background: C.cardDark, border: `1px solid ${C.borderDark}`, borderRadius: 12, padding: "72px 20px", textAlign: "center" }}>
            <div style={{ color: C.textSoft, fontSize: 13 }}>No assessment data available for this candidate.</div>
          </div>
        )}

        {!loading && (hasComp || results.length > 0) && (
          /* ── Asymmetric 5:3 Layout ── */
          <div style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 5fr) minmax(260px, 3fr)",
            gap: 0,
            alignItems: "start",
          }}>

            {/* ── PRIMARY COLUMN (left 5fr) ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20, paddingRight: 24 }}>

              {/* Radar — horizontal card */}
              {hasComp && (
                <div style={{
                  background: C.cardDark,
                  border: `1px solid ${C.borderDark}`,
                  borderRadius: 10,
                  padding: "24px 28px",
                  display: "grid",
                  gridTemplateColumns: "auto 1fr",
                  gap: 28,
                  alignItems: "center",
                }}>
                  <RadarChart competencies={comp} />
                  <div>
                    <Label color={C.purple}>Spatial Telemetry</Label>
                    <div style={{ fontSize: 16, fontWeight: 700, color: C.textWhite, letterSpacing: "-0.01em", marginBottom: 16 }}>
                      Behavioral Distribution Geometry
                    </div>
                    {/* Mini stat chips from radar data */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                      {compKeys.map(k => {
                        const v = comp[k];
                        if (v == null) return null;
                        const c = isCritical(v) ? C.red : v >= 70 ? C.green : C.amber;
                        return (
                          <div key={k} style={{
                            display: "flex", flexDirection: "column",
                            background: "#F0EFFF",
                            border: "1px solid #DDD9FF",
                            borderRadius: 6, padding: "7px 11px",
                          }}>
                            <span style={{ fontSize: 8, fontWeight: 600, color: C.textSoft, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 3 }}>
                              {COMPETENCY_LABELS[k].split(" ")[0]}
                            </span>
                            <span style={{ fontSize: 16, fontWeight: 800, color: c, letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums" }}>
                              {Math.round(v)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ fontSize: 11, color: C.textSoft, lineHeight: 1.65 }}>
                      Algorithmic competency profile compiled<br />from multi-session behavioral matrices.
                    </div>
                  </div>
                </div>
              )}

              {/* Game Sessions Table */}
              {results.length > 0 && (
                <div style={{
                  background: C.cardDark,
                  border: `1px solid ${C.borderDark}`,
                  borderRadius: 10,
                  overflow: "hidden",
                }}>
                  <div style={{ padding: "18px 22px 14px", borderBottom: `1px solid ${C.borderDark}` }}>
                    <Label color={C.purple}>Telemetry Engine Execution Log</Label>
                    <div style={{ fontSize: 12.5, color: C.textMid }}>
                      {results.length} session{results.length !== 1 ? "s" : ""} across {uniqueGames} module{uniqueGames !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                    <colgroup>
                      <col style={{ width: "22%" }} />
                      <col style={{ width: "13%" }} />
                      <col style={{ width: "18%" }} />
                      <col style={{ width: "12%" }} />
                      <col style={{ width: "13%" }} />
                      <col style={{ width: "22%" }} />
                    </colgroup>
                    <thead>
                      <tr>
                        {["Evaluation Scope", "Score Matrix", "Precision Track", "Reaction", "Date", "Diagnostic Interface"].map((h, i) => (
                          <th key={i} style={TH}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((r, ri) => {
                        const meta    = GAME_META[r.gameId] || { name: r.gameId };
                        const isExp   = expanded[r.id];
                        const hasDets = r.rawData && Object.entries(r.rawData).some(([, v]) => typeof v !== "object");
                        const rowBg   = ri % 2 === 0 ? C.cardDark : C.cardDarker;
                        const sc      = r.score;
                        const ac      = r.accuracy;
                        const scColor = scoreColor(sc);
                        const acColor = scoreColor(ac);

                        return (
                          <Fragment key={r.id}>
                            <tr style={{ background: rowBg }}>
                              {/* Game name */}
                              <td style={cols.name}>
                                <span style={{ fontSize: 12.5, fontWeight: 600, color: C.textWhite }}>{meta.name}</span>
                              </td>

                              {/* Score Matrix */}
                              <td style={cols.score}>
                                <span style={{
                                  display: "inline-block", minWidth: 56, textAlign: "center",
                                  background: sc != null ? scColor + "22" : C.borderDark,
                                  color: sc != null ? scColor : C.textSoft,
                                  border: `1px solid ${sc != null ? scColor + "55" : C.borderDark}`,
                                  borderRadius: 5, padding: "3px 8px",
                                  fontSize: 12, fontWeight: 700,
                                  fontVariantNumeric: "tabular-nums",
                                }}>
                                  {sc != null ? `${Math.round(sc)}/100` : "—"}
                                </span>
                              </td>

                              {/* Precision Track */}
                              <td style={cols.prec}>
                                <div style={{ display: "grid", gridTemplateColumns: "36px 1fr", gap: 10, alignItems: "center" }}>
                                  <span style={{
                                    fontSize: 12, fontWeight: 700,
                                    color: ac != null ? acColor : C.textSoft,
                                    fontVariantNumeric: "tabular-nums",
                                  }}>
                                    {ac != null ? `${Math.round(ac)}%` : "—"}
                                  </span>
                                  <div style={{ height: 4, background: C.borderDark, borderRadius: 2, overflow: "hidden" }}>
                                    <div style={{
                                      height: "100%", width: `${ac ?? 0}%`,
                                      background: ac != null ? acColor : "transparent",
                                      borderRadius: 2, transition: "width 0.5s",
                                    }} />
                                  </div>
                                </div>
                              </td>

                              {/* Reaction */}
                              <td style={cols.react}>
                                {r.reactionTimeMs != null
                                  ? <span style={{ color: C.textMid }}>{Math.round(r.reactionTimeMs)}<span style={{ color: C.textSoft, fontSize: 10, marginLeft: 2 }}>ms</span></span>
                                  : <span style={{ color: C.textSoft }}>—</span>}
                              </td>

                              {/* Date */}
                              <td style={cols.date}>{fmtDate(r.createdAt)}</td>

                              {/* Diagnostic */}
                              <td style={cols.diag}>
                                {hasDets && (
                                  <button
                                    onClick={() => setExpanded(p => ({ ...p, [r.id]: !p[r.id] }))}
                                    style={{
                                      background: "none", border: "none",
                                      color: C.purple, fontSize: 12, fontWeight: 600,
                                      cursor: "pointer", fontFamily: C.font,
                                      padding: 0, letterSpacing: "0.02em",
                                    }}>
                                    {isExp ? "Close" : "Trace Log"}&nbsp;&rarr;
                                  </button>
                                )}
                              </td>
                            </tr>
                            {isExp && r.rawData && (
                              <tr style={{ background: C.cardDarker }}>
                                <td colSpan={6} style={{ padding: "4px 16px 14px" }}>
                                  <RawDetails data={r.rawData} />
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Behavioral Insights */}
              {analytics?.insights?.length > 0 && (
                <div style={{
                  background: "#FFFFFF",
                  border: "1px solid #E5E7EB",
                  borderRadius: 10,
                  overflow: "hidden",
                }}>
                  {/* Header row */}
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "16px 22px",
                    borderBottom: "1px solid #E5E7EB",
                    background: "#FAFBFF",
                  }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#0F1120", letterSpacing: "-0.01em" }}>
                        Assessment Findings
                      </div>
                      <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>
                        Derived from cross-session behavioral data
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {["STR","DEV","OBS"].map(code => {
                        const colors = { STR: ["#DCFCE7","#15803D"], DEV: ["#FFE4E6","#BE123C"], OBS: ["#F3F4F6","#6B7280"] };
                        const count = analytics.insights.filter(i =>
                          (code === "STR" && i.type === "strength") ||
                          (code === "DEV" && i.type === "concern") ||
                          (code === "OBS" && i.type === "neutral")
                        ).length;
                        if (!count) return null;
                        return (
                          <span key={code} style={{
                            display: "inline-flex", alignItems: "center", gap: 4,
                            background: colors[code][0], color: colors[code][1],
                            fontSize: 9, fontWeight: 700, letterSpacing: "0.08em",
                            textTransform: "uppercase", borderRadius: 3, padding: "2px 7px",
                          }}>{code} {count}</span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Findings ledger */}
                  <div style={{ padding: "0 22px" }}>
                    {analytics.insights.map((ins, i) => (
                      <InsightRow key={i} insight={ins} index={i + 1} />
                    ))}
                  </div>
                </div>
              )}

              <div style={{ height: 40 }} />
            </div>

            {/* ── ANCHOR COLUMN (right 3fr, sticky) ── */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
              position: "sticky",
              top: 32,
              alignSelf: "start",
              paddingLeft: 24,
              borderLeft: `1px solid ${C.borderDark}`,
            }}>

              {/* Competency Vectors */}
              {hasComp && (
                <div style={{
                  background: "#FFFFFF",
                  border: "1px solid #E5E7EB",
                  borderRadius: 10,
                  padding: "22px 22px",
                }}>
                  <div style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: "0.15em",
                    textTransform: "uppercase", color: C.purple, marginBottom: 4,
                  }}>Index Metrics</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#0F1120", letterSpacing: "-0.01em", marginBottom: 18 }}>
                    Competency Vectors
                  </div>
                  {compKeys.map(k => (
                    <CompetencyRow
                      key={k}
                      label={COMPETENCY_LABELS[k]}
                      value={comp[k]}
                      percentile={analytics?.percentiles?.[k]}
                    />
                  ))}
                  {analytics?.percentiles && (
                    <div style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      marginTop: 14, paddingTop: 12, borderTop: "1px solid #F3F4F6",
                      fontSize: 10, color: "#9CA3AF",
                    }}>
                      <span>Global Assessment Matrix</span>
                      <span style={{ fontVariantNumeric: "tabular-nums" }}>N=—</span>
                    </div>
                  )}
                </div>
              )}

              {/* Role Compatibility */}
              {sortedRoles.length > 0 && (
                <div style={{
                  background: C.cardDark, border: `1px solid ${C.borderDark}`,
                  borderRadius: 10, padding: "22px 22px",
                }}>
                  <Label color={C.purple}>Role Vector Analysis</Label>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.textWhite, letterSpacing: "-0.01em", marginBottom: 4 }}>
                    Position Compatibility
                  </div>
                  <div>
                    {sortedRoles.map(([role, score], i) => (
                      <RoleRow key={role} role={role} score={score} rank={i + 1} />
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function HRDashboard() {
  const [authed, setAuthed]       = useState(() => sessionStorage.getItem("hr_auth") === "1");
  const [passInput, setPassInput] = useState("");
  const [passErr, setPassErr]     = useState("");
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(false);
  const [selected, setSelected]   = useState(null);
  const [search, setSearch]       = useState("");

  useEffect(() => {
    if (!authed) return;
    setLoading(true);
    fetch(`${API}/api/hr/dashboard`)
      .then(r => r.json())
      .then(data => {
        const arr = Array.isArray(data) ? data : [];
        setUsers(arr);
        if (arr.length > 0) setSelected(arr[0].id);
      })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, [authed]);

  function handleLogin(e) {
    e.preventDefault();
    if (passInput === HR_PASS) { sessionStorage.setItem("hr_auth", "1"); setAuthed(true); }
    else setPassErr("Invalid access code.");
  }

  /* ── Login ── */
  if (!authed) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", fontFamily: C.font, background: "#F2F3F9" }}>
        {/* Left accent panel */}
        <div style={{
          width: 480, background: "#6C63FF",
          display: "flex", flexDirection: "column", justifyContent: "space-between",
          padding: "56px 52px", flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#C4C0FF", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 52 }}>
              TalentMind &nbsp;&bull;&nbsp; Assessment Core
            </div>
            <div style={{ fontSize: 40, fontWeight: 800, color: "#FFFFFF", lineHeight: 1.15, letterSpacing: "-0.03em", marginBottom: 20 }}>
              HR Intelligence<br />Platform
            </div>
            <div style={{ fontSize: 13, color: "#C4C0FF", lineHeight: 1.75, maxWidth: 320 }}>
              Behavioral telemetry. Cognitive competency vectors.
              Role fit analysis — derived from real-time gameplay data.
            </div>
          </div>
          <div style={{ fontSize: 10, color: "#C4C0FF", letterSpacing: "0.06em" }}>
            COMP492 · Senior Design Project · 2026
          </div>
        </div>

        {/* Right form */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#F2F3F9" }}>
          <div style={{ width: 340 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: C.purple, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 16 }}>
              Secure Access
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#0F1120", letterSpacing: "-0.02em", marginBottom: 8 }}>
              Sign In
            </div>
            <div style={{ fontSize: 12.5, color: "#6B7280", marginBottom: 36 }}>
              Enter your HR access code to continue.
            </div>
            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: C.textSoft, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 }}>
                  Access Code
                </div>
                <input
                  type="password"
                  placeholder="Enter access code"
                  value={passInput}
                  onChange={e => { setPassInput(e.target.value); setPassErr(""); }}
                  style={{
                    width: "100%", padding: "12px 14px",
                    border: `1px solid ${passErr ? C.red : "#D1D5DB"}`,
                    borderRadius: 7, fontSize: 13.5,
                    fontFamily: C.font, color: "#0F1120",
                    background: "#FFFFFF", outline: "none",
                    boxSizing: "border-box",
                  }}
                  autoFocus
                />
                {passErr && <div style={{ color: C.red, fontSize: 11.5, marginTop: 6 }}>{passErr}</div>}
              </div>
              <button type="submit" style={{
                padding: "13px", marginTop: 4,
                background: C.purple, border: "none", borderRadius: 7,
                color: "white", fontFamily: C.font, fontWeight: 700,
                fontSize: 13.5, cursor: "pointer", letterSpacing: "0.02em",
              }}>
                Access Dashboard
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const filteredUsers = users.filter(u => u.username.toLowerCase().includes(search.toLowerCase()));
  const selectedUser  = users.find(u => u.id === selected);

  /* ── Main layout ── */
  return (
    <div style={{ display: "flex", height: "100vh", background: C.mainBg, fontFamily: C.font }}>

      {/* ── Sidebar ── */}
      <div style={{
        width: 260, flexShrink: 0,
        background: C.sidebarBg,
        borderRight: `1px solid ${C.borderDark}`,
        display: "flex", flexDirection: "column",
      }}>
        {/* Brand */}
        <div style={{ padding: "20px 18px 14px", borderBottom: `1px solid ${C.borderDark}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 7,
              background: C.purple, display: "flex", alignItems: "center",
              justifyContent: "center", color: "white", fontWeight: 800, fontSize: 13,
              flexShrink: 0,
            }}>T</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.textWhite, letterSpacing: "0.01em" }}>TalentMind</div>
              <div style={{ fontSize: 8.5, color: C.textSoft, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>Assessment Core</div>
            </div>
          </div>
          <input
            placeholder="Filter talent pool..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: "100%", padding: "7px 10px",
              border: `1px solid ${C.borderDark}`, borderRadius: 6,
              fontSize: 12, fontFamily: C.font, color: C.textWhite,
              background: C.cardDark, outline: "none", boxSizing: "border-box",
            }}
          />
        </div>

        {/* Section label */}
        <div style={{ padding: "10px 18px 6px" }}>
          <span style={{ fontSize: 8.5, fontWeight: 700, color: C.textSoft, textTransform: "uppercase", letterSpacing: "0.16em" }}>
            Live Nodes
          </span>
        </div>

        {/* Candidate list */}
        <div style={{ flex: 1, overflow: "auto" }}>
          {loading ? (
            <div style={{ padding: "20px", color: C.textSoft, fontSize: 12 }}>Loading nodes...</div>
          ) : filteredUsers.length === 0 ? (
            <div style={{ padding: "20px", color: C.textSoft, fontSize: 12 }}>No candidates found.</div>
          ) : filteredUsers.map((u, idx) => {
            const isActive   = selected === u.id;
            const gamesCount = u.results?.length || 0;
            return (
              <button
                key={u.id}
                onClick={() => setSelected(u.id)}
                style={{
                  width: "100%", padding: "10px 18px",
                  border: "none",
                  borderLeft: `3px solid ${isActive ? C.purple : "transparent"}`,
                  background: isActive ? C.purpleDim : "transparent",
                  cursor: "pointer", textAlign: "left",
                  display: "flex", flexDirection: "column", gap: 3,
                  transition: "background 0.15s",
                }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.textWhite }}>{u.username}</span>
                  {isActive ? (
                    <span style={{
                      fontSize: 7.5, fontWeight: 700, color: "#065F46", background: "#D1FAE5",
                      border: "1px solid #6EE7B7", borderRadius: 3, padding: "1px 5px",
                      letterSpacing: "0.1em", textTransform: "uppercase",
                    }}>Active</span>
                  ) : (
                    <span style={{ fontSize: 8.5, color: C.textSoft, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                      ID-{String(idx + 1).padStart(2, "0")}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 10.5, color: C.textSoft, display: "flex", alignItems: "center", gap: 5 }}>
                  {isActive && <div style={{ width: 5, height: 5, borderRadius: "50%", background: C.green }} />}
                  {gamesCount} session{gamesCount !== 1 ? "s" : ""}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{
          padding: "12px 18px", borderTop: `1px solid ${C.borderDark}`,
          fontSize: 8.5, color: C.textSoft, letterSpacing: "0.08em",
          textTransform: "uppercase", lineHeight: 1.8,
        }}>
          Terminal Node v2<br />Secure Connected
        </div>
      </div>

      {/* ── Content ── */}
      {selectedUser
        ? <UserPanel key={selectedUser.id} user={selectedUser} />
        : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ color: C.textSoft, fontSize: 13 }}>Select a candidate to view analytics.</div>
          </div>
        )
      }
    </div>
  );
}
