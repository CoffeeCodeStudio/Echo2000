export type AvatarAction = 'idle' | 'sit' | 'wave' | 'dance';

export interface ChatMessage {
  id: string;
  text: string;
  timestamp: number;
}

export interface RoomState {
  isOpen: boolean;
  currentAction: AvatarAction;
  messages: ChatMessage[];
}
