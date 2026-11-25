import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { FoodBar } from '@/components/food-bar';
import { GumballMachine, useGumballShake } from '@/components/gumball-machine';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { COINS_ALL_CHORES, COINS_PER_CHORE, GUMBALL_ODDS } from '@/lib/daily-logic';
import { pickGumballSticker, sticker } from '@/lib/sticker-logic';
import { useTownLife } from '@/lib/town-life';

export default function DailyScreen() {
  const theme = useTheme();
  const life = useTownLife();
  const { shake, rotate } = useGumballShake();
  const [spinning, setSpinning] = useState(false);
  const [gumMessage, setGumMessage] = useState<string | null>(null);
  const [choreMessage, setChoreMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSpin() {
    const nextSticker = pickGumballSticker(life.stickers, Math.random());
    setSpinning(true);
    setGumMessage(null);
    const [result] = await Promise.all([life.spinGumball(nextSticker !== null), shake()]);
    setSpinning(false);
    if (typeof result === 'string') {
      setGumMessage(result);
    } else if (result.sticker && nextSticker) {
      life.addSticker(nextSticker);
      setGumMessage(`A sticker rolled out: ${sticker(nextSticker)?.name}! It's in your Sticker Book.`);
    } else {
      setGumMessage(`A gumball rolled out with ${result.coins} coins inside!`);
    }
  }

  async function onClaim(id: string) {
    setBusy(true);
    const error = await life.claimChore(id);
    setBusy(false);
    setChoreMessage(error ?? `+${COINS_PER_CHORE} coins. Nice work!`);
  }

  async function onBonus() {
    setBusy(true);
    const error = await life.claimAllChoresBonus();
    setBusy(false);
    setChoreMessage(error ?? `+${COINS_ALL_CHORES} bonus coins for finishing every chore today!`);
  }

  return (
    <ThemedView style={styles.fill}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
          <ThemedText type="smallBold">Gumball Machine</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            One free turn every day. Missing a day is fine; nothing is lost.
          </ThemedText>
          <View style={styles.center}>
            <GumballMachine size={190} rotate={rotate} />
          </View>
          <Button
            label={life.gumballReady ? (spinning ? 'Turning…' : 'Turn the knob') : 'Come back tomorrow'}
            disabled={!life.gumballReady || spinning}
            onPress={onSpin}
          />
          {gumMessage && <ThemedText style={styles.centerText}>{gumMessage}</ThemedText>}
          <View style={styles.odds}>
            <ThemedText type="small" themeColor="textSecondary">
              What’s inside:
            </ThemedText>
            {GUMBALL_ODDS.map((row) => (
              <View key={row.label} style={styles.oddsRow}>
                <ThemedText type="small">{row.label}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {row.chance}%
                </ThemedText>
              </View>
            ))}
            <ThemedText type="small" themeColor="textSecondary">
              Got every gumball sticker? That slot pays 20 coins instead.
            </ThemedText>
          </View>
        </View>

        <View style={[styles.note]}>
          <ThemedText type="smallBold" style={styles.noteText}>
            Today’s chores
          </ThemedText>
          {life.chores.map((chore) => (
            <View key={chore.id} style={styles.choreRow}>
              <View style={styles.choreText}>
                <ThemedText style={[styles.noteText, chore.claimed && styles.crossed]}>{chore.text}</ThemedText>
                {chore.target > 1 && (
                  <ThemedText type="small" style={styles.noteText}>
                    {chore.progress} of {chore.target}
                  </ThemedText>
                )}
              </View>
              {chore.claimed ? (
                <ThemedText type="smallBold" style={styles.noteText}>
                  ✓ Done
                </ThemedText>
              ) : (
                <Button
                  label={`+${COINS_PER_CHORE}`}
                  disabled={!chore.done || busy}
                  onPress={() => onClaim(chore.id)}
                  style={styles.claim}
                />
              )}
            </View>
          ))}
          {life.allChoresClaimed && !life.bonusClaimed && (
            <Button label={`Collect +${COINS_ALL_CHORES} bonus`} disabled={busy} onPress={onBonus} />
          )}
          {life.bonusClaimed && (
            <ThemedText type="small" style={styles.noteText}>
              All done for today. New chores show up tomorrow.
            </ThemedText>
          )}
          {choreMessage && <ThemedText style={styles.noteText}>{choreMessage}</ThemedText>}
          <ThemedText type="small" style={[styles.noteText, styles.dim]}>
            Skipped chores just swap for a new set tomorrow.
          </ThemedText>
        </View>

        <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
          <FoodBar food={life.food} mood={life.mood} />
          <ThemedText type="small" themeColor="textSecondary">
            Your buddy gets hungry slowly over about a day. Visit the Snack Shack to fill up.
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { padding: Spacing.three, gap: Spacing.three },
  card: { padding: Spacing.three, borderRadius: Spacing.three, gap: Spacing.two },
  center: { alignItems: 'center', paddingVertical: Spacing.two },
  centerText: { textAlign: 'center' },
  odds: { gap: Spacing.half, marginTop: Spacing.two },
  oddsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  // A yellow sticky note, like one stuck to a 2000s monitor.
  note: {
    backgroundColor: '#FFF3A3',
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.two,
    transform: [{ rotate: '-0.6deg' }],
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  noteText: { color: '#4A3B00' },
  dim: { opacity: 0.7 },
  crossed: { textDecorationLine: 'line-through', opacity: 0.6 },
  choreRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  choreText: { flex: 1 },
  claim: { paddingVertical: Spacing.two, paddingHorizontal: Spacing.three },
});
