import { ThemedText } from '@/components/themed-text';
import { PlaceScreen } from '@/components/place-screen';

export default function HouseScreen() {
  return (
    <PlaceScreen title="Your House" color="#C77DBA">
      <ThemedText>Place the furniture you buy anywhere in your room. Friends can drop by to visit.</ThemedText>
    </PlaceScreen>
  );
}
