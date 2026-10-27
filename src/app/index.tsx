import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AvatarFigure } from '@/components/avatar-figure';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PLACES } from '@/constants/places';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { useGame } from '@/lib/game-store';

const PLACE_SIZE = 0.37;

export default function TownMapScreen() {
  const { player, signOut } = useAuth();
  const { coins, avatar } = useGame();

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
          <Pressable onPress={signOut} accessibilityRole="button">
            <ThemedText type="linkPrimary">Sign out</ThemedText>
          </Pressable>
        </View>

        <View style={styles.map}>
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
  me: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
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
  placeBlurb: { color: '#ffffffDD' },
});
