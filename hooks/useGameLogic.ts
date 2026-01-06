
import { useState, useCallback } from 'react';
import { PlayerMark, GameState } from '../types.ts';
import { WINNING_COMBINATIONS, INITIAL_BOARD } from '../constants.ts';

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
    let moveSuccessful = false;
    let markApplied: PlayerMark = null;

    setBoard((prevBoard) => {
      // If square taken or game over, do nothing
      if (prevBoard[index] || calculateWinner(prevBoard)) {
        return prevBoard;
      }

      const newBoard = [...prevBoard];
      // Determine mark based on xIsNext state
      // We can't rely on the xIsNext variable from the outer scope easily here, 
      // so we manage it carefully.
      return newBoard; 
    });

    // Actually, to keep it simple and sync-safe, we'll use a unified state setter
    setBoard((prevBoard) => {
      if (prevBoard[index]) return prevBoard;
      
      const newBoard = [...prevBoard];
      const currentMark = xIsNext ? 'X' : 'O';
      newBoard[index] = currentMark;
      markApplied = currentMark;
      
      const result = calculateWinner(newBoard);
      if (result) {
        setWinner(result.winner);
        setWinningLine(result.line);
        setScores(prevScores => ({
          ...prevScores,
          [result.winner]: prevScores[result.winner as keyof typeof prevScores] + 1
        }));
      } else {
        setXIsNext(prev => !prev);
      }
      
      moveSuccessful = true;
      return newBoard;
    });

    return moveSuccessful ? { index, mark: markApplied } : null;
  }, [xIsNext]); // Only depend on xIsNext, the rest is handled via functional updates

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
    if (state.scores !== undefined) setScores(state.scores as any);
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
