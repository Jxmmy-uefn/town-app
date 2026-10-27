import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type GameOverProps = {
  score: number;
  best: number;
  /** Coins earned, or null while the score is still being sent. */
  payout: number | null;
  error?: string | null;
  onPlayAgain: () => void;
};

export function GameOver({ score, best, payout, error, onPlayAgain }: GameOverProps) {
  const theme = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
      <ThemedText type="subtitle">Game over</ThemedText>
      <ThemedText>
        Score: <ThemedText type="smallBold">{score}</ThemedText>
        {score >= best && score > 0 ? '  New best!' : `  (best ${best})`}
      </ThemedText>
      {error ? (
        <ThemedText style={styles.error}>{error}</ThemedText>
      ) : (
        <ThemedText>{payout === null ? 'Counting coins…' : `+${payout} ${payout === 1 ? 'coin' : 'coins'}`}</ThemedText>
      )}
      {payout === 0 && score >= 10 && (
        <ThemedText type="small" themeColor="textSecondary">
          {"You've hit today's 500 coin limit. Come back tomorrow for more."}
        </ThemedText>
      )}
      <Button label="Play again" onPress={onPlayAgain} />
      <Button label="Back to the arcade" variant="secondary" onPress={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: Spacing.four,
    padding: Spacing.four,
    borderRadius: Spacing.four,
    gap: Spacing.three,
    alignItems: 'stretch',
  },
  error: { color: '#D93B3B' },
});
