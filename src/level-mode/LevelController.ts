import type { Direction, LevelDefinition, MoveResult } from './LevelTypes';
import { LevelModel } from './LevelModel';
import { LevelView } from './LevelView';

const directions: Direction[] = ['up', 'down', 'left', 'right'];

const nextDirection = (key: string): Direction | undefined => {
  switch (key) {
    case 'ArrowUp':
    case 'w':
    case 'W':
      return 'up';
    case 'ArrowDown':
    case 's':
    case 'S':
      return 'down';
    case 'ArrowLeft':
    case 'a':
    case 'A':
      return 'left';
    case 'ArrowRight':
    case 'd':
    case 'D':
      return 'right';
    default:
      return undefined;
  }
};

export type LevelModeControllerBindings = {
  root: HTMLDivElement;
  header: HTMLDivElement;
  boardSlot: HTMLDivElement;
  levelName: HTMLSpanElement;
  stepsValue: HTMLSpanElement;
  timerValue: HTMLSpanElement;
  prevButton: HTMLButtonElement;
  nextButton: HTMLButtonElement;
  replayButton: HTMLButtonElement;
  resetButton: HTMLButtonElement;
};

export class LevelController {
  private container: HTMLElement;
  private levels: LevelDefinition[];
  private model: LevelModel;
  private view: LevelView;
  private bindings: LevelModeControllerBindings;
  private levelIndex = 0;
  private selectedPieceId?: string;
  private steps = 0;
  private seconds = 0;
  private timerId: number | undefined;

  constructor(container: HTMLElement, levels: LevelDefinition[]) {
    this.container = container;
    this.levels = levels;
    this.model = new LevelModel(levels[0]);

    const root = document.createElement('div');
    root.className = 'level-mode-root';

    const header = document.createElement('div');
    header.className = 'level-hud';

    const levelName = document.createElement('span');
    levelName.className = 'hud-title';
    levelName.textContent = levels[0].name;

    const hudStats = document.createElement('div');
    hudStats.className = 'hud-stats';

    const stepsValue = document.createElement('span');
    stepsValue.className = 'hud-stat';
    stepsValue.textContent = '步数：0';

    const timerValue = document.createElement('span');
    timerValue.className = 'hud-stat';
    timerValue.textContent = '计时：00:00';

    hudStats.append(stepsValue, timerValue);

    const hudControls = document.createElement('div');
    hudControls.className = 'hud-controls';

    const prevButton = document.createElement('button');
    prevButton.type = 'button';
    prevButton.textContent = '上一关';

    const nextButton = document.createElement('button');
    nextButton.type = 'button';
    nextButton.textContent = '下一关';

    const replayButton = document.createElement('button');
    replayButton.type = 'button';
    replayButton.textContent = '重玩';

    const resetButton = document.createElement('button');
    resetButton.type = 'button';
    resetButton.textContent = '重置计时';

    hudControls.append(prevButton, nextButton, replayButton, resetButton);

    header.append(levelName, hudStats, hudControls);

    const boardSlot = document.createElement('div');
    boardSlot.className = 'level-board-slot';

    root.append(header, boardSlot);
    container.append(root);

    this.bindings = {
      root,
      header,
      boardSlot,
      levelName,
      stepsValue,
      timerValue,
      prevButton,
      nextButton,
      replayButton,
      resetButton,
    };

    this.view = new LevelView(boardSlot);
    this.attachListeners();
    this.loadLevel(0);
  }

  destroy() {
    this.stopTimer();
    this.container.innerHTML = '';
  }

  private attachListeners() {
    this.bindings.prevButton.addEventListener('click', () => this.switchLevel(-1));
    this.bindings.nextButton.addEventListener('click', () => this.switchLevel(1));
    this.bindings.replayButton.addEventListener('click', () => this.reloadLevel());
    this.bindings.resetButton.addEventListener('click', () => this.resetTimer());

    const { overlayNext, overlayReplay } = this.view.getBindings();
    overlayNext.addEventListener('click', () => this.switchLevel(1));
    overlayReplay.addEventListener('click', () => this.reloadLevel());

    this.bindings.boardSlot.addEventListener('click', (event) => {
      const target = event.target as HTMLElement | null;
      if (!target) {
        return;
      }
      const pieceId = target.closest<HTMLButtonElement>('.level-piece')?.dataset.pieceId;
      if (pieceId) {
        this.selectPiece(pieceId);
        return;
      }

      if (!this.selectedPieceId) {
        return;
      }

      const cell = target.closest<HTMLDivElement>('.level-cell');
      if (!cell) {
        return;
      }
      const index = Array.from(cell.parentElement?.children ?? []).indexOf(cell);
      if (index < 0) {
        return;
      }
      const level = this.model.getLevel();
      const x = index % level.boardW;
      const y = Math.floor(index / level.boardW);
      this.handleCellMove({ x, y }, event.shiftKey);
    });

    window.addEventListener('keydown', (event) => {
      const direction = nextDirection(event.key);
      if (!direction || !this.selectedPieceId) {
        return;
      }
      event.preventDefault();
      this.handleDirectionalMove(direction, event.shiftKey);
    });
  }

  private switchLevel(delta: number) {
    const nextIndex = (this.levelIndex + delta + this.levels.length) % this.levels.length;
    this.loadLevel(nextIndex);
  }

  private reloadLevel() {
    this.loadLevel(this.levelIndex);
  }

  private loadLevel(index: number) {
    this.levelIndex = index;
    const level = this.levels[index];
    this.model = new LevelModel(level);
    this.selectedPieceId = undefined;
    this.steps = 0;
    this.seconds = 0;
    this.stopTimer();
    this.startTimer();
    this.updateHud();
    this.view.renderLevel(level, this.model.getPieces(), this.model.getTargets());
    this.view.setSelected(undefined);
    this.view.setTargetsComplete(this.model.getTargets(), this.model.getPieces());
    this.view.hideOverlay();
  }

  private selectPiece(pieceId: string) {
    this.selectedPieceId = pieceId;
    this.view.setSelected(pieceId);
  }

  private handleDirectionalMove(direction: Direction, multi: boolean) {
    if (!this.selectedPieceId) {
      return;
    }
    const steps = multi ? this.model.getMaxSteps(this.selectedPieceId, direction) : 1;
    this.performMove(direction, steps);
  }

  private handleCellMove(target: { x: number; y: number }, multi: boolean) {
    if (!this.selectedPieceId) {
      return;
    }
    const piece = this.model.getPieceById(this.selectedPieceId);
    if (!piece) {
      return;
    }
    const dx = target.x - piece.x;
    const dy = target.y - piece.y;
    if ((dx !== 0 && dy !== 0) || (dx === 0 && dy === 0)) {
      return;
    }
    const direction = dx > 0 ? 'right' : dx < 0 ? 'left' : dy > 0 ? 'down' : 'up';
    const distance = Math.abs(dx || dy);
    const steps = multi ? distance : 1;
    this.performMove(direction, steps);
  }

  private performMove(direction: Direction, steps: number) {
    if (!this.selectedPieceId || steps <= 0) {
      return;
    }
    const result = this.model.movePiece(this.selectedPieceId, direction, steps);
    this.handleMoveResult(result);
  }

  private handleMoveResult(result: MoveResult) {
    if (!result.moved) {
      return;
    }
    this.steps += 1;
    this.updateHud();
    this.view.updatePieces(this.model.getPieces());
    this.view.setTargetsComplete(this.model.getTargets(), this.model.getPieces());

    if (this.model.isSolved()) {
      this.stopTimer();
      this.view.showOverlay('全部猫咪已收集！', `用时 ${this.formatTime(this.seconds)} · 步数 ${this.steps}`);
    }
  }

  private updateHud() {
    const level = this.model.getLevel();
    this.bindings.levelName.textContent = `${level.name} (${this.levelIndex + 1}/${this.levels.length})`;
    this.bindings.stepsValue.textContent = `步数：${this.steps}`;
    this.bindings.timerValue.textContent = `计时：${this.formatTime(this.seconds)}`;
  }

  private startTimer() {
    if (this.timerId !== undefined) {
      return;
    }
    this.timerId = window.setInterval(() => {
      this.seconds += 1;
      this.updateHud();
    }, 1000);
  }

  private stopTimer() {
    if (this.timerId === undefined) {
      return;
    }
    window.clearInterval(this.timerId);
    this.timerId = undefined;
  }

  private resetTimer() {
    this.seconds = 0;
    this.updateHud();
  }

  private formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remaining = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`;
  }
}

export const createLevelModeApp = (container: HTMLElement, levels: LevelDefinition[]) =>
  new LevelController(container, levels);

export { directions };
