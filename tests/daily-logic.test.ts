/// <reference types="node" />

import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  CHORE_POOL,
  choreDone,
  choresFor,
  currentFood,
  dayKey,
  feed,
  freshChores,
  GUMBALL_ODDS,
  moodFor,
  recordChoreEvent,
  rollGumball,
} from '../src/lib/daily-logic.ts';

const HOUR = 3_600_000;

test('uses the local calendar day', () => {
  assert.equal(dayKey(new Date(2026, 0, 5, 23, 59)), '2026-01-05');
});

test('food drops 4 an hour and never goes below zero', () => {
  const food = { value: 80, at: 0 };
  assert.equal(currentFood(food, 5 * HOUR), 60);
  assert.equal(currentFood(food, 100 * HOUR), 0);
});

test('feeding adds on top of the current level, up to 100', () => {
  assert.deepEqual(feed({ value: 80, at: 0 }, 45, 5 * HOUR), { value: 100, at: 5 * HOUR });
  assert.deepEqual(feed({ value: 0, at: 0 }, 25, 0), { value: 25, at: 0 });
});

test('mood follows the Food bar', () => {
  assert.equal(moodFor(90), 'full');
  assert.equal(moodFor(50), 'okay');
  assert.equal(moodFor(5), 'hungry');
});

test('picks three different chores, the same for everyone each day', () => {
  for (const day of ['2026-11-25', '2026-11-26', '2027-02-01']) {
    const picks = choresFor(day);
    assert.equal(picks.length, 3);
    assert.equal(new Set(picks.map((c) => c.id)).size, 3);
    assert.deepEqual(choresFor(day), picks);
  }
});

test('chores count matching events up to their target', () => {
  const pool = CHORE_POOL.find((c) => c.id === 'play-three')!;
  let chores = [{ id: pool.id, progress: 0, claimed: false }];
  chores = recordChoreEvent(chores, 'play');
  chores = recordChoreEvent(chores, 'visit:park');
  assert.equal(chores[0].progress, 1);
  for (let i = 0; i < 5; i++) chores = recordChoreEvent(chores, 'play');
  assert.equal(chores[0].progress, 3);
  assert.ok(choreDone(chores[0]));
  assert.equal(freshChores('2026-11-25').every((c) => c.progress === 0 && !c.claimed), true);
});

test('gumball odds add up to 100 and every roll gives a prize', () => {
  assert.equal(GUMBALL_ODDS.reduce((sum, row) => sum + row.chance, 0), 100);
  assert.deepEqual(rollGumball(0, true), { coins: 10, sticker: false });
  assert.deepEqual(rollGumball(0.5, true), { coins: 20, sticker: false });
  assert.deepEqual(rollGumball(0.72, true), { coins: 40, sticker: false });
  assert.deepEqual(rollGumball(0.99, true), { coins: 0, sticker: true });
  assert.deepEqual(rollGumball(1, true), { coins: 0, sticker: true });
});

test('the sticker slot pays coins once you own every gumball sticker', () => {
  assert.deepEqual(rollGumball(0.99, false), { coins: 20, sticker: false });
});
