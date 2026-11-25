// Bloops: small glossy jelly pets. Adopting one is free, and playing with it
// once a day teaches it new tricks. A Bloop never gets sad or sick if you are
// away. No imports from the app, so the tests can load this file directly.

export const BLOOP_COLORS = [
  { id: 'aqua', name: 'Aqua', hex: '#3DC6F2' },
  { id: 'lime', name: 'Lime', hex: '#8BE04E' },
  { id: 'bubblegum', name: 'Bubblegum', hex: '#FF7EC8' },
  { id: 'tangerine', name: 'Tangerine', hex: '#FF9F43' },
  { id: 'grape', name: 'Grape', hex: '#A77BFF' },
  { id: 'lemon', name: 'Lemon', hex: '#FFD93D' },
  { id: 'mint', name: 'Mint', hex: '#5DE2B5' },
  { id: 'cherry', name: 'Cherry', hex: '#FF5C6C' },
];

// Preset names keep everything friendly and safe to show other players later.
export const BLOOP_NAMES = ['Bubbles', 'Jellybean', 'Gloop', 'Pip', 'Squish', 'Wobble', 'Sprinkle', 'Dot', 'Boba', 'Fizz', 'Noodle', 'Puddle'];

export type Trick = { id: 'hop' | 'spin' | 'wiggle' | 'flip'; name: string; playDays: number };

/** Tricks unlock after playing on this many different days. */
export const TRICKS: Trick[] = [
  { id: 'hop', name: 'Hop', playDays: 0 },
  { id: 'wiggle', name: 'Wiggle', playDays: 2 },
  { id: 'spin', name: 'Spin', playDays: 4 },
  { id: 'flip', name: 'Backflip', playDays: 7 },
];

export type Bloop = { name: string; color: string; playDays: number; lastPlay: string | null };

export function newBloop(name: string, color: string): Bloop {
  return { name, color, playDays: 0, lastPlay: null };
}

/** Playing counts once per day. Returns the same Bloop when you already played today. */
export function playWith(bloop: Bloop, day: string): Bloop {
  if (bloop.lastPlay === day) return bloop;
  return { ...bloop, playDays: bloop.playDays + 1, lastPlay: day };
}

export function knownTricks(bloop: Bloop): Trick[] {
  return TRICKS.filter((t) => bloop.playDays >= t.playDays);
}

export function nextTrick(bloop: Bloop): Trick | undefined {
  return TRICKS.find((t) => bloop.playDays < t.playDays);
}

export function colorHex(id: string): string {
  return BLOOP_COLORS.find((c) => c.id === id)?.hex ?? BLOOP_COLORS[0].hex;
}
