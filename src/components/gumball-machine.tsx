import { useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

const GUM_COLORS = ['#FF5C8A', '#3DB2FF', '#7BE36B', '#FFD23F', '#B77CFF', '#FF9F43'];
// Fixed spots inside the glass dome, as fractions of its size.
const GUMS = Array.from({ length: 14 }, (_, i) => ({
  x: 0.2 + ((i * 37) % 60) / 100,
  y: 0.45 + ((i * 29) % 40) / 100,
  color: GUM_COLORS[i % GUM_COLORS.length],
}));

/** A glossy 2000s gumball machine drawn with shapes. `shake` wiggles it. */
export function useGumballShake() {
  const [value] = useState(() => new Animated.Value(0));
  const shake = () =>
    new Promise<void>((resolve) => {
      value.setValue(0);
      Animated.timing(value, { toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: true }).start(() =>
        resolve(),
      );
    });
  const rotate = value.interpolate({
    inputRange: [0, 0.15, 0.3, 0.45, 0.6, 0.75, 1],
    outputRange: ['0deg', '-6deg', '6deg', '-5deg', '5deg', '-2deg', '0deg'],
  });
  return { shake, rotate };
}

export function GumballMachine({ size = 200, rotate }: { size?: number; rotate?: Animated.AnimatedInterpolation<string> }) {
  const dome = size * 0.8;
  const gum = dome * 0.16;
  return (
    <Animated.View style={{ width: size, alignItems: 'center', transform: rotate ? [{ rotate }] : [] }}>
      <View style={[styles.cap, { width: dome * 0.3, height: dome * 0.1, borderRadius: dome * 0.05 }]} />
      <View style={[styles.dome, { width: dome, height: dome, borderRadius: dome / 2 }]}>
        {GUMS.map((g, i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: g.x * dome - gum / 2,
              top: g.y * dome - gum / 2,
              width: gum,
              height: gum,
              borderRadius: gum / 2,
              backgroundColor: g.color,
            }}>
            <View style={[styles.gumShine, { width: gum * 0.35, height: gum * 0.25, borderRadius: gum }]} />
          </View>
        ))}
        <View style={[styles.domeShine, { width: dome * 0.5, height: dome * 0.28, borderRadius: dome }]} />
      </View>
      <View style={[styles.base, { width: size * 0.72, height: size * 0.42, borderRadius: size * 0.08 }]}>
        <View style={[styles.baseShine, { borderRadius: size * 0.06 }]} />
        <View style={[styles.knob, { width: size * 0.18, height: size * 0.18, borderRadius: size * 0.09 }]} />
        <View style={[styles.chute, { width: size * 0.2, height: size * 0.08, borderRadius: size * 0.03 }]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cap: { backgroundColor: '#D83A4E', marginBottom: -2 },
  dome: {
    backgroundColor: '#DDF3FFCC',
    borderWidth: 3,
    borderColor: '#9FD6F5',
    overflow: 'hidden',
  },
  domeShine: { position: 'absolute', top: '7%', left: '12%', backgroundColor: '#FFFFFFB3' },
  gumShine: { position: 'absolute', top: '15%', left: '20%', backgroundColor: '#FFFFFF99' },
  base: {
    marginTop: -6,
    backgroundColor: '#E5484D',
    borderWidth: 2,
    borderColor: '#B7303B',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  baseShine: { position: 'absolute', top: 4, left: 8, right: 8, height: '35%', backgroundColor: '#FFFFFF4D' },
  knob: { backgroundColor: '#F4F7FA', borderWidth: 3, borderColor: '#C3CDD6' },
  chute: { backgroundColor: '#7A1F28' },
});
