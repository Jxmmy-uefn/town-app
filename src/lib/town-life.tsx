import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { useAuth } from '@/lib/auth';
import {
  choreDef,
  choreDone,
  currentFood,
  dayKey,
  feed,
  FOOD_START,
  freshChores,
  moodFor,
  recordChoreEvent,
  snack,
  type ChoreDef,
  type ChoreState,
  type FoodLevel,
  type GumballPrize,
  type Mood,
  type TownEvent,
} from '@/lib/daily-logic';
import { useGame } from '@/lib/game-store';
import { friendStickerId, HEARTS_FOR_STICKER } from '@/lib/resident-logic';

// The Daily Loop's progress (Food bar, chores, today's gumball turn, stickers)
// is saved on the phone for now. Coins always go through the game store, so the
// server still checks every coin when one is connected.

type LifeSave = {
  food: FoodLevel;
  day: string;
  chores: ChoreState[];
  bonusClaimed: boolean;
  gumballDay: string | null;
  stickers: string[];
  /** Hearts with each town resident, and the last day you brought them a snack. */
  friends: Record<string, { hearts: number; lastGift: string | null }>;
};

function newSave(now: number): LifeSave {
  const day = dayKey(new Date(now));
  return {
    food: { value: FOOD_START, at: now },
    day,
    chores: freshChores(day),
    bonusClaimed: false,
    gumballDay: null,
    stickers: [],
    friends: {},
  };
}

/** Starts a new set of chores when the day has changed. */
function rollDay(save: LifeSave, now: number): LifeSave {
  const day = dayKey(new Date(now));
  if (save.day === day) return save;
  return { ...save, day, chores: freshChores(day), bonusClaimed: false };
}

export type ChoreRow = ChoreDef & ChoreState & { done: boolean };

type TownLife = {
  food: number;
  mood: Mood;
  chores: ChoreRow[];
  bonusClaimed: boolean;
  allChoresClaimed: boolean;
  gumballReady: boolean;
  stickers: string[];
  friends: LifeSave['friends'];
  record(event: TownEvent): void;
  /** Buys a resident today's snack. Returns an error message, or null when it worked. */
  giftResident(id: string, snackSlug: string): Promise<string | null>;
  /** Each of these returns an error message, or null when it worked. */
  claimChore(id: string): Promise<string | null>;
  claimAllChoresBonus(): Promise<string | null>;
  eat(slug: string): Promise<string | null>;
  spinGumball(canWinSticker: boolean): Promise<GumballPrize | string>;
  addSticker(id: string): void;
};

const TownLifeContext = createContext<TownLife | null>(null);

function errorText(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong.';
}

/** Re-renders once a minute so the Food bar and the day stay current. */
function useMinuteClock() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export function TownLifeProvider({ children }: { children: ReactNode }) {
  const { player } = useAuth();
  const game = useGame();
  const storageKey = `town-life-v1:${player?.id ?? 'guest'}`;
  const now = useMinuteClock();
  const [save, setSave] = useState<LifeSave>(() => newSave(Date.now()));
  const loaded = useRef(false);

  useEffect(() => {
    loaded.current = false;
    let cancelled = false;
    AsyncStorage.getItem(storageKey)
      .then((stored) => {
        if (cancelled) return;
        const base = newSave(Date.now());
        setSave(rollDay(stored ? { ...base, ...JSON.parse(stored) } : base, Date.now()));
      })
      .catch(() => {})
      .finally(() => {
        loaded.current = true;
      });
    return () => {
      cancelled = true;
    };
  }, [storageKey]);

  useEffect(() => {
    if (!loaded.current) return;
    AsyncStorage.setItem(storageKey, JSON.stringify(save)).catch(() => {});
  }, [save, storageKey]);

  // Shows a fresh set of chores if midnight passed while the app was open.
  const live = useMemo(() => rollDay(save, now), [save, now]);

  const update = useCallback((change: (s: LifeSave) => LifeSave) => {
    setSave((s) => change(rollDay(s, Date.now())));
  }, []);

  const record = useCallback(
    (event: TownEvent) => update((s) => ({ ...s, chores: recordChoreEvent(s.chores, event) })),
    [update],
  );

  const { claimBonus, buySnack, spinGumball: spin } = game;

  const claimChore = useCallback(
    async (id: string) => {
      const chore = live.chores.find((c) => c.id === id);
      if (!chore || chore.claimed || !choreDone(chore)) return 'That chore is not finished yet.';
      try {
        await claimBonus('chore');
        update((s) => ({ ...s, chores: s.chores.map((c) => (c.id === id ? { ...c, claimed: true } : c)) }));
        return null;
      } catch (error) {
        return errorText(error);
      }
    },
    [claimBonus, live.chores, update],
  );

  const claimAllChoresBonus = useCallback(async () => {
    if (live.bonusClaimed || !live.chores.every((c) => c.claimed)) return 'Finish all three chores first.';
    try {
      await claimBonus('chores-bonus');
      update((s) => ({ ...s, bonusClaimed: true }));
      return null;
    } catch (error) {
      return errorText(error);
    }
  }, [claimBonus, live.bonusClaimed, live.chores, update]);

  const eat = useCallback(
    async (slug: string) => {
      const item = snack(slug);
      if (!item) return 'That snack is not on the menu.';
      try {
        await buySnack(slug);
        update((s) => ({ ...s, food: feed(s.food, item.food, Date.now()), chores: recordChoreEvent(s.chores, 'eat') }));
        return null;
      } catch (error) {
        return errorText(error);
      }
    },
    [buySnack, update],
  );

  const gumballReady = live.gumballDay !== dayKey(new Date(now));

  const spinGumball = useCallback(
    async (canWinSticker: boolean) => {
      if (!gumballReady) return 'You already had today’s turn. Come back tomorrow!';
      try {
        const prize = await spin(canWinSticker);
        update((s) => ({ ...s, gumballDay: dayKey() }));
        return prize;
      } catch (error) {
        return errorText(error);
      }
    },
    [gumballReady, spin, update],
  );

  const addSticker = useCallback(
    (id: string) =>
      update((s) =>
        s.stickers.includes(id)
          ? s
          : { ...s, stickers: [...s.stickers, id], chores: recordChoreEvent(s.chores, 'sticker') },
      ),
    [update],
  );

  const giftResident = useCallback(
    async (id: string, snackSlug: string) => {
      const today = dayKey();
      if (live.friends[id]?.lastGift === today) return 'You already brought them a snack today.';
      try {
        await buySnack(snackSlug);
        update((s) => {
          const hearts = Math.min(HEARTS_FOR_STICKER, (s.friends[id]?.hearts ?? 0) + 1);
          const sticker = friendStickerId(id);
          const earned = hearts >= HEARTS_FOR_STICKER && !s.stickers.includes(sticker);
          return {
            ...s,
            friends: { ...s.friends, [id]: { hearts, lastGift: today } },
            stickers: earned ? [...s.stickers, sticker] : s.stickers,
            chores: recordChoreEvent(s.chores, 'gift'),
          };
        });
        return null;
      } catch (error) {
        return errorText(error);
      }
    },
    [buySnack, live.friends, update],
  );

  const food = currentFood(live.food, now);
  const chores: ChoreRow[] = live.chores.flatMap((c) => {
    const def = choreDef(c.id);
    return def ? [{ ...def, ...c, done: choreDone(c) }] : [];
  });

  const value: TownLife = {
    food,
    mood: moodFor(food),
    chores,
    bonusClaimed: live.bonusClaimed,
    allChoresClaimed: chores.every((c) => c.claimed),
    gumballReady,
    stickers: live.stickers,
    friends: live.friends,
    giftResident,
    record,
    claimChore,
    claimAllChoresBonus,
    eat,
    spinGumball,
    addSticker,
  };

  return <TownLifeContext.Provider value={value}>{children}</TownLifeContext.Provider>;
}

export function useTownLife() {
  const value = useContext(TownLifeContext);
  if (!value) throw new Error('useTownLife must be used inside TownLifeProvider');
  return value;
}

/** Counts a visit to a place toward today's chores. */
export function useRecordVisit(event: TownEvent | undefined) {
  const { record } = useTownLife();
  useEffect(() => {
    if (event) record(event);
  }, [event, record]);
}
