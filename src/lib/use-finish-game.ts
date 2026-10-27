import { useCallback, useState } from 'react';

import { useGame, type GameId } from '@/lib/game-store';

/** Sends a finished game's score once and tracks the coins it paid out. */
export function useFinishGame(game: GameId) {
  const { submitScore, bestScores } = useGame();
  const [payout, setPayout] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bestBefore, setBestBefore] = useState(bestScores[game] ?? 0);

  const finish = useCallback(
    (score: number) => {
      setBestBefore(bestScores[game] ?? 0);
      submitScore(game, score)
        .then(setPayout)
        .catch(() => setError("Couldn't save your score. Check your connection."));
    },
    [bestScores, game, submitScore],
  );

  const reset = useCallback(() => {
    setPayout(null);
    setError(null);
  }, []);

  return { finish, reset, payout, error, bestBefore };
}
