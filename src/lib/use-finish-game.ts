import { useCallback, useState } from 'react';

import { useGame, type GameId } from '@/lib/game-store';
import { useTownLife } from '@/lib/town-life';

/** Sends a finished game's score once and tracks the coins it paid out. */
export function useFinishGame(game: GameId) {
  const { submitScore, bestScores } = useGame();
  const { record } = useTownLife();
  const [payout, setPayout] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bestBefore, setBestBefore] = useState(bestScores[game] ?? 0);

  const finish = useCallback(
    (score: number) => {
      setBestBefore(bestScores[game] ?? 0);
      record('play');
      record(`play:${game}`);
      submitScore(game, score)
        .then(setPayout)
        .catch(() => setError("Couldn't save your score. Check your connection."));
    },
    [bestScores, game, record, submitScore],
  );

  const reset = useCallback(() => {
    setPayout(null);
    setError(null);
  }, []);

  return { finish, reset, payout, error, bestBefore };
}
