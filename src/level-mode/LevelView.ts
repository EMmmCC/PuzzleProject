import type { Coord, LevelDefinition, Piece, Target } from './LevelTypes';

export type LevelViewBindings = {
  root: HTMLDivElement;
  board: HTMLDivElement;
  overlay: HTMLDivElement;
  overlayTitle: HTMLHeadingElement;
  overlayStats: HTMLParagraphElement;
  overlayNext: HTMLButtonElement;
  overlayReplay: HTMLButtonElement;
};

const coordKey = (coord: Coord) => `${coord.x},${coord.y}`;

export class LevelView {
  private bindings: LevelViewBindings;
  private pieceElements = new Map<string, HTMLButtonElement>();
  private targetElements = new Map<string, HTMLDivElement>();
  private cellSize = 56;

  constructor(container: HTMLElement) {
    const root = document.createElement('div');
    root.className = 'level-mode';

    const board = document.createElement('div');
    board.className = 'level-board';

    const overlay = document.createElement('div');
    overlay.className = 'level-overlay hidden';

    const overlayCard = document.createElement('div');
    overlayCard.className = 'level-overlay-card';

    const overlayTitle = document.createElement('h2');
    overlayTitle.textContent = '通关成功';

    const overlayStats = document.createElement('p');

    const overlayActions = document.createElement('div');
    overlayActions.className = 'level-overlay-actions';

    const overlayNext = document.createElement('button');
    overlayNext.type = 'button';
    overlayNext.textContent = '下一关';

    const overlayReplay = document.createElement('button');
    overlayReplay.type = 'button';
    overlayReplay.textContent = '重玩';

    overlayActions.append(overlayNext, overlayReplay);
    overlayCard.append(overlayTitle, overlayStats, overlayActions);
    overlay.append(overlayCard);

    root.append(board, overlay);
    container.append(root);

    this.bindings = {
      root,
      board,
      overlay,
      overlayTitle,
      overlayStats,
      overlayNext,
      overlayReplay,
    };
  }

  getBindings(): LevelViewBindings {
    return this.bindings;
  }

  renderLevel(level: LevelDefinition, pieces: Piece[], targets: Target[]) {
    const { board } = this.bindings;
    board.innerHTML = '';
    this.pieceElements.clear();
    this.targetElements.clear();

    this.cellSize = level.cellSize;
    board.style.width = `${level.boardW * level.cellSize}px`;
    board.style.height = `${level.boardH * level.cellSize}px`;
    board.style.gridTemplateColumns = `repeat(${level.boardW}, ${level.cellSize}px)`;
    board.style.gridTemplateRows = `repeat(${level.boardH}, ${level.cellSize}px)`;

    const gridLayer = document.createElement('div');
    gridLayer.className = 'level-grid-layer';
    gridLayer.style.gridTemplateColumns = `repeat(${level.boardW}, ${level.cellSize}px)`;
    gridLayer.style.gridTemplateRows = `repeat(${level.boardH}, ${level.cellSize}px)`;
    for (let i = 0; i < level.boardW * level.boardH; i += 1) {
      const cell = document.createElement('div');
      cell.className = 'level-cell';
      gridLayer.append(cell);
    }

    const obstacleLayer = document.createElement('div');
    obstacleLayer.className = 'level-layer';
    level.obstacles.forEach((obstacle) => {
      const element = document.createElement('div');
      element.className = 'level-obstacle';
      this.positionElement(element, obstacle);
      obstacleLayer.append(element);
    });

    const targetLayer = document.createElement('div');
    targetLayer.className = 'level-layer';
    targets.forEach((target) => {
      const element = document.createElement('div');
      element.className = 'level-target';
      element.dataset.targetType = target.targetType;
      element.textContent = '🐱';
      this.positionElement(element, target);
      this.targetElements.set(coordKey(target), element);
      targetLayer.append(element);
    });

    const pieceLayer = document.createElement('div');
    pieceLayer.className = 'level-layer';
    pieces.forEach((piece) => {
      const element = document.createElement('button');
      element.type = 'button';
      element.className = 'level-piece';
      element.textContent = piece.type;
      element.dataset.pieceId = piece.id;
      this.positionElement(element, piece);
      pieceLayer.append(element);
      this.pieceElements.set(piece.id, element);
    });

    board.append(gridLayer, targetLayer, obstacleLayer, pieceLayer);
  }

  updatePieces(pieces: Piece[]) {
    pieces.forEach((piece) => {
      const element = this.pieceElements.get(piece.id);
      if (!element) {
        return;
      }
      this.positionElement(element, piece);
    });
  }

  setSelected(pieceId?: string) {
    this.pieceElements.forEach((element, id) => {
      element.classList.toggle('selected', id === pieceId);
    });
  }

  setTargetsComplete(targets: Target[], pieces: Piece[]) {
    const pieceMap = new Map(pieces.map((piece) => [coordKey(piece), piece]));
    targets.forEach((target) => {
      const element = this.targetElements.get(coordKey(target));
      if (!element) {
        return;
      }
      const piece = pieceMap.get(coordKey(target));
      const complete = piece?.type === target.targetType;
      element.classList.toggle('complete', complete);
      element.textContent = complete ? '✅' : '🐱';
    });
  }

  getPieceElement(pieceId: string): HTMLButtonElement | undefined {
    return this.pieceElements.get(pieceId);
  }

  showOverlay(title: string, stats: string) {
    this.bindings.overlayTitle.textContent = title;
    this.bindings.overlayStats.textContent = stats;
    this.bindings.overlay.classList.remove('hidden');
  }

  hideOverlay() {
    this.bindings.overlay.classList.add('hidden');
  }

  private positionElement(element: HTMLElement, coord: Coord) {
    element.style.transform = `translate(${coord.x * this.cellSize}px, ${coord.y * this.cellSize}px)`;
    element.style.width = `${this.cellSize}px`;
    element.style.height = `${this.cellSize}px`;
  }
}
