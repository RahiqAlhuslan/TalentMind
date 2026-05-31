/**
 * Tower of Hanoi Game Engine
 * Manages peg state, legal move validation, optimal move detection, and undo stack.
 */

export function createGameEngine(numDiscs) {
    // Initial state: all discs on peg A, largest (numDiscs) at bottom
    const pegs = {
        A: Array.from({ length: numDiscs }, (_, i) => numDiscs - i), // [5,4,3,2,1] for 5 discs
        B: [],
        C: []
    };

    const moveHistory = [];
    const undoStack = [];
    let moveCount = 0;
    let lastMoveTime = performance.now();

    // Pre-compute optimal moves using the recursive algorithm
    const optimalMoves = [];
    computeOptimalMoves(numDiscs, 'A', 'C', 'B', optimalMoves);

    function computeOptimalMoves(n, from, to, aux, moves) {
        if (n === 0) return;
        computeOptimalMoves(n - 1, from, aux, to, moves);
        moves.push({ disc: n, from, to });
        computeOptimalMoves(n - 1, aux, to, from, moves);
    }

    function getState() {
        return {
            pegs: {
                A: [...pegs.A],
                B: [...pegs.B],
                C: [...pegs.C]
            },
            moveCount,
            isComplete: pegs.C.length === numDiscs,
            optimalMoveCount: Math.pow(2, numDiscs) - 1
        };
    }

    function getTopDisc(pegName) {
        const peg = pegs[pegName];
        return peg.length > 0 ? peg[peg.length - 1] : null;
    }

    function isLegalMove(fromPeg, toPeg) {
        const disc = getTopDisc(fromPeg);
        if (disc === null) return false;
        const topOfTarget = getTopDisc(toPeg);
        return topOfTarget === null || disc < topOfTarget;
    }

    function isOptimalMove(fromPeg, toPeg, disc) {
        // Check if this move matches the next expected optimal move
        // We track how far through the optimal sequence we are
        const legalMovesSoFar = moveHistory.filter(m => m.isLegal && !m.isUndo).length;
        if (legalMovesSoFar < optimalMoves.length) {
            const expected = optimalMoves[legalMovesSoFar];
            return expected.disc === disc && expected.from === fromPeg && expected.to === toPeg;
        }
        return false;
    }

    function makeMove(fromPeg, toPeg) {
        const now = performance.now();
        const timeSinceLastMove = now - lastMoveTime;
        const disc = getTopDisc(fromPeg);

        if (disc === null) {
            return { success: false, reason: 'No disc on source peg' };
        }

        const legal = isLegalMove(fromPeg, toPeg);
        const optimal = legal ? isOptimalMove(fromPeg, toPeg, disc) : false;

        const moveData = {
            fromPeg,
            toPeg,
            discSize: disc,
            isLegalMove: legal,
            isOptimalMove: optimal,
            timeSinceLastMoveMs: timeSinceLastMove,
            boardStateSnapshot: JSON.stringify(getState().pegs),
            isUndo: false
        };

        if (legal) {
            pegs[fromPeg].pop();
            pegs[toPeg].push(disc);
            moveCount++;
            undoStack.push({ fromPeg: toPeg, toPeg: fromPeg, disc });
            lastMoveTime = now;
        }

        moveHistory.push({ ...moveData, isLegal: legal });

        return {
            success: legal,
            reason: legal ? null : 'Cannot place larger disc on smaller disc',
            moveData,
            state: getState()
        };
    }

    function undo() {
        if (undoStack.length === 0) return null;

        const now = performance.now();
        const timeSinceLastMove = now - lastMoveTime;
        const lastMove = undoStack.pop();

        // Reverse the last move
        const disc = pegs[lastMove.fromPeg].pop();
        pegs[lastMove.toPeg].push(disc);
        moveCount--;
        lastMoveTime = now;

        const undoData = {
            fromPeg: lastMove.fromPeg,
            toPeg: lastMove.toPeg,
            discSize: disc,
            isLegalMove: true,
            isOptimalMove: false,
            timeSinceLastMoveMs: timeSinceLastMove,
            boardStateSnapshot: JSON.stringify(getState().pegs),
            isUndo: true
        };

        moveHistory.push({ ...undoData, isUndo: true });
        return { undoData, state: getState() };
    }

    function reset() {
        pegs.A = Array.from({ length: numDiscs }, (_, i) => numDiscs - i);
        pegs.B = [];
        pegs.C = [];
        moveHistory.length = 0;
        undoStack.length = 0;
        moveCount = 0;
        lastMoveTime = performance.now();
    }

    function getTimeSinceLastMove() {
        return performance.now() - lastMoveTime;
    }

    return {
        getState,
        getTopDisc,
        isLegalMove,
        makeMove,
        undo,
        reset,
        getTimeSinceLastMove,
        getMoveHistory: () => [...moveHistory]
    };
}
