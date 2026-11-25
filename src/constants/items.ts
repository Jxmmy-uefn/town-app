export type ItemCategory = 'clothing' | 'furniture';
export type ClothingSlot = 'hat' | 'shirt' | 'shoes';

export type CatalogItem = {
  slug: string;
  name: string;
  category: ItemCategory;
  price: number;
  /** Emoji stand-in until the AI-generated art exists. */
  emoji: string;
  slot?: ClothingSlot;
  /** A free Monthly Party gift. Never sold in the Shop. */
  party?: boolean;
  /** Part of a monthly collection (an index into COLLECTIONS), only sold in its month. */
  collection?: number;
};

// Mirrors supabase/seed.sql. Demo mode sells from this list; with a server the
// shop reads prices from the database and uses this only for the art.
export const CATALOG: CatalogItem[] = [
  { slug: 'red-cap', name: 'Red Cap', category: 'clothing', price: 40, emoji: '🧢', slot: 'hat' },
  { slug: 'striped-tee', name: 'Striped Tee', category: 'clothing', price: 60, emoji: '👕', slot: 'shirt' },
  { slug: 'rain-boots', name: 'Rain Boots', category: 'clothing', price: 80, emoji: '👢', slot: 'shoes' },
  { slug: 'wooden-chair', name: 'Wooden Chair', category: 'furniture', price: 50, emoji: '🪑' },
  { slug: 'round-rug', name: 'Round Rug', category: 'furniture', price: 70, emoji: '🟠' },
  { slug: 'potted-fern', name: 'Potted Fern', category: 'furniture', price: 30, emoji: '🪴' },
  { slug: 'bookshelf', name: 'Bookshelf', category: 'furniture', price: 150, emoji: '📚' },
  { slug: 'arcade-cabinet', name: 'Mini Arcade Cabinet', category: 'furniture', price: 400, emoji: '🕹️' },
  // Monthly collections. Each is in the Shop for one month, then comes back later.
  { slug: 'inflatable-chair', name: 'Inflatable Chair', category: 'furniture', price: 120, emoji: '🛋️', collection: 0 },
  { slug: 'lava-lamp', name: 'Lava Lamp', category: 'furniture', price: 90, emoji: '🧪', collection: 0 },
  { slug: 'bubble-tv', name: 'Bubble TV', category: 'furniture', price: 200, emoji: '📺', collection: 0 },
  { slug: 'frosted-tips', name: 'Frosted Tips', category: 'clothing', price: 80, emoji: '✨', slot: 'hat', collection: 0 },
  { slug: 'puffer-vest', name: 'Puffer Vest', category: 'clothing', price: 90, emoji: '🦺', slot: 'shirt', collection: 1 },
  { slug: 'chunky-sneakers', name: 'Chunky Sneakers', category: 'clothing', price: 100, emoji: '👟', slot: 'shoes', collection: 1 },
  { slug: 'butterfly-clips', name: 'Butterfly Clips', category: 'clothing', price: 40, emoji: '🦋', slot: 'hat', collection: 1 },
  { slug: 'bead-curtain', name: 'Bead Curtain', category: 'furniture', price: 110, emoji: '🎐', collection: 1 },
  { slug: 'trucker-hat', name: 'Trucker Hat', category: 'clothing', price: 50, emoji: '🧢', slot: 'hat', collection: 2 },
  { slug: 'graphic-tee', name: 'Graphic Tee', category: 'clothing', price: 60, emoji: '👕', slot: 'shirt', collection: 2 },
  { slug: 'skate-shoes', name: 'Skate Shoes', category: 'clothing', price: 90, emoji: '🛼', slot: 'shoes', collection: 2 },
  { slug: 'halfpipe-poster', name: 'Halfpipe Poster', category: 'furniture', price: 70, emoji: '🖼️', collection: 2 },
  { slug: 'vinyl-beanbag', name: 'Vinyl Beanbag', category: 'furniture', price: 100, emoji: '🫘', collection: 3 },
  { slug: 'fiber-optic-lamp', name: 'Fiber-Optic Lamp', category: 'furniture', price: 150, emoji: '🎇', collection: 3 },
  { slug: 'fuzzy-slippers', name: 'Fuzzy Slippers', category: 'clothing', price: 50, emoji: '🥿', slot: 'shoes', collection: 3 },
  { slug: 'pajama-tee', name: 'Pajama Tee', category: 'clothing', price: 50, emoji: '👚', slot: 'shirt', collection: 3 },
  // Monthly Party gifts (see src/lib/party-logic.ts).
  { slug: 'glow-necklace', name: 'Glow Shades', category: 'clothing', price: 0, emoji: '🕶️', slot: 'hat', party: true },
  { slug: 'heart-beanbag', name: 'Heart Beanbag', category: 'furniture', price: 0, emoji: '💗', party: true },
  { slug: 'bubble-machine', name: 'Bubble Machine', category: 'furniture', price: 0, emoji: '🫧', party: true },
  { slug: 'mini-disco-ball', name: 'Mini Disco Ball', category: 'furniture', price: 0, emoji: '🪩', party: true },
  { slug: 'flower-lamp', name: 'Flower Lamp', category: 'furniture', price: 0, emoji: '🌷', party: true },
  { slug: 'pool-ring', name: 'Inflatable Pool Ring', category: 'furniture', price: 0, emoji: '🛟', party: true },
  { slug: 'neon-sign', name: 'Neon Arcade Sign', category: 'furniture', price: 0, emoji: '👾', party: true },
  { slug: 'skate-ramp', name: 'Mini Skate Ramp', category: 'furniture', price: 0, emoji: '🛹', party: true },
  { slug: 'pumpkin-lantern', name: 'Pumpkin Lantern', category: 'furniture', price: 0, emoji: '🎃', party: true },
  { slug: 'glow-ghost', name: 'Friendly Glow Ghost', category: 'furniture', price: 0, emoji: '👻', party: true },
  { slug: 'aurora-lamp', name: 'Aurora Lamp', category: 'furniture', price: 0, emoji: '🌌', party: true },
  { slug: 'y2k-party-hat', name: 'Y2K Party Hat', category: 'clothing', price: 0, emoji: '🥳', slot: 'hat', party: true },
];

export const COLLECTIONS = ['Y2K Chrome', 'Mall Hangout', 'Skate Park', 'Sleepover'];

/** November 2026 shows collection 0. Keep in sync with buy_item in supabase/migrations. */
const FIRST_COLLECTION_YEAR = 2026;
const FIRST_COLLECTION_MONTH = 10; // November, counting from 0

/** Which collection is in the Shop this month. They cycle, so every one comes back. */
export function currentCollection(now: Date = new Date()): number {
  const months = (now.getFullYear() - FIRST_COLLECTION_YEAR) * 12 + now.getMonth() - FIRST_COLLECTION_MONTH;
  const n = COLLECTIONS.length;
  return ((months % n) + n) % n;
}

/** Days left before the Shop switches to the next collection. */
export function daysLeftInCollection(now: Date = new Date()): number {
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return lastDay - now.getDate() + 1;
}

/** Whether the Shop sells this item today. */
export function isForSale(item: CatalogItem, now: Date = new Date()): boolean {
  if (item.party) return false;
  return item.collection === undefined || item.collection === currentCollection(now);
}

const BY_SLUG = new Map(CATALOG.map((item) => [item.slug, item]));

export function catalogItem(slug: string): CatalogItem | undefined {
  return BY_SLUG.get(slug);
}
