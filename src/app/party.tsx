import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { catalogItem } from '@/constants/items';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useGame } from '@/lib/game-store';
import { currentParty, nextParty, partyDates, textOn } from '@/lib/party-logic';

export default function PartyScreen() {
  const theme = useTheme();
  const { owned, claimPartyGift } = useGame();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const party = currentParty();

  if (!party) {
    const next = nextParty();
    return (
      <ThemedView style={styles.fill}>
        <View style={styles.content}>
          <ThemedText type="smallBold">No party right now</ThemedText>
          <ThemedText>
            Next up: {next.party.name}, {partyDates(next.party)}.
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  const gift = catalogItem(party.gift);
  const have = owned.some((o) => o.slug === party.gift);
  const ink = textOn(party.color);

  async function onClaim() {
    setBusy(true);
    const error = await claimPartyGift(party!.gift);
    setBusy(false);
    setMessage(error ?? `The ${gift?.name} is yours! Find it in your house${gift?.slot ? ' or your closet' : ''}.`);
  }

  return (
    <ThemedView style={styles.fill}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.hero, { backgroundColor: party.color }]}>
          <Text style={styles.decor}>{party.decor.join('  ')}</Text>
          <ThemedText type="subtitle" style={[styles.center, { color: ink }]}>
            {party.name}
          </ThemedText>
          <ThemedText style={[styles.center, { color: ink }]}>{party.blurb}</ThemedText>
          <ThemedText type="small" style={[styles.center, { color: ink }]}>
            {partyDates(party)}
          </ThemedText>
        </View>

        {gift && (
          <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
            <Text style={styles.giftEmoji}>{gift.emoji}</Text>
            <ThemedText type="smallBold" style={styles.center}>
              Free party gift: {gift.name}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
              Free for everyone who visits. Missed it? Party gifts come back in a later year.
            </ThemedText>
            <Button label={have ? 'Picked up' : 'Pick up your gift'} disabled={have || busy} onPress={onClaim} />
            {message && <ThemedText style={styles.center}>{message}</ThemedText>}
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { padding: Spacing.three, gap: Spacing.three },
  hero: { borderRadius: Spacing.four, padding: Spacing.four, gap: Spacing.two },
  decor: { fontSize: 36, textAlign: 'center' },
  center: { textAlign: 'center' },
  card: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.two, alignItems: 'stretch' },
  giftEmoji: { fontSize: 56, textAlign: 'center' },
});
