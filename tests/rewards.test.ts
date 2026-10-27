/// <reference types="node" />

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { payoutFor } from '../src/lib/rewards.ts';

test('pays a coin per 10 points, up to 50 a game', () => {
  assert.equal(payoutFor(0, 0), 0);
  assert.equal(payoutFor(129, 0), 12);
  assert.equal(payoutFor(9999, 0), 50);
});

test('stops at 500 coins a day', () => {
  assert.equal(payoutFor(9999, 480), 20);
  assert.equal(payoutFor(9999, 500), 0);
});
