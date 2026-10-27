// Pure rules for the match-3 game. A board is rows of tile kinds (0 to KINDS - 1).

export type Board = number[][];
export type Cell = { row: number; col: number };

export const SIZE = 7;
export const KINDS = 5;
export const MOVES = 20;
export const POINTS_PER_TILE = 10;
const MAX_CASCADES = 50;
export const TILE_EMOJI = ['🍎', '🍋', '🍇', '🫐', '🍊'];

const EMPTY = -1;

function randomKind(rng: () => number) {
  return Math.floor(rng() * KINDS);
}

function copy(board: Board): Board {
  return board.map((row) => [...row]);
}

/** Every cell that is part of a horizontal or vertical run of 3 or more. */
export function findMatches(board: Board): Cell[] {
  const matched = new Set<string>();
  const size = board.length;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const kind = board[r][c];
      if (kind === EMPTY) continue;
      if (c + 2 < size && board[r][c + 1] === kind && board[r][c + 2] === kind) {
        for (let k = c; k < size && board[r][k] === kind; k++) matched.add(`${r},${k}`);
      }
      if (r + 2 < size && board[r + 1][c] === kind && board[r + 2][c] === kind) {
        for (let k = r; k < size && board[k][c] === kind; k++) matched.add(`${k},${c}`);
      }
    }
  }

  return [...matched].map((key) => {
    const [row, col] = key.split(',').map(Number);
    return { row, col };
  });
}

export function areAdjacent(a: Cell, b: Cell) {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1;
}

export function swap(board: Board, a: Cell, b: Cell): Board {
  const next = copy(board);
  next[a.row][a.col] = board[b.row][b.col];
  next[b.row][b.col] = board[a.row][a.col];
  return next;
}

export function hasMove(board: Board): boolean {
  const size = board.length;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (c + 1 < size && findMatches(swap(board, { row: r, col: c }, { row: r, col: c + 1 })).length) return true;
      if (r + 1 < size && findMatches(swap(board, { row: r, col: c }, { row: r + 1, col: c })).length) return true;
    }
  }
  return false;
}

/** A fresh board with no ready-made matches and at least one possible move. */
export function createBoard(rng = Math.random, size = SIZE): Board {
  for (;;) {
    const board: Board = [];
    for (let r = 0; r < size; r++) {
      board.push([]);
      for (let c = 0; c < size; c++) {
        let kind: number;
        do {
          kind = randomKind(rng);
        } while (
          (c >= 2 && board[r][c - 1] === kind && board[r][c - 2] === kind) ||
          (r >= 2 && board[r - 1][c] === kind && board[r - 2][c] === kind)
        );
        board[r].push(kind);
      }
    }
    if (hasMove(board)) return board;
  }
}

/** Drops tiles into the gaps below them and fills the top with new ones. */
function collapse(board: Board, rng: () => number): Board {
  const size = board.length;
  const next = copy(board);
  for (let c = 0; c < size; c++) {
    const column = [];
    for (let r = size - 1; r >= 0; r--) if (next[r][c] !== EMPTY) column.push(next[r][c]);
    for (let r = size - 1, i = 0; r >= 0; r--, i++) next[r][c] = i < column.length ? column[i] : randomKind(rng);
  }
  return next;
}

/**
 * Clears matches until the board settles. Each cascade after the first scores more:
 * tiles x 10 x cascade number.
 */
export function resolve(board: Board, rng = Math.random): { board: Board; points: number; cascades: number } {
  let current = board;
  let points = 0;
  let cascades = 0;

  for (;;) {
    const matches = findMatches(current);
    if (matches.length === 0 || cascades === MAX_CASCADES) break;
    cascades += 1;
    points += matches.length * POINTS_PER_TILE * cascades;
    const cleared = copy(current);
    for (const { row, col } of matches) cleared[row][col] = EMPTY;
    current = collapse(cleared, rng);
  }

  return { board: current, points, cascades };
}

/**
 * Swaps two tiles if that makes a match. Returns null for a move that isn't allowed.
 * A board left with no possible moves is reshuffled.
 */
export function playMove(board: Board, a: Cell, b: Cell, rng = Math.random) {
  if (!areAdjacent(a, b)) return null;
  const swapped = swap(board, a, b);
  if (findMatches(swapped).length === 0) return null;
  const result = resolve(swapped, rng);
  return hasMove(result.board) ? result : { ...result, board: createBoard(rng, board.length) };
}
