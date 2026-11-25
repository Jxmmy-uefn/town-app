// Rules for the Daily Loop: the gumball machine, daily chores and the Food bar.
// No imports from the app, so the tests can load this file directly.
// Coin amounts here must match supabase/migrations/20261125000000_daily_loop.sql.

// Days ------------------------------------------------------------------------------

/** The player's local calendar day, like "2026-11-25". A new day starts at their midnight. */
export function dayKey(date: Date = new Date()): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

/** A small, stable number made from a piece of text, so every player gets the same picks on the same day. */
export function hashText(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Food bar --------------------------------------------------------------------------

export const FOOD_MAX = 100;
export const FOOD_START = 80;
/** A full bar empties in about a day: 100 / 4 = 25 hours. */
export const FOOD_DROP_PER_HOUR = 4;

export type FoodLevel = { value: number; at: number };

export function currentFood(food: FoodLevel, now: number): number {
  const hours = Math.max(0, now - food.at) / 3_600_000;
  return Math.max(0, Math.min(FOOD_MAX, food.value - hours * FOOD_DROP_PER_HOUR));
}

export function feed(food: FoodLevel, amount: number, now: number): FoodLevel {
  return { value: Math.min(FOOD_MAX, currentFood(food, now) + amount), at: now };
}

export type Mood = 'full' | 'okay' | 'hungry';

/** An empty bar only makes your buddy look sleepy. Nothing is ever lost. */
export function moodFor(food: number): Mood {
  if (food >= 70) return 'full';
  if (food >= 30) return 'okay';
  return 'hungry';
}

export const MOOD_TEXT: Record<Mood, string> = {
  full: 'Full and happy',
  okay: 'Getting peckish',
  hungry: 'Hungry and a bit sleepy',
};

export type Snack = { slug: string; name: string; emoji: string; price: number; food: number };

// Original 2000s-style snacks. Emoji stand in until the art exists.
export const SNACKS: Snack[] = [
  { slug: 'fruit-pouch', name: 'Fruit Snack Pouch', emoji: '🍓', price: 8, food: 10 },
  { slug: 'gummy-worms', name: 'Sour Gummy Worms', emoji: '🍬', price: 10, food: 15 },
  { slug: 'cheesy-puffs', name: 'Cheesy Puffs', emoji: '🧀', price: 12, food: 20 },
  { slug: 'blue-slushie', name: 'Blue Raspberry Slushie', emoji: '🥤', price: 15, food: 25 },
  { slug: 'toaster-tart', name: 'Frosted Toaster Tart', emoji: '🥧', price: 20, food: 35 },
  { slug: 'pizza-bagel', name: 'Mini Pizza Bagels', emoji: '🍕', price: 25, food: 45 },
];

export function snack(slug: string): Snack | undefined {
  return SNACKS.find((s) => s.slug === slug);
}

// Chores ----------------------------------------------------------------------------

/** Things the app reports as you play, which chores count. */
export type TownEvent =
  | 'play'
  | 'play:catch'
  | 'play:match3'
  | 'play:snack-job'
  | 'visit:park'
  | 'visit:town-hall'
  | 'visit:shop'
  | 'visit:arcade'
  | 'visit:snack-shack'
  | 'eat'
  | 'buy'
  | 'decorate'
  | 'outfit'
  | 'sticker';

export type ChoreDef = { id: string; text: string; event: TownEvent; target: number };

export const CHORE_POOL: ChoreDef[] = [
  { id: 'play-catch', text: 'Play a round of Catch!', event: 'play:catch', target: 1 },
  { id: 'play-match3', text: 'Play a round of Fruit Match', event: 'play:match3', target: 1 },
  { id: 'play-three', text: 'Play 3 arcade games', event: 'play', target: 3 },
  { id: 'visit-park', text: 'Stop by the Park', event: 'visit:park', target: 1 },
  { id: 'visit-town-hall', text: 'Read the news at Town Hall', event: 'visit:town-hall', target: 1 },
  { id: 'visit-shop', text: 'Window-shop at the Shop', event: 'visit:shop', target: 1 },
  { id: 'eat', text: 'Grab a snack at the Snack Shack', event: 'eat', target: 1 },
  { id: 'decorate', text: 'Place or move something in your room', event: 'decorate', target: 1 },
  { id: 'outfit', text: 'Try on a new look', event: 'outfit', target: 1 },
];

export const CHORES_PER_DAY = 3;
export const COINS_PER_CHORE = 10;
export const COINS_ALL_CHORES = 20;

export type ChoreState = { id: string; progress: number; claimed: boolean };

/** Today's three chores. Everyone gets the same three on the same day. */
export function choresFor(day: string, pool: ChoreDef[] = CHORE_POOL): ChoreDef[] {
  const picks: ChoreDef[] = [];
  let seed = hashText(day);
  const left = [...pool];
  while (picks.length < CHORES_PER_DAY && left.length > 0) {
    seed = hashText(String(seed));
    picks.push(left.splice(seed % left.length, 1)[0]);
  }
  return picks;
}

export function choreDef(id: string): ChoreDef | undefined {
  return CHORE_POOL.find((c) => c.id === id);
}

export function freshChores(day: string): ChoreState[] {
  return choresFor(day).map((c) => ({ id: c.id, progress: 0, claimed: false }));
}

export function recordChoreEvent(chores: ChoreState[], event: TownEvent): ChoreState[] {
  return chores.map((c) => {
    const def = choreDef(c.id);
    if (!def || def.event !== event || c.claimed) return c;
    return { ...c, progress: Math.min(def.target, c.progress + 1) };
  });
}

export function choreDone(chore: ChoreState): boolean {
  const def = choreDef(chore.id);
  return !!def && chore.progress >= def.target;
}

// Gumball machine -------------------------------------------------------------------

export type GumballPrize = { coins: number; sticker: boolean };

/** Every prize and its chance, shown on the machine so nothing is hidden. */
export const GUMBALL_ODDS: { label: string; chance: number; prize: GumballPrize }[] = [
  { label: '10 coins', chance: 45, prize: { coins: 10, sticker: false } },
  { label: '20 coins', chance: 25, prize: { coins: 20, sticker: false } },
  { label: '40 coins', chance: 5, prize: { coins: 40, sticker: false } },
  { label: 'A gumball sticker', chance: 25, prize: { coins: 0, sticker: true } },
];

/**
 * Picks a prize from a random number between 0 and 1. When you already own every
 * gumball sticker, that slot pays 20 coins instead, so a turn is never wasted.
 */
export function rollGumball(random: number, canWinSticker: boolean): GumballPrize {
  let roll = Math.min(0.999999, Math.max(0, random)) * 100;
  for (const row of GUMBALL_ODDS) {
    if (roll < row.chance) {
      return row.prize.sticker && !canWinSticker ? { coins: 20, sticker: false } : row.prize;
    }
    roll -= row.chance;
  }
  return GUMBALL_ODDS[0].prize;
}
