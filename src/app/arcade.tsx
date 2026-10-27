import { ThemedText } from '@/components/themed-text';
import { PlaceScreen } from '@/components/place-screen';

export default function ArcadeScreen() {
  return (
    <PlaceScreen title="Arcade" color="#E8735A">
      <ThemedText type="smallBold">Coming soon</ThemedText>
      <ThemedText>Catch: move your basket to catch falling treats before they hit the ground.</ThemedText>
      <ThemedText>Match-3: swap tiles to line up three or more of a kind.</ThemedText>
      <ThemedText themeColor="textSecondary">
        Scores earn up to 50 coins a game, with a daily limit of 500 coins.
      </ThemedText>
    </PlaceScreen>
  );
}
