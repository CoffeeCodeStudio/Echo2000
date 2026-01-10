import React, { useState, useCallback, useEffect } from 'react';
import { IsometricRoom } from './IsometricRoom';
import { PixelAvatar } from './PixelAvatar';
import { ActionButtons } from './ActionButtons';
import { ChatBubble } from './ChatBubble';
import { ClosedSign } from './ClosedSign';
import { VibeWallet } from './VibeWallet';
import { use8BitSounds } from './use8BitSounds';
import { AvatarAction, ChatMessage } from './types';
import './habbo-styles.css';

// Check if room is open (Sunday 18:00-23:00)
const isRoomOpen = (): boolean => {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday
  const hour = now.getHours();
  
  return day === 0 && hour >= 18 && hour < 23;
};

const getNextOpenTime = (): string => {
  const now = new Date();
  const daysUntilSunday = (7 - now.getDay()) % 7 || 7;
  
  // If it's Sunday but before 18:00
  if (now.getDay() === 0 && now.getHours() < 18) {
    return 'Idag kl 18:00';
  }
  
  // If it's Sunday after 23:00
  if (now.getDay() === 0 && now.getHours() >= 23) {
    return 'Nästa söndag kl 18:00';
  }
  
  const nextSunday = new Date(now);
  nextSunday.setDate(now.getDate() + daysUntilSunday);
  
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  };
  
  return nextSunday.toLocaleDateString('sv-SE', options) + ' kl 18:00';
};

export const HabboRoom: React.FC = () => {
  const [isOpen, setIsOpen] = useState(isRoomOpen());
  const [currentAction, setCurrentAction] = useState<AvatarAction>('idle');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const { playSitSound, playWaveSound, playDanceSound, playChatSound } = use8BitSounds();

  // Check room status every minute
  useEffect(() => {
    const checkStatus = () => setIsOpen(isRoomOpen());
    const interval = setInterval(checkStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = useCallback((action: AvatarAction) => {
    setCurrentAction(action);
    
    switch (action) {
      case 'sit':
        playSitSound();
        break;
      case 'wave':
        playWaveSound();
        break;
      case 'dance':
        playDanceSound();
        break;
    }
  }, [playSitSound, playWaveSound, playDanceSound]);

  const handleSendMessage = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputText.trim()) return;
    
    playChatSound();
    
    const newMessage: ChatMessage = {
      id: crypto.randomUUID(),
      text: inputText.trim().slice(0, 50), // Limit message length
      timestamp: Date.now(),
    };
    
    setMessages(prev => [...prev, newMessage]);
    setInputText('');
  }, [inputText, playChatSound]);

  const handleMessageComplete = useCallback((messageId: string) => {
    setMessages(prev => prev.filter(m => m.id !== messageId));
  }, []);

  // Mock vibe data - would connect to GoodVibe system
  const vibesRemaining = 3;
  const totalVibes = 5;

  return (
    <div className="habbo-room-wrapper">
      {/* Echo2000 Logo */}
      <div className="habbo-logo">
        <span className="habbo-logo-text">Echo2000</span>
      </div>

      {/* Vibe Wallet */}
      <VibeWallet vibesRemaining={vibesRemaining} totalVibes={totalVibes} />

      {/* Main Room Area */}
      <div className="habbo-room">
        <IsometricRoom>
          <PixelAvatar action={currentAction} />
          
          {/* Chat bubbles floating above avatar */}
          <div className="chat-bubbles-container">
            {messages.map(message => (
              <ChatBubble 
                key={message.id} 
                message={message}
                onComplete={() => handleMessageComplete(message.id)}
              />
            ))}
          </div>
        </IsometricRoom>

        {/* Closed overlay */}
        {!isOpen && <ClosedSign nextOpenTime={getNextOpenTime()} />}
      </div>

      {/* Controls - only show when open */}
      {isOpen && (
        <div className="habbo-controls">
          <ActionButtons 
            currentAction={currentAction} 
            onAction={handleAction} 
          />
          
          {/* Chat input */}
          <form onSubmit={handleSendMessage} className="habbo-chat-form">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Skriv något..."
              className="habbo-chat-input"
              maxLength={50}
            />
            <button type="submit" className="pixel-button pixel-button-send">
              Säg
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
