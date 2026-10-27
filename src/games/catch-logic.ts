// Pure rules for the catch game. Positions are fractions of the play area (0 to 1),
// so the same game plays the same on any screen size.

export type FallerKind = 'treat' | 'star' | 'rock';

export type Faller = {
  id: number;
  kind: FallerKind;
  emoji: string;
  x: number;
  y: number;
  speed: number;
};

export type CatchState = {
  fallers: Faller[];
  score: number;
  lives: number;
  elapsed: number;
  untilSpawn: number;
  nextId: number;
  over: boolean;
};

export const BASKET_WIDTH = 0.24;
export const BASKET_TOP = 0.86;
export const BASKET_DEPTH = 0.06;
export const STARTING_LIVES = 3;

const TREATS = ['🍎', '🍓', '🍪', '🧁', '🍩'];
const POINTS: Record<FallerKind, number> = { treat: 10, star: 50, rock: 0 };

export function createCatchState(): CatchState {
  return {
    fallers: [],
    score: 0,
    lives: STARTING_LIVES,
    elapsed: 0,
    untilSpawn: 0.5,
    nextId: 1,
    over: false,
  };
}

/** Seconds between drops: starts relaxed and speeds up over the first two minutes. */
export function spawnInterval(elapsed: number) {
  return Math.max(0.35, 0.9 - elapsed * 0.005);
}

/** Fall speed in screen heights per second. */
export function fallSpeed(elapsed: number) {
  return Math.min(0.75, 0.28 + elapsed * 0.004);
}

function spawn(state: CatchState, rng: () => number): Faller {
  const roll = rng();
  const kind: FallerKind = roll < 0.2 ? 'rock' : roll < 0.25 ? 'star' : 'treat';
  const emoji = kind === 'rock' ? '🪨' : kind === 'star' ? '⭐' : TREATS[Math.floor(rng() * TREATS.length)];
  return {
    id: state.nextId,
    kind,
    emoji,
    x: 0.08 + rng() * 0.84,
    y: -0.05,
    speed: fallSpeed(state.elapsed) * (0.85 + rng() * 0.3),
  };
}

export function isCaught(faller: Faller, basketX: number) {
  return (
    faller.y >= BASKET_TOP &&
    faller.y <= BASKET_TOP + BASKET_DEPTH &&
    Math.abs(faller.x - basketX) <= BASKET_WIDTH / 2
  );
}

/**
 * Advances the game by dt seconds with the basket centered at basketX.
 * Catching a treat scores; catching a rock or dropping a treat costs a life.
 */
export function stepCatch(state: CatchState, dt: number, basketX: number, rng = Math.random): CatchState {
  if (state.over) return state;

  let { score, lives, untilSpawn, nextId } = state;
  const elapsed = state.elapsed + dt;
  const fallers: Faller[] = [];

  for (const faller of state.fallers) {
    const moved = { ...faller, y: faller.y + faller.speed * dt };
    if (isCaught(moved, basketX)) {
      if (moved.kind === 'rock') lives -= 1;
      else score += POINTS[moved.kind];
    } else if (moved.y > 1) {
      if (moved.kind !== 'rock') lives -= 1;
    } else {
      fallers.push(moved);
    }
  }

  untilSpawn -= dt;
  if (untilSpawn <= 0) {
    fallers.push(spawn({ ...state, elapsed, nextId }, rng));
    nextId += 1;
    untilSpawn = spawnInterval(elapsed);
  }

  lives = Math.max(0, lives);
  return { fallers, score, lives, elapsed, untilSpawn, nextId, over: lives === 0 };
}
