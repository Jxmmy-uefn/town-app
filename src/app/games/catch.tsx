import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';

import { GameOver } from '@/components/game-over';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import {
  BASKET_TOP,
  BASKET_WIDTH,
  createCatchState,
  stepCatch,
  type CatchState,
} from '@/games/catch-logic';
import { useFinishGame } from '@/lib/use-finish-game';

const FALLER_SIZE = 36;
const MAX_STEP = 0.05;
const BANNER_MS = 1500;

type Status = 'ready' | 'playing' | 'over';

export default function CatchGameScreen() {
  const [status, setStatus] = useState<Status>('ready');
  const [banner, setBanner] = useState<string | null>(null);
  const [game, setGame] = useState<CatchState>(createCatchState);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const basketX = useRef(0.5);
  const [basketPos, setBasketPos] = useState(0.5);
  const { finish, reset, payout, error, bestBefore } = useFinishGame('catch');
  const finishRef = useRef(finish);
  useEffect(() => {
    finishRef.current = finish;
  }, [finish]);

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize({ width, height });
  };

  // Everything inside the play area ignores touches, so locationX is always relative to it.
  const moveBasket = (locationX: number) => {
    if (!size.width) return;
    const half = BASKET_WIDTH / 2;
    basketX.current = Math.min(1 - half, Math.max(half, locationX / size.width));
  };

  useEffect(() => {
    if (status !== 'playing') return;
    let frame = 0;
    let bannerTimer: ReturnType<typeof setTimeout> | undefined;
    let last = performance.now();
    let state = createCatchState();

    const tick = (now: number) => {
      const dt = Math.min(MAX_STEP, (now - last) / 1000);
      last = now;
      const before = state.phase;
      state = stepCatch(state, dt, basketX.current);
      if (state.phase !== before) {
        setBanner(
          state.phase > before ? `Phase ${state.phase + 1}! Faster, more points` : `Back to phase ${state.phase + 1}`,
        );
        clearTimeout(bannerTimer);
        bannerTimer = setTimeout(() => setBanner(null), BANNER_MS);
      }
      setGame(state);
      setBasketPos(basketX.current);
      if (state.over) {
        setStatus('over');
        finishRef.current(state.score);
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(bannerTimer);
    };
  }, [status]);

  const start = useCallback(() => {
    reset();
    basketX.current = 0.5;
    setBasketPos(0.5);
    setBanner(null);
    setGame(createCatchState());
    setStatus('playing');
  }, [reset]);

  return (
    <ThemedView style={styles.fill}>
      <View style={styles.hud}>
        <ThemedText type="smallBold">Score {game.score}</ThemedText>
        <ThemedText type="smallBold">Phase {game.phase + 1}</ThemedText>
        <Text style={styles.lives}>{'❤️'.repeat(game.lives) || ' '}</Text>
      </View>

      <View
        style={styles.area}
        onLayout={onLayout}
        onStartShouldSetResponder={() => status === 'playing'}
        onMoveShouldSetResponder={() => status === 'playing'}
        onResponderGrant={(e) => moveBasket(e.nativeEvent.locationX)}
        onResponderMove={(e) => moveBasket(e.nativeEvent.locationX)}>
        {game.fallers.map((faller) => (
          <Text
            key={faller.id}
            style={[
              styles.faller,
              {
                left: faller.x * size.width - FALLER_SIZE / 2,
                top: faller.y * size.height - FALLER_SIZE / 2,
              },
            ]}>
            {faller.emoji}
          </Text>
        ))}
        <View
          style={[
            styles.basket,
            {
              left: (basketPos - BASKET_WIDTH / 2) * size.width,
              top: BASKET_TOP * size.height,
              width: BASKET_WIDTH * size.width,
            },
          ]}>
          <Text style={styles.basketEmoji}>🧺</Text>
        </View>

        {banner && (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>{banner}</Text>
          </View>
        )}
      </View>

      {status === 'ready' && (
        // Outside the play area so the basket's touch handling can't swallow the tap.
        <Pressable accessibilityRole="button" accessibilityLabel="Start" onPress={start} style={styles.overlayFull}>
          <View style={styles.intro}>
            <ThemedText type="subtitle" style={styles.center}>
              Catch!
            </ThemedText>
            <ThemedText style={styles.center}>
              Slide your finger to move the basket. Catch treats, skip the rocks, and don’t let
              treats hit the ground. Stars are worth 50.
            </ThemedText>
            <ThemedText style={styles.center}>
              Play well and you move up a phase: things fall faster, but every catch is worth more.
            </ThemedText>
            <ThemedText type="smallBold" style={styles.center}>
              Tap anywhere to start
            </ThemedText>
          </View>
        </Pressable>
      )}

      {status === 'over' && (
        <View style={styles.overlayFull}>
          <GameOver
            score={game.score}
            best={bestBefore}
            payout={payout}
            error={error}
            onPlayAgain={start}
          />
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  hud: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  lives: { fontSize: 18 },
  area: {
    flex: 1,
    margin: Spacing.three,
    marginTop: 0,
    borderRadius: Spacing.four,
    backgroundColor: '#CDEBFA',
    overflow: 'hidden',
  },
  faller: {
    position: 'absolute',
    pointerEvents: 'none',
    width: FALLER_SIZE,
    height: FALLER_SIZE,
    fontSize: 28,
    lineHeight: FALLER_SIZE,
    textAlign: 'center',
  },
  basket: { position: 'absolute', alignItems: 'center', pointerEvents: 'none' },
  basketEmoji: { fontSize: 44 },
  intro: {
    margin: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.three,
    borderRadius: Spacing.four,
    backgroundColor: '#FFFFFF',
  },
  banner: {
    position: 'absolute',
    top: '35%',
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'none',
  },
  bannerText: {
    fontSize: 22,
    fontWeight: 800,
    color: '#ffffff',
    backgroundColor: '#E8735ADD',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.four,
    overflow: 'hidden',
  },
  overlayFull: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    backgroundColor: '#00000066',
  },
  center: { textAlign: 'center', color: '#11181C' },
});
