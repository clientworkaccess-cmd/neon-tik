
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lobby } from './components/Lobby.tsx';
import { GameBoard } from './components/GameBoard.tsx';
import { StatsModal } from './components/StatsModal.tsx';
import { Chat } from './components/Chat.tsx';
import { useGameLogic } from './hooks/useGameLogic.ts';
import { GameMode, ChatMessage, NetworkMessage } from './types.ts';
import { Trophy, Home, RotateCcw, BarChart3, MessageSquare, Wifi, WifiOff, Activity, ShieldCheck, Zap } from 'lucide-react';

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

  // Reference to the latest game state for syncing
  const gameStateRef = useRef({ board, xIsNext, winner, winningLine, scores });
  useEffect(() => {
    gameStateRef.current = { board, xIsNext, winner, winningLine, scores };
  }, [board, xIsNext, winner, winningLine, scores]);

  // Logic Ref for network listeners to access latest functions
  const logicRef = useRef({
    makeMove,
    resetGame,
    syncState,
    setMessages,
    setMode,
    setIsConnected,
    setLocalPlayer,
    setRemoteNexusId
  });

  useEffect(() => {
    logicRef.current = {
      makeMove,
      resetGame,
      syncState,
      setMessages,
      setMode,
      setIsConnected,
      setLocalPlayer,
      setRemoteNexusId
    };
  }, [makeMove, resetGame, syncState]);

  // PeerJS Init
  useEffect(() => {
    const initPeer = () => {
      const peer = new Peer(null, { debug: 1 });
      peerRef.current = peer;

      peer.on('open', (id: string) => {
        setNexusId(id);
        console.log('Nexus Node ID Generated:', id);
      });

      peer.on('connection', (conn: any) => {
        console.log('Remote Request Incoming:', conn.peer);
        if (connRef.current) connRef.current.close();
        
        connRef.current = conn;
        logicRef.current.setLocalPlayer('X');
        logicRef.current.setMode('ONLINE_HOST');
        logicRef.current.setRemoteNexusId(conn.peer);
        setupListeners(conn);
      });

      peer.on('error', (err: any) => {
        console.error('Peer Protocol Error:', err.type);
        if (err.type === 'peer-disconnected' || err.type === 'network') {
          setIsConnected(false);
        }
      });
      
      peer.on('disconnected', () => {
        console.warn('Disconnected from PeerServer. Reconnecting...');
        peer.reconnect();
      });
    };

    if (typeof Peer === 'undefined') {
      const check = setInterval(() => {
        if (typeof Peer !== 'undefined') {
          initPeer();
          clearInterval(check);
        }
      }, 200);
    } else {
      initPeer();
    }

    return () => {
      if (peerRef.current) peerRef.current.destroy();
    };
  }, []);

  const setupListeners = (conn: any) => {
    conn.on('open', () => {
      console.log('Bi-directional Tunnel Open');
      setIsConnected(true);
      
      // Host sends current state to joiner immediately
      if (logicRef.current.setLocalPlayer === undefined) return; // safety
      
      // If we are the host, send the current board to the joiner
      if (connRef.current.peer !== nexusId) {
        conn.send({
          type: 'SYNC_STATE',
          payload: gameStateRef.current
        });
      }
    });

    conn.on('data', (data: NetworkMessage) => {
      console.log('Received Signal:', data.type);
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
      console.warn('P2P Tunnel Collapsed');
      setIsConnected(false);
      logicRef.current.setMode('LOBBY');
      connRef.current = null;
    });

    conn.on('error', (err: any) => {
      console.error('Data Channel Error:', err);
    });
  };

  const handleConnect = () => {
    if (!remoteNexusId || !peerRef.current) return;
    
    console.log('Initiating Link with:', remoteNexusId);
    const conn = peerRef.current.connect(remoteNexusId, {
      reliable: true
    });
    
    connRef.current = conn;
    setLocalPlayer('O');
    setMode('ONLINE_JOIN');
    setupListeners(conn);
  };

  const handleSquareClick = (index: number) => {
    const currentPlayerMark = xIsNext ? 'X' : 'O';
    
    // Remote Turn Enforcement
    if (mode === 'ONLINE_HOST' || mode === 'ONLINE_JOIN') {
      if (currentPlayerMark !== localPlayer) {
        console.warn('Tactical Alert: Not your turn.');
        return;
      }
    }

    const moveResult = makeMove(index);
    if (moveResult && connRef.current && connRef.current.open) {
      console.log('Sending Move Signal:', index);
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
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 blur-[150px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-600/10 blur-[150px] rounded-full"></div>

      <AnimatePresence mode="wait">
        {mode === 'LOBBY' ? (
          <motion.div
            key="lobby"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
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
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="w-full max-w-2xl flex flex-col items-center z-10"
          >
            <header className="w-full flex justify-between items-center mb-10 px-6 py-4 glass-panel rounded-2xl border border-white/5 shadow-xl">
              <button 
                onClick={() => {
                  if (connRef.current) connRef.current.close();
                  setMode('LOBBY');
                }}
                className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all group"
              >
                <Home className="w-6 h-6 group-hover:text-blue-400" />
              </button>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-3">
                   <h1 className="text-2xl font-black font-orbitron tracking-tight italic neon-text-blue">NEON NEXUS</h1>
                   {mode !== 'LOCAL' && (
                     <div className={`flex items-center gap-2 px-2 py-1 rounded-full text-[10px] font-bold ${isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400 animate-pulse'}`}>
                       {isConnected ? <Zap className="w-3 h-3 fill-current" /> : <WifiOff className="w-3 h-3" />}
                       {isConnected ? 'ONLINE' : 'LINK LOST'}
                     </div>
                   )}
                </div>
                <div className="text-[10px] uppercase tracking-[0.4em] text-slate-500 font-bold mt-1">
                   Grid Phase {winner ? 'Terminal' : 'Active'}
                </div>
              </div>

              <button 
                onClick={() => setIsStatsOpen(true)}
                className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all group"
              >
                <BarChart3 className="w-6 h-6 group-hover:text-purple-400" />
              </button>
            </header>

            <div className="mb-10 flex gap-6 items-center">
              <div className={`relative px-8 py-3 rounded-2xl border-2 transition-all duration-500 ${xIsNext ? 'border-cyan-400 bg-cyan-400/10 shadow-[0_0_20px_rgba(0,240,255,0.2)]' : 'border-white/5 opacity-30 scale-90'}`}>
                <span className={`font-orbitron font-black text-2xl ${xIsNext ? 'text-cyan-400' : 'text-slate-500'}`}>PLAYER X</span>
                {xIsNext && <motion.div layoutId="turn-indicator" className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-cyan-400 rounded-full" />}
              </div>
              <div className="text-slate-700 font-bold text-xl italic font-orbitron">VS</div>
              <div className={`relative px-8 py-3 rounded-2xl border-2 transition-all duration-500 ${!xIsNext ? 'border-purple-400 bg-purple-400/10 shadow-[0_0_20px_rgba(139,92,246,0.2)]' : 'border-white/5 opacity-30 scale-90'}`}>
                <span className={`font-orbitron font-black text-2xl ${!xIsNext ? 'text-purple-400' : 'text-slate-500'}`}>PLAYER O</span>
                {!xIsNext && <motion.div layoutId="turn-indicator" className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-purple-400 rounded-full" />}
              </div>
            </div>

            {(mode === 'ONLINE_HOST' || mode === 'ONLINE_JOIN') && (
               <div className="mb-8 h-6 flex items-center gap-3">
                  {isConnected && <ShieldCheck className="w-4 h-4 text-green-500 animate-pulse" />}
                  <span className={`text-xs font-black tracking-[0.4em] uppercase transition-all duration-500 ${isMyTurn() ? 'text-green-400 neon-text-green' : 'text-slate-600'}`}>
                    {isMyTurn() ? ">> Ready to Execute <<" : "Syncing Opponent Move..."}
                  </span>
               </div>
            )}

            <GameBoard 
              board={board} 
              onSquareClick={handleSquareClick}
              winningLine={winningLine}
              winner={winner}
            />

            <div className="mt-14 flex gap-6 w-full justify-center">
              <button
                onClick={handleReset}
                className="flex items-center gap-3 px-12 py-5 rounded-2xl glass-panel border border-white/10 hover:border-blue-500/50 hover:bg-blue-500/10 transition-all font-black tracking-widest font-orbitron text-xs group italic uppercase"
              >
                <RotateCcw className="w-4 h-4 group-hover:rotate-[-180deg] transition-transform duration-700" />
                Reset System
              </button>
              
              {(mode === 'ONLINE_HOST' || mode === 'ONLINE_JOIN') && (
                <button
                  onClick={() => setIsChatOpen(!isChatOpen)}
                  className={`p-5 rounded-2xl glass-panel border border-white/10 hover:border-purple-500/50 hover:bg-purple-500/10 transition-all relative ${messages.length > 0 && !isChatOpen ? 'animate-bounce' : ''}`}
                >
                  <MessageSquare className={`w-6 h-6 ${isChatOpen ? 'text-white' : 'text-purple-400'}`} />
                  {messages.length > 0 && !isChatOpen && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[8px] font-black text-white border-2 border-slate-950">
                      !
                    </div>
                  )}
                </button>
              )}
            </div>

            <AnimatePresence>
              {winner && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-2xl"
                >
                  <motion.div 
                    initial={{ scale: 0.7, y: 100 }}
                    animate={{ scale: 1, y: 0 }}
                    className="glass-panel p-16 rounded-[3rem] border-2 border-white/10 text-center max-w-md w-full mx-4 shadow-2xl relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600"></div>
                    <Trophy className={`w-28 h-28 mx-auto mb-8 ${winner === 'X' ? 'text-cyan-400 drop-shadow-[0_0_25px_rgba(0,240,255,0.7)]' : winner === 'O' ? 'text-purple-400 drop-shadow-[0_0_25px_rgba(139,92,246,0.7)]' : 'text-slate-400'}`} />
                    <h2 className="text-6xl font-black font-orbitron mb-4 tracking-tighter italic">
                      {winner === 'DRAW' ? "EQUITY" : "DOMINANT"}
                    </h2>
                    <p className="text-slate-500 mb-12 tracking-[0.5em] uppercase text-xs font-bold">
                      {winner === 'DRAW' ? "Mutual System Exhaustion" : `Player ${winner} has overridden the grid`}
                    </p>
                    <button
                      onClick={handleReset}
                      className="w-full py-6 rounded-2xl bg-white text-slate-950 font-black font-orbitron tracking-[0.2em] text-sm hover:bg-cyan-400 hover:shadow-[0_0_30px_rgba(0,240,255,0.4)] transition-all active:scale-95 italic uppercase"
                    >
                      Re-Initialize Link
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
