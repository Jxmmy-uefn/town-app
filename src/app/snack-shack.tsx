import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { FoodBar } from '@/components/food-bar';
import { PlaceScreen } from '@/components/place-screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { FOOD_MAX, SNACKS } from '@/lib/daily-logic';
import { useGame } from '@/lib/game-store';
import { useTownLife } from '@/lib/town-life';

export default function SnackShackScreen() {
  const theme = useTheme();
  const { coins } = useGame();
  const { food, mood, eat } = useTownLife();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onEat(slug: string, name: string) {
    setBusy(true);
    const error = await eat(slug);
    setBusy(false);
    setMessage(error ?? `Yum! Your buddy loved the ${name}.`);
  }

  const full = food >= FOOD_MAX - 1;

  return (
    <PlaceScreen title="Snack Shack" color="#FF8FB1" visit="visit:snack-shack">
      <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
        <FoodBar food={food} mood={mood} />
        <ThemedText type="small" themeColor="textSecondary">
          You have {coins} coins. {"Snacks fill your buddy's Food bar."}
        </ThemedText>
      </View>

      <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
        <ThemedText type="smallBold">Now hiring!</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Work a quick shift taking orders and earn coins.
        </ThemedText>
        <Link href="/games/snack-job" asChild>
          <Button label="Work a shift" />
        </Link>
      </View>

      {message && <ThemedText>{message}</ThemedText>}

      {SNACKS.map((item) => (
        <View key={item.slug} style={[styles.row, { backgroundColor: theme.backgroundElement }]}>
          <Text style={styles.emoji}>{item.emoji}</Text>
          <View style={styles.rowText}>
            <ThemedText type="smallBold">{item.name}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {item.price} coins · fills {item.food}
            </ThemedText>
          </View>
          <Button
            label={full ? 'Full' : 'Eat'}
            disabled={busy || full || coins < item.price}
            onPress={() => onEat(item.slug, item.name)}
          />
        </View>
      ))}
    </PlaceScreen>
  );
}

const styles = StyleSheet.create({
  card: { padding: Spacing.three, borderRadius: Spacing.three, gap: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, padding: Spacing.three, borderRadius: Spacing.three },
  emoji: { fontSize: 36 },
  rowText: { flex: 1 },
});
