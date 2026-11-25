// Rules for the Snack Shack job, "Order Up!". Buddies walk up with an order and
// you tap the snacks to fill their tray before your shift ends.
// No imports from the app, so the tests can load this file directly.

export const SHIFT_SECONDS = 45;
export const POINTS_PER_ITEM = 10;
/** Extra points for serving orders in a row with no wrong taps. */
export const STREAK_BONUS = 5;

export const MENU = ['fruit-pouch', 'gummy-worms', 'cheesy-puffs', 'blue-slushie', 'toaster-tart', 'pizza-bagel'];

export type Shift = {
  /** Snacks the current customer still needs. */
  remaining: string[];
  /** The whole current order, for showing the ticket. */
  order: string[];
  served: number;
  streak: number;
  mistakes: number;
  score: number;
  secondsLeft: number;
};

/** Orders grow from 2 to 4 snacks as you serve more customers. */
export function orderSize(served: number): number {
  return Math.min(4, 2 + Math.floor(served / 3));
}

/** Builds an order from a source of random numbers between 0 and 1. */
export function makeOrder(served: number, random: () => number): string[] {
  return Array.from({ length: orderSize(served) }, () => MENU[Math.floor(random() * MENU.length) % MENU.length]);
}

export function startShift(random: () => number): Shift {
  const order = makeOrder(0, random);
  return { order, remaining: [...order], served: 0, streak: 0, mistakes: 0, score: 0, secondsLeft: SHIFT_SECONDS };
}

export type TapResult = { shift: Shift; outcome: 'right' | 'wrong' | 'served' | 'over' };

/** Taps a snack. Snacks can go on the tray in any order. */
export function tapSnack(shift: Shift, slug: string, random: () => number): TapResult {
  if (shift.secondsLeft <= 0) return { shift, outcome: 'over' };
  const index = shift.remaining.indexOf(slug);
  if (index === -1) {
    return { shift: { ...shift, mistakes: shift.mistakes + 1, streak: 0 }, outcome: 'wrong' };
  }
  const remaining = shift.remaining.filter((_, i) => i !== index);
  if (remaining.length > 0) return { shift: { ...shift, remaining }, outcome: 'right' };

  const streak = shift.streak + 1;
  const earned = shift.order.length * POINTS_PER_ITEM + (streak > 1 ? STREAK_BONUS * (streak - 1) : 0);
  const served = shift.served + 1;
  const order = makeOrder(served, random);
  return {
    shift: { ...shift, served, streak, score: shift.score + earned, order, remaining: [...order] },
    outcome: 'served',
  };
}

export function tick(shift: Shift): Shift {
  return { ...shift, secondsLeft: Math.max(0, shift.secondsLeft - 1) };
}
