/// <reference types="node" />

import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  createBoard,
  findMatches,
  hasMove,
  playMove,
  resolve,
  SIZE,
  type Board,
} from '../src/games/match3-logic.ts';

function seeded(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

function cycle(values: number[]) {
  let i = 0;
  // Turns kinds into rng values that pick them back out.
  return () => (values[i++ % values.length] + 0.5) / 5;
}

test('a new board has no matches and at least one move', () => {
  for (let seed = 1; seed <= 25; seed++) {
    const board = createBoard(seeded(seed));
    assert.equal(board.length, SIZE);
    assert.equal(findMatches(board).length, 0);
    assert.ok(hasMove(board));
  }
});

test('finds horizontal and vertical runs', () => {
  const board: Board = [
    [0, 0, 0, 1],
    [2, 3, 4, 1],
    [3, 4, 2, 1],
    [4, 2, 3, 0],
  ];
  const keys = findMatches(board).map((c) => `${c.row},${c.col}`).sort();
  assert.deepEqual(keys, ['0,0', '0,1', '0,2', '0,3', '1,3', '2,3'].sort());
});

test('a swap that makes no match is refused', () => {
  const board: Board = [
    [0, 1, 2],
    [3, 4, 0],
    [1, 2, 3],
  ];
  assert.equal(playMove(board, { row: 0, col: 0 }, { row: 0, col: 1 }), null);
});

test('tiles that are not next to each other cannot swap', () => {
  const board = createBoard(seeded(3));
  assert.equal(playMove(board, { row: 0, col: 0 }, { row: 2, col: 2 }), null);
});

test('a matching swap scores and leaves a settled board', () => {
  const board: Board = [
    [0, 1, 0, 2],
    [3, 0, 4, 1],
    [2, 3, 1, 4],
    [4, 2, 3, 1],
  ];
  const result = playMove(board, { row: 0, col: 1 }, { row: 1, col: 1 }, seeded(7));
  assert.ok(result);
  assert.ok(result.points >= 30);
  assert.equal(findMatches(result.board).length, 0);
  assert.ok(result.board.flat().every((kind) => kind >= 0));
});

test('cascades score more per tile', () => {
  const { points, cascades } = resolve(
    [
      [0, 0, 0],
      [1, 2, 3],
      [2, 3, 1],
    ],
    cycle([0, 0, 0, 1, 2, 3, 4]),
  );
  // The first refill drops in another row of three.
  assert.ok(cascades >= 2);
  assert.ok(points > 30);
});
