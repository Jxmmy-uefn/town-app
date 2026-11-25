// The Bubble Bulletin: a short town newspaper with a new issue every Monday.
// It is put together from the party calendar, the hidden sticker and a few
// rotating lists, so it stays fresh without anyone writing it by hand.

import { currentParty, nextParty, partyDates } from './party-logic.ts';
import { currentHiddenSpot } from './sticker-logic.ts';

export type Story = { kicker: string; title: string; body: string };
export type Issue = { number: number; weekOf: Date; stories: Story[] };

/** Monday of the first issue. */
const FIRST_MONDAY = new Date(2026, 10, 16);

export const TIPS = [
  'Every 10 points in the Arcade earns a coin. Golden treats in Catch! are worth extra.',
  'Your buddy gets hungry over about a day. A Mini Pizza Bagel fills the bar the most.',
  'Rotate furniture in your room by tapping it. Corners look great with a lamp.',
  'Chores change every day. You do not have to finish them all, and nothing is lost if you skip.',
  'In Fruit Match, try to line up matches near the bottom. New fruit falling in can chain into combos.',
  'The Snack Shack is always hiring. A shift pays steady coins.',
];

export const JOKES = [
  { q: 'Why did the computer go to the doctor?', a: 'It had a virus. Too many pop-ups.' },
  { q: 'What do you call a dial-up modem that tells jokes?', a: 'A real screecher.' },
  { q: 'Why was the CD so calm?', a: 'It never skipped a beat. Well, almost never.' },
  { q: 'Why did the buddy bring a ladder to the Arcade?', a: 'To reach the high score.' },
  { q: 'What is a slushie’s favorite type of music?', a: 'Brrr-and new pop.' },
  { q: 'Why did the lava lamp get an award?', a: 'It was outstanding in its… glow.' },
  { q: 'How does a flip phone say goodbye?', a: 'It just closes the conversation.' },
];

function wholeDaysSince(start: Date, now: Date) {
  const a = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const b = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.floor((b - a) / 86_400_000);
}

function shortDate(date: Date) {
  return date.toLocaleString('en-US', { month: 'long', day: 'numeric' });
}

export function issueFor(now: Date = new Date()): Issue {
  const week = Math.max(0, Math.floor(wholeDaysSince(FIRST_MONDAY, now) / 7));
  const weekOf = new Date(FIRST_MONDAY.getFullYear(), FIRST_MONDAY.getMonth(), FIRST_MONDAY.getDate() + week * 7);
  const stories: Story[] = [];

  const party = currentParty(now);
  if (party) {
    stories.push({
      kicker: 'Party news',
      title: `${party.name} is on now!`,
      body: `${party.blurb} It runs ${partyDates(party)}. Stop by the party to pick up a free gift.`,
    });
  } else {
    const next = nextParty(now);
    stories.push({
      kicker: 'Coming up',
      title: `${next.party.name} starts ${shortDate(next.starts)}`,
      body: `${next.party.blurb} Everyone who visits gets a free gift.`,
    });
  }

  const { spot, daysLeft } = currentHiddenSpot(now);
  stories.push({
    kicker: 'Sticker hunt',
    title: 'Clue of the fortnight',
    body: `${spot.hint} It moves to a new hiding spot in ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}.`,
  });

  const joke = JOKES[week % JOKES.length];
  stories.push({ kicker: 'Joke of the week', title: joke.q, body: joke.a });

  stories.push({ kicker: 'Town tip', title: 'Did you know?', body: TIPS[week % TIPS.length] });

  return { number: week + 1, weekOf, stories };
}
