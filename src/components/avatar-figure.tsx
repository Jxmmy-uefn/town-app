import { StyleSheet, Text, View } from 'react-native';

import { catalogItem } from '@/constants/items';
import type { Avatar } from '@/lib/game-store';

/** A simple shapes-and-emoji character until the real avatar art exists. */
export function AvatarFigure({ avatar, size = 120 }: { avatar: Avatar; size?: number }) {
  const unit = size / 10;
  const hat = avatar.hat && catalogItem(avatar.hat)?.emoji;
  const shirt = avatar.shirt && catalogItem(avatar.shirt)?.emoji;
  const shoes = avatar.shoes && catalogItem(avatar.shoes)?.emoji;

  return (
    <View style={{ width: size * 0.7, height: size, alignItems: 'center' }}>
      <View
        style={{
          marginTop: unit * 1.6,
          width: unit * 3.4,
          height: unit * 3.4,
          borderRadius: unit * 1.7,
          backgroundColor: avatar.skin,
        }}
      />
      <View
        style={[
          styles.body,
          {
            width: unit * 5,
            height: unit * 3.6,
            borderRadius: unit * 1.4,
            marginTop: unit * 0.2,
            backgroundColor: avatar.shirtColor,
          },
        ]}>
        {shirt && <Text style={{ fontSize: unit * 2.2 }}>{shirt}</Text>}
      </View>
      {hat && <Text style={[styles.abs, { top: 0, fontSize: unit * 2.6 }]}>{hat}</Text>}
      {shoes && <Text style={[styles.abs, { bottom: 0, fontSize: unit * 1.6 }]}>{shoes}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  body: { alignItems: 'center', justifyContent: 'center' },
  abs: { position: 'absolute' },
});
