/// <reference types="node" />

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { MENU, orderSize, SHIFT_SECONDS, startShift, tapSnack, tick } from '../src/games/snack-job-logic.ts';

const always = (n: number) => () => n;

test('orders grow from 2 to 4 snacks', () => {
  assert.equal(orderSize(0), 2);
  assert.equal(orderSize(3), 3);
  assert.equal(orderSize(50), 4);
});

test('filling an order in any order serves it and scores', () => {
  const random = always(0);
  let shift = startShift(random);
  assert.deepEqual(shift.order, [MENU[0], MENU[0]]);
  let result = tapSnack(shift, MENU[1], random);
  assert.equal(result.outcome, 'wrong');
  assert.equal(result.shift.mistakes, 1);
  shift = result.shift;
  result = tapSnack(shift, MENU[0], random);
  assert.equal(result.outcome, 'right');
  result = tapSnack(result.shift, MENU[0], random);
  assert.equal(result.outcome, 'served');
  assert.equal(result.shift.score, 20);
  assert.equal(result.shift.served, 1);
});

test('serving in a row with no mistakes adds a streak bonus', () => {
  const random = always(0);
  let shift = startShift(random);
  for (let i = 0; i < 4; i++) shift = tapSnack(shift, MENU[0], random).shift;
  // Two orders of 2: 20 + (20 + 5 bonus).
  assert.equal(shift.score, 45);
  assert.equal(shift.streak, 2);
});

test('the shift ends when time runs out', () => {
  let shift = startShift(always(0));
  for (let i = 0; i < SHIFT_SECONDS + 5; i++) shift = tick(shift);
  assert.equal(shift.secondsLeft, 0);
  assert.equal(tapSnack(shift, MENU[0], always(0)).outcome, 'over');
});
