import { FC, useEffect, useRef } from 'react';
import { useWebSocketStore } from '@/lib/websocket';
import { Message } from '@shared/schema';
import { BartenderAvatar } from '@/assets/svgs/bartenders';
import { PixelAvatar, RoleDescriptions } from '@/assets/svgs/pixel-avatars';

const ChatMessages: FC = () => {
  const { messages, user, onlineUsers } = useWebSocketStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const renderMessage = (message: Message) => {
    // Check if message has a valid type before proceeding
    if (!message || !message.type) {
      console.error("Invalid message object:", message);
      return null;
    }
    
    switch (message.type) {
      case 'user':
        // Get the user that sent this message
        const isCurrentUser = message.userId === user?.id;

        // Get the avatar for this user
        const avatarString = isCurrentUser 
          ? user?.avatar || 'bard' 
          : onlineUsers.find(u => u.id === message.userId)?.avatar || 'bard';

        return (
          <div className={`chat-message ${isCurrentUser ? 'user flex justify-end' : 'flex'}`}>
            {!isCurrentUser && message.userId && (
              <div className="relative group avatar-wrapper mr-2">
                <PixelAvatar 
                  name={avatarString}
                  size={36}
                />
                <div className="absolute -top-10 left-0 bg-[#2C1810] p-2 rounded border border-[#8B4513] 
                              text-[#E8D6B3] text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 
                              transition-opacity z-50 pointer-events-none shadow-lg">
                  {RoleDescriptions[avatarString.toLowerCase() as keyof typeof RoleDescriptions] || "Tavern Patron"}
                </div>
              </div>
            )}
            <div className={`chat-bubble p-2 rounded-md max-w-[80%] relative ${
              isCurrentUser 
                ? 'bg-[#4A3429] text-[#E8D6B3]' 
                : 'bg-[#8B4513] text-[#E8D6B3]'
            }`}>
              {!isCurrentUser && (
                <span className="text-[#FFD700] text-xs font-bold block mb-1">
                  {onlineUsers.find(u => u.id === message.userId)?.username}
                  <span className="text-[#E8D6B3] opacity-70 ml-2 italic">
                    {avatarString.charAt(0).toUpperCase() + avatarString.slice(1)}
                  </span>
                </span>
              )}
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
            <div className="relative group">
              <BartenderAvatar 
                name={message.bartenderId === 1 ? "amethyst" : message.bartenderId === 2 ? "sapphire" : "ruby"}
                size={40}
                className="mr-2"
              />
              <div className="absolute -top-10 left-0 bg-[#2C1810] p-2 rounded border border-[#8B4513] 
                            text-[#E8D6B3] text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 
                            transition-opacity z-50 pointer-events-none shadow-lg">
                Tavern Bartender
              </div>
            </div>
            <div className="chat-bubble p-2 rounded-md max-w-[80%] bg-[#8B4513] text-[#E8D6B3]">
              <span className="text-[#FFD700] text-xs font-bold block mb-1">
                {message.bartenderId === 1 ? "Amethyst" : message.bartenderId === 2 ? "Sapphire" : "Ruby"}
                <span className="text-[#E8D6B3] opacity-70 ml-2 italic">
                  Bartender
                </span>
              </span>
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
      className="flex-grow p-4 overflow-y-auto overflow-x-hidden font-['VT323'] text-lg text-[#E8D6B3] custom-scrollbar"
      style={{ 
        maxHeight: 'calc(100vh - 400px)',
        scrollbarWidth: 'thin',
        scrollbarColor: '#8B4513 transparent'
      }}
    >
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-center text-[#8B4513] opacity-50">
          <div>
            <p className="text-xl mb-2">Welcome to the Pixel Tavern!</p>
            <p>Messages will appear here. Type /menu to see available drinks and food.</p>
          </div>
        </div>
      ) : (
        messages
          .filter(message => message && typeof message === 'object')
          .map((message, index) => (
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