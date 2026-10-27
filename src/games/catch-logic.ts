// Pure rules for the catch game. Positions are fractions of the play area (0 to 1),
// so the same game plays the same on any screen size.

export type PowerKind = 'magnet' | 'slow' | 'shield' | 'life';
export type FallerKind = 'treat' | 'star' | 'golden' | 'rock' | 'power';

export type Faller = {
  id: number;
  kind: FallerKind;
  emoji: string;
  x: number;
  y: number;
  speed: number;
  power?: PowerKind;
};

/** One difficulty level. Phases step up as the player does well, and each has its own look. */
export type Phase = {
  name: string;
  /** Background color of the play area. */
  sky: string;
  treats: string[];
  /** Seconds between drops. */
  interval: number;
  /** Fall speed in screen heights per second. */
  speed: number;
  rockChance: number;
  starChance: number;
  /** Wireframe phases draw everything as glowing outlines in this color. */
  wire?: string;
};

type Theme = {
  name: string;
  sky: string;
  treats: string[];
  /** Outline symbols that stand in for this theme's treats in wireframe mode. */
  wireTreats: string[];
  wire: string;
};

const THEMES: Theme[] = [
  { name: 'Morning orchard', sky: '#CDEBFA', treats: ['🍎', '🍓', '🍐', '🍊', '🍌'], wireTreats: ['◯', '◒', '◇', '○'], wire: '#39FF14' },
  { name: 'Bakery afternoon', sky: '#FBE7C6', treats: ['🍪', '🧁', '🍩', '🥐', '🥨'], wireTreats: ['◎', '○', '▭', '◯'], wire: '#FFB347' },
  { name: 'Sunset sweets', sky: '#F9C6B4', treats: ['🍬', '🍭', '🍫', '🍡', '🍮'], wireTreats: ['◇', '◊', '○', '♢'], wire: '#FF6EC7' },
  { name: 'Starry night', sky: '#3B4A7A', treats: ['🍰', '🎂', '🥧', '🍨', '🍦'], wireTreats: ['☾', '◯', '◌', '◇'], wire: '#7DF9FF' },
  { name: 'Snow festival', sky: '#E4EEF6', treats: ['🎁', '🍬', '🍪', '🥛', '🍫'], wireTreats: ['✲', '◇', '▢', '○'], wire: '#E0FFFF' },
  { name: 'Spring garden', sky: '#DFF5DC', treats: ['🍓', '🥕', '🍯', '🫐', '🥗'], wireTreats: ['✿', '○', '◇', '◑'], wire: '#ADFF2F' },
  { name: 'Summer beach', sky: '#FFE9A8', treats: ['🍉', '🍦', '🍍', '🍑', '🧃'], wireTreats: ['☼', '◯', '△', '◇'], wire: '#FFFF66' },
  { name: 'Autumn harvest', sky: '#F4C58E', treats: ['🎃', '🥧', '🍎', '🌰', '🍠'], wireTreats: ['❦', '◯', '△', '◇'], wire: '#FF8C00' },
];

// Speed and drop rate keep climbing through all 16 phases; rocks level off.
const DIFFICULTY: Pick<Phase, 'interval' | 'speed' | 'rockChance' | 'starChance'>[] = [
  { interval: 1.0, speed: 0.3, rockChance: 0.1, starChance: 0.05 },
  { interval: 0.85, speed: 0.38, rockChance: 0.15, starChance: 0.05 },
  { interval: 0.7, speed: 0.46, rockChance: 0.2, starChance: 0.06 },
  { interval: 0.58, speed: 0.55, rockChance: 0.25, starChance: 0.07 },
  { interval: 0.48, speed: 0.65, rockChance: 0.3, starChance: 0.08 },
  { interval: 0.45, speed: 0.69, rockChance: 0.3, starChance: 0.08 },
  { interval: 0.42, speed: 0.73, rockChance: 0.31, starChance: 0.08 },
  { interval: 0.4, speed: 0.77, rockChance: 0.32, starChance: 0.08 },
  { interval: 0.39, speed: 0.8, rockChance: 0.32, starChance: 0.08 },
  { interval: 0.375, speed: 0.83, rockChance: 0.33, starChance: 0.08 },
  { interval: 0.36, speed: 0.86, rockChance: 0.33, starChance: 0.08 },
  { interval: 0.345, speed: 0.89, rockChance: 0.34, starChance: 0.08 },
  { interval: 0.33, speed: 0.92, rockChance: 0.34, starChance: 0.08 },
  { interval: 0.32, speed: 0.95, rockChance: 0.35, starChance: 0.08 },
  { interval: 0.31, speed: 0.98, rockChance: 0.35, starChance: 0.08 },
  { interval: 0.3, speed: 1.0, rockChance: 0.36, starChance: 0.08 },
];

/** The 8 themes in color, then the same 8 again as wireframe after the glitch. */
export const PHASES: Phase[] = [
  ...THEMES.map((theme, i) => ({ name: theme.name, sky: theme.sky, treats: theme.treats, ...DIFFICULTY[i] })),
  ...THEMES.map((theme, i) => ({
    name: `WIRE // ${theme.name}`,
    sky: '#04070A',
    treats: theme.wireTreats,
    wire: theme.wire,
    ...DIFFICULTY[THEMES.length + i],
  })),
];

/** The first wireframe phase, where the game glitches out. */
export const GLITCH_PHASE = THEMES.length;
/** Seconds of glitch before things start falling again. */
export const GLITCH_SECONDS = 2;

/** Outline stand-ins for special items in wireframe mode. */
export const WIRE_GLYPHS = {
  rock: '✕',
  star: '☆',
  golden: '✧',
  magnet: '∪',
  slow: '◴',
  shield: '▽',
  life: '♡',
} as const;

export const POWERS: Record<PowerKind, { emoji: string; label: string }> = {
  magnet: { emoji: '🧲', label: 'Magnet' },
  slow: { emoji: '🐢', label: 'Slow-mo' },
  shield: { emoji: '🛡️', label: 'Shield' },
  life: { emoji: '❤️', label: 'Extra life' },
};

export const BASKET_WIDTH = 0.24;
export const BASKET_TOP = 0.86;
export const BASKET_DEPTH = 0.06;
export const STARTING_LIVES = 3;
export const MAX_LIVES = 5;

/** How many recent results decide whether to move up a phase. */
export const PROMOTE_WINDOW = 10;
/** Share of those results that must be good to move up. */
export const PROMOTE_RATE = 0.9;

export const GOLDEN_CHANCE = 0.02;
export const GOLDEN_SPEED = 1.6;
export const POWER_CHANCE = 0.05;
export const POWER_SECONDS = 6;
/** Slow-mo multiplies fall speed and stretches the time between drops. */
export const SLOW_FACTOR = 0.5;
/** How fast the magnet pulls treats sideways, in screen widths per second. */
export const MAGNET_PULL = 0.9;
/** A combo bonus every this many catches in a row. */
export const COMBO_STEP = 5;
export const COMBO_POINTS_PER_CATCH = 5;

const POINTS: Record<'treat' | 'star' | 'golden', number> = { treat: 10, star: 50, golden: 100 };
const MAX_SPEED_JITTER = 0.15;
// Extra lives are rarer than the other power-ups.
const POWER_WEIGHTS: [PowerKind, number][] = [
  ['magnet', 0.3],
  ['slow', 0.3],
  ['shield', 0.3],
  ['life', 0.1],
];

/** Something that just happened, for the screen to show and play sounds for. */
export type CatchEvent =
  | { type: 'catch'; x: number; points: number; kind: 'treat' | 'star' | 'golden' }
  | { type: 'combo'; streak: number; points: number }
  | { type: 'power'; x: number; power: PowerKind }
  | { type: 'rock'; blocked: boolean }
  | { type: 'drop' }
  | { type: 'phase'; phase: number }
  | { type: 'glitch' };

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
  /** Catches in a row without a mistake. */
  streak: number;
  /** Seconds left on timed power-ups. */
  magnet: number;
  slow: number;
  shield: boolean;
  /** What happened during the last step only. */
  events: CatchEvent[];
};

export function createCatchState(): CatchState {
  return {
    fallers: [],
    score: 0,
    lives: STARTING_LIVES,
    elapsed: 0,
    // Drop the first treat right away so the game starts the moment the countdown ends.
    untilSpawn: 0,
    nextId: 1,
    over: false,
    phase: 0,
    recent: [],
    streak: 0,
    magnet: 0,
    slow: 0,
    shield: false,
    events: [],
  };
}

function pick<T>(items: T[], rng: () => number): T {
  return items[Math.floor(rng() * items.length)];
}

function pickPower(rng: () => number): PowerKind {
  let roll = rng();
  for (const [kind, weight] of POWER_WEIGHTS) {
    if (roll < weight) return kind;
    roll -= weight;
  }
  return 'magnet';
}

function spawn(id: number, phase: Phase, rng: () => number): Faller {
  const roll = rng();
  let kind: FallerKind = 'treat';
  let threshold = phase.rockChance;
  if (roll < threshold) kind = 'rock';
  else if (roll < (threshold += phase.starChance)) kind = 'star';
  else if (roll < (threshold += GOLDEN_CHANCE)) kind = 'golden';
  else if (roll < (threshold += POWER_CHANCE)) kind = 'power';

  const power = kind === 'power' ? pickPower(rng) : undefined;
  const emoji = phase.wire
    ? kind === 'treat'
      ? pick(phase.treats, rng)
      : WIRE_GLYPHS[power ?? (kind as 'rock' | 'star' | 'golden')]
    : kind === 'rock'
      ? '🪨'
      : kind === 'star'
        ? '⭐'
        : kind === 'golden'
          ? '🌟'
          : power
            ? POWERS[power].emoji
            : pick(phase.treats, rng);

  return {
    id,
    kind,
    emoji,
    power,
    x: 0.08 + rng() * 0.84,
    // Start just below the top edge so it's visible immediately.
    y: 0.02,
    speed:
      phase.speed *
      (kind === 'golden' ? GOLDEN_SPEED : 1) *
      (1 - MAX_SPEED_JITTER + rng() * MAX_SPEED_JITTER * 2),
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
 * Moves up a phase after PROMOTE_WINDOW results that are at least PROMOTE_RATE good, then starts
 * the record over so each phase is judged on its own. Phases never go back down.
 */
export function nextPhase(phase: number, recent: boolean[]): { phase: number; recent: boolean[] } {
  if (phase < PHASES.length - 1 && recent.length >= PROMOTE_WINDOW) {
    const window = recent.slice(-PROMOTE_WINDOW);
    if (window.filter(Boolean).length / PROMOTE_WINDOW >= PROMOTE_RATE) {
      return { phase: phase + 1, recent: [] };
    }
  }
  return { phase, recent };
}

/** The combo bonus for reaching this streak, or 0 when it isn't a milestone. */
export function comboBonus(streak: number) {
  return streak > 0 && streak % COMBO_STEP === 0 ? streak * COMBO_POINTS_PER_CATCH : 0;
}

/**
 * Advances the game by dt seconds with the basket centered at basketX.
 * Catching treats scores (more in later phases and on combos); catching a rock or dropping a
 * treat costs a life and ends the combo. Power-ups help for a few seconds.
 */
export function stepCatch(state: CatchState, dt: number, basketX: number, rng = Math.random): CatchState {
  if (state.over) return { ...state, events: [] };

  let { score, lives, untilSpawn, nextId, streak, shield } = state;
  let magnet = Math.max(0, state.magnet - dt);
  let slow = Math.max(0, state.slow - dt);
  const multiplier = state.phase + 1;
  const elapsed = state.elapsed + dt;
  const fallers: Faller[] = [];
  const results: boolean[] = [];
  const events: CatchEvent[] = [];
  const speedFactor = state.slow > 0 ? SLOW_FACTOR : 1;

  const mistake = () => {
    lives -= 1;
    streak = 0;
    results.push(false);
  };

  for (const faller of state.fallers) {
    const moved = { ...faller, y: faller.y + faller.speed * speedFactor * dt };
    if (state.magnet > 0 && moved.kind !== 'rock') {
      const pull = Math.min(Math.abs(basketX - moved.x), MAGNET_PULL * dt);
      moved.x += Math.sign(basketX - moved.x) * pull;
    }

    if (isCaught(moved, basketX)) {
      if (moved.kind === 'rock') {
        if (shield) {
          shield = false;
          events.push({ type: 'rock', blocked: true });
          results.push(true);
        } else {
          mistake();
          events.push({ type: 'rock', blocked: false });
        }
      } else if (moved.kind === 'power') {
        const power = moved.power!;
        if (power === 'magnet') magnet = POWER_SECONDS;
        else if (power === 'slow') slow = POWER_SECONDS;
        else if (power === 'shield') shield = true;
        else lives = Math.min(MAX_LIVES, lives + 1);
        results.push(true);
        events.push({ type: 'power', x: moved.x, power });
      } else {
        const points = POINTS[moved.kind] * multiplier;
        score += points;
        streak += 1;
        results.push(true);
        events.push({ type: 'catch', x: moved.x, points, kind: moved.kind });
        const bonus = comboBonus(streak) * multiplier;
        if (bonus) {
          score += bonus;
          events.push({ type: 'combo', streak, points: bonus });
        }
      }
    } else if (moved.y > 1) {
      if (moved.kind === 'rock') {
        results.push(true);
      } else if (moved.kind !== 'power') {
        mistake();
        events.push({ type: 'drop' });
      }
      // A missed power-up is no penalty.
    } else {
      fallers.push(moved);
    }
  }

  const { phase, recent } = nextPhase(state.phase, [...state.recent, ...results]);
  let remaining = fallers;
  if (phase !== state.phase) {
    events.push({ type: 'phase', phase });
    if (phase === GLITCH_PHASE) {
      // Everything on screen glitches away, and there's a short pause before wireframe mode.
      events.push({ type: 'glitch' });
      remaining = [];
      untilSpawn = GLITCH_SECONDS;
    }
  }

  untilSpawn -= dt;
  if (untilSpawn <= 0) {
    remaining.push(spawn(nextId, PHASES[phase], rng));
    nextId += 1;
    untilSpawn = PHASES[phase].interval / (slow > 0 ? SLOW_FACTOR : 1);
  }

  lives = Math.max(0, lives);
  return {
    fallers: remaining,
    score,
    lives,
    elapsed,
    untilSpawn,
    nextId,
    over: lives === 0,
    phase,
    recent,
    streak,
    magnet,
    slow,
    shield,
    events,
  };
}
