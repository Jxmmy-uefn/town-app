import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { clueAt, currentMystery, NEW_CASE } from '@/lib/mystery-logic';
import { resident } from '@/lib/resident-logic';
import { useTownLife } from '@/lib/town-life';

/** Shows "Ask about the case" when this place has the next clue in this month's mystery. */
export function MysteryClue({ place }: { place: string }) {
  const { cases, findClue } = useTownLife();
  const [heard, setHeard] = useState<string | null>(null);
  const mystery = currentMystery();
  const progress = cases[mystery.id] ?? NEW_CASE;
  const step = clueAt(mystery, progress, place);
  const who = step ? resident(step.residentId) : undefined;

  if (heard) {
    return (
      <View style={styles.card}>
        <ThemedText type="small" style={styles.kicker}>
          NEW CLUE
        </ThemedText>
        <ThemedText style={styles.text}>“{heard}”</ThemedText>
        <Link href="/mystery" asChild>
          <Button label="Open the case file" variant="secondary" />
        </Link>
      </View>
    );
  }
  if (!step || !who) return null;

  return (
    <View style={styles.card}>
      <ThemedText type="small" style={styles.kicker}>
        TOWN MYSTERY
      </ThemedText>
      <ThemedText style={styles.text}>
        {who.name} might know something about {mystery.title.replace(/^The /, 'the ')}.
      </ThemedText>
      <Button
        label={`Ask ${who.name}`}
        onPress={() => {
          findClue(mystery.id);
          setHeard(step.clue);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // A manila case-file look.
  card: { backgroundColor: '#F4E3B5', borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.two },
  kicker: { color: '#7A5A12', fontWeight: 800, letterSpacing: 1 },
  text: { color: '#3D2D05' },
});
