import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { currentMystery, NEW_CASE, readyToSolve } from '@/lib/mystery-logic';
import { resident } from '@/lib/resident-logic';
import { sticker } from '@/lib/sticker-logic';
import { useTownLife } from '@/lib/town-life';

const PLACE_NAMES: Record<string, string> = {
  arcade: 'the Arcade',
  shop: 'the Shop',
  'town-hall': 'Town Hall',
  park: 'the Park',
  'snack-shack': 'the Snack Shack',
};

export default function MysteryScreen() {
  const { cases, solveCase } = useTownLife();
  const [wrong, setWrong] = useState(false);
  const mystery = currentMystery();
  const progress = cases[mystery.id] ?? NEW_CASE;
  const next = mystery.steps[progress.found];
  const nextWho = next ? resident(next.residentId) : undefined;
  const badge = sticker(mystery.stickerId);

  return (
    <ThemedView style={styles.fill}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.file}>
          <ThemedText type="small" style={styles.kicker}>
            CASE FILE · THIS MONTH
          </ThemedText>
          <ThemedText type="subtitle" style={[styles.ink, styles.title]}>
            {mystery.title}
          </ThemedText>
          <ThemedText style={styles.ink}>{mystery.intro}</ThemedText>

          <ThemedText type="smallBold" style={styles.ink}>
            Clues ({progress.found} of {mystery.steps.length})
          </ThemedText>
          {mystery.steps.slice(0, progress.found).map((step, i) => (
            <View key={i} style={styles.clue}>
              <ThemedText type="small" style={styles.kicker}>
                {resident(step.residentId)?.name.toUpperCase()}, {PLACE_NAMES[step.place].toUpperCase()}
              </ThemedText>
              <ThemedText style={styles.ink}>“{step.clue}”</ThemedText>
            </View>
          ))}
          {next && nextWho && !progress.solved && (
            <ThemedText type="small" style={styles.ink}>
              Next lead: visit {nextWho.name} at {PLACE_NAMES[next.place]}.
            </ThemedText>
          )}
        </View>

        {readyToSolve(mystery, progress) && (
          <View style={styles.file}>
            <ThemedText type="smallBold" style={styles.ink}>
              {mystery.question}
            </ThemedText>
            {mystery.options.map((option, i) => (
              <Pressable
                key={option}
                accessibilityRole="button"
                onPress={() => {
                  if (i === mystery.answer) solveCase(mystery.id, mystery.stickerId);
                  else setWrong(true);
                }}
                style={({ pressed }) => [styles.option, pressed && styles.pressed]}>
                <ThemedText style={styles.ink}>{option}</ThemedText>
              </Pressable>
            ))}
            {wrong && (
              <ThemedText type="small" style={styles.ink}>
                Hmm, that doesn’t fit the clues. Read them again and take another guess.
              </ThemedText>
            )}
          </View>
        )}

        {progress.solved && (
          <View style={styles.file}>
            <ThemedText type="smallBold" style={styles.ink}>
              Solved!
            </ThemedText>
            <ThemedText style={styles.ink}>{mystery.ending}</ThemedText>
            {badge && (
              <ThemedText style={styles.ink}>
                {badge.emoji} You earned the {badge.name} sticker. A new mystery arrives next month.
              </ThemedText>
            )}
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { padding: Spacing.three, gap: Spacing.three },
  file: { backgroundColor: '#F4E3B5', borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.two },
  kicker: { color: '#7A5A12', fontWeight: 800, letterSpacing: 1 },
  ink: { color: '#3D2D05' },
  title: { fontSize: 26, lineHeight: 32 },
  clue: { backgroundColor: '#FFF6DC', borderRadius: Spacing.two, padding: Spacing.two, gap: Spacing.half },
  option: { backgroundColor: '#FFF6DC', borderRadius: Spacing.two, padding: Spacing.three },
  pressed: { opacity: 0.7 },
});
