import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { PlaceScreen } from '@/components/place-screen';
import { ThemedText } from '@/components/themed-text';
import { CATALOG, type ItemCategory } from '@/constants/items';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useGame } from '@/lib/game-store';

const TABS: { id: ItemCategory; label: string }[] = [
  { id: 'clothing', label: 'Clothes' },
  { id: 'furniture', label: 'Furniture' },
];

export default function ShopScreen() {
  const theme = useTheme();
  const { coins, owned, prices, buy } = useGame();
  const [tab, setTab] = useState<ItemCategory>('clothing');
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function onBuy(slug: string, name: string) {
    setBusy(slug);
    const error = await buy(slug);
    setBusy(null);
    setMessage(error ?? `You bought the ${name}!`);
  }

  const items = CATALOG.filter((item) => item.category === tab && prices[item.slug] !== undefined);

  return (
    <PlaceScreen title="Shop" color="#F2B84B">
      <ThemedText type="smallBold">You have {coins} coins</ThemedText>

      <View style={[styles.tabs, { backgroundColor: theme.backgroundElement }]}>
        {TABS.map((t) => (
          <Pressable
            key={t.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === t.id }}
            onPress={() => setTab(t.id)}
            style={[styles.tab, tab === t.id && { backgroundColor: theme.background }]}>
            <ThemedText type="smallBold">{t.label}</ThemedText>
          </Pressable>
        ))}
      </View>

      {message && <ThemedText>{message}</ThemedText>}

      {items.map((item) => {
        const price = prices[item.slug];
        const count = owned.filter((o) => o.slug === item.slug).length;
        // Clothes are one of a kind; furniture you can buy as many as you like.
        const ownedClothing = item.category === 'clothing' && count > 0;
        return (
          <View key={item.slug} style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
            <Text style={styles.emoji}>{item.emoji}</Text>
            <View style={styles.cardText}>
              <ThemedText type="smallBold">{item.name}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {price} coins{count > 0 ? ` · you own ${count}` : ''}
              </ThemedText>
            </View>
            <Button
              label={ownedClothing ? 'Owned' : 'Buy'}
              disabled={ownedClothing || coins < price || busy !== null}
              onPress={() => onBuy(item.slug, item.name)}
            />
          </View>
        );
      })}
    </PlaceScreen>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', borderRadius: Spacing.three, padding: Spacing.one },
  tab: { flex: 1, alignItems: 'center', paddingVertical: Spacing.two, borderRadius: Spacing.two },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  emoji: { fontSize: 36 },
  cardText: { flex: 1 },
});
