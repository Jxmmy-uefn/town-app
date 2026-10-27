/// <reference types="node" />

import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  BASKET_TOP,
  COMBO_STEP,
  comboBonus,
  createCatchState,
  GLITCH_PHASE,
  GLITCH_SECONDS,
  MAX_LIVES,
  WIRE_GLYPHS,
  POWER_SECONDS,
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
  const after = stepCatch(over, 1, 0.5, never);
  assert.equal(after.score, over.score);
  assert.deepEqual(after.fallers, over.fallers);
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

test('mistakes never drop you back a phase', () => {
  assert.equal(nextPhase(2, [true, false, true, false]).phase, 2);
  assert.equal(nextPhase(3, Array(PROMOTE_WINDOW).fill(false)).phase, 3);
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

function catchOne(state: CatchState, faller: Partial<Faller> = {}): CatchState {
  return stepCatch(
    {
      ...state,
      untilSpawn: 100,
      fallers: [{ id: 99, kind: 'treat', emoji: '🍎', x: 0.5, y: BASKET_TOP - 0.01, speed: 0.5, ...faller }],
    },
    0.05,
    0.5,
    never,
  );
}

test('every 5 catches in a row pays a combo bonus', () => {
  assert.equal(comboBonus(COMBO_STEP - 1), 0);
  assert.equal(comboBonus(COMBO_STEP), 25);
  assert.equal(comboBonus(COMBO_STEP * 2), 50);

  let state = createCatchState();
  for (let i = 0; i < COMBO_STEP; i++) state = catchOne(state);
  assert.equal(state.streak, COMBO_STEP);
  assert.equal(state.score, 10 * COMBO_STEP + 25);
  assert.ok(state.events.some((e) => e.type === 'combo' && e.streak === COMBO_STEP));
});

test('a mistake ends the combo', () => {
  let state = catchOne(catchOne(createCatchState()));
  state = catchOne(state, { kind: 'rock', emoji: '🪨' });
  assert.equal(state.streak, 0);
});

test('a golden treat is worth 100', () => {
  const state = catchOne(createCatchState(), { kind: 'golden', emoji: '🌟' });
  assert.equal(state.score, 100);
});

test('a shield blocks one rock', () => {
  let state = catchOne(createCatchState(), { kind: 'power', power: 'shield', emoji: '🛡️' });
  assert.equal(state.shield, true);
  state = catchOne(state, { kind: 'rock', emoji: '🪨' });
  assert.equal(state.lives, STARTING_LIVES);
  assert.equal(state.shield, false);
  state = catchOne(state, { kind: 'rock', emoji: '🪨' });
  assert.equal(state.lives, STARTING_LIVES - 1);
});

test('an extra life adds a heart, up to the maximum', () => {
  let state = catchOne(createCatchState(), { kind: 'power', power: 'life', emoji: '❤️' });
  assert.equal(state.lives, STARTING_LIVES + 1);
  for (let i = 0; i < 5; i++) state = catchOne(state, { kind: 'power', power: 'life', emoji: '❤️' });
  assert.equal(state.lives, MAX_LIVES);
});

test('slow-mo halves the fall speed for a few seconds', () => {
  const slowed = catchOne(createCatchState(), { kind: 'power', power: 'slow', emoji: '🐢' });
  assert.ok(slowed.slow > POWER_SECONDS - 0.1);
  const faller: Faller = { id: 1, kind: 'treat', emoji: '🍎', x: 0.1, y: 0.2, speed: 0.4 };
  const normal = stepCatch({ ...createCatchState(), untilSpawn: 100, fallers: [faller] }, 0.1, 0.9, never);
  const slow = stepCatch({ ...slowed, untilSpawn: 100, fallers: [faller] }, 0.1, 0.9, never);
  assert.ok(Math.abs(normal.fallers[0].y - 0.24) < 1e-9);
  assert.ok(Math.abs(slow.fallers[0].y - 0.22) < 1e-9);
});

test('the magnet pulls treats toward the basket but not rocks', () => {
  const magnet = { ...createCatchState(), magnet: 3, untilSpawn: 100 };
  const next = stepCatch(
    {
      ...magnet,
      fallers: [
        { id: 1, kind: 'treat', emoji: '🍎', x: 0.1, y: 0.2, speed: 0.4 },
        { id: 2, kind: 'rock', emoji: '🪨', x: 0.1, y: 0.2, speed: 0.4 },
      ],
    },
    0.1,
    0.9,
    never,
  );
  assert.ok(next.fallers[0].x > 0.1);
  assert.equal(next.fallers[1].x, 0.1);
});

test('missing a power-up is not a mistake', () => {
  const next = stepCatch(
    { ...createCatchState(), untilSpawn: 100, fallers: [{ id: 1, kind: 'power', power: 'magnet', emoji: '🧲', x: 0.1, y: 0.99, speed: 0.5 }] },
    0.1,
    0.9,
    never,
  );
  assert.equal(next.lives, STARTING_LIVES);
});

test('each phase has its own look and treats', () => {
  for (const phase of PHASES) {
    assert.ok(phase.name && phase.sky && phase.treats.length > 0);
  }
  const state = catchOne({ ...createCatchState(), recent: Array(PROMOTE_WINDOW - 1).fill(true) });
  assert.ok(state.events.some((e) => e.type === 'phase' && e.phase === 1));
});

test('8 colorful themes, then the same 8 in wireframe', () => {
  assert.equal(PHASES.length, 16);
  assert.deepEqual(
    PHASES.slice(4, 8).map((p) => p.name),
    ['Snow festival', 'Spring garden', 'Summer beach', 'Autumn harvest'],
  );
  for (let i = 0; i < GLITCH_PHASE; i++) {
    assert.equal(PHASES[i].wire, undefined);
    assert.equal(PHASES[GLITCH_PHASE + i].name, `WIRE // ${PHASES[i].name}`);
    assert.ok(PHASES[GLITCH_PHASE + i].wire);
  }
});

test('reaching wireframe glitches: the screen clears and drops pause', () => {
  const before: CatchState = {
    ...createCatchState(),
    phase: GLITCH_PHASE - 1,
    recent: Array(PROMOTE_WINDOW - 1).fill(true),
  };
  const after = catchOne({
    ...before,
    fallers: [],
  });
  assert.equal(after.phase, GLITCH_PHASE);
  assert.ok(after.events.some((e) => e.type === 'glitch'));
  assert.equal(after.fallers.length, 0);
  assert.ok(after.untilSpawn > GLITCH_SECONDS - 0.1);
});

test('wireframe phases drop outline symbols instead of emoji', () => {
  const outlines = new Set<string>([...PHASES.slice(GLITCH_PHASE).flatMap((p) => p.treats), ...Object.values(WIRE_GLYPHS)]);
  let state: CatchState = { ...createCatchState(), phase: GLITCH_PHASE + 3 };
  let rolls = 0;
  for (let i = 0; i < 400; i++) {
    state = stepCatch({ ...state, untilSpawn: 0 }, 0.001, 0.5, () => ((rolls = (rolls * 37 + 11) % 100) / 100));
  }
  assert.ok(state.fallers.length > 0);
  for (const faller of state.fallers) assert.ok(outlines.has(faller.emoji), faller.emoji);
});
