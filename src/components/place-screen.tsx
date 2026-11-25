import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { ResidentCard } from '@/components/resident-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { TownEvent } from '@/lib/daily-logic';
import { currentHiddenSpot, sticker } from '@/lib/sticker-logic';
import { useRecordVisit, useTownLife } from '@/lib/town-life';

type PlaceScreenProps = {
  title: string;
  color: string;
  children: ReactNode;
  /** Counts toward a "visit this place" chore, and lets a hidden sticker show up here. */
  visit?: TownEvent;
};

/** The sticker hidden in this place this fortnight, if you haven't found it yet. */
function HiddenSticker({ place }: { place: string }) {
  const { stickers, addSticker } = useTownLife();
  const [found, setFound] = useState(false);
  const { spot } = currentHiddenSpot();
  const details = sticker(spot.stickerId);
  if (spot.place !== place || !details) return null;
  if (found) {
    return (
      <ThemedText type="smallBold" style={styles.foundText}>
        You found the {details.name} sticker!
      </ThemedText>
    );
  }
  if (stickers.includes(spot.stickerId)) return null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Something small and shiny"
      hitSlop={12}
      onPress={() => {
        addSticker(spot.stickerId);
        setFound(true);
      }}
      style={[styles.hidden, { left: `${spot.x * 100}%`, top: `${spot.y * 100}%` }]}>
      <Text style={styles.hiddenEmoji}>{details.emoji}</Text>
    </Pressable>
  );
}

/** Shared layout for a town location until each one gets its own art and features. */
export function PlaceScreen({ title, color, visit, children }: PlaceScreenProps) {
  useRecordVisit(visit);
  const place = visit?.startsWith('visit:') ? visit.slice('visit:'.length) : null;
  return (
    <ThemedView style={styles.fill}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedView style={[styles.banner, { backgroundColor: color }]}>
          <ThemedText type="subtitle" style={styles.bannerText}>
            {title}
          </ThemedText>
          {place && <HiddenSticker place={place} />}
        </ThemedView>
        {children}
        {place && <ResidentCard place={place} />}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { padding: Spacing.three, gap: Spacing.three },
  banner: {
    height: 140,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  bannerText: { color: '#ffffff' },
  // Small and a little see-through, so it takes a sharp eye to spot.
  hidden: { position: 'absolute', marginLeft: -12, marginTop: -12, opacity: 0.85 },
  hiddenEmoji: { fontSize: 20 },
  foundText: { color: '#ffffff', position: 'absolute', bottom: Spacing.two },
});
