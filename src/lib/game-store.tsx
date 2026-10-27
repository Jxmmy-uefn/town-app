import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { CATALOG, catalogItem, type ClothingSlot } from '@/constants/items';
import { useAuth } from '@/lib/auth';
import { payoutFor } from '@/lib/rewards';
import { supabase } from '@/lib/supabase';

export type GameId = 'catch' | 'match3';
export type Rotation = 0 | 90 | 180 | 270;

export type Avatar = {
  skin: string;
  shirtColor: string;
} & Partial<Record<ClothingSlot, string>>;

export type OwnedItem = { inventoryId: string; slug: string };

export type Placement = {
  inventoryId: string;
  slug: string;
  x: number;
  y: number;
  rotation: Rotation;
};

export type LeaderboardRow = { username: string; bestScore: number };

type GameData = {
  coins: number;
  avatar: Avatar;
  owned: OwnedItem[];
  placements: Placement[];
  bestScores: Partial<Record<GameId, number>>;
  /** Shop prices by slug. */
  prices: Record<string, number>;
};

/** Everything that reads or writes saved progress, in demo mode or against Supabase. */
type Backend = {
  load(): Promise<GameData>;
  submitScore(game: GameId, score: number): Promise<number>;
  buy(slug: string): Promise<OwnedItem>;
  place(placement: Placement): Promise<void>;
  move(placement: Placement): Promise<void>;
  unplace(inventoryId: string): Promise<void>;
  saveAvatar(avatar: Avatar): Promise<void>;
  leaderboard(game: GameId): Promise<LeaderboardRow[]>;
};

export const DEFAULT_AVATAR: Avatar = { skin: '#E0AC69', shirtColor: '#208AEF' };

const STARTING_COINS = 100;
const catalogPrices = Object.fromEntries(CATALOG.map((item) => [item.slug, item.price]));

// Demo mode ---------------------------------------------------------------------

const DEMO_KEY = 'demo-game-v1';

type DemoSave = Omit<GameData, 'prices'> & {
  earnedDay: string;
  earnedToday: number;
  nextId: number;
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

/** Saves progress on the phone only, following the same rules as the server. */
function createDemoBackend(): Backend {
  let save: DemoSave = {
    coins: STARTING_COINS,
    avatar: DEFAULT_AVATAR,
    owned: [],
    placements: [],
    bestScores: {},
    earnedDay: today(),
    earnedToday: 0,
    nextId: 1,
  };

  async function persist() {
    try {
      await AsyncStorage.setItem(DEMO_KEY, JSON.stringify(save));
    } catch {
      // Progress just won't survive a restart.
    }
  }

  return {
    async load() {
      try {
        const stored = await AsyncStorage.getItem(DEMO_KEY);
        if (stored) save = { ...save, ...JSON.parse(stored) };
      } catch {
        // Start fresh.
      }
      return { ...save, prices: catalogPrices };
    },
    async submitScore(game, score) {
      if (save.earnedDay !== today()) {
        save.earnedDay = today();
        save.earnedToday = 0;
      }
      const payout = payoutFor(score, save.earnedToday);
      save.earnedToday += payout;
      save.coins += payout;
      save.bestScores = { ...save.bestScores, [game]: Math.max(save.bestScores[game] ?? 0, score) };
      await persist();
      return payout;
    },
    async buy(slug) {
      const price = catalogPrices[slug];
      if (price === undefined) throw new Error('That item is not for sale.');
      if (save.coins < price) throw new Error('Not enough coins.');
      const item = { inventoryId: String(save.nextId++), slug };
      save.coins -= price;
      save.owned = [...save.owned, item];
      await persist();
      return item;
    },
    async place(placement) {
      save.placements = [...save.placements, placement];
      await persist();
    },
    async move(placement) {
      save.placements = save.placements.map((p) =>
        p.inventoryId === placement.inventoryId ? placement : p,
      );
      await persist();
    },
    async unplace(inventoryId) {
      save.placements = save.placements.filter((p) => p.inventoryId !== inventoryId);
      await persist();
    },
    async saveAvatar(avatar) {
      save.avatar = avatar;
      await persist();
    },
    async leaderboard() {
      return [];
    },
  };
}

// Supabase ------------------------------------------------------------------------

function createSupabaseBackend(userId: string): Backend {
  const db = supabase!;
  const itemIds = new Map<string, number>();
  const slugs = new Map<number, string>();

  function check<T>(result: { data: T; error: { message: string } | null }): T {
    if (result.error) throw new Error(result.error.message);
    return result.data;
  }

  return {
    async load() {
      const [profile, items, inventory, placements, scores] = await Promise.all([
        db.from('profiles').select('coins, avatar').eq('id', userId).single(),
        db.from('items').select('id, slug, price'),
        db.from('inventory').select('id, item_id'),
        db.from('house_placements').select('inventory_id, item_id, x, y, rotation').eq('user_id', userId),
        db.from('game_scores').select('game, score').eq('user_id', userId).order('score', { ascending: false }).limit(50),
      ]);

      const prices: Record<string, number> = {};
      for (const item of check(items) ?? []) {
        itemIds.set(item.slug, item.id);
        slugs.set(item.id, item.slug);
        prices[item.slug] = item.price;
      }

      const bestScores: GameData['bestScores'] = {};
      for (const row of check(scores) ?? []) {
        const game = row.game as GameId;
        bestScores[game] = Math.max(bestScores[game] ?? 0, row.score);
      }

      const me = check(profile);
      if (!me) throw new Error('Profile not found.');
      const { coins, avatar } = me;
      return {
        coins,
        avatar: { ...DEFAULT_AVATAR, ...avatar },
        prices,
        bestScores,
        owned: (check(inventory) ?? []).map((row) => ({
          inventoryId: String(row.id),
          slug: slugs.get(row.item_id) ?? '',
        })),
        placements: (check(placements) ?? []).map((row) => ({
          inventoryId: String(row.inventory_id),
          slug: slugs.get(row.item_id) ?? '',
          x: row.x,
          y: row.y,
          rotation: row.rotation as Rotation,
        })),
      };
    },
    async submitScore(game, score) {
      return check(await db.rpc('submit_score', { p_game: game, p_score: score })) as number;
    },
    async buy(slug) {
      const id = check(await db.rpc('buy_item', { p_item_id: itemIds.get(slug) }));
      return { inventoryId: String(id), slug };
    },
    async place(placement) {
      check(
        await db.from('house_placements').insert({
          user_id: userId,
          inventory_id: Number(placement.inventoryId),
          item_id: itemIds.get(placement.slug),
          x: placement.x,
          y: placement.y,
          rotation: placement.rotation,
        }),
      );
    },
    async move(placement) {
      check(
        await db
          .from('house_placements')
          .update({ x: placement.x, y: placement.y, rotation: placement.rotation })
          .eq('inventory_id', Number(placement.inventoryId)),
      );
    },
    async unplace(inventoryId) {
      check(await db.from('house_placements').delete().eq('inventory_id', Number(inventoryId)));
    },
    async saveAvatar(avatar) {
      check(await db.from('profiles').update({ avatar }).eq('id', userId));
    },
    async leaderboard(game) {
      const rows = check(
        await db
          .from('weekly_leaderboard')
          .select('username, best_score')
          .eq('game', game)
          .order('best_score', { ascending: false })
          .limit(10),
      );
      return (rows ?? []).map((row) => ({ username: row.username, bestScore: row.best_score }));
    },
  };
}

// Provider ----------------------------------------------------------------------------

type GameState = GameData & {
  loading: boolean;
  submitScore(game: GameId, score: number): Promise<number>;
  /** Returns an error message, or null when the purchase went through. */
  buy(slug: string): Promise<string | null>;
  place(inventoryId: string): Promise<void>;
  move(placement: Placement): Promise<void>;
  unplace(inventoryId: string): Promise<void>;
  saveAvatar(avatar: Avatar): Promise<void>;
  leaderboard(game: GameId): Promise<LeaderboardRow[]>;
};

const GameContext = createContext<GameState | null>(null);

const EMPTY: GameData = {
  coins: 0,
  avatar: DEFAULT_AVATAR,
  owned: [],
  placements: [],
  bestScores: {},
  prices: catalogPrices,
};

export function GameProvider({ children }: { children: ReactNode }) {
  const { player } = useAuth();
  const playerId = player?.id;
  const backend = useMemo(
    () => (playerId && supabase && playerId !== 'demo' ? createSupabaseBackend(playerId) : createDemoBackend()),
    [playerId],
  );
  const [data, setData] = useState<GameData>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    backend
      .load()
      .then((loaded) => !cancelled && setData(loaded))
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [backend]);

  const submitScore = useCallback(
    async (game: GameId, score: number) => {
      const payout = await backend.submitScore(game, score);
      setData((d) => ({
        ...d,
        coins: d.coins + payout,
        bestScores: { ...d.bestScores, [game]: Math.max(d.bestScores[game] ?? 0, score) },
      }));
      return payout;
    },
    [backend],
  );

  const buy = useCallback(
    async (slug: string) => {
      try {
        const item = await backend.buy(slug);
        setData((d) => ({ ...d, coins: d.coins - (d.prices[slug] ?? 0), owned: [...d.owned, item] }));
        return null;
      } catch (error) {
        return error instanceof Error ? error.message : 'Something went wrong.';
      }
    },
    [backend],
  );

  const place = useCallback(
    async (inventoryId: string) => {
      const owned = data.owned.find((item) => item.inventoryId === inventoryId);
      if (!owned) return;
      const placement: Placement = { inventoryId, slug: owned.slug, x: 0.5, y: 0.5, rotation: 0 };
      setData((d) => ({ ...d, placements: [...d.placements, placement] }));
      await backend.place(placement);
    },
    [backend, data.owned],
  );

  const move = useCallback(
    async (placement: Placement) => {
      setData((d) => ({
        ...d,
        placements: d.placements.map((p) => (p.inventoryId === placement.inventoryId ? placement : p)),
      }));
      await backend.move(placement);
    },
    [backend],
  );

  const unplace = useCallback(
    async (inventoryId: string) => {
      setData((d) => ({ ...d, placements: d.placements.filter((p) => p.inventoryId !== inventoryId) }));
      await backend.unplace(inventoryId);
    },
    [backend],
  );

  const saveAvatar = useCallback(
    async (avatar: Avatar) => {
      setData((d) => ({ ...d, avatar }));
      await backend.saveAvatar(avatar);
    },
    [backend],
  );

  const value: GameState = {
    ...data,
    loading,
    submitScore,
    buy,
    place,
    move,
    unplace,
    saveAvatar,
    leaderboard: backend.leaderboard,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const value = useContext(GameContext);
  if (!value) throw new Error('useGame must be used inside GameProvider');
  return value;
}

/** Owned items with their catalog details, skipping anything no longer in the catalog. */
export function ownedWithDetails(owned: OwnedItem[]) {
  return owned.flatMap((item) => {
    const details = catalogItem(item.slug);
    return details ? [{ ...item, ...details }] : [];
  });
}
