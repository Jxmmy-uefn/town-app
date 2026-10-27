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

/** One difficulty level. Phases step up as the player does well. */
export type Phase = {
  /** Seconds between drops. */
  interval: number;
  /** Fall speed in screen heights per second. */
  speed: number;
  rockChance: number;
  starChance: number;
};

export const PHASES: Phase[] = [
  { interval: 1.0, speed: 0.3, rockChance: 0.1, starChance: 0.05 },
  { interval: 0.85, speed: 0.38, rockChance: 0.15, starChance: 0.05 },
  { interval: 0.7, speed: 0.46, rockChance: 0.2, starChance: 0.06 },
  { interval: 0.58, speed: 0.55, rockChance: 0.25, starChance: 0.07 },
  { interval: 0.48, speed: 0.65, rockChance: 0.3, starChance: 0.08 },
];

/** How many recent results decide whether to move up a phase. */
export const PROMOTE_WINDOW = 10;
/** Share of those results that must be good to move up. */
export const PROMOTE_RATE = 0.9;
/** This many mistakes within the last DEMOTE_WINDOW results drops a phase. */
export const DEMOTE_MISTAKES = 2;
export const DEMOTE_WINDOW = 5;

export type CatchState = {
  fallers: Faller[];
  score: number;
  lives: number;
  elapsed: number;
  untilSpawn: number;
  nextId: number;
  over: boolean;
  /** Index into PHASES. */
  phase: number;
  /** Results since entering this phase, newest last: true for a catch or a dodged rock. */
  recent: boolean[];
};

export const BASKET_WIDTH = 0.24;
export const BASKET_TOP = 0.86;
export const BASKET_DEPTH = 0.06;
export const STARTING_LIVES = 3;

const TREATS = ['🍎', '🍓', '🍪', '🧁', '🍩'];
const POINTS: Record<FallerKind, number> = { treat: 10, star: 50, rock: 0 };
const MAX_SPEED_JITTER = 0.15;

export function createCatchState(): CatchState {
  return {
    fallers: [],
    score: 0,
    lives: STARTING_LIVES,
    elapsed: 0,
    // Drop the first treat right away so the game starts the moment you tap.
    untilSpawn: 0,
    nextId: 1,
    over: false,
    phase: 0,
    recent: [],
  };
}

function spawn(id: number, phase: Phase, rng: () => number): Faller {
  const roll = rng();
  const kind: FallerKind =
    roll < phase.rockChance ? 'rock' : roll < phase.rockChance + phase.starChance ? 'star' : 'treat';
  const emoji = kind === 'rock' ? '🪨' : kind === 'star' ? '⭐' : TREATS[Math.floor(rng() * TREATS.length)];
  return {
    id,
    kind,
    emoji,
    x: 0.08 + rng() * 0.84,
    // Start just below the top edge so it's visible immediately.
    y: 0.02,
    speed: phase.speed * (1 - MAX_SPEED_JITTER + rng() * MAX_SPEED_JITTER * 2),
  };
}

/**
 * Adjusts the phase from recent results: move up after PROMOTE_WINDOW results that are at least
 * PROMOTE_RATE good, move down after DEMOTE_MISTAKES mistakes close together. Either way the
 * record starts over so each phase is judged on its own.
 */
export function nextPhase(phase: number, recent: boolean[]): { phase: number; recent: boolean[] } {
  const lastFew = recent.slice(-DEMOTE_WINDOW);
  if (phase > 0 && lastFew.filter((good) => !good).length >= DEMOTE_MISTAKES) {
    return { phase: phase - 1, recent: [] };
  }
  if (phase < PHASES.length - 1 && recent.length >= PROMOTE_WINDOW) {
    const window = recent.slice(-PROMOTE_WINDOW);
    if (window.filter(Boolean).length / PROMOTE_WINDOW >= PROMOTE_RATE) {
      return { phase: phase + 1, recent: [] };
    }
  }
  return { phase, recent };
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
 * Catching a treat scores (more in later phases); catching a rock or dropping a treat costs a life.
 */
export function stepCatch(state: CatchState, dt: number, basketX: number, rng = Math.random): CatchState {
  if (state.over) return state;

  let { score, lives, untilSpawn, nextId } = state;
  const elapsed = state.elapsed + dt;
  const fallers: Faller[] = [];
  const results: boolean[] = [];

  for (const faller of state.fallers) {
    const moved = { ...faller, y: faller.y + faller.speed * dt };
    if (isCaught(moved, basketX)) {
      if (moved.kind === 'rock') {
        lives -= 1;
        results.push(false);
      } else {
        score += POINTS[moved.kind] * (state.phase + 1);
        results.push(true);
      }
    } else if (moved.y > 1) {
      if (moved.kind !== 'rock') lives -= 1;
      results.push(moved.kind === 'rock');
    } else {
      fallers.push(moved);
    }
  }

  const { phase, recent } = nextPhase(state.phase, [...state.recent, ...results]);

  untilSpawn -= dt;
  if (untilSpawn <= 0) {
    fallers.push(spawn(nextId, PHASES[phase], rng));
    nextId += 1;
    untilSpawn = PHASES[phase].interval;
  }

  lives = Math.max(0, lives);
  return { fallers, score, lives, elapsed, untilSpawn, nextId, over: lives === 0, phase, recent };
}
