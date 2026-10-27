import { memo } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

type Decoration = { emoji: string; wire: string; x: number; y: number; size: number };

type Scene = {
  skyTop: string;
  skyBottom: string;
  ground: string;
  decorations: Decoration[];
};

// One scene per theme, in the same order as the phases. Wireframe phases reuse them as outlines.
// Decorations sit behind the falling items and are faded so they never look catchable.
const SCENES: Scene[] = [
  {
    // Morning orchard
    skyTop: '#9FD8F7',
    skyBottom: '#E3F4FC',
    ground: '#7BC67E',
    decorations: [
      { emoji: '☀️', wire: '☼', x: 0.82, y: 0.06, size: 44 },
      { emoji: '☁️', wire: '☁', x: 0.2, y: 0.12, size: 34 },
      { emoji: '🌳', wire: '♣', x: 0.08, y: 0.78, size: 56 },
      { emoji: '🌳', wire: '♣', x: 0.86, y: 0.76, size: 64 },
    ],
  },
  {
    // Bakery afternoon
    skyTop: '#F8D9A8',
    skyBottom: '#FDF1DE',
    ground: '#C89B6D',
    decorations: [
      { emoji: '🏠', wire: '⌂', x: 0.1, y: 0.76, size: 56 },
      { emoji: '🏪', wire: '⌂', x: 0.84, y: 0.76, size: 56 },
      { emoji: '☁️', wire: '☁', x: 0.7, y: 0.1, size: 34 },
      { emoji: '🌤️', wire: '☼', x: 0.15, y: 0.06, size: 36 },
    ],
  },
  {
    // Sunset sweets
    skyTop: '#F59A7A',
    skyBottom: '#FCD9B8',
    ground: '#D17B88',
    decorations: [
      { emoji: '🌇', wire: '◒', x: 0.5, y: 0.72, size: 70 },
      { emoji: '🎈', wire: '○', x: 0.12, y: 0.18, size: 34 },
      { emoji: '🎈', wire: '○', x: 0.85, y: 0.28, size: 30 },
    ],
  },
  {
    // Starry night
    skyTop: '#1B2347',
    skyBottom: '#3B4A7A',
    ground: '#26304F',
    decorations: [
      { emoji: '🌙', wire: '☾', x: 0.82, y: 0.06, size: 44 },
      { emoji: '✨', wire: '✦', x: 0.15, y: 0.1, size: 22 },
      { emoji: '✨', wire: '✦', x: 0.45, y: 0.2, size: 18 },
      { emoji: '✨', wire: '✦', x: 0.7, y: 0.32, size: 20 },
      { emoji: '🏡', wire: '⌂', x: 0.1, y: 0.78, size: 50 },
    ],
  },
  {
    // Snow festival
    skyTop: '#C9DCEB',
    skyBottom: '#F2F7FB',
    ground: '#FFFFFF',
    decorations: [
      { emoji: '⛄', wire: '8', x: 0.1, y: 0.76, size: 56 },
      { emoji: '🎄', wire: '△', x: 0.86, y: 0.74, size: 60 },
      { emoji: '❄️', wire: '✲', x: 0.25, y: 0.14, size: 24 },
      { emoji: '❄️', wire: '✲', x: 0.7, y: 0.24, size: 20 },
    ],
  },
  {
    // Spring garden
    skyTop: '#BDE8F5',
    skyBottom: '#EAF8EC',
    ground: '#8FD18A',
    decorations: [
      { emoji: '🌷', wire: '♧', x: 0.08, y: 0.8, size: 40 },
      { emoji: '🌷', wire: '♧', x: 0.2, y: 0.82, size: 34 },
      { emoji: '🌸', wire: '✿', x: 0.84, y: 0.78, size: 46 },
      { emoji: '🦋', wire: '⋈', x: 0.7, y: 0.18, size: 30 },
      { emoji: '🌈', wire: '◠', x: 0.2, y: 0.06, size: 48 },
    ],
  },
  {
    // Summer beach
    skyTop: '#62C6F2',
    skyBottom: '#BFEAFB',
    ground: '#F3D99A',
    decorations: [
      { emoji: '☀️', wire: '☼', x: 0.15, y: 0.06, size: 50 },
      { emoji: '🌴', wire: '⚘', x: 0.86, y: 0.72, size: 64 },
      { emoji: '🌊', wire: '≈', x: 0.1, y: 0.8, size: 40 },
      { emoji: '⛱️', wire: '⌒', x: 0.32, y: 0.78, size: 40 },
    ],
  },
  {
    // Autumn harvest
    skyTop: '#F2B36B',
    skyBottom: '#FBE0B9',
    ground: '#B8763A',
    decorations: [
      { emoji: '🍂', wire: '❦', x: 0.2, y: 0.16, size: 26 },
      { emoji: '🍁', wire: '❦', x: 0.75, y: 0.26, size: 28 },
      { emoji: '🌾', wire: '⋔', x: 0.08, y: 0.78, size: 48 },
      { emoji: '🏚️', wire: '⌂', x: 0.84, y: 0.76, size: 54 },
    ],
  },
];

const BANDS = 8;
const GROUND_TOP = 0.9;
const MONO = Platform.select({ ios: 'Menlo', default: 'monospace' });

function blend(a: string, b: string, t: number) {
  const channel = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  const mixed = [0, 1, 2].map((i) => Math.round(channel(a, i) + (channel(b, i) - channel(a, i)) * t));
  return `rgb(${mixed.join(',')})`;
}

type CatchSceneryProps = {
  /** Which theme to draw, from 0 to 7. */
  theme: number;
  /** Outline color for wireframe mode, or undefined for the colorful version. */
  wire?: string;
};

/** The backdrop behind the Catch! play area, different for every phase. */
export const CatchScenery = memo(function CatchScenery({ theme, wire }: CatchSceneryProps) {
  const scene = SCENES[theme % SCENES.length];

  if (wire) {
    return (
      <View style={styles.fill}>
        <View style={[styles.horizon, { top: `${GROUND_TOP * 100}%`, backgroundColor: wire }]} />
        {scene.decorations.map((d, i) => (
          <Text
            key={i}
            style={[
              styles.decoration,
              styles.wireDecoration,
              {
                left: `${d.x * 100}%`,
                top: `${d.y * 100}%`,
                marginLeft: -d.size / 2,
                fontSize: d.size * 0.8,
                color: wire,
                textShadowColor: wire,
              },
            ]}>
            {d.wire}
          </Text>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.fill}>
      {Array.from({ length: BANDS }, (_, i) => (
        <View
          key={i}
          style={{ height: `${(GROUND_TOP * 100) / BANDS}%`, backgroundColor: blend(scene.skyTop, scene.skyBottom, i / (BANDS - 1)) }}
        />
      ))}
      <View style={[styles.ground, { backgroundColor: scene.ground }]} />
      {scene.decorations.map((d, i) => (
        <Text
          key={i}
          style={[
            styles.decoration,
            { left: `${d.x * 100}%`, top: `${d.y * 100}%`, marginLeft: -d.size / 2, fontSize: d.size },
          ]}>
          {d.emoji}
        </Text>
      ))}
    </View>
  );
});

/** The sky color at the top of a theme, for anything that needs one solid color. */
export function sceneSky(theme: number) {
  return SCENES[theme % SCENES.length].skyTop;
}

const styles = StyleSheet.create({
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' },
  ground: { flex: 1 },
  decoration: { position: 'absolute', opacity: 0.55 },
  wireDecoration: { fontFamily: MONO, opacity: 0.4, textShadowRadius: 6 },
  horizon: { position: 'absolute', left: 0, right: 0, height: 1, opacity: 0.6 },
});
