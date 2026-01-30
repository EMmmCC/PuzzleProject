export type Coord = {
  x: number;
  y: number;
};

export type Piece = Coord & {
  id: string;
  type: string;
};

export type Target = Coord & {
  id: string;
  targetType: string;
};

export type Obstacle = Coord & {
  id: string;
};

export type LevelDefinition = {
  id: string;
  name: string;
  boardW: number;
  boardH: number;
  cellSize: number;
  pieces: Piece[];
  targets: Target[];
  obstacles: Obstacle[];
};

export type Direction = 'up' | 'down' | 'left' | 'right';

export type MoveResult = {
  moved: boolean;
  steps: number;
  updatedPiece?: Piece;
};
