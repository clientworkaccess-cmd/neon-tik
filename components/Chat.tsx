
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Terminal } from 'lucide-react';
import { ChatMessage } from '../types.ts';

interface ChatProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  currentMark: 'X' | 'O';
}

export const Chat: React.FC<ChatProps> = ({ isOpen, onClose, messages, onSendMessage, currentMark }) => {
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          className="fixed bottom-24 right-4 z-40 w-80 h-96 flex flex-col glass-panel rounded-3xl border border-white/10 shadow-2xl"
        >
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-purple-400">
              <Terminal className="w-4 h-4" />
              <span className="font-orbitron font-bold text-xs tracking-widest">COMMS CHANNEL</span>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white/5 rounded-md transition-colors text-slate-500">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-800"
          >
            {messages.length === 0 && (
              <div className="h-full flex items-center justify-center text-slate-600 text-xs text-center p-8 uppercase tracking-widest leading-loose">
                Secure link established. Awaiting data transmission...
              </div>
            )}
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex flex-col ${msg.sender === currentMark ? 'items-end' : 'items-start'}`}
              >
                <span className={`text-[10px] font-bold tracking-tighter mb-1 uppercase opacity-50 ${msg.sender === 'X' ? 'text-cyan-400' : 'text-purple-400'}`}>
                  {msg.sender === currentMark ? 'YOU' : `PLAYER ${msg.sender}`}
                </span>
                <div className={`
                  px-3 py-2 rounded-xl text-sm max-w-[85%]
                  ${msg.sender === currentMark 
                    ? 'bg-blue-600/20 text-blue-100 rounded-tr-none border border-blue-500/20' 
                    : 'bg-slate-800/50 text-slate-200 rounded-tl-none border border-white/5'
                  }
                `}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="p-4 border-t border-white/5 flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Signal output..."
              className="flex-1 bg-slate-900/50 border border-white/5 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-cyan-500/50 transition-colors"
            />
            <button 
              type="submit"
              className="p-2 bg-cyan-600/20 text-cyan-400 rounded-xl hover:bg-cyan-600/40 transition-colors border border-cyan-500/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
