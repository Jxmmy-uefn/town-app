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
  PHASES,
  POWERS,
  stepCatch,
  type CatchEvent,
  type CatchState,
} from '@/games/catch-logic';
import { useGameFeedback } from '@/lib/game-feedback';
import { useFinishGame } from '@/lib/use-finish-game';

const FALLER_SIZE = 36;
const MAX_STEP = 0.05;
const BANNER_MS = 1800;
const POPUP_MS = 900;
const BOUNCE_MS = 160;
const SHAKE_MS = 300;
const COUNTDOWN = ['3', '2', '1', 'Go!'];
const COUNTDOWN_STEP_MS = 800;

type Status = 'ready' | 'countdown' | 'playing' | 'over';

/** Floating text such as "+20" that drifts up and fades. */
type Popup = { id: number; x: number; y: number; text: string; color: string; born: number };

export default function CatchGameScreen() {
  const [status, setStatus] = useState<Status>('ready');
  const [game, setGame] = useState<CatchState>(createCatchState);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [count, setCount] = useState(0);
  const [banner, setBanner] = useState<{ text: string; born: number } | null>(null);
  const [popups, setPopups] = useState<Popup[]>([]);
  const [bounceAt, setBounceAt] = useState(-Infinity);
  const [shakeAt, setShakeAt] = useState(-Infinity);
  const [now, setNow] = useState(0);
  const [muted, setMuted] = useState(false);
  const basketX = useRef(0.5);
  const [basketPos, setBasketPos] = useState(0.5);
  const popupId = useRef(0);

  const { play, buzz } = useGameFeedback(muted);
  const { finish, reset, payout, error, bestBefore } = useFinishGame('catch');

  // The game loop reads these through refs so it doesn't restart when they change.
  const finishRef = useRef(finish);
  const feedbackRef = useRef({ play, buzz });
  useEffect(() => {
    finishRef.current = finish;
    feedbackRef.current = { play, buzz };
  }, [finish, play, buzz]);

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

  // 3, 2, 1, Go! The basket can already be moved so the player can line up.
  useEffect(() => {
    if (status !== 'countdown') return;
    feedbackRef.current.play(count < COUNTDOWN.length - 1 ? 'beep' : 'go');
    const timer = setTimeout(() => {
      if (count < COUNTDOWN.length - 1) setCount(count + 1);
      else setStatus('playing');
    }, COUNTDOWN_STEP_MS);
    return () => clearTimeout(timer);
  }, [status, count]);

  useEffect(() => {
    if (status !== 'playing') return;
    let frame = 0;
    let last = performance.now();
    let state = createCatchState();

    const react = (events: CatchEvent[], at: number) => {
      const { play: sound, buzz: vibrate } = feedbackRef.current;
      const added: Popup[] = [];
      const popup = (x: number, y: number, text: string, color: string) =>
        added.push({ id: popupId.current++, x, y, text, color, born: at });

      for (const event of events) {
        switch (event.type) {
          case 'catch':
            popup(event.x, BASKET_TOP - 0.04, `+${event.points}`, event.kind === 'treat' ? '#2E7D32' : '#C9A100');
            setBounceAt(at);
            sound(event.kind === 'treat' ? 'catch' : 'golden');
            vibrate(event.kind === 'treat' ? 'tap' : 'bump');
            break;
          case 'combo':
            popup(0.5, 0.45, `Combo x${event.streak}! +${event.points}`, '#E8735A');
            sound('combo');
            vibrate('good');
            break;
          case 'power':
            popup(event.x, BASKET_TOP - 0.06, `${POWERS[event.power].emoji} ${POWERS[event.power].label}!`, '#6A4BC4');
            setBounceAt(at);
            sound('power');
            vibrate('good');
            break;
          case 'rock':
            if (event.blocked) {
              popup(basketX.current, BASKET_TOP - 0.05, '🛡️ Blocked!', '#1565C0');
              sound('power');
              vibrate('bump');
            } else {
              setShakeAt(at);
              sound('rock');
              vibrate('thud');
            }
            break;
          case 'drop':
            setShakeAt(at);
            sound('life');
            vibrate('bad');
            break;
          case 'phase':
            setBanner({ text: `Phase ${event.phase + 1}: ${PHASES[event.phase].name}!`, born: at });
            sound('phase');
            vibrate('good');
            break;
        }
      }
      setPopups((current) => [...current.filter((p) => at - p.born < POPUP_MS), ...added]);
    };

    const tick = (time: number) => {
      const dt = Math.min(MAX_STEP, (time - last) / 1000);
      last = time;
      state = stepCatch(state, dt, basketX.current);
      react(state.events, time);
      setGame(state);
      setNow(time);
      setBasketPos(basketX.current);
      if (state.over) {
        feedbackRef.current.buzz('bad');
        setStatus('over');
        finishRef.current(state.score);
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [status]);

  const start = useCallback(() => {
    reset();
    basketX.current = 0.5;
    setBasketPos(0.5);
    setBanner(null);
    setPopups([]);
    setGame(createCatchState());
    setCount(0);
    setStatus('countdown');
  }, [reset]);

  const theme = PHASES[game.phase];
  const bounce = Math.max(0, 1 - (now - bounceAt) / BOUNCE_MS);
  const shakeLeft = Math.max(0, 1 - (now - shakeAt) / SHAKE_MS);
  const shake = Math.sin((now - shakeAt) / 18) * 10 * shakeLeft;
  const showBanner = banner && now - banner.born < BANNER_MS;
  const active = [
    game.magnet > 0 && `🧲 ${Math.ceil(game.magnet)}s`,
    game.slow > 0 && `🐢 ${Math.ceil(game.slow)}s`,
    game.shield && '🛡️',
  ].filter(Boolean);

  return (
    <ThemedView style={styles.fill}>
      <View style={styles.hud}>
        <ThemedText type="smallBold">Score {game.score}</ThemedText>
        <ThemedText type="smallBold">Phase {game.phase + 1}</ThemedText>
        <View style={styles.hudRight}>
          <Text style={styles.lives}>{'❤️'.repeat(game.lives) || ' '}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={muted ? 'Turn sound on' : 'Turn sound off'}
            onPress={() => setMuted((m) => !m)}
            hitSlop={8}>
            <Text style={styles.lives}>{muted ? '🔇' : '🔊'}</Text>
          </Pressable>
        </View>
      </View>
      <View style={styles.status}>
        <ThemedText type="small">{game.streak >= 2 ? `🔥 ${game.streak} in a row` : ' '}</ThemedText>
        <ThemedText type="small">{active.join('   ')}</ThemedText>
      </View>

      <View
        style={[styles.area, { backgroundColor: theme.sky, transform: [{ translateX: shake }] }]}
        onLayout={onLayout}
        onStartShouldSetResponder={() => status === 'playing' || status === 'countdown'}
        onMoveShouldSetResponder={() => status === 'playing' || status === 'countdown'}
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
              faller.kind === 'golden' && styles.golden,
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
              transform: [{ scaleX: 1 + bounce * 0.25 }, { scaleY: 1 - bounce * 0.15 }],
            },
          ]}>
          {game.shield && <Text style={styles.shield}>🛡️</Text>}
          <Text style={styles.basketEmoji}>🧺</Text>
        </View>

        {popups.map((p) => {
          const age = Math.max(0, (now - p.born) / POPUP_MS);
          if (age >= 1) return null;
          return (
            <Text
              key={p.id}
              style={[
                styles.popup,
                {
                  left: p.x * size.width - 80,
                  top: p.y * size.height - age * 50,
                  opacity: 1 - age,
                  color: p.color,
                },
              ]}>
              {p.text}
            </Text>
          );
        })}

        {status === 'countdown' && (
          <View style={styles.banner}>
            <Text style={styles.countdown}>{COUNTDOWN[count]}</Text>
          </View>
        )}
        {showBanner && (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>{banner.text}</Text>
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
              treats hit the ground.
            </ThemedText>
            <ThemedText style={styles.center}>
              ⭐ 50 points · 🌟 100 points · 5 in a row for a combo bonus
            </ThemedText>
            <ThemedText style={styles.center}>
              Power-ups: 🧲 pulls treats in · 🐢 slows things down · 🛡️ blocks a rock · ❤️ extra life
            </ThemedText>
            <ThemedText style={styles.center}>
              Play well to move up through 5 phases: faster, but every catch is worth more.
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
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
  },
  hudRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  status: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
  },
  lives: { fontSize: 18 },
  area: {
    flex: 1,
    margin: Spacing.three,
    marginTop: 0,
    borderRadius: Spacing.four,
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
  golden: { fontSize: 34, textShadowColor: '#FFD54F', textShadowRadius: 12 },
  basket: { position: 'absolute', alignItems: 'center', pointerEvents: 'none' },
  basketEmoji: { fontSize: 44 },
  shield: { position: 'absolute', top: -22, fontSize: 20 },
  popup: {
    position: 'absolute',
    pointerEvents: 'none',
    width: 160,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 800,
    textShadowColor: '#FFFFFF',
    textShadowRadius: 4,
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
  countdown: {
    fontSize: 96,
    fontWeight: 900,
    color: '#E8735A',
  },
  bannerText: {
    fontSize: 20,
    fontWeight: 800,
    color: '#ffffff',
    backgroundColor: '#E8735ADD',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.four,
    overflow: 'hidden',
    textAlign: 'center',
  },
  center: { textAlign: 'center', color: '#11181C' },
});
