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

const BY_SLUG = new Map(CATALOG.map((item) => [item.slug, item]));

export function catalogItem(slug: string): CatalogItem | undefined {
  return BY_SLUG.get(slug);
}
