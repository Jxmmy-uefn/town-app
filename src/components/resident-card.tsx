import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { dayKey, snack } from '@/lib/daily-logic';
import { useGame } from '@/lib/game-store';
import { MENU } from '@/games/snack-job-logic';
import { dailyLine, dailyRequest, friendStickerId, HEARTS_FOR_STICKER, residentAt } from '@/lib/resident-logic';
import { sticker } from '@/lib/sticker-logic';
import { useTownLife } from '@/lib/town-life';

/** The resident who hangs out at this place: today's chat line and snack favor. */
export function ResidentCard({ place }: { place: string }) {
  const theme = useTheme();
  const { coins } = useGame();
  const { friends, giftResident } = useTownLife();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const r = residentAt(place);
  if (!r) return null;

  const today = dayKey();
  const wish = snack(dailyRequest(r, today, MENU));
  const friend = friends[r.id] ?? { hearts: 0, lastGift: null };
  const giftedToday = friend.lastGift === today;
  const friendSticker = sticker(friendStickerId(r.id));

  async function onGift() {
    if (!wish) return;
    setBusy(true);
    const error = await giftResident(r!.id, wish.slug);
    setBusy(false);
    if (error) return setMessage(error);
    const hearts = Math.min(HEARTS_FOR_STICKER, friend.hearts + 1);
    setMessage(
      hearts >= HEARTS_FOR_STICKER && friend.hearts < HEARTS_FOR_STICKER
        ? `${r!.thanks} Best friends! ${r!.name} gave you the ${friendSticker?.name} sticker.`
        : r!.thanks,
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
      <View style={styles.row}>
        {/* Placeholder glossy buddy until the real art exists. */}
        <View style={[styles.buddy, { backgroundColor: r.color }]}>
          <View style={styles.shine} />
          <Text style={styles.face}>{r.face}</Text>
        </View>
        <View style={styles.text}>
          <ThemedText type="smallBold">{r.name}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {r.about}
          </ThemedText>
          <ThemedText type="small" accessibilityLabel={`Friendship ${friend.hearts} of ${HEARTS_FOR_STICKER}`}>
            {'♥'.repeat(friend.hearts)}
            <ThemedText type="small" themeColor="textSecondary">
              {'♡'.repeat(HEARTS_FOR_STICKER - friend.hearts)}
            </ThemedText>
          </ThemedText>
        </View>
      </View>

      <View style={[styles.bubble, { backgroundColor: theme.background }]}>
        <ThemedText>“{dailyLine(r, today)}”</ThemedText>
      </View>

      {wish && !giftedToday && (
        <>
          <ThemedText type="small" themeColor="textSecondary">
            {r.name} would love a {wish.emoji} {wish.name} today ({wish.price} coins).
          </ThemedText>
          <Button
            label={`Bring the ${wish.name}`}
            disabled={busy || coins < wish.price}
            onPress={onGift}
            variant="secondary"
          />
        </>
      )}
      {giftedToday && !message && (
        <ThemedText type="small" themeColor="textSecondary">
          You brought {r.name} a snack today. Come back tomorrow to chat again.
        </ThemedText>
      )}
      {message && <ThemedText>{message}</ThemedText>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.two },
  row: { flexDirection: 'row', gap: Spacing.three, alignItems: 'center' },
  buddy: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  shine: { position: 'absolute', top: 6, left: 12, width: 30, height: 16, borderRadius: 16, backgroundColor: '#FFFFFF80' },
  face: { fontSize: 30 },
  text: { flex: 1, gap: Spacing.half },
  bubble: { borderRadius: Spacing.three, padding: Spacing.three },
});
