// Keep in sync with submit_score in supabase/migrations.
export const COINS_PER_POINTS = 10;
export const MAX_COINS_PER_GAME = 50;
export const MAX_COINS_PER_DAY = 500;

export function payoutFor(score: number, earnedToday: number): number {
  const raw = Math.floor(Math.max(0, score) / COINS_PER_POINTS);
  return Math.max(0, Math.min(raw, MAX_COINS_PER_GAME, MAX_COINS_PER_DAY - earnedToday));
}
