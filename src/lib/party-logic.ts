// Monthly Parties: once a month the town dresses up for a few days and everyone
// who stops by gets a free party item. No imports from the app, so the tests
// can load this file directly. Keep dates in sync with party_gifts in
// supabase/migrations/20261125000000_daily_loop.sql.

export type Party = {
  id: string;
  name: string;
  blurb: string;
  /** 1 = January. */
  month: number;
  startDay: number;
  endDay: number;
  /** Map tint and accent while the party is on. */
  color: string;
  accent: string;
  /** Emoji floating over the map. */
  decor: string[];
  /** The free gift, a catalog item slug. */
  gift: string;
};

export const PARTIES: Party[] = [
  { id: 'new-year-glow', name: 'New Year Glow Party', blurb: 'Start the year with glow sticks and fireworks over Town Square.', month: 1, startDay: 1, endDay: 7, color: '#2B2F6B', accent: '#7CF3FF', decor: ['🎆', '✨', '🎇'], gift: 'glow-necklace' },
  { id: 'friendship-fest', name: 'Friendship Festival', blurb: 'Hearts everywhere. Wave at every buddy you see!', month: 2, startDay: 10, endDay: 16, color: '#FFD3E2', accent: '#E0457B', decor: ['💖', '💌', '💕'], gift: 'heart-beanbag' },
  { id: 'spring-bubble-bash', name: 'Spring Bubble Bash', blurb: 'The whole town floats in giant soap bubbles.', month: 3, startDay: 15, endDay: 22, color: '#D4F3FF', accent: '#2D9CDB', decor: ['🫧', '🌷', '🫧'], gift: 'bubble-machine' },
  { id: 'rainy-day-disco', name: 'Rainy Day Disco', blurb: 'April showers, disco lights. The Town Hall turns into a dance floor.', month: 4, startDay: 10, endDay: 17, color: '#E3D9FF', accent: '#7B4FE0', decor: ['🪩', '🌧️', '🎶'], gift: 'mini-disco-ball' },
  { id: 'bloom-fest', name: 'Bloom Fest', blurb: 'Flowers pop up all over the Park.', month: 5, startDay: 15, endDay: 22, color: '#E6F8D8', accent: '#3DA35D', decor: ['🌸', '🌼', '🌻'], gift: 'flower-lamp' },
  { id: 'lagoon-splash', name: 'Lagoon Splash Day', blurb: 'Pool rings, beach balls and a splash zone by the water.', month: 6, startDay: 20, endDay: 27, color: '#C8F1F5', accent: '#0FA3B1', decor: ['🏖️', '🐠', '🌊'], gift: 'pool-ring' },
  { id: 'summer-arcade-jam', name: 'Summer Arcade Jam', blurb: 'Neon signs and high scores. The Arcade stays lit all week.', month: 7, startDay: 10, endDay: 17, color: '#1E1B3A', accent: '#FF4FD8', decor: ['🕹️', '👾', '⚡'], gift: 'neon-sign' },
  { id: 'skate-jam', name: 'Back-to-School Skate Jam', blurb: 'Ramps go up in the Park for one week only.', month: 8, startDay: 15, endDay: 22, color: '#FFE9C7', accent: '#E07A1F', decor: ['🛹', '🎒', '📓'], gift: 'skate-ramp' },
  { id: 'harvest-fair', name: 'Harvest Fair', blurb: 'Hay bales, apple cider slushies and a giant pumpkin contest.', month: 9, startDay: 15, endDay: 22, color: '#FCE3C0', accent: '#C2571A', decor: ['🍎', '🌾', '🍂'], gift: 'pumpkin-lantern' },
  { id: 'spooky-glow', name: 'Spooky Glow Night', blurb: 'Friendly ghosts and glowing pumpkins. Nothing too scary.', month: 10, startDay: 24, endDay: 31, color: '#2A1E3D', accent: '#FF9F1C', decor: ['🎃', '👻', '🦇'], gift: 'glow-ghost' },
  { id: 'aurora-glow', name: 'Aurora Glow Night', blurb: 'Green and purple lights dance across the night sky. Stay up and watch!', month: 11, startDay: 20, endDay: 30, color: '#14263F', accent: '#5CFFB0', decor: ['🌌', '✨', '🌠'], gift: 'aurora-lamp' },
  { id: 'y2k-countdown', name: 'Y2K Countdown Bash', blurb: 'Party like the clocks are about to roll over. Silver everything.', month: 12, startDay: 26, endDay: 31, color: '#E4E9F2', accent: '#5A6B8C', decor: ['🪩', '🎉', '💿'], gift: 'y2k-party-hat' },
];

function partyStart(party: Party, year: number) {
  return new Date(year, party.month - 1, party.startDay);
}

export function isPartyOn(party: Party, now: Date): boolean {
  const day = now.getDate();
  return now.getMonth() + 1 === party.month && day >= party.startDay && day <= party.endDay;
}

/** The party happening today, if any. */
export function currentParty(now: Date = new Date()): Party | null {
  return PARTIES.find((p) => isPartyOn(p, now)) ?? null;
}

/** The next party that hasn't started yet, and the day it starts. */
export function nextParty(now: Date = new Date()): { party: Party; starts: Date } {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let best: { party: Party; starts: Date } | null = null;
  for (const party of PARTIES) {
    let starts = partyStart(party, now.getFullYear());
    if (starts <= today) starts = partyStart(party, now.getFullYear() + 1);
    if (!best || starts < best.starts) best = { party, starts };
  }
  return best!;
}

/** Light text on dark party colors, dark text on light ones. */
export function textOn(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const lum = 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
  return lum < 140 ? '#FFFFFF' : '#1B2433';
}

export function partyDates(party: Party): string {
  const month = new Date(2000, party.month - 1, 1).toLocaleString('en-US', { month: 'long' });
  return `${month} ${party.startDay} to ${party.endDay}`;
}
