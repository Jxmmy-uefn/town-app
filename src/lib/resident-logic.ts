// Town residents: buddies who live in town, each with a personality, a home
// spot and a favorite snack. Once a day each one asks for a snack. Bring it and
// your friendship grows; at full friendship they give you their own sticker.
// No imports from the app, so the tests can load this file directly.

import { hashText } from './daily-logic.ts';

export type Resident = {
  id: string;
  name: string;
  /** Body color for the placeholder buddy. */
  color: string;
  face: string;
  place: 'arcade' | 'shop' | 'town-hall' | 'park' | 'snack-shack';
  about: string;
  favorite: string;
  lines: string[];
  thanks: string;
};

export const HEARTS_FOR_STICKER = 5;

export const RESIDENTS: Resident[] = [
  {
    id: 'blip',
    name: 'Blip',
    color: '#3DB2FF',
    face: '😎',
    place: 'arcade',
    about: 'Holds the town record in Catch! and never lets anyone forget it.',
    favorite: 'blue-slushie',
    lines: [
      'Did you see my high score? It’s still up there. Just checking.',
      'Pro tip: golden treats are worth chasing. Trust me.',
      'I’ve been practicing my combos all morning.',
      'Bet you can’t beat my Fruit Match score. Okay, maybe you can.',
    ],
    thanks: 'A slushie! That’s my power-up. Thanks, buddy!',
  },
  {
    id: 'gloria',
    name: 'Gloria Glitter',
    color: '#FF7EC8',
    face: '😊',
    place: 'shop',
    about: 'Knows every outfit in the Shop and has opinions about all of them.',
    favorite: 'fruit-pouch',
    lines: [
      'That look is so you. Have you seen this month’s collection?',
      'Butterfly clips are timeless. I will not be taking questions.',
      'Matching your shirt to your shoes? Bold. I love it.',
      'I rearranged the whole Shop window today. Again.',
    ],
    thanks: 'Fruit snacks! You totally get me.',
  },
  {
    id: 'mayor',
    name: 'Mayor Marbles',
    color: '#8C7AE6',
    face: '🙂',
    place: 'town-hall',
    about: 'Runs the town, writes most of the Bubble Bulletin, loves a good pun.',
    favorite: 'toaster-tart',
    lines: [
      'Welcome, welcome! Have you read this week’s Bulletin?',
      'Remember the town rules: be kind, keep it fun.',
      'I’m working on next month’s party. It’s going to be big.',
      'Why did the mayor bring a ladder? To reach new heights in leadership!',
    ],
    thanks: 'A frosted toaster tart! Official town business can wait.',
  },
  {
    id: 'skye',
    name: 'Skye',
    color: '#5DD39E',
    face: '😄',
    place: 'park',
    about: 'Skates, draws, and always knows where the hidden sticker is. Almost always.',
    favorite: 'gummy-worms',
    lines: [
      'Nice day for a skate, right?',
      'I think I saw something shiny somewhere in town...',
      'I’m drawing the clouds today. That one looks like a flip phone.',
      'Have you tried the job at the Snack Shack? It’s kind of fun.',
    ],
    thanks: 'Sour gummy worms! You’re the best.',
  },
  {
    id: 'tater',
    name: 'Chef Tater',
    color: '#F2B84B',
    face: '😋',
    place: 'snack-shack',
    about: 'Runs the Snack Shack and taste-tests every single snack. For quality.',
    favorite: 'pizza-bagel',
    lines: [
      'Order up! Oh wait, you’re not a customer. Hi!',
      'The secret ingredient is always extra cheese.',
      'Hungry buddies are sleepy buddies. Eat up!',
      'We’re hiring if you want to earn a few coins.',
    ],
    thanks: 'Pizza bagels! Even a chef needs a snack break.',
  },
];

export function resident(id: string): Resident | undefined {
  return RESIDENTS.find((r) => r.id === id);
}

export function residentAt(place: string): Resident | undefined {
  return RESIDENTS.find((r) => r.place === place);
}

/** What they say today. Changes every day. */
export function dailyLine(r: Resident, day: string): string {
  return r.lines[hashText(`${r.id}:${day}`) % r.lines.length];
}

/** The snack they'd like today: usually their favorite, sometimes something else. */
export function dailyRequest(r: Resident, day: string, menu: string[]): string {
  const h = hashText(`${r.id}:wish:${day}`);
  return h % 2 === 0 ? r.favorite : menu[h % menu.length];
}

export function friendStickerId(residentId: string): string {
  return `friend-${residentId}`;
}
