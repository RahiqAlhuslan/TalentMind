import express from 'express';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';
const PORT = process.env.PORT || 3000;

const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Game Hub Backend API is running' });
});

// DB test
app.get('/api/dbtest', async (req, res) => {
  try {
    const count = await prisma.user.count();
    res.json({ ok: true, userCount: count });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message, code: err.code });
  }
});

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'username and password are required' });
    }

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username, password: hashed },
      select: { id: true, username: true }
    });

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({ token, user: { id: user.id, username: user.username } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'username and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: { id: user.id, username: user.username }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/users
app.get('/api/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, username: true, createdAt: true }
    });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/games — create or update a game
app.post('/api/games', async (req, res) => {
  try {
    const { gameId, name, owner, url, category } = req.body;
    if (!gameId || !name) {
      return res.status(400).json({ error: 'gameId and name are required' });
    }

    const game = await prisma.assessmentGame.upsert({
      where: { gameId },
      update: { name, owner: owner ?? null, url: url ?? null, category: category ?? null },
      create: { gameId, name, owner: owner ?? null, url: url ?? null, category: category ?? null }
    });

    res.status(201).json(game);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/games
app.get('/api/games', async (req, res) => {
  try {
    const games = await prisma.assessmentGame.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' }
    });
    res.json(games);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/attempts — start a new assessment attempt
app.post('/api/attempts', async (req, res) => {
  try {
    const { userId, gameId } = req.body;
    if (!gameId) {
      return res.status(400).json({ error: 'gameId is required' });
    }

    const attempt = await prisma.assessmentAttempt.create({
      data: {
        userId: userId ? parseInt(userId) : null,
        gameId,
        status: 'started'
      }
    });

    res.status(201).json({
      attemptId: attempt.id,
      userId: attempt.userId,
      gameId: attempt.gameId,
      startedAt: attempt.startedAt
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/results — save final game result
app.post('/api/results', async (req, res) => {
  try {
    const { userId, attemptId, gameId, score, accuracy, reactionTimeMs, durationMs, rawData } = req.body;
    if (!gameId) {
      return res.status(400).json({ error: 'gameId is required' });
    }

    const result = await prisma.gameResult.create({
      data: {
        userId: userId ? parseInt(userId) : null,
        attemptId: attemptId || null,
        gameId,
        score: score != null ? parseFloat(score) : null,
        accuracy: accuracy != null ? parseFloat(accuracy) : null,
        reactionTimeMs: reactionTimeMs != null ? parseFloat(reactionTimeMs) : null,
        durationMs: durationMs != null ? parseInt(durationMs) : null,
        rawData: rawData ?? null
      },
      select: {
        id: true,
        userId: true,
        attemptId: true,
        gameId: true,
        score: true,
        accuracy: true,
        reactionTimeMs: true,
        durationMs: true,
        createdAt: true
      }
    });

    if (attemptId) {
      await prisma.assessmentAttempt.updateMany({
        where: { id: attemptId },
        data: { status: 'completed', completedAt: new Date() }
      });
    }

    res.status(201).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/results — all results
app.get('/api/results', async (req, res) => {
  try {
    const results = await prisma.gameResult.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        score: true,
        accuracy: true,
        reactionTimeMs: true,
        durationMs: true,
        rawData: true,
        createdAt: true,
        attemptId: true,
        gameId: true,
        userId: true,
        user: { select: { id: true, username: true } },
        game: { select: { gameId: true, name: true } }
      }
    });
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/results/user/:userId
app.get('/api/results/user/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const results = await prisma.gameResult.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        score: true,
        accuracy: true,
        reactionTimeMs: true,
        durationMs: true,
        rawData: true,
        createdAt: true,
        attemptId: true,
        gameId: true,
        userId: true,
        user: { select: { id: true, username: true } },
        game: { select: { gameId: true, name: true } }
      }
    });
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/results/game/:gameId
app.get('/api/results/game/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    const results = await prisma.gameResult.findMany({
      where: { gameId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        score: true,
        accuracy: true,
        reactionTimeMs: true,
        durationMs: true,
        rawData: true,
        createdAt: true,
        attemptId: true,
        gameId: true,
        userId: true,
        user: { select: { id: true, username: true } },
        game: { select: { gameId: true, name: true } }
      }
    });
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/hr/dashboard — all users with their results (for HR dashboard)
app.get('/api/hr/dashboard', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        createdAt: true,
        results: {
          orderBy: { createdAt: 'asc' }, // oldest first so dedup keeps the first play
          where: { gameId: { not: 'spatial-memory-game' } },
          select: {
            id: true,
            gameId: true,
            score: true,
            accuracy: true,
            reactionTimeMs: true,
            durationMs: true,
            rawData: true,
            createdAt: true,
            game: { select: { name: true } }
          }
        }
      }
    });

    // Keep only the first result per game per user — subsequent plays are excluded
    const deduped = users.map(u => ({
      ...u,
      results: firstPerGame(u.results),
    }));

    res.json(deduped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================================
// ANALYTICS ENGINE — Competency scoring, insights, role match
// ============================================================

/** Convert reaction time (ms) to 0-100 score (lower RT = higher score) */
function normalizeRT(rtMs, bestMs, worstMs) {
  if (!rtMs || rtMs <= 0) return null;
  if (rtMs <= bestMs) return 100;
  if (rtMs >= worstMs) return 0;
  return Math.round(((worstMs - rtMs) / (worstMs - bestMs)) * 100);
}

/** Extract raw competency signals from a single game result */
function extractGameSignals(result) {
  const acc = result.accuracy ?? result.score ?? 0;
  const rt  = result.reactionTimeMs;
  const raw = result.rawData || {};
  const out = {};

  switch (result.gameId) {
    case 'tower-of-hanoi': {
      const moveEff = raw.actualMoveCount && raw.optimalMoveCount
        ? Math.min(100, (raw.optimalMoveCount / raw.actualMoveCount) * 100) : acc;
      const errPen = Math.max(0, 100 - (raw.illegalAttempts || 0) * 5);
      const undoPen = Math.max(0, 100 - (raw.undoCount || 0) * 3);
      out.problemSolving   = moveEff * 0.6 + errPen * 0.4;
      out.decisionMaking   = moveEff * 0.5 + undoPen * 0.5;
      out.cognitiveFlexibility = errPen * 0.6 + acc * 0.4;
      break;
    }
    case 'eriksen-flanker-test': {
      const rtScore = normalizeRT(rt, 250, 1000) ?? acc * 0.8;
      out.attention        = acc;
      out.reactionSpeed    = rtScore;
      out.impulseControl   = acc * 0.7 + rtScore * 0.3;
      break;
    }
    case 'simon-says-game': {
      const seqScore = raw.sequenceLength
        ? Math.min(100, (raw.sequenceLength / 8) * 100) : acc;
      out.workingMemory    = acc * 0.5 + seqScore * 0.5;
      out.patternRecognition = acc;
      break;
    }
    case 'digit-symbol-game': {
      out.processingSpeed  = acc;
      out.cognitiveFlexibility = acc * 0.8;
      break;
    }
    case 'colour-stroop-task': {
      const rtScore = normalizeRT(rt, 300, 1400) ?? acc * 0.8;
      out.cognitiveFlexibility = acc * 0.55 + rtScore * 0.45;
      out.impulseControl   = acc;
      out.reactionSpeed    = rtScore;
      break;
    }
    case 'emotion-recognition': {
      const rtScore = normalizeRT(rt, 400, 2500) ?? acc * 0.5;
      out.emotionalIntelligence = acc * 0.75 + rtScore * 0.25;
      out.reactionSpeed    = rtScore;
      break;
    }
    case 'n-back-task': {
      const rtScore = normalizeRT(rt, 300, 1500) ?? 50;
      out.workingMemory    = acc * 0.75 + rtScore * 0.25;
      out.attention        = acc * 0.6 + rtScore * 0.4;
      break;
    }
    case 'go-no-go-game': {
      out.impulseControl   = acc;
      out.attention        = acc * 0.8;
      break;
    }
    case 'target-tracking-game': {
      out.attention        = acc;
      out.processingSpeed  = acc * 0.7;
      break;
    }
    case 'typing-pressure-test': {
      out.stressResistance = acc;
      out.cognitiveEndurance = acc;
      out.processingSpeed  = acc * 0.5;
      break;
    }
    case 'balloon-task': {
      out.decisionMaking   = acc;
      out.impulseControl   = Math.min(100, acc * 1.1);
      out.stressResistance = acc * 0.8;
      break;
    }
    case 'numbers-memory-game': {
      out.workingMemory    = acc * 0.75;
      out.attention        = acc * 0.4;
      break;
    }
  }
  // clamp all signals to 0-100
  for (const k of Object.keys(out)) out[k] = Math.min(100, Math.max(0, Math.round(out[k])));
  return out;
}

/** Aggregate per-game signals into 8 top-level competencies */
const COMPETENCY_SOURCES = {
  attention:              ['attention'],
  workingMemory:          ['workingMemory', 'patternRecognition'],
  processingSpeed:        ['processingSpeed', 'reactionSpeed'],
  decisionMaking:         ['decisionMaking', 'problemSolving'],
  emotionalIntelligence:  ['emotionalIntelligence'],
  impulseControl:         ['impulseControl'],
  stressResistance:       ['stressResistance', 'cognitiveEndurance'],
  cognitiveFlexibility:   ['cognitiveFlexibility'],
};

/** Keep only the first (earliest) result per gameId */
function firstPerGame(results) {
  const seen = {};
  // results must arrive sorted oldest-first
  for (const r of results) {
    if (!seen[r.gameId]) seen[r.gameId] = r;
  }
  return Object.values(seen);
}

function computeCompetencies(results) {
  // Collect all signals using only the first play per game
  const allSignals = {};
  for (const r of firstPerGame(results)) {
    const signals = extractGameSignals(r);
    for (const [k, v] of Object.entries(signals)) {
      if (!allSignals[k]) allSignals[k] = [];
      allSignals[k].push(v);
    }
  }

  // Aggregate into competencies
  const competencies = {};
  for (const [comp, sources] of Object.entries(COMPETENCY_SOURCES)) {
    const vals = sources.flatMap(s => allSignals[s] || []);
    if (vals.length > 0) {
      competencies[comp] = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
    }
  }
  return competencies;
}

/** Generate behavioral insight strings from competency scores */
function generateInsights(comp) {
  const insights = [];
  const add = (type, text) => insights.push({ type, text });

  if (comp.attention >= 80) add('strength', 'Demonstrates strong sustained focus and high distraction resistance under pressure.');
  else if (comp.attention != null && comp.attention < 45) add('concern', 'Shows difficulty maintaining consistent attention, especially in complex or distracting environments.');
  else if (comp.attention != null) add('neutral', 'Maintains adequate attention levels with occasional lapses under cognitive load.');

  if (comp.workingMemory >= 80) add('strength', 'Exhibits excellent working memory capacity and strong pattern recall ability.');
  else if (comp.workingMemory != null && comp.workingMemory < 45) add('concern', 'Memory retention and sequential recall may be a limiting factor in demanding roles.');
  else if (comp.workingMemory != null) add('neutral', 'Demonstrates functional working memory with typical performance on recall tasks.');

  if (comp.processingSpeed >= 80) add('strength', 'Processes information rapidly and responds with high cognitive efficiency.');
  else if (comp.processingSpeed != null && comp.processingSpeed < 45) add('concern', 'Slower processing speed observed; may struggle in fast-paced, time-sensitive environments.');
  else if (comp.processingSpeed != null) add('neutral', 'Processing speed falls within the average range for the candidate pool.');

  if (comp.decisionMaking >= 80) add('strength', 'Makes strategic, well-planned decisions with minimal errors — strong analytical thinker.');
  else if (comp.decisionMaking != null && comp.decisionMaking < 45) add('concern', 'Decisions tend to be suboptimal or impulsive; may benefit from structured decision-support frameworks.');
  else if (comp.decisionMaking != null) add('neutral', 'Decision-making is reasonably sound but shows room for improvement in complex scenarios.');

  if (comp.emotionalIntelligence >= 80) add('strength', 'Accurately reads emotional cues — a key strength for roles requiring interpersonal sensitivity.');
  else if (comp.emotionalIntelligence != null && comp.emotionalIntelligence < 45) add('concern', 'Limited emotional cue recognition may affect performance in team-based or client-facing roles.');
  else if (comp.emotionalIntelligence != null) add('neutral', 'Shows moderate emotional perception; performs adequately in standard social interaction contexts.');

  if (comp.impulseControl >= 80) add('strength', 'Exhibits strong behavioral inhibition — avoids premature responses even under time pressure.');
  else if (comp.impulseControl != null && comp.impulseControl < 45) add('concern', 'Tendency toward impulsive responses detected; higher error rates under pressure suggest limited inhibitory control.');
  else if (comp.impulseControl != null) add('neutral', 'Impulse control is functional, with occasional reactive responses in high-speed tasks.');

  if (comp.stressResistance >= 80) add('strength', 'Maintains high performance consistency under pressure — well-suited for high-stakes environments.');
  else if (comp.stressResistance != null && comp.stressResistance < 45) add('concern', 'Performance degrades noticeably under pressure; stress management may require targeted development.');
  else if (comp.stressResistance != null) add('neutral', 'Handles pressure adequately with some performance variability in demanding conditions.');

  if (comp.cognitiveFlexibility >= 80) add('strength', 'Adapts quickly to changing rules and resolves mental conflicts with ease — highly flexible thinker.');
  else if (comp.cognitiveFlexibility != null && comp.cognitiveFlexibility < 45) add('concern', 'Struggles to switch between conflicting cognitive tasks; may have difficulty adapting to changing work demands.');
  else if (comp.cognitiveFlexibility != null) add('neutral', 'Cognitive flexibility is adequate; handles most task-switching with moderate efficiency.');

  return insights;
}

/** Compute role compatibility scores */
const ROLE_PROFILES = {
  'Software Engineer':    { attention: 0.25, workingMemory: 0.30, decisionMaking: 0.20, processingSpeed: 0.15, cognitiveFlexibility: 0.10 },
  'Customer Support':     { emotionalIntelligence: 0.35, stressResistance: 0.30, attention: 0.20, impulseControl: 0.15 },
  'Data Analyst':         { processingSpeed: 0.30, cognitiveFlexibility: 0.25, decisionMaking: 0.25, attention: 0.20 },
  'Team Manager':         { decisionMaking: 0.30, stressResistance: 0.25, emotionalIntelligence: 0.25, attention: 0.20 },
  'Sales Representative': { emotionalIntelligence: 0.35, stressResistance: 0.30, impulseControl: 0.20, decisionMaking: 0.15 },
  'Creative / UX':        { cognitiveFlexibility: 0.35, emotionalIntelligence: 0.30, workingMemory: 0.20, processingSpeed: 0.15 },
};

function computeRoleScores(comp) {
  const roles = {};
  for (const [role, weights] of Object.entries(ROLE_PROFILES)) {
    let score = 0, totalW = 0;
    for (const [key, w] of Object.entries(weights)) {
      if (comp[key] != null) { score += comp[key] * w; totalW += w; }
    }
    roles[role] = totalW > 0 ? Math.round(score / totalW) : null;
  }
  return roles;
}

/** Calculate percentile rank of a value within an array */
function percentileRank(arr, value) {
  if (!arr.length || value == null) return null;
  const below = arr.filter(v => v < value).length;
  return Math.round((below / arr.length) * 100);
}

// GET /api/hr/analytics/:userId — Full analytics for one candidate
app.get('/api/hr/analytics/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    // Get this user's results — oldest first, exclude spatial-memory-game
    const userResults = await prisma.gameResult.findMany({
      where: { userId, gameId: { not: 'spatial-memory-game' } },
      orderBy: { createdAt: 'asc' },
      select: { gameId: true, score: true, accuracy: true, reactionTimeMs: true, durationMs: true, rawData: true, createdAt: true }
    });

    // Only first play per game counts
    const firstResults = firstPerGame(userResults);

    if (!firstResults.length) {
      return res.json({ competencies: {}, insights: [], roleScores: {}, percentiles: {}, gamesPlayed: 0 });
    }

    const competencies = computeCompetencies(firstResults);
    const insights     = generateInsights(competencies);
    const roleScores   = computeRoleScores(competencies);

    // Benchmark: get all users' first-play results for percentile calc
    const allResults = await prisma.gameResult.findMany({
      where: { userId: { not: null }, gameId: { not: 'spatial-memory-game' } },
      orderBy: { createdAt: 'asc' },
      select: { userId: true, gameId: true, accuracy: true, score: true, reactionTimeMs: true, rawData: true, createdAt: true }
    });

    // Group by user, keep only first play per game per user
    const byUser = {};
    for (const r of allResults) {
      if (!byUser[r.userId]) byUser[r.userId] = [];
      byUser[r.userId].push(r);
    }

    // Compute competencies for all users using first-play-only
    const allCompetencies = Object.values(byUser).map(rs => computeCompetencies(firstPerGame(rs)));

    // Percentile for each competency
    const percentiles = {};
    for (const key of Object.keys(COMPETENCY_SOURCES)) {
      const pool = allCompetencies.map(c => c[key]).filter(v => v != null);
      percentiles[key] = percentileRank(pool, competencies[key]);
    }

    res.json({ competencies, insights, roleScores, percentiles, gamesPlayed: firstResults.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const GAMES = [
  { gameId: 'tower-of-hanoi',      name: 'Tower of Hanoi',          category: 'cognitive' },
  { gameId: 'balloon-task',         name: 'Balloon Task',             category: 'risk' },
  { gameId: 'n-back-task',          name: 'N-Back Task',              category: 'memory' },
  { gameId: 'emotion-recognition',  name: 'Emotion Recognition',      category: 'emotional' },
  { gameId: 'digit-symbol-game',    name: 'Digit Symbol Task',        category: 'cognitive' },
  { gameId: 'colour-stroop-task',   name: 'Colour Stroop Task',       category: 'cognitive' },
  { gameId: 'eriksen-flanker-test', name: 'Eriksen Flanker Test',     category: 'attention' },
  { gameId: 'simon-says-game',      name: 'Simon Says Task',          category: 'memory' },
  { gameId: 'numbers-memory-game',  name: 'Numbers Memory Task',      category: 'memory' },
  { gameId: 'target-tracking-game', name: 'Target Tracking Task',     category: 'attention' },
  { gameId: 'typing-pressure-test', name: 'Typing Pressure Test',     category: 'motor' },
  { gameId: 'go-no-go-game',        name: 'Go / No-Go Task',          category: 'inhibition' },
];

async function seedGames() {
  for (const g of GAMES) {
    await prisma.assessmentGame.upsert({
      where: { gameId: g.gameId },
      update: { name: g.name, category: g.category, isActive: true },
      create: { ...g, isActive: true },
    });
  }
  // Deactivate removed games
  await prisma.assessmentGame.updateMany({
    where: { gameId: { in: ['spatial-memory-game'] } },
    data: { isActive: false },
  });
  console.log('Games seeded');
}

// Seed endpoint — call once to register all games in the database
app.get('/api/seed', async (req, res) => {
  try {
    await seedGames();
    const games = await prisma.assessmentGame.findMany({ select: { gameId: true, name: true } });
    res.json({ ok: true, seeded: games.length, games });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.listen(PORT, async () => {
  console.log(`Game Hub Backend running on http://localhost:${PORT}`);
  await seedGames().catch(console.error);
});
