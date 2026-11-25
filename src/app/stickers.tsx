import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { currentHiddenSpot, STICKERS, type Sticker } from '@/lib/sticker-logic';
import { useTownLife } from '@/lib/town-life';

function Page({ title, blurb, list, owned }: { title: string; blurb: string; list: Sticker[]; owned: string[] }) {
  const theme = useTheme();
  const count = list.filter((s) => owned.includes(s.id)).length;
  return (
    <View style={[styles.page, { backgroundColor: theme.backgroundElement }]}>
      <View style={styles.pageHead}>
        <ThemedText type="smallBold">{title}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {count} of {list.length}
        </ThemedText>
      </View>
      <ThemedText type="small" themeColor="textSecondary">
        {blurb}
      </ThemedText>
      <View style={styles.grid}>
        {list.map((s) => {
          const have = owned.includes(s.id);
          return (
            <View
              key={s.id}
              accessibilityLabel={have ? s.name : 'Empty sticker slot'}
              style={[styles.slot, { backgroundColor: theme.background }, have && styles.slotFilled]}>
              <Text style={[styles.slotEmoji, !have && styles.missing]}>{have ? s.emoji : '?'}</Text>
              <ThemedText type="small" numberOfLines={2} style={styles.slotName}>
                {have ? s.name : '???'}
              </ThemedText>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function StickerBookScreen() {
  const { stickers } = useTownLife();
  const { daysLeft } = currentHiddenSpot();
  return (
    <ThemedView style={styles.fill}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="subtitle">Sticker Book</ThemedText>
        <Page
          title="Hidden in town"
          blurb={`One sticker is hiding somewhere in town. It moves in ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}. Check the Bubble Bulletin at Town Hall for a clue. Missed one? They all come back around later.`}
          list={STICKERS.filter((s) => s.source === 'hidden')}
          owned={stickers}
        />
        <Page
          title="Gumball prizes"
          blurb="These roll out of the Gumball Machine. You never get the same one twice."
          list={STICKERS.filter((s) => s.source === 'gumball')}
          owned={stickers}
        />
        <Page
          title="From friends"
          blurb="Bring a town resident the snack they ask for each day. After five visits you're best friends, and they give you their own sticker."
          list={STICKERS.filter((s) => s.source === 'friend')}
          owned={stickers}
        />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { padding: Spacing.three, gap: Spacing.three },
  page: { padding: Spacing.three, borderRadius: Spacing.three, gap: Spacing.two },
  pageHead: { flexDirection: 'row', justifyContent: 'space-between' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  slot: {
    width: '23%',
    aspectRatio: 0.85,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.one,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#9FB7CC',
  },
  slotFilled: { borderStyle: 'solid', borderColor: '#5DB4FF' },
  slotEmoji: { fontSize: 32 },
  missing: { opacity: 0.35 },
  slotName: { textAlign: 'center' },
});
