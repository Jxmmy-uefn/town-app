import type { ReactNode } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

type PlaceScreenProps = {
  title: string;
  color: string;
  children: ReactNode;
};

/** Shared layout for a town location until each one gets its own art and features. */
export function PlaceScreen({ title, color, children }: PlaceScreenProps) {
  return (
    <ThemedView style={styles.fill}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedView style={[styles.banner, { backgroundColor: color }]}>
          <ThemedText type="subtitle" style={styles.bannerText}>
            {title}
          </ThemedText>
        </ThemedView>
        {children}
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
  },
  bannerText: { color: '#ffffff' },
});
