
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, Award, Minus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  scores: {
    X: number;
    O: number;
    DRAW: number;
  };
}

export const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose, scores }) => {
  const data = [
    { name: 'Player X', value: scores.X, color: '#00f0ff' },
    { name: 'Player O', value: scores.O, color: '#8b5cf6' },
    { name: 'Draws', value: scores.DRAW, color: '#64748b' },
  ];

  const total = scores.X + scores.O + scores.DRAW;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg glass-panel p-8 rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4">
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            <h2 className="text-3xl font-black font-orbitron mb-8 tracking-tighter italic text-white flex items-center gap-3">
              <TrendingUp className="text-cyan-400" />
              SESSION DATA
            </h2>

            <div className="grid grid-cols-3 gap-4 mb-10">
              <div className="p-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/20 text-center">
                <div className="text-xs uppercase tracking-widest text-cyan-400/60 mb-1">X WINS</div>
                <div className="text-2xl font-orbitron font-bold text-cyan-400">{scores.X}</div>
              </div>
              <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/20 text-center">
                <div className="text-xs uppercase tracking-widest text-purple-400/60 mb-1">O WINS</div>
                <div className="text-2xl font-orbitron font-bold text-purple-400">{scores.O}</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-500/5 border border-slate-500/20 text-center">
                <div className="text-xs uppercase tracking-widest text-slate-400/60 mb-1">DRAWS</div>
                <div className="text-2xl font-orbitron font-bold text-slate-400">{scores.DRAW}</div>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                  />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      borderColor: 'rgba(255,255,255,0.1)', 
                      borderRadius: '12px',
                      color: '#f8fafc'
                    }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center text-slate-500">
              <div className="flex items-center gap-2 text-xs font-bold tracking-[0.2em] uppercase">
                <Award className="w-4 h-4" />
                Total Matches: {total}
              </div>
              <div className="text-[10px] tracking-widest opacity-50">ENCRYPTED DATA STREAM ACTIVE</div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
