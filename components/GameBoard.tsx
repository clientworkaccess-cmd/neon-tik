
import React from 'react';
import { Square } from './Square';
import { PlayerMark } from '../types';

interface GameBoardProps {
  board: PlayerMark[];
  onSquareClick: (index: number) => void;
  winningLine: number[] | null;
  winner: PlayerMark | 'DRAW';
}

export const GameBoard: React.FC<GameBoardProps> = ({ board, onSquareClick, winningLine, winner }) => {
  return (
    <div className="grid grid-cols-3 gap-4 p-4 rounded-3xl relative">
      {board.map((square, i) => (
        <Square
          key={i}
          value={square}
          onClick={() => onSquareClick(i)}
          isWinningSquare={winningLine?.includes(i) || false}
        />
      ))}
      
      {/* Decorative corners */}
      <div className="absolute -top-2 -left-2 w-6 h-6 border-t-2 border-l-2 border-cyan-500 opacity-50" />
      <div className="absolute -top-2 -right-2 w-6 h-6 border-t-2 border-r-2 border-purple-500 opacity-50" />
      <div className="absolute -bottom-2 -left-2 w-6 h-6 border-b-2 border-l-2 border-purple-500 opacity-50" />
      <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-2 border-r-2 border-cyan-500 opacity-50" />
    </div>
  );
};
