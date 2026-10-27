import { ThemedText } from '@/components/themed-text';
import { PlaceScreen } from '@/components/place-screen';

const RULES = [
  'Be kind. No bullying, hate or harassment.',
  'Keep personal info private: no real names, addresses, phone numbers or social media.',
  'No cheating or exploiting bugs. Report bugs instead.',
  'Report anything that makes you uncomfortable. Moderators review every report.',
];

export default function TownHallScreen() {
  return (
    <PlaceScreen title="Town Hall" color="#7A8CE0">
      <ThemedText type="smallBold">Town rules</ThemedText>
      {RULES.map((rule, i) => (
        <ThemedText key={rule}>
          {i + 1}. {rule}
        </ThemedText>
      ))}
    </PlaceScreen>
  );
}
