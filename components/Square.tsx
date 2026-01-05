
import React from 'react';
import { motion } from 'framer-motion';
import { PlayerMark } from '../types';
import { X, Circle } from 'lucide-react';

interface SquareProps {
  value: PlayerMark;
  onClick: () => void;
  isWinningSquare: boolean;
}

export const Square: React.FC<SquareProps> = ({ value, onClick, isWinningSquare }) => {
  return (
    <motion.button
      whileHover={!value ? { backgroundColor: 'rgba(255, 255, 255, 0.05)' } : {}}
      whileTap={!value ? { scale: 0.95 } : {}}
      onClick={onClick}
      className={`
        relative h-24 w-24 md:h-32 md:w-32 rounded-2xl flex items-center justify-center 
        glass-panel border-2 transition-all duration-300
        ${isWinningSquare ? 'border-green-500 bg-green-500/10' : 'border-white/5 hover:border-white/20'}
        ${value === 'X' ? 'shadow-[0_0_15px_rgba(0,240,255,0.1)]' : value === 'O' ? 'shadow-[0_0_15px_rgba(139,92,246,0.1)]' : ''}
      `}
    >
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={value ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {value === 'X' ? (
          <X className={`w-12 h-12 md:w-16 md:h-16 text-cyan-400 drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]`} />
        ) : value === 'O' ? (
          <Circle className={`w-12 h-12 md:w-16 md:h-16 text-purple-400 drop-shadow-[0_0_8px_rgba(139,92,246,0.8)]`} />
        ) : null}
      </motion.div>
      
      {isWinningSquare && (
        <motion.div 
          layoutId="win-glow"
          className="absolute inset-0 rounded-2xl bg-green-500/20 blur-xl animate-pulse"
        />
      )}
    </motion.button>
  );
};
