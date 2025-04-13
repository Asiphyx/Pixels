import { FC, useEffect, useRef, useState } from 'react';
import { useWebSocketStore } from '@/lib/websocket';
import { Message } from '@shared/schema';
import { BartenderAvatar } from '@/assets/svgs/bartenders';
import { PatronAvatar } from '@/assets/svgs/tavern-patrons';
import { tavernSoundscape } from '@/lib/audio/tavernSoundscape';

const ChatMessages: FC = () => {
  const { messages, user, onlineUsers } = useWebSocketStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesLengthRef = useRef<number>(0);

  // Auto scroll to bottom on new messages and play notification sound
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    
    // If there are more messages than before, play a notification sound
    // Only when it's not a message from the current user
    if (messages.length > messagesLengthRef.current) {
      const latestMessage = messages[messages.length - 1];
      
      // Don't play notification sound for the current user's messages
      if (latestMessage && latestMessage.userId !== user?.id) {
        console.log('New message detected - playing notification sound');
        
        // Try all notification methods
        
        // 1. Try using the global sound functions
        if ((window as any).playNotificationSound) {
          (window as any).playNotificationSound();
        }
        
        if (latestMessage.type === 'bartender') {
          // For bartender messages, also try the alert sound
          if ((window as any).playAlertSound) {
            setTimeout(() => {
              (window as any).playAlertSound();
            }, 300);
          }
          
          // 2. Also try through our system
          tavernSoundscape.playUiSound('notification', 1.0);
        } else if (latestMessage.type === 'user') {
          // For user messages
          tavernSoundscape.playUiSound('notification', 1.0);
        }
        
        // Fallback to basic beep as a last resort
        if ((window as any).playBeep) {
          setTimeout(() => {
            (window as any).playBeep();
          }, 100);
        }
      }
    }
    
    // Update the reference for next comparison
    messagesLengthRef.current = messages.length;
  }, [messages, user?.id]);

  const renderMessage = (message: Message) => {
    switch (message.type) {
      case 'user':
        // Get the user that sent this message
        const isCurrentUser = message.userId === user?.id;

        // Get the avatar for this user
        const avatarString = isCurrentUser 
          ? user?.avatar 
          : onlineUsers.find(u => u.id === message.userId)?.avatar || 'bard';

        return (
          <div className={`chat-message ${isCurrentUser ? 'user flex justify-end' : 'flex'}`}>
            {!isCurrentUser && message.userId && (
              <PatronAvatar 
                name={avatarString}
                size={32}
                className="mr-2"
              />
            )}
            <div className={`chat-bubble p-2 rounded-md max-w-[80%] ${
              isCurrentUser 
                ? 'bg-[#4A3429] text-[#E8D6B3]' 
                : 'bg-[#8B4513] text-[#E8D6B3]'
            }`}>
              {message.content}
            </div>
          </div>
        );

      case 'system':
        return (
          <div className="chat-message system">
            <div className="chat-bubble p-2 rounded-md max-w-[80%] bg-[rgba(255,215,0,0.2)] text-[#FFD700] italic">
              {message.content}
            </div>
          </div>
        );

      case 'emote':
        // Special styling for emote messages
        return (
          <div className="chat-message emote text-center">
            <div className="chat-bubble p-2 max-w-[80%] mx-auto bg-transparent text-[#FFB6C1] italic">
              {message.content}
            </div>
          </div>
        );

      case 'bartender':
        return (
          <div className="chat-message bartender flex">
            <BartenderAvatar 
              name={message.bartenderId === 1 ? "amethyst" : message.bartenderId === 2 ? "sapphire" : "ruby"}
              size={32}
              className="mr-2"
            />
            <div className="chat-bubble p-2 rounded-md max-w-[80%] bg-[#8B4513] text-[#E8D6B3]">
              {message.content}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Function to test audio directly
  const playTestSound = () => {
    try {
      console.log('Playing test sounds directly...');
      
      // Try using global sound functions first
      if ((window as any).playNotificationSound) {
        (window as any).playNotificationSound();
      }
      
      if ((window as any).playAlertSound) {
        setTimeout(() => {
          (window as any).playAlertSound();
        }, 500);
      }
      
      if ((window as any).playMessageSound) {
        setTimeout(() => {
          (window as any).playMessageSound();
        }, 1000);
      }
      
      // Try beep as final fallback
      if ((window as any).playBeep) {
        setTimeout(() => {
          (window as any).playBeep();
        }, 1500);
      }
      
      // Also try through our system
      tavernSoundscape.playUiSound('notification', 1.0);
      
    } catch (e) {
      console.error('Error in test sound:', e);
    }
  };
  
  return (
    <div 
      className="flex-grow p-4 overflow-y-auto font-['VT323'] text-lg text-[#E8D6B3]"
      style={{ maxHeight: 'calc(100vh - 400px)' }}
    >
      {/* Sound test button */}
      <div className="mb-4 text-right">
        <button
          onClick={playTestSound}
          className="px-2 py-1 bg-[#8B4513] text-[#E8D6B3] rounded-md text-sm"
        >
          🔊 Test Sound
        </button>
      </div>
      
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-center text-[#8B4513] opacity-50">
          <div>
            <p className="text-xl mb-2">Welcome to the Pixel Tavern!</p>
            <p>Messages will appear here. Type /menu to see available drinks and food.</p>
          </div>
        </div>
      ) : (
        messages.map((message, index) => (
          <div key={index} className="mb-4 animate-fadeIn">
            {renderMessage(message)}
          </div>
        ))
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessages;