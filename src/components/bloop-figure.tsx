import { useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import type { Trick } from '@/lib/pet-logic';

/** Plays a trick on a Bloop. Returns the animated style to put on the figure. */
export function useBloopTricks() {
  const [value] = useState(() => new Animated.Value(0));
  const [trick, setTrick] = useState<Trick['id']>('hop');

  const perform = (id: Trick['id']) => {
    setTrick(id);
    value.setValue(0);
    Animated.timing(value, {
      toValue: 1,
      duration: id === 'flip' ? 900 : 700,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  const lift = value.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -40, 0] });
  const squash = value.interpolate({ inputRange: [0, 0.1, 0.5, 0.9, 1], outputRange: [1, 0.8, 1.1, 0.85, 1] });
  const spin = value.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const wiggle = value.interpolate({
    inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
    outputRange: ['0deg', '-14deg', '14deg', '-10deg', '10deg', '0deg'],
  });

  const style = {
    hop: { transform: [{ translateY: lift }, { scaleY: squash }] },
    wiggle: { transform: [{ rotate: wiggle }] },
    spin: { transform: [{ rotate: spin }] },
    flip: { transform: [{ translateY: lift }, { rotate: spin }] },
  }[trick];

  return { perform, style };
}

/** A glossy jelly blob with a shine and two eyes. Placeholder until the real art exists. */
export function BloopFigure({ color, size = 80 }: { color: string; size?: number }) {
  const eye = size * 0.11;
  return (
    <View
      style={{
        width: size,
        height: size * 0.82,
        borderTopLeftRadius: size * 0.5,
        borderTopRightRadius: size * 0.5,
        borderBottomLeftRadius: size * 0.36,
        borderBottomRightRadius: size * 0.36,
        backgroundColor: color,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
      <View
        style={[
          styles.shine,
          { top: size * 0.08, left: size * 0.18, width: size * 0.36, height: size * 0.2, borderRadius: size },
        ]}
      />
      <View style={{ flexDirection: 'row', gap: size * 0.16, marginTop: size * 0.08 }}>
        <View style={[styles.eye, { width: eye, height: eye * 1.4, borderRadius: eye }]} />
        <View style={[styles.eye, { width: eye, height: eye * 1.4, borderRadius: eye }]} />
      </View>
      <View style={[styles.cheekRow, { gap: size * 0.38, marginTop: size * 0.02 }]}>
        <View style={[styles.cheek, { width: eye, height: eye * 0.6, borderRadius: eye }]} />
        <View style={[styles.cheek, { width: eye, height: eye * 0.6, borderRadius: eye }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shine: { position: 'absolute', backgroundColor: '#FFFFFF8C' },
  eye: { backgroundColor: '#1B2433' },
  cheekRow: { flexDirection: 'row' },
  cheek: { backgroundColor: '#FFFFFF59' },
});
