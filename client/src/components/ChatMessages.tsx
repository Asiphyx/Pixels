import { FC, useEffect, useRef, useState } from 'react';
import { useWebSocketStore } from '@/lib/websocket';
import { Message } from '@shared/schema';
import { BartenderAvatar } from '@/assets/svgs/bartenders';
import { PatronAvatar } from '@/assets/svgs/tavern-patrons';
import { useTavernAudio } from '@/hooks/use-tavern-audio';

const ChatMessages: FC = () => {
  const { messages, user, onlineUsers } = useWebSocketStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { playSound } = useTavernAudio();
  const [lastMessageCount, setLastMessageCount] = useState(0);
  
  // Auto scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    
    // Play sounds when new messages arrive
    if (messages.length > lastMessageCount) {
      // Get the latest message
      const latestMessage = messages[messages.length - 1];
      
      // Play different sounds based on message type
      if (latestMessage) {
        if (latestMessage.type === 'bartender') {
          // Play glass clink sound when bartender serves a drink (if message mentions drink or serving)
          const content = latestMessage.content.toLowerCase();
          if (content.includes('drink') || content.includes('serve') || 
              content.includes('pour') || content.includes('here you go')) {
            playSound('drink-serve');
          } else {
            // General bartender response
            playSound('glass-clink');
          }
        } else if (latestMessage.type === 'system' && latestMessage.content.includes('joined')) {
          // Door sound when users join
          playSound('door-open');
        } else if (latestMessage.type === 'user' && latestMessage.userId !== user?.id) {
          // Chair movement sound for other users talking
          playSound('chair-move');
        } else if (latestMessage.content?.toLowerCase().includes('order') || 
                  latestMessage.content?.toLowerCase().includes('coin')) {
          // Coin sound for orders
          playSound('coin-drop');
        }
      }
      
      // Update the message count
      setLastMessageCount(messages.length);
    }
  }, [messages, lastMessageCount, playSound, user?.id]);
  
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
        // Determine which bartender is speaking
        const bartenderName = message.bartenderId === 1 
          ? "amethyst" 
          : message.bartenderId === 2 
            ? "sapphire" 
            : "ruby";
            
        return (
          <div className="chat-message bartender flex">
            <BartenderAvatar 
              name={bartenderName}
              size={32}
              className="mr-2"
            />
            <div className={`chat-bubble p-2 rounded-md max-w-[80%] ${
              bartenderName === "amethyst"
                ? "bg-[#9b59b6] text-white"
                : bartenderName === "sapphire"
                  ? "bg-[#3498db] text-white"
                  : "bg-[#e74c3c] text-white" 
            }`}>
              {message.content}
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div 
      className="flex-grow p-4 overflow-y-auto font-['VT323'] text-lg text-[#E8D6B3]"
      style={{ maxHeight: 'calc(100vh - 400px)' }}
    >
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-center text-[#8B4513] opacity-50">
          <div>
            <p className="text-xl mb-2">Welcome to the Pixel Tavern!</p>
            <p>Messages will appear here. Type /menu to see available drinks and food.</p>
          </div>
        </div>
      ) : (
        messages.map((message, index) => (
          <div key={index} className="mb-2">
            {renderMessage(message)}
          </div>
        ))
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessages;