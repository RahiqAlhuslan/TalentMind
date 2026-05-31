/**
 * trialEngine.js — Flanker Test Trial Engine
 * 
 * Handles:
 * - Trial sequence generation (Fisher-Yates shuffle)
 * - Timing state machine (fixation → stimulus → response → ITI)
 * - performance.now() timestamps
 */

const CONDITIONS = ['Congruent', 'Incongruent', 'Neutral'];
const DIRECTIONS = ['Left', 'Right'];

// Timing parameters (ms)
export const TIMING = {
    FIXATION: 500,
    STIMULUS: 200,
    RESPONSE_WINDOW: 1500,
    ITI_MIN: 300,
    ITI_MAX: 700,
    ANTICIPATORY_THRESHOLD: 150
};

/**
 * Fisher-Yates shuffle (in-place)
 */
function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

/**
 * Random integer between min and max (inclusive)
 */
function randRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate a single trial config
 */
function makeTrial(condition, trialNumber, isPractice = false) {
    const targetDir = DIRECTIONS[Math.floor(Math.random() * 2)];

    let flankerDir;
    if (condition === 'Congruent') {
        flankerDir = targetDir;
    } else if (condition === 'Incongruent') {
        flankerDir = targetDir === 'Left' ? 'Right' : 'Left';
    } else {
        flankerDir = 'Neutral';
    }

    return {
        trialNumber,
        condition,
        targetDirection: targetDir,
        flankerDirection: flankerDir,
        isPractice,
        iti: randRange(TIMING.ITI_MIN, TIMING.ITI_MAX)
    };
}

/**
 * Get the stimulus display characters for a trial
 * Returns array of 5 strings (flanker, flanker, TARGET, flanker, flanker)
 */
export function getStimulusChars(trial) {
    const target = trial.targetDirection === 'Left' ? '←' : '→';
    let flanker;

    if (trial.condition === 'Neutral') {
        flanker = '—';
    } else {
        flanker = trial.flankerDirection === 'Left' ? '←' : '→';
    }

    return [flanker, flanker, target, flanker, flanker];
}

/**
 * Generate practice trials (5 mixed conditions)
 */
export function generatePracticeTrials() {
    const trials = [];
    // 2 congruent, 2 incongruent, 1 neutral for practice
    const conditions = ['Congruent', 'Congruent', 'Incongruent', 'Incongruent', 'Neutral'];
    shuffle(conditions);
    conditions.forEach((cond, i) => {
        trials.push(makeTrial(cond, i + 1, true));
    });
    return trials;
}

/**
 * Generate the main test trials (60 total: 20 per condition)
 */
export function generateMainTrials() {
    const conditions = [];
    CONDITIONS.forEach(cond => {
        for (let i = 0; i < 20; i++) conditions.push(cond);
    });
    shuffle(conditions);

    return conditions.map((cond, i) => makeTrial(cond, i + 1, false));
}

/**
 * Check if a response is correct
 */
export function checkResponse(trial, responseDirection) {
    return trial.targetDirection === responseDirection;
}

/**
 * Build a trial result record for API submission
 */
export function buildTrialRecord(trial, sessionId, stimulusOnsetMs, responseMs, responseDirection) {
    const reactionTimeMs = responseMs !== null ? Math.round(responseMs - stimulusOnsetMs) : null;
    const isTimeout = responseMs === null;
    const isAnticipatory = reactionTimeMs !== null && reactionTimeMs < TIMING.ANTICIPATORY_THRESHOLD;
    const isCorrect = isTimeout ? null : (isAnticipatory ? null : checkResponse(trial, responseDirection));

    return {
        sessionId,
        trialNumber: trial.trialNumber,
        condition: trial.condition,
        targetDirection: trial.targetDirection,
        flankerDirection: trial.flankerDirection,
        stimulusOnsetMs,
        responseMs,
        reactionTimeMs,
        isCorrect,
        isTimeout,
        isPractice: trial.isPractice
    };
}

/**
 * Detect device type from user agent
 */
export function detectDeviceType() {
    const ua = navigator.userAgent.toLowerCase();
    if (/tablet|ipad/i.test(ua)) return 'Tablet';
    if (/mobile|iphone|android/i.test(ua)) return 'Mobile';
    return 'Desktop';
}
