import { useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { BloopFigure, useBloopTricks } from '@/components/bloop-figure';
import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { dayKey } from '@/lib/daily-logic';
import { BLOOP_COLORS, BLOOP_NAMES, colorHex, knownTricks, nextTrick, TRICKS } from '@/lib/pet-logic';
import { useTownLife } from '@/lib/town-life';

function Adopt() {
  const theme = useTheme();
  const { adoptBloop } = useTownLife();
  const [color, setColor] = useState(BLOOP_COLORS[0].id);
  const [name, setName] = useState(BLOOP_NAMES[0]);
  return (
    <>
      <ThemedText type="subtitle">Adopt a Bloop</ThemedText>
      <ThemedText themeColor="textSecondary">
        Bloops are little jelly pets that hang out with your buddy. Adopting one is free.
      </ThemedText>
      <View style={styles.center}>
        <BloopFigure color={colorHex(color)} size={120} />
      </View>
      <ThemedText type="smallBold">Color</ThemedText>
      <View style={styles.wrap}>
        {BLOOP_COLORS.map((c) => (
          <Pressable
            key={c.id}
            accessibilityRole="button"
            accessibilityLabel={c.name}
            accessibilityState={{ selected: color === c.id }}
            onPress={() => setColor(c.id)}
            style={[styles.swatch, { backgroundColor: c.hex }, color === c.id && styles.swatchOn]}
          />
        ))}
      </View>
      <ThemedText type="smallBold">Name</ThemedText>
      <View style={styles.wrap}>
        {BLOOP_NAMES.map((n) => (
          <Pressable
            key={n}
            accessibilityRole="button"
            accessibilityState={{ selected: name === n }}
            onPress={() => setName(n)}
            style={[
              styles.chip,
              { backgroundColor: name === n ? '#208AEF' : theme.backgroundElement },
            ]}>
            <ThemedText type="smallBold" style={name === n && styles.chipOn}>
              {n}
            </ThemedText>
          </Pressable>
        ))}
      </View>
      <Button label={`Adopt ${name}`} onPress={() => adoptBloop(name, color)} />
    </>
  );
}

function PlayRoom() {
  const theme = useTheme();
  const { bloop, playWithBloop } = useTownLife();
  const { perform, style } = useBloopTricks();
  const [said, setSaid] = useState<string | null>(null);
  if (!bloop) return null;

  const playedToday = bloop.lastPlay === dayKey();
  const known = knownTricks(bloop);
  const next = nextTrick(bloop);

  function onPlay() {
    playWithBloop();
    perform('hop');
    const learned = TRICKS.find((t) => t.playDays === bloop!.playDays + 1);
    setSaid(learned ? `${bloop!.name} learned a new trick: ${learned.name}!` : `${bloop!.name} had a great time!`);
  }

  return (
    <>
      <ThemedText type="subtitle">{bloop.name}</ThemedText>
      <View style={[styles.stage, { backgroundColor: theme.backgroundElement }]}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Pet ${bloop.name}`} onPress={() => perform('hop')}>
          <Animated.View style={style}>
            <BloopFigure color={colorHex(bloop.color)} size={130} />
          </Animated.View>
        </Pressable>
      </View>
      <Button
        label={playedToday ? 'You played today' : `Play with ${bloop.name}`}
        disabled={playedToday}
        onPress={onPlay}
      />
      {said && <ThemedText style={styles.centerText}>{said}</ThemedText>}

      <ThemedText type="smallBold">Tricks</ThemedText>
      <View style={styles.wrap}>
        {known.map((t) => (
          <Button key={t.id} label={t.name} variant="secondary" onPress={() => perform(t.id)} />
        ))}
      </View>
      <ThemedText type="small" themeColor="textSecondary">
        {next
          ? `Play on ${next.playDays - bloop.playDays} more ${next.playDays - bloop.playDays === 1 ? 'day' : 'days'} to learn ${next.name}. Days don't need to be in a row.`
          : `${bloop.name} knows every trick!`}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {"Bloops never get sad or sick when you're away. They're always happy to see you."}
      </ThemedText>
    </>
  );
}

export default function BloopScreen() {
  const { bloop } = useTownLife();
  return (
    <ThemedView style={styles.fill}>
      <ScrollView contentContainerStyle={styles.content}>{bloop ? <PlayRoom /> : <Adopt />}</ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { padding: Spacing.three, gap: Spacing.three },
  center: { alignItems: 'center', paddingVertical: Spacing.three },
  centerText: { textAlign: 'center' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  swatch: { width: 40, height: 40, borderRadius: 20, borderWidth: 3, borderColor: 'transparent' },
  swatchOn: { borderColor: '#1B2433' },
  chip: { paddingVertical: Spacing.two, paddingHorizontal: Spacing.three, borderRadius: 999 },
  chipOn: { color: '#ffffff' },
  stage: { height: 220, borderRadius: Spacing.four, alignItems: 'center', justifyContent: 'center' },
});
