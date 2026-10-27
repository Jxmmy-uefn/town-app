import { ThemedText } from '@/components/themed-text';
import { PlaceScreen } from '@/components/place-screen';

export default function ShopScreen() {
  return (
    <PlaceScreen title="Shop" color="#F2B84B">
      <ThemedText>Clothes for your avatar and furniture for your house will be sold here.</ThemedText>
    </PlaceScreen>
  );
}
