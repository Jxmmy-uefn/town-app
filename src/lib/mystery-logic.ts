// Town Mysteries: a small story quest each month. Follow clues by talking to
// residents around town, then make your guess. Wrong guesses cost nothing.
// No imports from the app, so the tests can load this file directly.

export type MysteryStep = { place: 'arcade' | 'shop' | 'town-hall' | 'park' | 'snack-shack'; residentId: string; clue: string };

export type Mystery = {
  id: string;
  title: string;
  intro: string;
  steps: MysteryStep[];
  question: string;
  options: string[];
  answer: number;
  ending: string;
  /** The sticker you get for solving it. */
  stickerId: string;
};

export const MYSTERIES: Mystery[] = [
  {
    id: 'lava-lamps',
    title: 'The Case of the Missing Lava Lamps',
    intro: 'Every lava lamp vanished from the Shop window overnight. Start by asking Gloria at the Shop.',
    steps: [
      { place: 'shop', residentId: 'gloria', clue: 'They were here at closing time! This morning I found a trail of glitter heading toward the Park.' },
      { place: 'park', residentId: 'skye', clue: 'Last night the pond was glowing every color. Someone was setting up lights and humming the party song.' },
      { place: 'town-hall', residentId: 'mayor', clue: 'The party song? Well, I was up late planning Aurora Glow Night. Why do you ask? Ahem.' },
    ],
    question: 'Who borrowed the lava lamps?',
    options: ['Blip, for a gaming setup', 'Mayor Marbles, for party lights', 'Chef Tater, to keep snacks warm'],
    answer: 1,
    ending: 'Mayor Marbles blushes. "I wanted the party to glow! I’ll bring them back right after." Case closed!',
    stickerId: 'case-lava-lamps',
  },
  {
    id: 'phantom-score',
    title: 'The Phantom High Score',
    intro: 'Someone beat Blip’s Catch! record and signed it "ZZZ". Ask Blip at the Arcade.',
    steps: [
      { place: 'arcade', residentId: 'blip', clue: 'ZZZ! Who even plays that late? The score went up right after midnight.' },
      { place: 'snack-shack', residentId: 'tater', clue: 'Skye came by at midnight for a Toaster Tart. Yawned the whole time. Said it was “for the big game”.' },
      { place: 'shop', residentId: 'gloria', clue: 'Skye bought Fuzzy Slippers yesterday. Something about a sleepover at the Arcade.' },
    ],
    question: 'Who set the "ZZZ" high score?',
    options: ['Mayor Marbles, during a late meeting', 'Gloria, between outfits', 'Skye, at a sleepover'],
    answer: 2,
    ending: 'Skye laughs. "ZZZ is my sleepover name! Rematch, Blip?" Case closed!',
    stickerId: 'case-phantom-score',
  },
  {
    id: 'jokes-page',
    title: 'The Missing Jokes Page',
    intro: 'This week’s Bubble Bulletin can’t go out: the jokes page is gone! Ask Mayor Marbles at Town Hall.',
    steps: [
      { place: 'town-hall', residentId: 'mayor', clue: 'I left the jokes page by the printer. Then I went for a snack. Then it was gone!' },
      { place: 'arcade', residentId: 'blip', clue: 'I heard a whole crowd laughing over at the Snack Shack. Like, really laughing.' },
      { place: 'snack-shack', residentId: 'tater', clue: 'My customers keep giggling at their napkins today. I just used the paper by the Town Hall printer...' },
    ],
    question: 'Where did the jokes page go?',
    options: ['Blown into the Park pond', 'Printed onto Snack Shack napkins', 'Hidden in the Shop window'],
    answer: 1,
    ending: 'Chef Tater hands over a stack of very funny napkins. The Bulletin goes out on time. Case closed!',
    stickerId: 'case-jokes-page',
  },
  {
    id: 'star-cards',
    title: 'The Mystery Friendship Cards',
    intro: 'Someone left a friendship card on every bench in the Park, signed with a little star. Ask Skye at the Park.',
    steps: [
      { place: 'park', residentId: 'skye', clue: 'Every bench! Each card says “You make this town sweeter” with a star sticker on it.' },
      { place: 'shop', residentId: 'gloria', clue: 'Chef Tater bought every star sticker I had. Said it was for “a sweet surprise”.' },
      { place: 'arcade', residentId: 'blip', clue: 'Tater gave every player a star-shaped cookie today and winked. Suspicious. Delicious, but suspicious.' },
    ],
    question: 'Who left the friendship cards?',
    options: ['Chef Tater', 'Blip', 'Mayor Marbles'],
    answer: 0,
    ending: 'Chef Tater grins. "Everyone deserves a sweet note sometimes." Case closed!',
    stickerId: 'case-star-cards',
  },
];

const FIRST_YEAR = 2026;
const FIRST_MONTH = 10; // November, counting from 0

/** This month's mystery. They take turns, so each one comes back later. */
export function currentMystery(now: Date = new Date()): Mystery {
  const months = (now.getFullYear() - FIRST_YEAR) * 12 + now.getMonth() - FIRST_MONTH;
  const n = MYSTERIES.length;
  return MYSTERIES[((months % n) + n) % n];
}

export type CaseProgress = { found: number; solved: boolean };

export const NEW_CASE: CaseProgress = { found: 0, solved: false };

/** The clue waiting at this place, if it's the next one in the case. */
export function clueAt(mystery: Mystery, progress: CaseProgress, place: string): MysteryStep | null {
  if (progress.solved) return null;
  const step = mystery.steps[progress.found];
  return step && step.place === place ? step : null;
}

export function readyToSolve(mystery: Mystery, progress: CaseProgress): boolean {
  return !progress.solved && progress.found >= mystery.steps.length;
}
