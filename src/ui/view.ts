import type { PuzzleState } from '../logic/puzzle';

export type ViewBindings = {
  grid: HTMLDivElement;
  stepsValue: HTMLSpanElement;
  timerValue: HTMLSpanElement;
  message: HTMLParagraphElement;
  shuffleButton: HTMLButtonElement;
  resetButton: HTMLButtonElement;
};

export const createView = (container: HTMLElement): ViewBindings => {
  const card = document.createElement('div');
  card.className = 'app-card';

  const header = document.createElement('div');
  header.className = 'header';

  const title = document.createElement('h1');
  title.textContent = '15-Puzzle 滑块拼图';

  const stats = document.createElement('div');
  stats.className = 'stats';

  const steps = document.createElement('div');
  steps.className = 'stat';
  steps.innerHTML = '步数：<span id="steps">0</span>';

  const timer = document.createElement('div');
  timer.className = 'stat';
  timer.innerHTML = '计时：<span id="timer">00:00</span>';

  stats.append(steps, timer);
  header.append(title, stats);

  const controls = document.createElement('div');
  controls.className = 'controls';

  const shuffleButton = document.createElement('button');
  shuffleButton.type = 'button';
  shuffleButton.textContent = '打乱';

  const resetButton = document.createElement('button');
  resetButton.type = 'button';
  resetButton.textContent = '重置';

  controls.append(shuffleButton, resetButton);

  const grid = document.createElement('div');
  grid.className = 'grid';

  const message = document.createElement('p');
  message.className = 'message';
  message.textContent = '点击与空格相邻的数字块移动。';

  card.append(header, controls, grid, message);
  container.append(card);

  return {
    grid,
    stepsValue: steps.querySelector('#steps') as HTMLSpanElement,
    timerValue: timer.querySelector('#timer') as HTMLSpanElement,
    message,
    shuffleButton,
    resetButton,
  };
};

export const renderGrid = (
  state: PuzzleState,
  grid: HTMLDivElement,
  onTileClick: (index: number) => void,
) => {
  grid.innerHTML = '';
  state.tiles.forEach((value, index) => {
    const tile = document.createElement('button');
    tile.type = 'button';
    tile.className = 'tile';

    if (value === 0) {
      tile.classList.add('empty');
      tile.disabled = true;
      tile.textContent = '';
    } else {
      tile.textContent = String(value);
      tile.addEventListener('click', () => onTileClick(index));
    }

    grid.append(tile);
  });
};

export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`;
};
