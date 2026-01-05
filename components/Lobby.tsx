
import React from 'react';
import { motion } from 'framer-motion';
import { Users, Globe, ChevronRight, Copy, CheckCircle2 } from 'lucide-react';

interface LobbyProps {
  onSelectLocal: () => void;
  onHost: () => void;
  peerId: string;
  remoteId: string;
  setRemoteId: (id: string) => void;
  onConnect: () => void;
}

export const Lobby: React.FC<LobbyProps> = ({ 
  onSelectLocal, 
  peerId, 
  remoteId, 
  setRemoteId, 
  onConnect 
}) => {
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(peerId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <div className="text-center space-y-2">
        <motion.h1 
          variants={itemVariants}
          className="text-6xl md:text-8xl font-black font-orbitron tracking-tighter italic bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(0,240,255,0.3)]"
        >
          NEON NEXUS
        </motion.h1>
        <motion.p variants={itemVariants} className="text-cyan-400/60 font-medium tracking-[0.5em] uppercase text-xs">
          Tactical Matrix Combat
        </motion.p>
      </div>

      <div className="grid gap-6">
        {/* Local PvP Option */}
        <motion.button
          variants={itemVariants}
          onClick={onSelectLocal}
          className="group relative p-1 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-blue-600/20 hover:from-cyan-500/40 hover:to-blue-600/40 transition-all duration-500 overflow-hidden"
        >
          <div className="relative flex items-center justify-between p-6 rounded-xl glass-panel border border-white/5">
            <div className="flex items-center gap-6">
              <div className="p-4 rounded-xl bg-cyan-500/10 text-cyan-400 group-hover:scale-110 transition-transform">
                <Users className="w-8 h-8" />
              </div>
              <div className="text-left">
                <h3 className="text-xl font-bold font-orbitron tracking-wider">LOCAL PvP</h3>
                <p className="text-slate-400 text-sm">Challenge a friend on this terminal</p>
              </div>
            </div>
            <ChevronRight className="w-6 h-6 text-cyan-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </motion.button>

        {/* Online Multiplayer Section */}
        <motion.div variants={itemVariants} className="p-8 rounded-2xl glass-panel border border-white/10 space-y-6 relative overflow-hidden">
          <div className="flex items-center gap-4 mb-2">
            <Globe className="w-6 h-6 text-purple-400" />
            <h3 className="text-xl font-bold font-orbitron tracking-wider text-purple-400">NEXUS LINK</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-slate-500 ml-1">Your Terminal ID</label>
              <div className="flex gap-2">
                <div className="flex-1 px-4 py-3 rounded-xl bg-slate-900/50 border border-white/5 font-mono text-sm text-cyan-300 flex items-center">
                  {peerId || 'Initializing...'}
                </div>
                <button 
                  onClick={copyToClipboard}
                  className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-slate-300 relative"
                  title="Copy ID"
                >
                  {copied ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="relative py-4 flex items-center">
              <div className="flex-grow border-t border-white/5"></div>
              <span className="flex-shrink mx-4 text-slate-600 text-[10px] uppercase tracking-widest font-bold">OR JOIN NODE</span>
              <div className="flex-grow border-t border-white/5"></div>
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-slate-500 ml-1">Target Terminal ID</label>
              <div className="flex gap-2">
                <input 
                  type="text"
                  value={remoteId}
                  onChange={(e) => setRemoteId(e.target.value)}
                  placeholder="Paste Node ID here..."
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-900/50 border border-white/5 font-mono text-sm focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all text-purple-300"
                />
                <button 
                  onClick={onConnect}
                  disabled={!remoteId}
                  className="px-6 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-30 disabled:hover:bg-purple-600 font-bold transition-all text-white shadow-lg shadow-purple-600/20 active:scale-95"
                >
                  LINK
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div variants={itemVariants} className="text-center">
        <p className="text-slate-500 text-[10px] uppercase tracking-[0.4em]">v2.5.0 Secure WebRTC Node System</p>
      </motion.div>
    </motion.div>
  );
};
