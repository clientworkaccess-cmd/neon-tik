
import { useState, useCallback } from 'react';
import { PlayerMark, GameState } from '../types';
import { WINNING_COMBINATIONS, INITIAL_BOARD } from '../constants';

export const useGameLogic = () => {
  const [board, setBoard] = useState<PlayerMark[]>(INITIAL_BOARD);
  const [xIsNext, setXIsNext] = useState<boolean>(true);
  const [winner, setWinner] = useState<PlayerMark | 'DRAW'>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [scores, setScores] = useState({ X: 0, O: 0, DRAW: 0 });

  const calculateWinner = (squares: PlayerMark[]) => {
    for (let i = 0; i < WINNING_COMBINATIONS.length; i++) {
      const [a, b, c] = WINNING_COMBINATIONS[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a], line: [a, b, c] };
      }
    }
    if (!squares.includes(null)) {
      return { winner: 'DRAW' as const, line: null };
    }
    return null;
  };

  const makeMove = useCallback((index: number) => {
    if (board[index] || winner) return null;

    const newBoard = [...board];
    const currentMark = xIsNext ? 'X' : 'O';
    newBoard[index] = currentMark;
    
    setBoard(newBoard);
    const result = calculateWinner(newBoard);
    
    if (result) {
      setWinner(result.winner);
      setWinningLine(result.line);
      setScores(prev => ({
        ...prev,
        [result.winner]: prev[result.winner as keyof typeof prev] + 1
      }));
    } else {
      setXIsNext(!xIsNext);
    }

    return { index, mark: currentMark };
  }, [board, xIsNext, winner]);

  const resetGame = useCallback(() => {
    setBoard(INITIAL_BOARD);
    setXIsNext(true);
    setWinner(null);
    setWinningLine(null);
  }, []);

  const syncState = useCallback((state: Partial<GameState>) => {
    if (state.board !== undefined) setBoard(state.board);
    if (state.xIsNext !== undefined) setXIsNext(state.xIsNext);
    if (state.winner !== undefined) setWinner(state.winner);
    if (state.winningLine !== undefined) setWinningLine(state.winningLine);
  }, []);

  return {
    board,
    xIsNext,
    winner,
    winningLine,
    scores,
    makeMove,
    resetGame,
    syncState
  };
};
