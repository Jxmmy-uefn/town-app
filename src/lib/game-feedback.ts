import { useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { useCallback } from 'react';
import { Platform } from 'react-native';

export type SoundName =
  | 'catch'
  | 'golden'
  | 'combo'
  | 'power'
  | 'rock'
  | 'life'
  | 'phase'
  | 'beep'
  | 'go'
  | 'glitch';
export type BuzzKind = 'tap' | 'bump' | 'thud' | 'good' | 'bad';

/** Placeholder sound effects from scripts/make-sounds.py, plus vibration. */
export function useGameFeedback(muted: boolean) {
  const players: Record<SoundName, ReturnType<typeof useAudioPlayer>> = {
    catch: useAudioPlayer(require('@/assets/sounds/catch.wav')),
    golden: useAudioPlayer(require('@/assets/sounds/golden.wav')),
    combo: useAudioPlayer(require('@/assets/sounds/combo.wav')),
    power: useAudioPlayer(require('@/assets/sounds/power.wav')),
    rock: useAudioPlayer(require('@/assets/sounds/rock.wav')),
    life: useAudioPlayer(require('@/assets/sounds/life.wav')),
    phase: useAudioPlayer(require('@/assets/sounds/phase.wav')),
    beep: useAudioPlayer(require('@/assets/sounds/beep.wav')),
    go: useAudioPlayer(require('@/assets/sounds/go.wav')),
    glitch: useAudioPlayer(require('@/assets/sounds/glitch.wav')),
  };

  const play = useCallback(
    (name: SoundName) => {
      if (muted) return;
      const player = players[name];
      try {
        player.seekTo(0);
        player.play();
      } catch {
        // A sound that fails to play shouldn't stop the game.
      }
    },
    // The players are created once per screen and never change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [muted],
  );

  const buzz = useCallback(
    (kind: BuzzKind) => {
      if (muted || Platform.OS === 'web') return;
      const done = {
        tap: () => Haptics.selectionAsync(),
        bump: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
        thud: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
        good: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
        bad: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
      }[kind]();
      done.catch(() => {});
    },
    [muted],
  );

  return { play, buzz };
}
