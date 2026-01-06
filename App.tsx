
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lobby } from './components/Lobby.tsx';
import { GameBoard } from './components/GameBoard.tsx';
import { StatsModal } from './components/StatsModal.tsx';
import { Chat } from './components/Chat.tsx';
import { useGameLogic } from './hooks/useGameLogic.ts';
import { GameMode, ChatMessage, NetworkMessage } from './types.ts';
import { Trophy, Home, RotateCcw, BarChart3, MessageSquare, Wifi, WifiOff, Activity, ShieldCheck } from 'lucide-react';

// Declaration for global PeerJS from CDN
declare const Peer: any;

export default function App() {
  const [mode, setMode] = useState<GameMode>('LOBBY');
  const [nexusId, setNexusId] = useState<string>('');
  const [remoteNexusId, setRemoteNexusId] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [localPlayer, setLocalPlayer] = useState<'X' | 'O' | null>(null);

  const peerRef = useRef<any>(null);
  const connRef = useRef<any>(null);
  
  const {
    board,
    xIsNext,
    winner,
    winningLine,
    scores,
    makeMove,
    resetGame,
    syncState
  } = useGameLogic();

  // CRITICAL: Logic Ref Pattern
  // PeerJS listeners are defined once, but makeMove/resetGame change every render.
  // We use a Ref to always provide the listener with the LATEST functions.
  const logicRef = useRef({
    makeMove,
    resetGame,
    syncState,
    setMessages,
    setMode,
    setIsConnected,
    setLocalPlayer
  });

  useEffect(() => {
    logicRef.current = {
      makeMove,
      resetGame,
      syncState,
      setMessages,
      setMode,
      setIsConnected,
      setLocalPlayer
    };
  }, [makeMove, resetGame, syncState]);

  // PeerJS Initialization
  useEffect(() => {
    const initPeer = () => {
      const peer = new Peer();
      peerRef.current = peer;

      peer.on('open', (id: string) => {
        setNexusId(id);
        console.log('Nexus Node Online:', id);
      });

      peer.on('connection', (conn: any) => {
        console.log('Incoming connection from:', conn.peer);
        if (connRef.current) connRef.current.close();
        
        connRef.current = conn;
        logicRef.current.setLocalPlayer('X');
        logicRef.current.setMode('ONLINE_HOST');
        setupListeners(conn);
      });

      peer.on('error', (err: any) => {
        console.error('Peer Protocol Error:', err);
        if (err.type === 'peer-disconnected') setIsConnected(false);
      });
    };

    // Check for Peer object (CDN load)
    if (typeof Peer === 'undefined') {
      const check = setInterval(() => {
        if (typeof Peer !== 'undefined') {
          initPeer();
          clearInterval(check);
        }
      }, 100);
    } else {
      initPeer();
    }

    return () => {
      if (peerRef.current) peerRef.current.destroy();
    };
  }, []);

  const setupListeners = (conn: any) => {
    conn.on('open', () => {
      console.log('Data channel established');
      setIsConnected(true);
    });

    conn.on('data', (data: NetworkMessage) => {
      console.log('Signal Received:', data.type, data.payload);
      switch (data.type) {
        case 'MOVE':
          logicRef.current.makeMove(data.payload.index);
          break;
        case 'RESET':
          logicRef.current.resetGame();
          break;
        case 'CHAT':
          logicRef.current.setMessages(prev => [...prev, data.payload]);
          break;
        case 'SYNC_STATE':
          logicRef.current.syncState(data.payload);
          break;
      }
    });

    conn.on('close', () => {
      console.log('Remote peer disconnected');
      setIsConnected(false);
      logicRef.current.setMode('LOBBY');
      connRef.current = null;
    });
  };

  const handleConnect = () => {
    if (!remoteNexusId || !peerRef.current) return;
    
    console.log('Connecting to remote Node:', remoteNexusId);
    const conn = peerRef.current.connect(remoteNexusId);
    connRef.current = conn;
    setLocalPlayer('O');
    setMode('ONLINE_JOIN');
    setupListeners(conn);
  };

  const handleSquareClick = (index: number) => {
    // Turn enforcement
    if (mode === 'ONLINE_HOST' || mode === 'ONLINE_JOIN') {
      const currentPlayerMark = xIsNext ? 'X' : 'O';
      if (currentPlayerMark !== localPlayer) return;
    }

    const moveResult = makeMove(index);
    if (moveResult && connRef.current && connRef.current.open) {
      connRef.current.send({
        type: 'MOVE',
        payload: { index }
      });
    }
  };

  const handleReset = () => {
    resetGame();
    if (connRef.current && connRef.current.open) {
      connRef.current.send({ type: 'RESET' });
    }
  };

  const sendChatMessage = (text: string) => {
    if (!localPlayer) return;
    const msg: ChatMessage = {
      id: Math.random().toString(36).substring(2, 11),
      sender: localPlayer,
      text,
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, msg]);
    if (connRef.current && connRef.current.open) {
      connRef.current.send({ type: 'CHAT', payload: msg });
    }
  };

  const isMyTurn = () => {
    if (mode === 'LOCAL') return true;
    const currentMark = xIsNext ? 'X' : 'O';
    return currentMark === localPlayer;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden font-rajdhani">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/5 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/5 blur-[120px] rounded-full"></div>

      <AnimatePresence mode="wait">
        {mode === 'LOBBY' ? (
          <motion.div
            key="lobby"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="w-full max-w-lg z-10"
          >
            <Lobby 
              onSelectLocal={() => {
                setLocalPlayer(null);
                setMode('LOCAL');
              }}
              onHost={() => {}}
              peerId={nexusId}
              remoteId={remoteNexusId}
              setRemoteId={setRemoteNexusId}
              onConnect={handleConnect}
            />
          </motion.div>
        ) : (
          <motion.div
            key="game"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-2xl flex flex-col items-center z-10"
          >
            <header className="w-full flex justify-between items-center mb-8 px-4">
              <button 
                onClick={() => {
                  if (connRef.current) connRef.current.close();
                  setMode('LOBBY');
                }}
                className="p-3 rounded-xl glass-panel hover:bg-white/10 transition-all group"
              >
                <Home className="w-6 h-6 group-hover:text-blue-400 transition-colors" />
              </button>
              
              <div className="flex flex-col items-center text-center">
                <div className="flex items-center gap-3">
                   <h1 className="text-2xl font-black font-orbitron tracking-tighter italic neon-text-blue">NEON NEXUS</h1>
                   {mode !== 'LOCAL' && (
                     <div className={`p-1 rounded-full ${isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400 animate-pulse'}`}>
                       {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                     </div>
                   )}
                </div>
                <div className="text-[10px] uppercase tracking-[0.4em] text-slate-500 font-bold mt-1 flex items-center gap-2">
                  <Activity className="w-3 h-3" />
                  P2P Secure Tunnel
                </div>
              </div>

              <button 
                onClick={() => setIsStatsOpen(true)}
                className="p-3 rounded-xl glass-panel hover:bg-white/10 transition-all group"
              >
                <BarChart3 className="w-6 h-6 group-hover:text-purple-400 transition-colors" />
              </button>
            </header>

            <div className="mb-8 flex gap-4 items-center scale-110">
              <div className={`px-6 py-2 rounded-xl border-2 transition-all duration-500 ${xIsNext ? 'border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.3)] bg-cyan-400/10' : 'border-white/5 opacity-40'}`}>
                <span className={`font-orbitron font-bold text-xl ${xIsNext ? 'text-cyan-400' : 'text-slate-500'}`}>X</span>
              </div>
              <div className="w-2 h-2 rounded-full bg-white/10"></div>
              <div className={`px-6 py-2 rounded-xl border-2 transition-all duration-500 ${!xIsNext ? 'border-purple-400 shadow-[0_0_15px_rgba(139,92,246,0.3)] bg-purple-400/10' : 'border-white/5 opacity-40'}`}>
                <span className={`font-orbitron font-bold text-xl ${!xIsNext ? 'text-purple-400' : 'text-slate-500'}`}>O</span>
              </div>
            </div>

            {(mode === 'ONLINE_HOST' || mode === 'ONLINE_JOIN') && (
               <div className="mb-6 h-6 flex items-center gap-2">
                  {isConnected && <ShieldCheck className="w-4 h-4 text-green-500" />}
                  <span className={`text-xs font-bold tracking-[0.3em] uppercase transition-all duration-300 ${isMyTurn() ? 'text-green-400 neon-text-green' : 'text-slate-600'}`}>
                    {isMyTurn() ? ">> Your Turn to Strike <<" : "Opponent Tactical Phase..."}
                  </span>
               </div>
            )}

            <GameBoard 
              board={board} 
              onSquareClick={handleSquareClick}
              winningLine={winningLine}
              winner={winner}
            />

            <div className="mt-12 flex gap-4 w-full justify-center">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-10 py-4 rounded-2xl glass-panel border border-white/10 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all font-black tracking-widest font-orbitron text-xs group italic"
              >
                <RotateCcw className="w-4 h-4 group-hover:rotate-[-180deg] transition-transform duration-700" />
                INIT RESTART
              </button>
              
              {(mode === 'ONLINE_HOST' || mode === 'ONLINE_JOIN') && (
                <button
                  onClick={() => setIsChatOpen(!isChatOpen)}
                  className={`p-4 rounded-2xl glass-panel border border-white/10 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all relative ${messages.length > 0 && !isChatOpen ? 'animate-bounce' : ''}`}
                >
                  <MessageSquare className={`w-6 h-6 ${isChatOpen ? 'text-white' : 'text-purple-400'}`} />
                  {messages.length > 0 && !isChatOpen && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
                  )}
                </button>
              )}
            </div>

            <AnimatePresence>
              {winner && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-xl"
                >
                  <motion.div 
                    initial={{ scale: 0.5, y: 50 }}
                    animate={{ scale: 1, y: 0 }}
                    className="glass-panel p-12 rounded-[2rem] border-2 border-white/10 text-center max-w-sm w-full mx-4 shadow-[0_0_50px_rgba(0,0,0,0.5)]"
                  >
                    <Trophy className={`w-24 h-24 mx-auto mb-6 ${winner === 'X' ? 'text-cyan-400 drop-shadow-[0_0_20px_rgba(0,240,255,0.6)]' : winner === 'O' ? 'text-purple-400 drop-shadow-[0_0_20px_rgba(139,92,246,0.6)]' : 'text-slate-400'}`} />
                    <h2 className="text-5xl font-black font-orbitron mb-2 tracking-tighter italic">
                      {winner === 'DRAW' ? "DRAW" : "VICTORY"}
                    </h2>
                    <p className="text-slate-500 mb-10 tracking-[0.4em] uppercase text-[10px] font-bold">
                      Match Sequence Terminated
                    </p>
                    <button
                      onClick={handleReset}
                      className="w-full py-5 rounded-2xl bg-white text-slate-950 font-black font-orbitron tracking-widest text-xs hover:bg-cyan-400 transition-all active:scale-95 italic"
                    >
                      ENGAGE NEW ROUND
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <StatsModal 
        isOpen={isStatsOpen} 
        onClose={() => setIsStatsOpen(false)} 
        scores={scores} 
      />

      <Chat 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        messages={messages} 
        onSendMessage={sendChatMessage} 
        currentMark={localPlayer || 'X'}
      />
    </div>
  );
}
