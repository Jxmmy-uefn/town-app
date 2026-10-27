/// <reference types="node" />

import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  BASKET_TOP,
  createCatchState,
  STARTING_LIVES,
  stepCatch,
  type CatchState,
  type Faller,
} from '../src/games/catch-logic.ts';

const never = () => 0.99;

function withFaller(faller: Partial<Faller>): CatchState {
  return {
    ...createCatchState(),
    untilSpawn: 100,
    fallers: [{ id: 1, kind: 'treat', emoji: '🍎', x: 0.5, y: BASKET_TOP - 0.01, speed: 0.5, ...faller }],
  };
}

test('catching a treat scores 10 points', () => {
  const next = stepCatch(withFaller({}), 0.05, 0.5, never);
  assert.equal(next.score, 10);
  assert.equal(next.fallers.length, 0);
  assert.equal(next.lives, STARTING_LIVES);
});

test('a star is worth 50', () => {
  assert.equal(stepCatch(withFaller({ kind: 'star' }), 0.05, 0.5, never).score, 50);
});

test('catching a rock costs a life', () => {
  const next = stepCatch(withFaller({ kind: 'rock' }), 0.05, 0.5, never);
  assert.equal(next.score, 0);
  assert.equal(next.lives, STARTING_LIVES - 1);
});

test('dropping a treat costs a life, dodging a rock does not', () => {
  assert.equal(stepCatch(withFaller({ y: 0.99 }), 0.1, 0.1, never).lives, STARTING_LIVES - 1);
  assert.equal(stepCatch(withFaller({ y: 0.99, kind: 'rock' }), 0.1, 0.1, never).lives, STARTING_LIVES);
});

test('a treat outside the basket keeps falling', () => {
  const next = stepCatch(withFaller({}), 0.05, 0.1, never);
  assert.equal(next.fallers.length, 1);
  assert.equal(next.score, 0);
});

test('the game ends at zero lives and then stops changing', () => {
  const last = { ...withFaller({ kind: 'rock' }), lives: 1 };
  const over = stepCatch(last, 0.05, 0.5, never);
  assert.equal(over.over, true);
  assert.equal(stepCatch(over, 1, 0.5, never), over);
});

test('new things drop on a timer', () => {
  let state = createCatchState();
  for (let i = 0; i < 60; i++) state = stepCatch(state, 1 / 30, 0.5, () => 0.5);
  assert.ok(state.nextId > 1);
});
