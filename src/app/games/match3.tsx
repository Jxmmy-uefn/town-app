import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { Button } from '@/components/button';
import { GameOver } from '@/components/game-over';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import {
  areAdjacent,
  createBoard,
  MOVES,
  playMove,
  SIZE,
  TILE_EMOJI,
  type Board,
  type Cell,
} from '@/games/match3-logic';
import { useFinishGame } from '@/lib/use-finish-game';

type Phase = 'ready' | 'playing' | 'over';

export default function Match3Screen() {
  const { width } = useWindowDimensions();
  const boardWidth = Math.min(width - Spacing.three * 2, 480);
  const tile = boardWidth / SIZE;

  const [phase, setPhase] = useState<Phase>('ready');
  const [board, setBoard] = useState<Board>(() => createBoard());
  const [selected, setSelected] = useState<Cell | null>(null);
  const [score, setScore] = useState(0);
  const [movesLeft, setMovesLeft] = useState(MOVES);
  const [hint, setHint] = useState<string | null>(null);
  const { finish, reset, payout, error, bestBefore } = useFinishGame('match3');

  const start = useCallback(() => {
    reset();
    setBoard(createBoard());
    setSelected(null);
    setScore(0);
    setMovesLeft(MOVES);
    setHint(null);
    setPhase('playing');
  }, [reset]);

  function onTap(cell: Cell) {
    if (phase !== 'playing') return;
    setHint(null);
    if (!selected) return setSelected(cell);
    if (selected.row === cell.row && selected.col === cell.col) return setSelected(null);
    if (!areAdjacent(selected, cell)) return setSelected(cell);

    const result = playMove(board, selected, cell);
    setSelected(null);
    if (!result) return setHint("That swap doesn't make a match.");

    const newScore = score + result.points;
    setBoard(result.board);
    setScore(newScore);
    if (result.cascades > 1) setHint(`Combo x${result.cascades}!`);
    const remaining = movesLeft - 1;
    setMovesLeft(remaining);
    if (remaining === 0) {
      setPhase('over');
      finish(newScore);
    }
  }

  return (
    <ThemedView style={styles.fill}>
      <View style={styles.hud}>
        <ThemedText type="smallBold">Score {score}</ThemedText>
        <ThemedText type="smallBold">Moves {movesLeft}</ThemedText>
      </View>

      <View style={[styles.board, { width: boardWidth, height: boardWidth }]}>
        {board.map((row, r) =>
          row.map((kind, c) => {
            const isSelected = selected?.row === r && selected?.col === c;
            return (
              <Pressable
                key={`${r},${c}`}
                accessibilityLabel={`Row ${r + 1}, column ${c + 1}`}
                onPress={() => onTap({ row: r, col: c })}
                style={StyleSheet.flatten([
                  styles.tile,
                  { width: tile, height: tile, left: c * tile, top: r * tile },
                  isSelected && styles.selected,
                ])}>
                <Text style={{ fontSize: tile * 0.6 }}>{TILE_EMOJI[kind]}</Text>
              </Pressable>
            );
          }),
        )}
      </View>

      <ThemedText style={styles.hint}>{hint ?? 'Tap a fruit, then tap a neighbor to swap them.'}</ThemedText>

      {phase === 'ready' && (
        <View style={styles.overlay}>
          <View style={styles.intro}>
            <ThemedText type="subtitle" style={styles.dark}>
              Fruit Match
            </ThemedText>
            <ThemedText style={styles.dark}>
              Swap neighboring fruit to line up 3 or more. You get {MOVES} moves. Chain reactions score
              extra.
            </ThemedText>
            <Button label="Start" onPress={start} />
          </View>
        </View>
      )}

      {phase === 'over' && (
        <View style={styles.overlay}>
          <GameOver score={score} best={bestBefore} payout={payout} error={error} onPlayAgain={start} />
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, alignItems: 'center' },
  hud: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  board: {
    borderRadius: Spacing.three,
    backgroundColor: '#F6E7C8',
    overflow: 'hidden',
  },
  tile: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: {
    backgroundColor: '#FFFFFFAA',
    borderRadius: Spacing.two,
    borderWidth: 3,
    borderColor: '#208AEF',
  },
  hint: { padding: Spacing.three, textAlign: 'center' },
  overlay: {
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
    borderRadius: Spacing.four,
    gap: Spacing.three,
    backgroundColor: '#FFFFFF',
  },
  dark: { color: '#11181C' },
});
