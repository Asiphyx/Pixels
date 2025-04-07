import { FC, useEffect, useRef } from 'react';
import { useWebSocketStore } from '@/lib/websocket';
import { Message } from '@shared/schema';
import { BartenderAvatar } from '@/assets/svgs/bartenders';
import { CharacterAvatar } from '@/assets/svgs/avatars';

const ChatMessages: FC = () => {
  const { messages, user } = useWebSocketStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const renderMessage = (message: Message) => {
    switch (message.type) {
      case 'user':
        // Get the user that sent this message (this is a simplification, the server should provide this)
        const isCurrentUser = message.userId === user?.id;
        
        return (
          <div className={`chat-message ${isCurrentUser ? 'user flex justify-end' : 'flex'}`}>
            {!isCurrentUser && (
              <CharacterAvatar 
                name="thorgrim" // This should be dynamic based on the sender
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
        
      case 'bartender':
        return (
          <div className="chat-message bartender flex">
            <BartenderAvatar 
              name={message.bartenderId === 1 ? "sapphire" : message.bartenderId === 2 ? "amethyst" : "indigo"}
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
