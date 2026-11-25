/// <reference types="node" />

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { issueFor } from '../src/lib/bulletin-logic.ts';
import { currentParty, nextParty, PARTIES } from '../src/lib/party-logic.ts';
import { currentHiddenSpot, HIDDEN_SPOTS, pickGumballSticker, sticker, STICKERS } from '../src/lib/sticker-logic.ts';
import { CATALOG } from '../src/constants/items.ts';

test('every hidden spot and party gift points at something real', () => {
  for (const spot of HIDDEN_SPOTS) assert.equal(sticker(spot.stickerId)?.source, 'hidden');
  for (const party of PARTIES) {
    const gift = CATALOG.find((item) => item.slug === party.gift);
    assert.ok(gift?.party, `${party.gift} should be a party item`);
  }
  assert.equal(new Set(STICKERS.map((s) => s.id)).size, STICKERS.length);
});

test('the hidden sticker moves every 14 days and cycles back around', () => {
  const first = currentHiddenSpot(new Date(2026, 10, 16));
  assert.equal(first.spot, HIDDEN_SPOTS[0]);
  assert.equal(first.daysLeft, 14);
  assert.equal(currentHiddenSpot(new Date(2026, 10, 29)).daysLeft, 1);
  assert.equal(currentHiddenSpot(new Date(2026, 10, 30)).spot, HIDDEN_SPOTS[1]);
  const later = new Date(2026, 10, 16 + 14 * HIDDEN_SPOTS.length);
  assert.equal(currentHiddenSpot(later).spot, HIDDEN_SPOTS[0]);
});

test('gumball stickers never repeat', () => {
  const gumball = STICKERS.filter((s) => s.source === 'gumball').map((s) => s.id);
  assert.equal(pickGumballSticker(gumball, 0.5), null);
  assert.equal(pickGumballSticker(gumball.slice(1), 0.99), gumball[0]);
});

test('parties run on their dates and the next one is found across the new year', () => {
  assert.equal(currentParty(new Date(2026, 10, 25))?.id, 'aurora-glow');
  assert.equal(currentParty(new Date(2026, 10, 10)), null);
  const next = nextParty(new Date(2026, 11, 31));
  assert.equal(next.party.id, 'new-year-glow');
  assert.equal(next.starts.getFullYear(), 2027);
});

test('parties never overlap within a month', () => {
  const months = PARTIES.map((p) => p.month);
  assert.equal(new Set(months).size, months.length);
});

test('the bulletin has a new issue every Monday', () => {
  const a = issueFor(new Date(2026, 10, 25));
  assert.equal(a.number, 2);
  assert.equal(a.stories[0].kicker, 'Party news');
  assert.equal(issueFor(new Date(2026, 10, 30)).number, 3);
  assert.equal(issueFor(new Date(2026, 11, 1)).stories[0].kicker, 'Coming up');
});
