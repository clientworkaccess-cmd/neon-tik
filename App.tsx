
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lobby } from './components/Lobby.tsx';
import { GameBoard } from './components/GameBoard.tsx';
import { StatsModal } from './components/StatsModal.tsx';
import { Chat } from './components/Chat.tsx';
import { useGameLogic } from './hooks/useGameLogic.ts';
import { GameMode, ChatMessage, NetworkMessage } from './types.ts';
import { Trophy, Home, RotateCcw, BarChart3, MessageSquare } from 'lucide-react';

// Declaration for global PeerJS from CDN
declare const Peer: any;

export default function App() {
  const [mode, setMode] = useState<GameMode>('LOBBY');
  const [peerId, setPeerId] = useState<string>('');
  const [remotePeerId, setRemotePeerId] = useState<string>('');
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

  // PeerJS setup
  useEffect(() => {
    // Check if Peer is defined (loaded from CDN)
    if (typeof Peer === 'undefined') {
      const checkPeer = setInterval(() => {
        if (typeof Peer !== 'undefined') {
          initializePeer();
          clearInterval(checkPeer);
        }
      }, 100);
      return () => clearInterval(checkPeer);
    } else {
      initializePeer();
    }

    function initializePeer() {
      const peer = new Peer();
      peerRef.current = peer;

      peer.on('open', (id: string) => {
        setPeerId(id);
      });

      peer.on('connection', (conn: any) => {
        if (connRef.current) connRef.current.close();
        connRef.current = conn;
        setLocalPlayer('X');
        setMode('ONLINE_HOST');
        setupConnectionListeners(conn);
      });
    }

    return () => {
      if (peerRef.current) peerRef.current.destroy();
    };
  }, []);

  const setupConnectionListeners = (conn: any) => {
    conn.on('open', () => {
      setIsConnected(true);
    });

    conn.on('data', (data: NetworkMessage) => {
      switch (data.type) {
        case 'MOVE':
          makeMove(data.payload.index);
          break;
        case 'RESET':
          resetGame();
          break;
        case 'CHAT':
          setMessages(prev => [...prev, data.payload]);
          break;
        case 'SYNC_STATE':
          syncState(data.payload);
          break;
      }
    });

    conn.on('close', () => {
      setIsConnected(false);
      setMode('LOBBY');
    });
  };

  const connectToPeer = () => {
    if (!remotePeerId || !peerRef.current) return;
    const conn = peerRef.current.connect(remotePeerId);
    connRef.current = conn;
    setLocalPlayer('O');
    setMode('ONLINE_JOIN');
    setupConnectionListeners(conn);
  };

  const handleSquareClick = (index: number) => {
    if (mode === 'ONLINE_HOST' || mode === 'ONLINE_JOIN') {
      const currentPlayerMark = xIsNext ? 'X' : 'O';
      if (currentPlayerMark !== localPlayer) return;
    }

    const move = makeMove(index);
    if (move && connRef.current) {
      connRef.current.send({
        type: 'MOVE',
        payload: { index }
      });
    }
  };

  const handleReset = () => {
    resetGame();
    if (connRef.current) {
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
    if (connRef.current) {
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
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full"></div>

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
              onSelectLocal={() => setMode('LOCAL')}
              onHost={() => {}}
              peerId={peerId}
              remoteId={remotePeerId}
              setRemoteId={setRemotePeerId}
              onConnect={connectToPeer}
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
                onClick={() => setMode('LOBBY')}
                className="p-3 rounded-xl glass-panel hover:bg-white/10 transition-all group"
              >
                <Home className="w-6 h-6 group-hover:text-blue-400 transition-colors" />
              </button>
              
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold tracking-widest font-orbitron neon-text-blue">NEON NEXUS</h1>
                <div className="text-[10px] uppercase tracking-[0.3em] opacity-50">Grid Combat Protocol</div>
              </div>

              <button 
                onClick={() => setIsStatsOpen(true)}
                className="p-3 rounded-xl glass-panel hover:bg-white/10 transition-all group"
              >
                <BarChart3 className="w-6 h-6 group-hover:text-purple-400 transition-colors" />
              </button>
            </header>

            <div className="mb-6 flex gap-4 items-center">
              <div className={`px-6 py-2 rounded-lg border transition-all duration-300 ${xIsNext ? 'border-cyan-400/50 bg-cyan-400/10' : 'border-white/5 opacity-40'}`}>
                <span className={`font-orbitron font-bold text-xl ${xIsNext ? 'neon-text-blue' : ''}`}>PLAYER X</span>
              </div>
              <div className="text-xl font-bold opacity-30 italic">VS</div>
              <div className={`px-6 py-2 rounded-lg border transition-all duration-300 ${!xIsNext ? 'border-purple-400/50 bg-purple-400/10' : 'border-white/5 opacity-40'}`}>
                <span className={`font-orbitron font-bold text-xl ${!xIsNext ? 'neon-text-purple' : ''}`}>PLAYER O</span>
              </div>
            </div>

            {(mode === 'ONLINE_HOST' || mode === 'ONLINE_JOIN') && (
               <div className="mb-4 text-center">
                  <span className={`text-sm font-semibold tracking-widest uppercase ${isMyTurn() ? 'text-green-400 animate-pulse' : 'text-slate-500'}`}>
                    {isMyTurn() ? "Your Turn" : "Opponent's Turn"}
                  </span>
               </div>
            )}

            <GameBoard 
              board={board} 
              onSquareClick={handleSquareClick}
              winningLine={winningLine}
              winner={winner}
            />

            <div className="mt-10 flex gap-4 w-full justify-center">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-8 py-3 rounded-xl glass-panel border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all font-bold tracking-wider group"
              >
                <RotateCcw className="w-5 h-5 group-hover:rotate-[-180deg] transition-transform duration-500" />
                RESTART
              </button>
              
              {(mode === 'ONLINE_HOST' || mode === 'ONLINE_JOIN') && (
                <button
                  onClick={() => setIsChatOpen(!isChatOpen)}
                  className="p-3 rounded-xl glass-panel border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all"
                >
                  <MessageSquare className="w-6 h-6 text-purple-400" />
                </button>
              )}
            </div>

            <AnimatePresence>
              {winner && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md"
                >
                  <div className="glass-panel p-10 rounded-3xl border border-white/20 text-center max-w-sm w-full mx-4 shadow-2xl">
                    <Trophy className={`w-20 h-20 mx-auto mb-4 ${winner === 'X' ? 'text-cyan-400 drop-shadow-[0_0_15px_rgba(0,240,255,0.5)]' : winner === 'O' ? 'text-purple-400 drop-shadow-[0_0_15px_rgba(139,92,246,0.5)]' : 'text-slate-400'}`} />
                    <h2 className="text-4xl font-black font-orbitron mb-2 tracking-tighter italic">
                      {winner === 'DRAW' ? "SYSTEM DRAW" : `PLAYER ${winner} WINS`}
                    </h2>
                    <p className="text-slate-400 mb-8 tracking-widest uppercase text-sm">Nexus match concluded</p>
                    <button
                      onClick={handleReset}
                      className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 font-bold tracking-widest shadow-lg shadow-cyan-500/20 active:scale-95 transition-transform"
                    >
                      PLAY AGAIN
                    </button>
                  </div>
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
