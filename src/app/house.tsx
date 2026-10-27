import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions, type GestureResponderEvent } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { catalogItem } from '@/constants/items';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ownedWithDetails, useGame, type Placement, type Rotation } from '@/lib/game-store';

const ITEM_SIZE = 64;
const TAP_SLOP = 6;

function clamp(value: number) {
  return Math.min(0.92, Math.max(0.08, value));
}

type PlacedItemProps = {
  placement: Placement;
  roomSize: number;
  selected: boolean;
  onSelect: () => void;
  onDrop: (x: number, y: number) => void;
};

function PlacedItem({ placement, roomSize, selected, onSelect, onDrop }: PlacedItemProps) {
  const [drag, setDrag] = useState({ dx: 0, dy: 0 });
  const start = useRef({ x: 0, y: 0 });

  const offset = (e: GestureResponderEvent) => ({
    dx: e.nativeEvent.pageX - start.current.x,
    dy: e.nativeEvent.pageY - start.current.y,
  });

  return (
    <View
      accessibilityLabel={catalogItem(placement.slug)?.name}
      onStartShouldSetResponder={() => true}
      onResponderGrant={(e) => {
        start.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY };
      }}
      onResponderMove={(e) => setDrag(offset(e))}
      onResponderRelease={(e) => {
        const { dx, dy } = offset(e);
        setDrag({ dx: 0, dy: 0 });
        if (Math.abs(dx) < TAP_SLOP && Math.abs(dy) < TAP_SLOP) onSelect();
        else onDrop(clamp(placement.x + dx / roomSize), clamp(placement.y + dy / roomSize));
      }}
      onResponderTerminate={() => setDrag({ dx: 0, dy: 0 })}
      style={[
        styles.placed,
        {
          left: placement.x * roomSize - ITEM_SIZE / 2 + drag.dx,
          top: placement.y * roomSize - ITEM_SIZE / 2 + drag.dy,
          transform: [{ rotate: `${placement.rotation}deg` }],
        },
        selected && styles.selected,
      ]}>
      <Text style={styles.itemEmoji}>{catalogItem(placement.slug)?.emoji}</Text>
    </View>
  );
}

export default function HouseScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const roomSize = Math.min(width - Spacing.three * 2, 480);
  const { owned, placements, place, move, unplace } = useGame();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const placedIds = new Set(placements.map((p) => p.inventoryId));
  const stored = ownedWithDetails(owned).filter(
    (item) => item.category === 'furniture' && !placedIds.has(item.inventoryId),
  );
  const selected = placements.find((p) => p.inventoryId === selectedId);

  return (
    <ThemedView style={styles.fill}>
      <ScrollView contentContainerStyle={styles.content} scrollEnabled={false}>
        <View style={[styles.room, { width: roomSize, height: roomSize }]}>
          <View style={styles.wall} />
          {placements.map((p) => (
            <PlacedItem
              key={p.inventoryId}
              placement={p}
              roomSize={roomSize}
              selected={p.inventoryId === selectedId}
              onSelect={() => setSelectedId(p.inventoryId === selectedId ? null : p.inventoryId)}
              onDrop={(x, y) => move({ ...p, x, y })}
            />
          ))}
        </View>

        {selected ? (
          <View style={styles.actions}>
            <Button
              label="Rotate"
              variant="secondary"
              onPress={() => move({ ...selected, rotation: ((selected.rotation + 90) % 360) as Rotation })}
            />
            <Button
              label="Put away"
              variant="secondary"
              onPress={() => {
                unplace(selected.inventoryId);
                setSelectedId(null);
              }}
            />
          </View>
        ) : (
          <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
            Drag furniture to move it. Tap a piece to rotate it or put it away.
          </ThemedText>
        )}

        <ThemedText type="smallBold">Your furniture</ThemedText>
        {stored.length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary">
            {owned.length === 0 ? 'Buy furniture at the Shop to decorate.' : 'Everything you own is placed.'}
          </ThemedText>
        ) : (
          <View style={styles.tray}>
            {stored.map((item) => (
              <Pressable
                key={item.inventoryId}
                accessibilityRole="button"
                accessibilityLabel={`Place ${item.name}`}
                onPress={() => place(item.inventoryId)}
                style={[styles.trayItem, { backgroundColor: theme.backgroundElement }]}>
                <Text style={styles.trayEmoji}>{item.emoji}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { padding: Spacing.three, gap: Spacing.three, alignItems: 'stretch' },
  room: {
    alignSelf: 'center',
    borderRadius: Spacing.three,
    backgroundColor: '#E9C9A1',
    overflow: 'hidden',
  },
  wall: { height: '25%', backgroundColor: '#F4E3CF' },
  placed: {
    position: 'absolute',
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: { borderWidth: 2, borderColor: '#208AEF', borderRadius: Spacing.two, borderStyle: 'dashed' },
  itemEmoji: { fontSize: 48 },
  actions: { flexDirection: 'row', gap: Spacing.three, justifyContent: 'center' },
  center: { textAlign: 'center' },
  tray: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  trayItem: {
    width: 64,
    height: 64,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trayEmoji: { fontSize: 36 },
});
