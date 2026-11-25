import { StyleSheet, View } from 'react-native';

import { PlaceScreen } from '@/components/place-screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { issueFor } from '@/lib/bulletin-logic';

const RULES = [
  'Be kind. No bullying, hate or harassment.',
  'Keep personal info private: no real names, addresses, phone numbers or social media.',
  'No cheating or exploiting bugs. Report bugs instead.',
  'Report anything that makes you uncomfortable. Moderators review every report.',
];

function Bulletin() {
  const theme = useTheme();
  const issue = issueFor();
  const weekOf = issue.weekOf.toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  return (
    <View style={[styles.paper, { backgroundColor: theme.backgroundElement }]}>
      {/* A glossy blue masthead, like a 2000s web portal. */}
      <View style={styles.masthead}>
        <View style={styles.mastShine} />
        <ThemedText type="subtitle" style={styles.mastTitle}>
          The Bubble Bulletin
        </ThemedText>
        <ThemedText type="small" style={styles.mastSub}>
          Issue {issue.number} · Week of {weekOf}
        </ThemedText>
      </View>
      {issue.stories.map((story) => (
        <View key={story.kicker} style={styles.story}>
          <ThemedText type="small" style={styles.kicker}>
            {story.kicker.toUpperCase()}
          </ThemedText>
          <ThemedText type="smallBold">{story.title}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {story.body}
          </ThemedText>
        </View>
      ))}
      <ThemedText type="small" themeColor="textSecondary">
        A new issue comes out every Monday.
      </ThemedText>
    </View>
  );
}

export default function TownHallScreen() {
  return (
    <PlaceScreen title="Town Hall" color="#7A8CE0" visit="visit:town-hall">
      <Bulletin />
      <ThemedText type="smallBold">Town rules</ThemedText>
      {RULES.map((rule, i) => (
        <ThemedText key={rule}>
          {i + 1}. {rule}
        </ThemedText>
      ))}
    </PlaceScreen>
  );
}

const styles = StyleSheet.create({
  paper: { borderRadius: Spacing.three, overflow: 'hidden', gap: Spacing.three, paddingBottom: Spacing.three },
  masthead: { backgroundColor: '#1F7AE0', paddingVertical: Spacing.three, paddingHorizontal: Spacing.three },
  mastShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: '#FFFFFF33',
  },
  mastTitle: { color: '#ffffff', fontSize: 26, lineHeight: 32 },
  mastSub: { color: '#E3F1FF' },
  story: { paddingHorizontal: Spacing.three, gap: Spacing.half },
  kicker: { color: '#1F7AE0', fontWeight: 800, letterSpacing: 1 },
});
