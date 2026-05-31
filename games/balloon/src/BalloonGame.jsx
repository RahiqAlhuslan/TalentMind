import { useState, useEffect, useRef, useCallback } from "react";
import { createAttempt, saveResult } from "./services/gameHubApi";

// ─── Constants ────────────────────────────────────────────────────────────────
const TOTAL_ROUNDS = 15;
const REWARD_PER_PUMP = 0.05;
const MAX_POSSIBLE_BANK = TOTAL_ROUNDS * 14 * REWARD_PER_PUMP; // $10.50

// ─── Helpers ──────────────────────────────────────────────────────────────────
// Her balon için rastgele bir patlama eşiği belirler.
// Eşik değerleri: 4 ile 14 arasında rastgele (bazıları 4'te, bazıları 7'de, bazıları 12'de patlasın)
// Ağırlıklı dağılım: düşük sayılar biraz daha sık gelsin ama çok geniş yelpaze olsun
const POP_THRESHOLDS = [4, 5, 6, 7, 7, 8, 9, 10, 11, 12, 13, 14];
function getPopThreshold() {
  return POP_THRESHOLDS[Math.floor(Math.random() * POP_THRESHOLDS.length)];
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BalloonGame() {
  const [gameState, setGameState] = useState("idle"); // idle | playing | popped | cashed | finished
  const [round, setRound] = useState(1);
  const [pumps, setPumps] = useState(0);
  const [bankTotal, setBankTotal] = useState(0);
  const [roundEarnings, setRoundEarnings] = useState(0);
  // Her round başında rastgele belirlenen patlama eşiği
  const [popThreshold, setPopThreshold] = useState(() => getPopThreshold());
  const [, setSessionId] = useState(null);
  const [history, setHistory] = useState([]); // [{pumps, popped, earned}]
  const [balloonShake, setBalloonShake] = useState(false);
  const [particles, setParticles] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const pumpSoundRef = useRef(null);
  const attemptIdRef = useRef(null);
  const startTimeRef = useRef(null);

  // ─── Attempt start ───────────────────────────────────────────────────────
  useEffect(() => {
    createAttempt()
      .then((d) => {
        attemptIdRef.current = d.attemptId ?? d.id ?? null;
        startTimeRef.current = Date.now();
        setSessionId(attemptIdRef.current);
      })
      .catch(() => {
        attemptIdRef.current = null;
        startTimeRef.current = Date.now();
        setSessionId("offline-" + Date.now());
      });
  }, []);

  // ─── Balloon scale ───────────────────────────────────────────────────────
  const balloonScale = 1 + pumps * 0.022;
  const balloonColor = pumps < 20
    ? "#F5ECD7"
    : pumps < 40
    ? "#EDD9B5"
    : pumps < 60
    ? "#E5C992"
    : "#D4A853";

  // ─── Spawn burst particles ────────────────────────────────────────────────
  const spawnParticles = () => {
    const p = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: 50 + (Math.random() - 0.5) * 80,
      y: 40 + (Math.random() - 0.5) * 80,
      dx: (Math.random() - 0.5) * 200,
      dy: (Math.random() - 0.5) * 200,
      color: ["#FF6B6B", "#FFD93D", "#6BCB77", "#4D96FF", "#FF6BFF"][
        Math.floor(Math.random() * 5)
      ],
    }));
    setParticles(p);
    setTimeout(() => setParticles([]), 800);
  };

  // ─── Pump ────────────────────────────────────────────────────────────────
  const handlePump = useCallback(() => {
    if (gameState !== "playing" && gameState !== "idle") return;
    if (gameState === "idle") setGameState("playing");

    const newPumps = pumps + 1;
    const newEarnings = parseFloat((newPumps * REWARD_PER_PUMP).toFixed(2));

    // Micro-shake feedback
    setBalloonShake(true);
    setTimeout(() => setBalloonShake(false), 150);

    if (newPumps >= popThreshold) {
      // POPPED
      setPumps(newPumps);
      setRoundEarnings(0);
      setGameState("popped");
      spawnParticles();
      const entry = { round, pumps: newPumps, popped: true, earned: 0 };
      setHistory((h) => [...h, entry]);
      postRound(entry);
    } else {
      setPumps(newPumps);
      setRoundEarnings(newEarnings);
    }
  }, [gameState, pumps, round, popThreshold]);

  // ─── Cash out ─────────────────────────────────────────────────────────────
  const handleCashOut = useCallback(() => {
    if (gameState !== "playing") return;
    const earned = roundEarnings;
    setBankTotal((b) => parseFloat((b + earned).toFixed(2)));
    setGameState("cashed");
    const entry = { round, pumps, popped: false, earned };
    setHistory((h) => [...h, entry]);
    postRound(entry);
  }, [gameState, roundEarnings, round, pumps]);

  // ─── Next round ───────────────────────────────────────────────────────────
  const handleNext = useCallback(() => {
    if (round >= TOTAL_ROUNDS) {
      setGameState("finished");
      // Pass current history/bankTotal directly — state flush not guaranteed yet
      postFinish(history, bankTotal);
      return;
    }
    setRound((r) => r + 1);
    setPumps(0);
    setRoundEarnings(0);
    setPopThreshold(getPopThreshold());
    setGameState("idle");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, history, bankTotal]);

  // ─── API calls ────────────────────────────────────────────────────────────
  const postRound = (_entry) => {
    // Round data is collected locally; result is submitted once on game finish
  };

  const postFinish = (finalHistory, finalBankTotal) => {
    const hist = finalHistory ?? history;
    const bank = finalBankTotal ?? bankTotal;
    const nonPopped   = hist.filter((h) => !h.popped);
    const popCount    = hist.filter((h) => h.popped).length;
    const cashCount   = nonPopped.length;
    const avgPumps    = nonPopped.length > 0
      ? parseFloat((nonPopped.reduce((s, h) => s + h.pumps, 0) / nonPopped.length).toFixed(2))
      : 0;
    const durationMs  = startTimeRef.current ? Date.now() - startTimeRef.current : null;
    // score: bank total as % of theoretical max ($10.50)
    const score       = Math.min(100, Math.round((bank / MAX_POSSIBLE_BANK) * 100));
    // accuracy: cash-out rate (non-popped rounds / total rounds)
    const accuracy    = Math.round((cashCount / TOTAL_ROUNDS) * 100);

    saveResult({
      attemptId:     attemptIdRef.current,
      score,
      accuracy,
      reactionTimeMs: null,
      durationMs,
      rawData: {
        bankTotal:        parseFloat(bank.toFixed(2)),
        avgAdjustedPumps: avgPumps,
        popCount,
        cashOutCount:     cashCount,
        totalRounds:      TOTAL_ROUNDS,
      },
    }).catch(() => {});
  };

  // ─── Keyboard support ─────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        if (gameState === "idle" || gameState === "playing") handlePump();
      }
      if (e.code === "Enter") {
        if (gameState === "playing") handleCashOut();
        else if (gameState === "popped" || gameState === "cashed") handleNext();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [gameState, handlePump, handleCashOut, handleNext]);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={styles.root}>
      {/* Background grid */}
      <div style={styles.gridBg} />

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.logo}>BALLOON TASK</div>
        <div style={styles.stats}>
          <Stat label="ROUND" value={`${round} / ${TOTAL_ROUNDS}`} />
          <Stat label="BANKED" value={`$${bankTotal.toFixed(2)}`} accent />
          <Stat label="THIS BALLOON" value={`$${roundEarnings.toFixed(2)}`} />
        </div>
      </header>

      {/* Game Arena */}
      <main style={styles.arena}>
        {/* Particles */}
        {particles.map((p) => (
          <div
            key={p.id}
            style={{
              position: "absolute",
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: 10,
              height: 10,
              borderRadius: "50%",
              backgroundColor: p.color,
              animation: "burst 0.7s ease-out forwards",
              "--dx": `${p.dx}px`,
              "--dy": `${p.dy}px`,
              pointerEvents: "none",
            }}
          />
        ))}

        {/* Balloon or result */}
        {gameState === "popped" ? (
          <div style={styles.poppedMsg}>
            <span style={styles.poppedEmoji}>💥</span>
            <p style={styles.poppedText}>POPPED!</p>
            <p style={styles.poppedSub}>You earned $0.00 this round</p>
          </div>
        ) : gameState === "cashed" ? (
          <div style={styles.cashedMsg}>
            <span style={styles.cashedEmoji}>💰</span>
            <p style={styles.cashedText}>CASHED OUT!</p>
            <p style={styles.cashedSub}>+${roundEarnings.toFixed(2)} banked</p>
          </div>
        ) : gameState === "finished" ? (
          <FinishedScreen bankTotal={bankTotal} history={history} />
        ) : (
          <div style={styles.balloonWrap}>
            {/* String */}
            <div
              style={{
                ...styles.string,
                height: 60 + pumps * 1.5,
              }}
            />
            {/* Balloon */}
            <div
              onClick={handlePump}
              style={{
                ...styles.balloon,
                width: 120 * balloonScale,
                height: 150 * balloonScale,
                backgroundColor: balloonColor,
                transform: `translateX(-50%) ${balloonShake ? "scale(1.07)" : "scale(1)"}`,
                boxShadow: `0 0 ${20 + pumps * 0.5}px ${balloonColor}88`,
                cursor: "pointer",
              }}
            >
              <div style={styles.balloonShine} />
              <div style={styles.pumpCount}>{pumps > 0 ? `×${pumps}` : "TAP"}</div>
            </div>
            {/* Knot */}
            <div
              style={{
                ...styles.knot,
                borderTopColor: balloonColor,
                top: 150 * balloonScale + 48 - 10,
                left: `calc(50% - 8px)`,
              }}
            />
          </div>
        )}
      </main>

      {/* Controls */}
      {gameState !== "finished" && (
        <footer style={styles.footer}>
          {(gameState === "idle" || gameState === "playing") && (
            <>
              <button style={styles.btnPump} onClick={handlePump}>
                PUMP <kbd style={styles.kbd}>SPACE</kbd>
              </button>
              <button
                style={{
                  ...styles.btnCash,
                  opacity: gameState === "playing" ? 1 : 0.35,
                  cursor: gameState === "playing" ? "pointer" : "not-allowed",
                }}
                onClick={handleCashOut}
                disabled={gameState !== "playing"}
              >
                CASH OUT <kbd style={styles.kbd}>↵</kbd>
              </button>
            </>
          )}
          {(gameState === "popped" || gameState === "cashed") && (
            <button style={styles.btnNext} onClick={handleNext}>
              {round >= TOTAL_ROUNDS ? "SEE RESULTS" : "NEXT BALLOON"}{" "}
              <kbd style={styles.kbd}>↵</kbd>
            </button>
          )}
        </footer>
      )}

      {/* Round history dots */}
      <div style={styles.historyRow}>
        {Array.from({ length: TOTAL_ROUNDS }, (_, i) => {
          const h = history[i];
          return (
            <div
              key={i}
              title={h ? (h.popped ? `Round ${i + 1}: POPPED` : `Round ${i + 1}: $${h.earned}`) : ""}
              style={{
                ...styles.dot,
                backgroundColor: !h
                  ? "#2a2a3a"
                  : h.popped
                  ? "#EDD9B5"
                  : "#6BCB77",
                border: i + 1 === round ? "2px solid #FFD93D" : "2px solid transparent",
              }}
            />
          );
        })}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f5f0e8; }
        @keyframes burst {
          to {
            transform: translate(var(--dx), var(--dy)) scale(0);
            opacity: 0;
          }
        }
        @keyframes floatBalloon {
          0%, 100% { transform: translateX(-50%) translateY(0px); }
          50%       { transform: translateX(-50%) translateY(-10px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.8); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function Stat({ label, value, accent }) {
  return (
    <div style={styles.statBox}>
      <span style={styles.statLabel}>{label}</span>
      <span style={{ ...styles.statValue, color: accent ? "#FFD93D" : "#fff" }}>
        {value}
      </span>
    </div>
  );
}

function FinishedScreen({ bankTotal, history }) {
  const nonPopped = history.filter((h) => !h.popped);
  const avgPumps =
    nonPopped.length > 0
      ? (nonPopped.reduce((s, h) => s + h.pumps, 0) / nonPopped.length).toFixed(1)
      : 0;
  const popCount = history.filter((h) => h.popped).length;

  return (
    <div style={styles.finished}>
      <p style={styles.finishedTitle}>GAME COMPLETE</p>
      <p style={styles.finishedBank}>${bankTotal.toFixed(2)}</p>
      <p style={styles.finishedSub}>Total Banked</p>
      <div style={styles.metricsRow}>
        <MetricBox label="Adjusted Avg Pumps" value={avgPumps} />
        <MetricBox label="Balloons Popped" value={popCount} />
        <MetricBox label="Cash-outs" value={history.length - popCount} />
      </div>
    </div>
  );
}

function MetricBox({ label, value }) {
  return (
    <div style={styles.metricBox}>
      <span style={styles.metricValue}>{value}</span>
      <span style={styles.metricLabel}>{label}</span>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = {
  root: {
    fontFamily: "'DM Mono', monospace",
    background: "#426572",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    color: "#2a2a2a",
    position: "relative",
    overflow: "hidden",
    userSelect: "none",
  },
  gridBg: {
    position: "absolute",
    inset: 0,
    backgroundImage:
      "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
    backgroundSize: "40px 40px",
    pointerEvents: "none",
  },
  header: {
    width: "100%",
    maxWidth: 700,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "24px 32px 0",
    zIndex: 1,
  },
  logo: {
    fontFamily: "'Orbitron', sans-serif",
    fontSize: 18,
    fontWeight: 900,
    letterSpacing: 4,
    color: "#c4973a",
  },
  stats: { display: "flex", gap: 24 },
  statBox: { display: "flex", flexDirection: "column", alignItems: "flex-end" },
  statLabel: { fontSize: 9, letterSpacing: 2, color: "#999", marginBottom: 2 },
  statValue: { fontSize: 16, fontWeight: 500 },
  arena: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    position: "relative",
    minHeight: 380,
    zIndex: 1,
  },
  balloonWrap: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-end",
    height: 380,
  },
  balloon: {
    position: "absolute",
    top: 20,
    left: "50%",
    borderRadius: "50% 50% 50% 50% / 45% 45% 55% 55%",
    transition: "all 0.12s ease, box-shadow 0.12s",
    animation: "floatBalloon 3s ease-in-out infinite",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
  },
  balloonShine: {
    position: "absolute",
    top: "15%",
    left: "20%",
    width: "25%",
    height: "35%",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.25)",
    pointerEvents: "none",
  },
  pumpCount: {
    fontFamily: "'Orbitron', sans-serif",
    fontWeight: 900,
    fontSize: 18,
    color: "rgba(80,60,30,0.85)",
    textShadow: "0 1px 4px rgba(0,0,0,0.5)",
  },
  knot: {
    position: "absolute",
    width: 0,
    height: 0,
    borderLeft: "8px solid transparent",
    borderRight: "8px solid transparent",
    borderTop: "14px solid",
  },
  string: {
    position: "absolute",
    bottom: 0,
    left: "50%",
    width: 2,
    background: "linear-gradient(#00000022, #00000011)",
    transform: "translateX(-50%)",
    transition: "height 0.1s",
  },
  poppedMsg: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    animation: "fadeIn 0.3s ease",
  },
  poppedEmoji: { fontSize: 80, lineHeight: 1 },
  poppedText: {
    fontFamily: "'Orbitron', sans-serif",
    fontSize: 36,
    fontWeight: 900,
    color: "#FF4757",
    marginTop: 12,
    letterSpacing: 4,
  },
  poppedSub: { color: "#aaa", marginTop: 8, fontSize: 14 },
  cashedMsg: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    animation: "fadeIn 0.3s ease",
  },
  cashedEmoji: { fontSize: 80, lineHeight: 1 },
  cashedText: {
    fontFamily: "'Orbitron', sans-serif",
    fontSize: 36,
    fontWeight: 900,
    color: "#6BCB77",
    marginTop: 12,
    letterSpacing: 4,
  },
  cashedSub: { color: "#aaa", marginTop: 8, fontSize: 14 },
  footer: {
    display: "flex",
    gap: 16,
    paddingBottom: 24,
    zIndex: 1,
  },
  btnPump: {
    fontFamily: "'Orbitron', sans-serif",
    fontWeight: 700,
    fontSize: 14,
    letterSpacing: 2,
    padding: "14px 36px",
    background: "linear-gradient(135deg, #FF6B6B, #FF4757)",
    border: "none",
    borderRadius: 4,
    color: "#2a2a2a",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 10,
    boxShadow: "0 4px 20px #FF475755",
    transition: "transform 0.1s",
  },
  btnCash: {
    fontFamily: "'Orbitron', sans-serif",
    fontWeight: 700,
    fontSize: 14,
    letterSpacing: 2,
    padding: "14px 36px",
    background: "linear-gradient(135deg, #6BCB77, #44a851)",
    border: "none",
    borderRadius: 4,
    color: "#2a2a2a",
    display: "flex",
    alignItems: "center",
    gap: 10,
    boxShadow: "0 4px 20px #6BCB7755",
    transition: "opacity 0.2s",
  },
  btnNext: {
    fontFamily: "'Orbitron', sans-serif",
    fontWeight: 700,
    fontSize: 14,
    letterSpacing: 2,
    padding: "14px 48px",
    background: "linear-gradient(135deg, #4D96FF, #2a6fcc)",
    border: "none",
    borderRadius: 4,
    color: "#2a2a2a",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 10,
    boxShadow: "0 4px 20px #4D96FF55",
  },
  kbd: {
    background: "rgba(0,0,0,0.25)",
    borderRadius: 3,
    padding: "2px 6px",
    fontSize: 11,
    fontFamily: "'DM Mono', monospace",
  },
  historyRow: {
    display: "flex",
    gap: 6,
    paddingBottom: 28,
    zIndex: 1,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: "50%",
    transition: "background-color 0.3s",
  },
  finished: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    animation: "fadeIn 0.4s ease",
  },
  finishedTitle: {
    fontFamily: "'Orbitron', sans-serif",
    fontSize: 14,
    letterSpacing: 6,
    color: "#999",
    marginBottom: 12,
  },
  finishedBank: {
    fontFamily: "'Orbitron', sans-serif",
    fontSize: 64,
    fontWeight: 900,
    color: "#FFD93D",
    lineHeight: 1,
  },
  finishedSub: { color: "#aaa", fontSize: 12, marginTop: 8, letterSpacing: 2 },
  metricsRow: { display: "flex", gap: 32, marginTop: 40 },
  metricBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    background: "#ede8de",
    border: "1px solid #d8d0c0",
    borderRadius: 8,
    padding: "20px 28px",
  },
  metricValue: {
    fontFamily: "'Orbitron', sans-serif",
    fontSize: 32,
    fontWeight: 700,
    color: "#4D96FF",
  },
  metricLabel: { fontSize: 10, color: "#aaa", marginTop: 6, letterSpacing: 1.5 },
};