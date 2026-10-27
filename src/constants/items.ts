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
];

const BY_SLUG = new Map(CATALOG.map((item) => [item.slug, item]));

export function catalogItem(slug: string): CatalogItem | undefined {
  return BY_SLUG.get(slug);
}
