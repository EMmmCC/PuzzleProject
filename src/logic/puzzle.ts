export type PuzzleState = {
  size: number;
  tiles: number[];
  emptyIndex: number;
};

export const DEFAULT_SIZE = 4;

export const createSolvedState = (size: number = DEFAULT_SIZE): PuzzleState => {
  const total = size * size;
  const tiles = Array.from({ length: total }, (_, index) => {
    if (index === total - 1) {
      return 0;
    }
    return index + 1;
  });
  return {
    size,
    tiles,
    emptyIndex: total - 1,
  };
};

export const cloneState = (state: PuzzleState): PuzzleState => ({
  size: state.size,
  tiles: [...state.tiles],
  emptyIndex: state.emptyIndex,
});

export const isSolved = (state: PuzzleState): boolean => {
  const total = state.size * state.size;
  for (let i = 0; i < total - 1; i += 1) {
    if (state.tiles[i] !== i + 1) {
      return false;
    }
  }
  return state.tiles[total - 1] === 0;
};

const indexToRowCol = (index: number, size: number) => ({
  row: Math.floor(index / size),
  col: index % size,
});

export const isAdjacent = (a: number, b: number, size: number): boolean => {
  const aPos = indexToRowCol(a, size);
  const bPos = indexToRowCol(b, size);
  const rowDiff = Math.abs(aPos.row - bPos.row);
  const colDiff = Math.abs(aPos.col - bPos.col);
  return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
};

export const getMovableIndexes = (state: PuzzleState): number[] => {
  const moves: number[] = [];
  for (let i = 0; i < state.tiles.length; i += 1) {
    if (isAdjacent(i, state.emptyIndex, state.size)) {
      moves.push(i);
    }
  }
  return moves;
};

export const moveTile = (state: PuzzleState, index: number): PuzzleState => {
  if (!isAdjacent(index, state.emptyIndex, state.size)) {
    return state;
  }
  const next = cloneState(state);
  next.tiles[state.emptyIndex] = next.tiles[index];
  next.tiles[index] = 0;
  next.emptyIndex = index;
  return next;
};

const randomChoice = <T,>(list: T[]): T => list[Math.floor(Math.random() * list.length)];

export const shuffleByMoves = (state: PuzzleState, moves: number = 200): PuzzleState => {
  let next = cloneState(state);
  let lastEmpty = next.emptyIndex;

  for (let i = 0; i < moves; i += 1) {
    const candidates = getMovableIndexes(next).filter((index) => index !== lastEmpty);
    const choice = randomChoice(candidates.length ? candidates : getMovableIndexes(next));
    lastEmpty = next.emptyIndex;
    next = moveTile(next, choice);
  }

  return next;
};
