import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AvatarFigure } from '@/components/avatar-figure';
import { FoodBar } from '@/components/food-bar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PLACES } from '@/constants/places';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth';
import { useGame } from '@/lib/game-store';
import { currentParty, textOn } from '@/lib/party-logic';
import { useTownLife } from '@/lib/town-life';

const PLACE_SIZE = 0.37;

export default function TownMapScreen() {
  const { player, signOut } = useAuth();
  const { coins, avatar } = useGame();
  const life = useTownLife();
  const theme = useTheme();
  const choresDone = life.chores.filter((c) => c.claimed).length;
  const party = currentParty();

  return (
    <ThemedView style={styles.fill}>
      <SafeAreaView style={styles.fill}>
        <View style={styles.header}>
          <Link href="/avatar" asChild>
            <Pressable accessibilityRole="button" accessibilityLabel="Change your look" style={styles.me}>
              <AvatarFigure avatar={avatar} size={44} />
              <View>
                <ThemedText type="smallBold">{player?.username}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {coins} coins
                </ThemedText>
              </View>
            </Pressable>
          </Link>
          <View style={styles.headerLinks}>
            <Link href="/stickers" asChild>
              <Pressable accessibilityRole="button">
                <ThemedText type="linkPrimary">Stickers</ThemedText>
              </Pressable>
            </Link>
            <Pressable onPress={signOut} accessibilityRole="button">
              <ThemedText type="linkPrimary">Sign out</ThemedText>
            </Pressable>
          </View>
        </View>

        <Link href="/daily" asChild>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Today in town: gumball, chores and food"
            style={StyleSheet.flatten([styles.today, { backgroundColor: theme.backgroundElement }])}>
            <View style={styles.todayItem}>
              <ThemedText type="smallBold">{life.gumballReady ? '🍬 Free gumball!' : '🍬 Back tomorrow'}</ThemedText>
            </View>
            <View style={styles.todayItem}>
              <ThemedText type="smallBold">
                📝 Chores {choresDone}/{life.chores.length}
              </ThemedText>
            </View>
            <View style={[styles.todayItem, styles.todayFood]}>
              <ThemedText type="smallBold">🍕</ThemedText>
              <FoodBar food={life.food} mood={life.mood} compact />
            </View>
          </Pressable>
        </Link>

        {party && (
          <Link href="/party" asChild>
            <Pressable
              accessibilityRole="button"
              style={StyleSheet.flatten([styles.partyBanner, { backgroundColor: party.accent }])}>
              <ThemedText type="smallBold" style={StyleSheet.flatten([styles.partyText, { color: textOn(party.accent) }])}>
                🎉 {party.name} is on! Tap for your free gift.
              </ThemedText>
            </Pressable>
          </Link>
        )}

        <View style={StyleSheet.flatten([styles.map, party && { backgroundColor: party.color }])}>
          {party?.decor.map((emoji, i) => (
            <ThemedText
              key={i}
              style={StyleSheet.flatten([styles.decor, { left: `${20 + i * 30}%`, top: `${29 + (i % 2) * 33}%` }])}>
              {emoji}
            </ThemedText>
          ))}
          {PLACES.map((place) => (
            <Link key={place.id} href={place.href} asChild>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${place.name}: ${place.blurb}`}
                // Link's asChild can't take a style array, so pass one flat object.
                style={StyleSheet.flatten([
                  styles.place,
                  {
                    left: `${place.x * 100}%`,
                    top: `${place.y * 100}%`,
                    width: `${PLACE_SIZE * 100}%`,
                    backgroundColor: place.color,
                  },
                ])}>
                <ThemedText type="smallBold" style={styles.placeName}>
                  {place.name}
                </ThemedText>
                <ThemedText type="small" style={styles.placeBlurb}>
                  {place.blurb}
                </ThemedText>
              </Pressable>
            </Link>
          ))}
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  headerLinks: { flexDirection: 'row', gap: Spacing.three },
  me: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  today: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginHorizontal: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.three,
  },
  todayItem: { flexShrink: 1 },
  todayFood: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  map: {
    flex: 1,
    margin: Spacing.three,
    borderRadius: Spacing.four,
    backgroundColor: '#BFE3B4',
    overflow: 'hidden',
  },
  place: {
    position: 'absolute',
    aspectRatio: 1,
    borderRadius: Spacing.three,
    padding: Spacing.two,
    justifyContent: 'flex-end',
  },
  placeName: { color: '#ffffff' },
  partyBanner: {
    marginHorizontal: Spacing.three,
    marginTop: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
  partyText: { textAlign: 'center' },
  decor: { position: 'absolute', fontSize: 28, lineHeight: 34 },
  placeBlurb: { color: '#ffffffDD' },
});
