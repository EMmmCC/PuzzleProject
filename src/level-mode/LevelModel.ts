import type {
  Coord,
  Direction,
  LevelDefinition,
  MoveResult,
  Piece,
  Target,
} from './LevelTypes';

const directionVectors: Record<Direction, Coord> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export class LevelModel {
  private level: LevelDefinition;
  private pieces: Map<string, Piece>;
  private targets: Target[];
  private obstacles: Set<string>;

  constructor(level: LevelDefinition) {
    this.level = level;
    this.pieces = new Map(level.pieces.map((piece) => [piece.id, { ...piece }]));
    this.targets = level.targets.map((target) => ({ ...target }));
    this.obstacles = new Set(level.obstacles.map((coord) => this.key(coord)));
  }

  getLevel(): LevelDefinition {
    return this.level;
  }

  getPieces(): Piece[] {
    return Array.from(this.pieces.values()).map((piece) => ({ ...piece }));
  }

  getTargets(): Target[] {
    return this.targets.map((target) => ({ ...target }));
  }

  getPieceById(id: string): Piece | undefined {
    const piece = this.pieces.get(id);
    return piece ? { ...piece } : undefined;
  }

  getPieceAt(coord: Coord, ignoreId?: string): Piece | undefined {
    for (const piece of this.pieces.values()) {
      if (ignoreId && piece.id === ignoreId) {
        continue;
      }
      if (piece.x === coord.x && piece.y === coord.y) {
        return { ...piece };
      }
    }
    return undefined;
  }

  isInside(coord: Coord): boolean {
    return coord.x >= 0 && coord.x < this.level.boardW && coord.y >= 0 && coord.y < this.level.boardH;
  }

  isObstacle(coord: Coord): boolean {
    return this.obstacles.has(this.key(coord));
  }

  isBlocked(coord: Coord, movingId?: string): boolean {
    if (!this.isInside(coord)) {
      return true;
    }
    if (this.isObstacle(coord)) {
      return true;
    }
    return Boolean(this.getPieceAt(coord, movingId));
  }

  getMaxSteps(pieceId: string, direction: Direction): number {
    const piece = this.pieces.get(pieceId);
    if (!piece) {
      return 0;
    }
    const vector = directionVectors[direction];
    let steps = 0;
    let next = { x: piece.x + vector.x, y: piece.y + vector.y };

    while (!this.isBlocked(next, pieceId)) {
      steps += 1;
      next = { x: next.x + vector.x, y: next.y + vector.y };
    }

    return steps;
  }

  canMove(pieceId: string, direction: Direction, steps: number): boolean {
    if (steps <= 0) {
      return false;
    }
    const piece = this.pieces.get(pieceId);
    if (!piece) {
      return false;
    }
    const vector = directionVectors[direction];
    for (let i = 1; i <= steps; i += 1) {
      const next = { x: piece.x + vector.x * i, y: piece.y + vector.y * i };
      if (this.isBlocked(next, pieceId)) {
        return false;
      }
    }
    return true;
  }

  movePiece(pieceId: string, direction: Direction, steps: number): MoveResult {
    const piece = this.pieces.get(pieceId);
    if (!piece) {
      return { moved: false, steps: 0 };
    }
    if (!this.canMove(pieceId, direction, steps)) {
      return { moved: false, steps: 0 };
    }
    const vector = directionVectors[direction];
    const updated = {
      ...piece,
      x: piece.x + vector.x * steps,
      y: piece.y + vector.y * steps,
    };
    this.pieces.set(pieceId, updated);
    return { moved: true, steps, updatedPiece: { ...updated } };
  }

  isSolved(): boolean {
    return this.targets.every((target) => {
      const piece = this.getPieceAt({ x: target.x, y: target.y });
      return piece?.type === target.targetType;
    });
  }

  private key(coord: Coord): string {
    return `${coord.x},${coord.y}`;
  }
}
