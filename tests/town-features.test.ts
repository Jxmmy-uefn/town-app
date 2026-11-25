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

test('the Shop collection changes each month and comes back around', async () => {
  const { COLLECTIONS, currentCollection, daysLeftInCollection, isForSale, CATALOG: items } = await import(
    '../src/constants/items.ts'
  );
  assert.equal(currentCollection(new Date(2026, 10, 25)), 0);
  assert.equal(currentCollection(new Date(2026, 11, 1)), 1);
  assert.equal(currentCollection(new Date(2027, 2, 1)), 0);
  assert.equal(currentCollection(new Date(2026, 9, 1)), COLLECTIONS.length - 1);
  assert.equal(daysLeftInCollection(new Date(2026, 10, 25)), 6);
  const lamp = items.find((i) => i.slug === 'lava-lamp')!;
  assert.equal(isForSale(lamp, new Date(2026, 10, 25)), true);
  assert.equal(isForSale(lamp, new Date(2026, 11, 25)), false);
  for (let c = 0; c < COLLECTIONS.length; c++) assert.ok(items.some((i) => i.collection === c));
});

test('every resident has a home, a favorite snack and a friend sticker', async () => {
  const { RESIDENTS, dailyLine, dailyRequest, friendStickerId } = await import('../src/lib/resident-logic.ts');
  const { MENU } = await import('../src/games/snack-job-logic.ts');
  const places = new Set<string>();
  for (const r of RESIDENTS) {
    assert.ok(!places.has(r.place), `${r.place} has two residents`);
    places.add(r.place);
    assert.ok(MENU.includes(r.favorite));
    assert.equal(sticker(friendStickerId(r.id))?.source, 'friend');
    assert.equal(dailyLine(r, '2026-11-25'), dailyLine(r, '2026-11-25'));
    assert.ok(MENU.includes(dailyRequest(r, '2026-11-25', MENU)));
  }
});

test('Bloops learn tricks by playing on different days', async () => {
  const { newBloop, playWith, knownTricks, nextTrick } = await import('../src/lib/pet-logic.ts');
  let b = newBloop('Pip', 'aqua');
  assert.deepEqual(knownTricks(b).map((t) => t.id), ['hop']);
  b = playWith(b, '2026-11-25');
  b = playWith(b, '2026-11-25');
  assert.equal(b.playDays, 1);
  b = playWith(b, '2026-11-26');
  assert.deepEqual(knownTricks(b).map((t) => t.id), ['hop', 'wiggle']);
  assert.equal(nextTrick(b)?.id, 'spin');
});

test('each Town Mystery is solvable with real residents and stickers', async () => {
  const { MYSTERIES, currentMystery, clueAt, readyToSolve, NEW_CASE } = await import('../src/lib/mystery-logic.ts');
  const { resident } = await import('../src/lib/resident-logic.ts');
  for (const m of MYSTERIES) {
    assert.equal(sticker(m.stickerId)?.source, 'mystery');
    assert.ok(m.answer >= 0 && m.answer < m.options.length);
    for (const step of m.steps) assert.equal(resident(step.residentId)?.place, step.place);
  }
  const m = currentMystery(new Date(2026, 10, 25));
  assert.equal(m.id, 'lava-lamps');
  assert.equal(currentMystery(new Date(2027, 2, 1)).id, 'lava-lamps');
  assert.equal(clueAt(m, NEW_CASE, 'shop'), m.steps[0]);
  assert.equal(clueAt(m, NEW_CASE, 'park'), null);
  assert.equal(readyToSolve(m, { found: 3, solved: false }), true);
});
