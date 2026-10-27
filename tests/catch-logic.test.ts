/// <reference types="node" />

import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  BASKET_TOP,
  createCatchState,
  nextPhase,
  PHASES,
  PROMOTE_WINDOW,
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

test('the first treat drops as soon as the game starts', () => {
  const next = stepCatch(createCatchState(), 1 / 60, 0.5, () => 0.5);
  assert.equal(next.fallers.length, 1);
  assert.ok(next.fallers[0].y > 0 && next.fallers[0].y < 0.1);
});

test('doing well moves up a phase', () => {
  const good = Array(PROMOTE_WINDOW).fill(true);
  assert.deepEqual(nextPhase(0, good), { phase: 1, recent: [] });
  // One slip in ten is still doing well.
  assert.equal(nextPhase(0, [false, ...good.slice(1)]).phase, 1);
  // Two slips in ten is not.
  assert.equal(nextPhase(0, [false, true, true, true, true, true, true, true, true, false]).phase, 0);
});

test('a phase needs a full window of results before moving up', () => {
  assert.equal(nextPhase(0, Array(PROMOTE_WINDOW - 1).fill(true)).phase, 0);
});

test('two quick mistakes drop back a phase, but never below the first', () => {
  assert.deepEqual(nextPhase(2, [true, false, true, false]), { phase: 1, recent: [] });
  assert.equal(nextPhase(0, [false, false]).phase, 0);
});

test('the last phase is the hardest and stays put', () => {
  const last = PHASES.length - 1;
  assert.equal(nextPhase(last, Array(PROMOTE_WINDOW).fill(true)).phase, last);
  for (let i = 1; i < PHASES.length; i++) {
    assert.ok(PHASES[i].speed > PHASES[i - 1].speed);
    assert.ok(PHASES[i].interval < PHASES[i - 1].interval);
  }
});

test('treats are worth more in later phases', () => {
  const next = stepCatch({ ...withFaller({}), phase: 2 }, 0.05, 0.5, never);
  assert.equal(next.score, 30);
});

test('a run of catches during play raises the phase', () => {
  let state: CatchState = { ...createCatchState(), untilSpawn: 100 };
  for (let i = 0; i < PROMOTE_WINDOW; i++) {
    state = stepCatch(
      { ...state, fallers: [{ id: i, kind: 'treat', emoji: '🍎', x: 0.5, y: BASKET_TOP - 0.01, speed: 0.5 }] },
      0.05,
      0.5,
      never,
    );
  }
  assert.equal(state.phase, 1);
});

test('new things drop on a timer', () => {
  let state = createCatchState();
  for (let i = 0; i < 60; i++) state = stepCatch(state, 1 / 30, 0.5, () => 0.5);
  assert.ok(state.nextId > 1);
});
