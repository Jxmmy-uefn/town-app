import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AvatarFigure } from '@/components/avatar-figure';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import type { ClothingSlot } from '@/constants/items';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ownedWithDetails, useGame } from '@/lib/game-store';

const SKINS = ['#FBE3CC', '#F1C27D', '#E0AC69', '#C68642', '#8D5524', '#5C3A1E'];
const SHIRT_COLORS = ['#208AEF', '#E8735A', '#5DB37E', '#F2B84B', '#C77DBA', '#3A3F47'];
const SLOTS: { id: ClothingSlot; label: string }[] = [
  { id: 'hat', label: 'Hat' },
  { id: 'shirt', label: 'Shirt' },
  { id: 'shoes', label: 'Shoes' },
];

function Swatches({ colors, value, onPick, label }: { colors: string[]; value: string; onPick: (c: string) => void; label: string }) {
  return (
    <View style={styles.row}>
      {colors.map((color) => (
        <Pressable
          key={color}
          accessibilityRole="button"
          accessibilityLabel={`${label} ${color}`}
          accessibilityState={{ selected: value === color }}
          onPress={() => onPick(color)}
          style={[styles.swatch, { backgroundColor: color }, value === color && styles.picked]}
        />
      ))}
    </View>
  );
}

export default function AvatarScreen() {
  const theme = useTheme();
  const { avatar, owned, saveAvatar } = useGame();
  const clothes = ownedWithDetails(owned).filter((item) => item.category === 'clothing');

  return (
    <ThemedView style={styles.fill}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.preview, { backgroundColor: theme.backgroundElement }]}>
          <AvatarFigure avatar={avatar} size={180} />
        </View>

        <ThemedText type="smallBold">Skin</ThemedText>
        <Swatches label="Skin" colors={SKINS} value={avatar.skin} onPick={(skin) => saveAvatar({ ...avatar, skin })} />

        <ThemedText type="smallBold">Shirt color</ThemedText>
        <Swatches
          label="Shirt color"
          colors={SHIRT_COLORS}
          value={avatar.shirtColor}
          onPick={(shirtColor) => saveAvatar({ ...avatar, shirtColor })}
        />

        {SLOTS.map((slot) => {
          const options = clothes.filter((item) => item.slot === slot.id);
          return (
            <View key={slot.id} style={styles.slot}>
              <ThemedText type="smallBold">{slot.label}</ThemedText>
              {options.length === 0 ? (
                <ThemedText type="small" themeColor="textSecondary">
                  Buy one at the Shop.
                </ThemedText>
              ) : (
                <View style={styles.row}>
                  {[{ slug: undefined, emoji: '🚫', name: 'None' }, ...options].map((item) => {
                    const on = avatar[slot.id] === item.slug;
                    return (
                      <Pressable
                        key={item.slug ?? 'none'}
                        accessibilityRole="button"
                        accessibilityLabel={item.name}
                        accessibilityState={{ selected: on }}
                        onPress={() => saveAvatar({ ...avatar, [slot.id]: item.slug })}
                        style={[styles.option, { backgroundColor: theme.backgroundElement }, on && styles.picked]}>
                        <Text style={styles.optionEmoji}>{item.emoji}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { padding: Spacing.three, gap: Spacing.three },
  preview: { alignItems: 'center', paddingVertical: Spacing.four, borderRadius: Spacing.four },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  swatch: { width: 40, height: 40, borderRadius: 20 },
  picked: { borderWidth: 3, borderColor: '#208AEF' },
  slot: { gap: Spacing.two },
  option: { width: 56, height: 56, borderRadius: Spacing.three, alignItems: 'center', justifyContent: 'center' },
  optionEmoji: { fontSize: 30 },
});
