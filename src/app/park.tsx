import { ThemedText } from '@/components/themed-text';
import { PlaceScreen } from '@/components/place-screen';

export default function ParkScreen() {
  return (
    <PlaceScreen title="Park" color="#5DB37E" visit="visit:park">
      <ThemedText>Add friends, send them friendly preset messages, and visit their houses.</ThemedText>
    </PlaceScreen>
  );
}
