import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PlaceScreen } from '@/components/place-screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useGame, type GameId, type LeaderboardRow } from '@/lib/game-store';
import { MAX_COINS_PER_DAY, MAX_COINS_PER_GAME } from '@/lib/rewards';

const GAMES: { id: GameId; name: string; emoji: string; blurb: string; href: '/games/catch' | '/games/match3' }[] = [
  { id: 'catch', name: 'Catch!', emoji: '🧺', blurb: 'Catch falling treats, dodge the rocks.', href: '/games/catch' },
  { id: 'match3', name: 'Fruit Match', emoji: '🍇', blurb: 'Line up 3 or more fruit in 20 moves.', href: '/games/match3' },
];

export default function ArcadeScreen() {
  const theme = useTheme();
  const { bestScores, leaderboard } = useGame();
  const [boards, setBoards] = useState<Partial<Record<GameId, LeaderboardRow[]>>>({});

  useEffect(() => {
    for (const game of GAMES) {
      leaderboard(game.id)
        .then((rows) => setBoards((b) => ({ ...b, [game.id]: rows })))
        .catch(() => {});
    }
  }, [leaderboard]);

  return (
    <PlaceScreen title="Arcade" color="#E8735A">
      <ThemedText themeColor="textSecondary">
        Every 10 points earns a coin, up to {MAX_COINS_PER_GAME} a game and {MAX_COINS_PER_DAY} a day.
      </ThemedText>

      {GAMES.map((game) => (
        <Link key={game.id} href={game.href} asChild>
          <Pressable
            accessibilityRole="button"
            style={StyleSheet.flatten([styles.card, { backgroundColor: theme.backgroundElement }])}>
            <Text style={styles.emoji}>{game.emoji}</Text>
            <View style={styles.cardText}>
              <ThemedText type="smallBold">{game.name}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {game.blurb}
              </ThemedText>
              <ThemedText type="small">Your best: {bestScores[game.id] ?? 0}</ThemedText>
            </View>
          </Pressable>
        </Link>
      ))}

      {GAMES.map((game) =>
        boards[game.id]?.length ? (
          <View key={game.id} style={styles.board}>
            <ThemedText type="smallBold">This week’s top {game.name} scores</ThemedText>
            {boards[game.id]!.map((row, i) => (
              <ThemedText key={row.username} type="small">
                {i + 1}. {row.username}: {row.bestScore}
              </ThemedText>
            ))}
          </View>
        ) : null,
      )}
    </PlaceScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  emoji: { fontSize: 40 },
  cardText: { flex: 1, gap: Spacing.half },
  board: { gap: Spacing.one },
});
