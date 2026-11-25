// Stickers for the Sticker Book: some roll out of the gumball machine, and one
// is hidden somewhere in town, moving to a new spot every two weeks.
// No imports from the app, so the tests can load this file directly.

export type StickerPlace = 'arcade' | 'shop' | 'town-hall' | 'park' | 'snack-shack';

export type Sticker = {
  id: string;
  name: string;
  /** Emoji stand-in until the art exists. */
  emoji: string;
  source: 'gumball' | 'hidden';
};

export type HiddenSpot = {
  stickerId: string;
  place: StickerPlace;
  /** Where it sits on the place's banner, as fractions of its width and height. */
  x: number;
  y: number;
  /** A clue for the Bubble Bulletin. */
  hint: string;
};

export const STICKERS: Sticker[] = [
  { id: 'glossy-star', name: 'Glossy Star', emoji: '⭐', source: 'gumball' },
  { id: 'bubble-fish', name: 'Bubble Fish', emoji: '🐠', source: 'gumball' },
  { id: 'flip-phone', name: 'Flip Phone', emoji: '📱', source: 'gumball' },
  { id: 'shiny-cd', name: 'Shiny CD', emoji: '💿', source: 'gumball' },
  { id: 'rainbow-butterfly', name: 'Rainbow Butterfly', emoji: '🦋', source: 'gumball' },
  { id: 'pixel-heart', name: 'Pixel Heart', emoji: '💖', source: 'gumball' },
  { id: 'peace-flower', name: 'Peace Flower', emoji: '🌼', source: 'gumball' },
  { id: 'disco-ball', name: 'Disco Ball', emoji: '🪩', source: 'gumball' },
  { id: 'lava-lamp', name: 'Lava Lamp', emoji: '🫧', source: 'hidden' },
  { id: 'cloud-buddy', name: 'Cloud Buddy', emoji: '☁️', source: 'hidden' },
  { id: 'game-cart', name: 'Game Cartridge', emoji: '🎮', source: 'hidden' },
  { id: 'mixtape', name: 'Mixtape', emoji: '📼', source: 'hidden' },
  { id: 'skate-deck', name: 'Skate Deck', emoji: '🛹', source: 'hidden' },
  { id: 'glow-stick', name: 'Glow Stick', emoji: '🪄', source: 'hidden' },
  { id: 'aqua-drop', name: 'Aqua Drop', emoji: '💧', source: 'hidden' },
  { id: 'golden-ticket', name: 'Golden Arcade Ticket', emoji: '🎟️', source: 'hidden' },
];

// One spot per two-week stretch, in this order. After the last one it starts
// again from the top, so late joiners get another chance at every sticker.
export const HIDDEN_SPOTS: HiddenSpot[] = [
  { stickerId: 'lava-lamp', place: 'shop', x: 0.86, y: 0.22, hint: 'Something is glowing in a corner of the Shop.' },
  { stickerId: 'cloud-buddy', place: 'park', x: 0.12, y: 0.18, hint: 'Look up at the sky over the Park.' },
  { stickerId: 'game-cart', place: 'arcade', x: 0.9, y: 0.78, hint: 'Someone dropped something by the Arcade floor.' },
  { stickerId: 'mixtape', place: 'town-hall', x: 0.08, y: 0.76, hint: 'The Town Hall notice board has a tape stuck to it.' },
  { stickerId: 'skate-deck', place: 'park', x: 0.88, y: 0.8, hint: 'Who left their board at the edge of the Park?' },
  { stickerId: 'glow-stick', place: 'snack-shack', x: 0.1, y: 0.25, hint: 'The Snack Shack sign has an extra glow tonight.' },
  { stickerId: 'aqua-drop', place: 'shop', x: 0.14, y: 0.8, hint: 'A drip of water landed near the Shop door.' },
  { stickerId: 'golden-ticket', place: 'arcade', x: 0.5, y: 0.12, hint: 'High above the Arcade sign, something shines.' },
];

export const SPOT_DAYS = 14;
/** The first two-week stretch starts on this local date. */
const FIRST_DAY = new Date(2026, 10, 16);

function wholeDaysSince(start: Date, now: Date) {
  const a = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const b = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.floor((b - a) / 86_400_000);
}

/** The hidden sticker for right now, and how many days until it moves. */
export function currentHiddenSpot(now: Date = new Date()): { spot: HiddenSpot; daysLeft: number } {
  const days = Math.max(0, wholeDaysSince(FIRST_DAY, now));
  const stretch = Math.floor(days / SPOT_DAYS);
  return {
    spot: HIDDEN_SPOTS[stretch % HIDDEN_SPOTS.length],
    daysLeft: SPOT_DAYS - (days % SPOT_DAYS),
  };
}

export function sticker(id: string): Sticker | undefined {
  return STICKERS.find((s) => s.id === id);
}

/** A gumball sticker you don't have yet, or null when you own them all. */
export function pickGumballSticker(owned: string[], random: number): string | null {
  const left = STICKERS.filter((s) => s.source === 'gumball' && !owned.includes(s.id));
  if (left.length === 0) return null;
  return left[Math.min(left.length - 1, Math.floor(Math.max(0, random) * left.length))].id;
}
