import './ui/styles.css';
import {
  createSolvedState,
  moveTile,
  shuffleByMoves,
  isSolved,
  type PuzzleState,
} from './logic/puzzle';
import { createView, renderGrid, formatTime } from './ui/view';
import { createLevelModeApp } from './level-mode/LevelController';
import { levels } from './levels/levels';

const app = document.querySelector('#app');
if (!app) {
  throw new Error('Missing #app container');
}

const root = document.createElement('div');
root.className = 'app-root';

const modeBar = document.createElement('div');
modeBar.className = 'mode-bar';

const puzzleButton = document.createElement('button');
puzzleButton.type = 'button';
puzzleButton.textContent = '经典 15 拼图';

const levelButton = document.createElement('button');
levelButton.type = 'button';
levelButton.textContent = '关卡收集模式';

modeBar.append(puzzleButton, levelButton);

const content = document.createElement('div');
content.className = 'mode-content';

const puzzleContainer = document.createElement('div');
const levelContainer = document.createElement('div');
levelContainer.className = 'level-container hidden';

content.append(puzzleContainer, levelContainer);
root.append(modeBar, content);
app.append(root);

const createPuzzleApp = (container: HTMLElement) => {
  const view = createView(container);

  let state: PuzzleState = createSolvedState();
  let steps = 0;
  let seconds = 0;
  let timerId: number | undefined;

  const updateStats = () => {
    view.stepsValue.textContent = String(steps);
    view.timerValue.textContent = formatTime(seconds);
  };

  const stopTimer = () => {
    if (timerId !== undefined) {
      window.clearInterval(timerId);
      timerId = undefined;
    }
  };

  const startTimer = () => {
    if (timerId !== undefined) {
      return;
    }
    timerId = window.setInterval(() => {
      seconds += 1;
      updateStats();
    }, 1000);
  };

  const render = () => {
    renderGrid(state, view.grid, handleTileClick);
    updateStats();
  };

  const handleSolved = () => {
    if (isSolved(state)) {
      stopTimer();
      view.message.textContent = '恭喜完成！可以点击“打乱”再来一局。';
    }
  };

  const handleTileClick = (index: number) => {
    const next = moveTile(state, index);
    if (next.emptyIndex === state.emptyIndex) {
      return;
    }
    state = next;
    steps += 1;
    startTimer();
    view.message.textContent = '点击与空格相邻的数字块移动。';
    render();
    handleSolved();
  };

  const resetGame = () => {
    state = createSolvedState();
    steps = 0;
    seconds = 0;
    stopTimer();
    view.message.textContent = '已重置到完成态。';
    render();
  };

  const shuffleGame = () => {
    state = shuffleByMoves(createSolvedState(), 240);
    steps = 0;
    seconds = 0;
    stopTimer();
    startTimer();
    view.message.textContent = '打乱完成，开始挑战吧！';
    render();
  };

  view.shuffleButton.addEventListener('click', shuffleGame);
  view.resetButton.addEventListener('click', resetGame);

  render();
};

createPuzzleApp(puzzleContainer);
createLevelModeApp(levelContainer, levels);

const setMode = (mode: 'puzzle' | 'level') => {
  const puzzleActive = mode === 'puzzle';
  puzzleContainer.classList.toggle('hidden', !puzzleActive);
  levelContainer.classList.toggle('hidden', puzzleActive);
  puzzleButton.classList.toggle('active', puzzleActive);
  levelButton.classList.toggle('active', !puzzleActive);
};

puzzleButton.addEventListener('click', () => setMode('puzzle'));
levelButton.addEventListener('click', () => setMode('level'));

setMode('puzzle');
