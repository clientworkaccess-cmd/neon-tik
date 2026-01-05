
export type PlayerMark = 'X' | 'O' | null;

export type GameMode = 'LOBBY' | 'LOCAL' | 'ONLINE_HOST' | 'ONLINE_JOIN';

export interface GameState {
  board: PlayerMark[];
  xIsNext: boolean;
  winner: PlayerMark | 'DRAW';
  winningLine: number[] | null;
  scores: {
    X: number;
    O: number;
    DRAW: number;
  };
}

export interface ChatMessage {
  id: string;
  sender: 'X' | 'O';
  text: string;
  timestamp: number;
}

export interface NetworkMessage {
  type: 'MOVE' | 'RESET' | 'CHAT' | 'SYNC_STATE';
  payload: any;
}
