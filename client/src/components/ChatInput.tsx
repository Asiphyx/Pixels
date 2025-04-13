import { FC, useState, KeyboardEvent, useEffect } from 'react';
import { useWebSocketStore } from '@/lib/websocket';
import { SendIcon, AtSign } from 'lucide-react';

const ChatInput: FC = () => {
  const [message, setMessage] = useState<string>('');
  const [showMentionOptions, setShowMentionOptions] = useState(false);
  const { sendMessage, toggleMenu, roomId } = useWebSocketStore();
  
  // Reset state when room changes
  useEffect(() => {
    setMessage('');
    setShowMentionOptions(false);
  }, [roomId]);
  
  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    const trimmedMessage = message.trim();
    
    // Check for commands
    if (trimmedMessage === '/menu') {
      toggleMenu();
      setMessage('');
      return;
    } else if (trimmedMessage.startsWith('/emote ')) {
      // Extract the emote action
      const emoteAction = trimmedMessage.substring(7).trim();
      if (emoteAction) {
        sendMessage(emoteAction, 'emote');
      }
    } else {
      // Log message before sending to help debug
      console.log(`Sending message to room ${roomId}: "${trimmedMessage}"`);
      sendMessage(trimmedMessage);
    }
    
    setMessage('');
    setShowMentionOptions(false);
  };
  
  // Helper to insert bartender mention
  const insertMention = (bartenderName: string) => {
    setMessage(`@${bartenderName} `);
    setShowMentionOptions(false);
  };
  
  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };
  
  return (
    <div className="chat-input p-3 border-t-4 border-[#8B4513]">
      <div className="flex gap-2 items-center">
        {/* Mention button */}
        <button 
          onClick={() => setShowMentionOptions(!showMentionOptions)}
          className="bg-[#8B4513] text-[#E8D6B3] p-2 rounded-sm transition hover:bg-[#9B5523]"
          title="Mention bartender"
        >
          <AtSign className="h-5 w-5" />
        </button>
        
        <div className="relative flex-grow">
          <input 
            type="text" 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full bg-[#2C1810] border-2 border-[#8B4513] text-[#E8D6B3] p-2 rounded-sm font-['VT323'] text-lg"
            placeholder="Say something or type /menu..."
          />
          
          {/* Mention dropdown */}
          {showMentionOptions && (
            <div className="absolute top-full left-0 mt-1 w-full bg-[#2C1810] border-2 border-[#8B4513] rounded-sm z-50 shadow-lg">
              <div className="p-2 text-[#FFD700] font-['VT323'] text-sm border-b border-[#8B4513]">
                Mention a bartender
              </div>
              
              {/* Current room bartender with special highlighting */}
              <div 
                className="p-2 hover:bg-[#8B4513] cursor-pointer font-['VT323'] flex items-center border-l-4 border-[#FFD700]"
                onClick={() => insertMention(roomId === 1 ? "Amethyst" : roomId === 2 ? "Sapphire" : "Ruby")}
              >
                <div className="w-6 h-6 mr-2 flex items-center justify-center rounded-full bg-[#8B4513] text-[#FFD700]">★</div>
                <div>
                  <div className="text-[#FFD700]">
                    {roomId === 1 ? "Amethyst" : roomId === 2 ? "Sapphire" : "Ruby"}
                  </div>
                  <div className="text-[#E8D6B3] text-xs opacity-70">
                    Currently serving in this room
                  </div>
                </div>
              </div>
              
              {/* All bartenders options */}
              {roomId !== 1 && (
                <div 
                  className="p-2 hover:bg-[#8B4513] cursor-pointer text-[#E8D6B3] font-['VT323'] flex items-center"
                  onClick={() => insertMention("Amethyst")}
                >
                  <div className="w-6 h-6 mr-2 flex items-center justify-center rounded-full bg-[#4A3429] text-[#E8D6B3]">1</div>
                  <div>
                    <div className="text-[#E8D6B3]">Amethyst</div>
                    <div className="text-[#E8D6B3] text-xs opacity-70">Serving in The Rose Garden</div>
                  </div>
                </div>
              )}
              {roomId !== 2 && (
                <div 
                  className="p-2 hover:bg-[#8B4513] cursor-pointer text-[#E8D6B3] font-['VT323'] flex items-center"
                  onClick={() => insertMention("Sapphire")}
                >
                  <div className="w-6 h-6 mr-2 flex items-center justify-center rounded-full bg-[#4A3429] text-[#E8D6B3]">2</div>
                  <div>
                    <div className="text-[#E8D6B3]">Sapphire</div>
                    <div className="text-[#E8D6B3] text-xs opacity-70">Serving in The Ocean View</div>
                  </div>
                </div>
              )}
              {roomId !== 3 && (
                <div 
                  className="p-2 hover:bg-[#8B4513] cursor-pointer text-[#E8D6B3] font-['VT323'] flex items-center"
                  onClick={() => insertMention("Ruby")}
                >
                  <div className="w-6 h-6 mr-2 flex items-center justify-center rounded-full bg-[#4A3429] text-[#E8D6B3]">3</div>
                  <div>
                    <div className="text-[#E8D6B3]">Ruby</div>
                    <div className="text-[#E8D6B3] text-xs opacity-70">Serving in The Dragon's Den</div>
                  </div>
                </div>
              )}
              
              <div className="p-2 border-t border-[#8B4513] text-[#E8D6B3] text-xs opacity-70">
                Tip: You can also manually type @BartenderName in your message
              </div>
            </div>
          )}
        </div>
        
        <button 
          onClick={handleSendMessage}
          className="bg-[#8B4513] text-[#E8D6B3] p-2 rounded-sm transition hover:bg-[#9B5523] active:bg-[#7B3503] active:translate-y-[2px]"
        >
          <SendIcon className="h-6 w-6" />
        </button>
      </div>
      <div className="commands-help text-xs mt-2 text-[#E8D6B3] opacity-60 font-['VT323']">
        Commands: /menu, @Bartender (mention), /emote [action]
      </div>
    </div>
  );
};

export default ChatInput;
