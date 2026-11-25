import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { GameOver } from '@/components/game-over';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { snack } from '@/lib/daily-logic';
import { useGameFeedback } from '@/lib/game-feedback';
import { MENU, SHIFT_SECONDS, startShift, tapSnack, tick, type Shift } from '@/games/snack-job-logic';
import { useFinishGame } from '@/lib/use-finish-game';

type Phase = 'ready' | 'working' | 'over';

const CUSTOMERS = ['🙂', '😄', '😎', '🤓', '😊', '🥳'];

export default function SnackJobScreen() {
  const theme = useTheme();
  const [phase, setPhase] = useState<Phase>('ready');
  const [shift, setShift] = useState<Shift>(() => startShift(Math.random));
  const [flash, setFlash] = useState<'wrong' | 'served' | null>(null);
  const { finish, reset, payout, error, bestBefore } = useFinishGame('snack-job');
  const { play, buzz } = useGameFeedback(false);
  const finished = useRef(false);

  const start = useCallback(() => {
    reset();
    finished.current = false;
    setShift(startShift(Math.random));
    setFlash(null);
    setPhase('working');
  }, [reset]);

  // The shift clock.
  useEffect(() => {
    if (phase !== 'working') return;
    const id = setInterval(() => setShift((s) => tick(s)), 1000);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase === 'working' && shift.secondsLeft === 0 && !finished.current) {
      finished.current = true;
      setPhase('over');
      finish(shift.score);
    }
  }, [finish, phase, shift.score, shift.secondsLeft]);

  function onTap(slug: string) {
    if (phase !== 'working') return;
    const result = tapSnack(shift, slug, Math.random);
    setShift(result.shift);
    if (result.outcome === 'wrong') {
      setFlash('wrong');
      buzz('bad');
    } else if (result.outcome === 'served') {
      setFlash('served');
      play('combo');
      buzz('good');
    } else {
      setFlash(null);
      play('catch');
      buzz('tap');
    }
  }

  // Shows which snacks are already on the tray.
  const onTray = [...shift.order];
  for (const left of shift.remaining) onTray.splice(onTray.indexOf(left), 1);
  const customer = CUSTOMERS[shift.served % CUSTOMERS.length];

  return (
    <ThemedView style={styles.fill}>
      <View style={styles.hud}>
        <ThemedText type="smallBold">Score {shift.score}</ThemedText>
        <ThemedText type="smallBold">Served {shift.served}</ThemedText>
        <ThemedText type="smallBold">⏱ {shift.secondsLeft}s</ThemedText>
      </View>

      {phase === 'working' && (
        <View style={styles.play}>
          <View style={[styles.counter, { backgroundColor: theme.backgroundElement }]}>
            <Text style={styles.customer}>{customer}</Text>
            <View style={styles.ticket}>
              <ThemedText type="small" style={styles.ticketHead}>
                ORDER
              </ThemedText>
              <View style={styles.ticketRow}>
                {shift.order.map((slug, i) => (
                  <Text key={i} style={styles.ticketItem}>
                    {snack(slug)?.emoji}
                  </Text>
                ))}
              </View>
              <ThemedText type="small" style={styles.ticketHead}>
                TRAY: {onTray.map((s) => snack(s)?.emoji).join(' ') || 'empty'}
              </ThemedText>
            </View>
          </View>

          <ThemedText style={styles.center}>
            {flash === 'wrong'
              ? 'Oops, that’s not on the order!'
              : flash === 'served'
                ? shift.streak > 1
                  ? `Order up! ${shift.streak} in a row!`
                  : 'Order up!'
                : 'Tap the snacks on the order, in any order.'}
          </ThemedText>

          <View style={styles.menu}>
            {MENU.map((slug) => (
              <Pressable
                key={slug}
                accessibilityRole="button"
                accessibilityLabel={snack(slug)?.name}
                onPress={() => onTap(slug)}
                style={({ pressed }) => [
                  styles.menuItem,
                  { backgroundColor: theme.backgroundElement },
                  pressed && styles.pressed,
                ]}>
                <Text style={styles.menuEmoji}>{snack(slug)?.emoji}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {phase === 'ready' && (
        <View style={[styles.intro, { backgroundColor: theme.backgroundElement }]}>
          <ThemedText type="subtitle">Order Up!</ThemedText>
          <ThemedText>
            Work a {SHIFT_SECONDS}-second shift at the Snack Shack. Buddies come up with an order; tap the snacks they
            want to fill the tray. Orders get bigger as you go, and serving several in a row with no mistakes earns a
            bonus.
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Pays like the arcade: a coin for every 10 points.
          </ThemedText>
          <Button label="Start my shift" onPress={start} />
          <Button label="Not now" variant="secondary" onPress={() => router.back()} />
        </View>
      )}

      {phase === 'over' && (
        <GameOver
          score={shift.score}
          best={bestBefore}
          payout={payout}
          error={error}
          onPlayAgain={start}
          playAgainLabel="Work another shift"
          backLabel="Back to the Snack Shack"
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  hud: { flexDirection: 'row', justifyContent: 'space-between', padding: Spacing.three },
  play: { flex: 1, paddingHorizontal: Spacing.three, gap: Spacing.three },
  counter: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, padding: Spacing.three, borderRadius: Spacing.three },
  customer: { fontSize: 56 },
  ticket: { flex: 1, backgroundColor: '#FFFDF2', borderRadius: Spacing.two, padding: Spacing.two, gap: Spacing.one },
  ticketHead: { color: '#6B5A2A', fontWeight: 800, letterSpacing: 1 },
  ticketRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  ticketItem: { fontSize: 32 },
  center: { textAlign: 'center' },
  menu: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three, justifyContent: 'center' },
  menuItem: { width: '28%', aspectRatio: 1, borderRadius: Spacing.four, alignItems: 'center', justifyContent: 'center' },
  pressed: { transform: [{ scale: 0.92 }] },
  menuEmoji: { fontSize: 44 },
  intro: { margin: Spacing.four, padding: Spacing.four, borderRadius: Spacing.four, gap: Spacing.three },
});
