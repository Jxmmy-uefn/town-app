import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { MOOD_TEXT, type Mood } from '@/lib/daily-logic';

const MOOD_COLOR: Record<Mood, string> = { full: '#3DBB5C', okay: '#F2B84B', hungry: '#E8735A' };

/** Your buddy's Food bar. It only changes how your buddy looks; nothing is ever lost. */
export function FoodBar({ food, mood, compact }: { food: number; mood: Mood; compact?: boolean }) {
  const theme = useTheme();
  return (
    <View style={styles.wrap} accessibilityLabel={`Food ${Math.round(food)} percent. ${MOOD_TEXT[mood]}`}>
      {!compact && (
        <View style={styles.row}>
          <ThemedText type="smallBold">Food</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {MOOD_TEXT[mood]}
          </ThemedText>
        </View>
      )}
      <View style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
        <View style={[styles.fill, { width: `${Math.max(3, food)}%`, backgroundColor: MOOD_COLOR[mood] }]}>
          <View style={styles.shine} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.one, flex: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  track: { height: 14, borderRadius: 7, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 7 },
  // Glossy top highlight, Aero style.
  shine: { height: '45%', marginHorizontal: 3, marginTop: 1, borderRadius: 4, backgroundColor: '#ffffff66' },
});
