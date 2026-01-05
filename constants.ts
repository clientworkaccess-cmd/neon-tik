
export const COLORS = {
  bg: '#0f172a',
  playerX: '#00f0ff',
  playerO: '#8b5cf6',
  winningLine: '#10b981',
  glass: 'rgba(15, 23, 42, 0.7)',
};

export const WINNING_COMBINATIONS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export const INITIAL_BOARD = Array(9).fill(null);
