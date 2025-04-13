import { FC, useState, KeyboardEvent } from 'react';
import { useWebSocketStore } from '@/lib/websocket';
import { SendIcon } from 'lucide-react';

const ChatInput: FC = () => {
  const [message, setMessage] = useState<string>('');
  const { sendMessage, toggleMenu } = useWebSocketStore();
  
  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    const trimmedMessage = message.trim();
    
    // Check for commands
    if (trimmedMessage === '/menu') {
      toggleMenu();
    } else if (trimmedMessage.startsWith('/emote ')) {
      // Extract the emote action
      const emoteAction = trimmedMessage.substring(7).trim();
      if (emoteAction) {
        sendMessage(emoteAction, 'emote');
      }
    } else {
      sendMessage(trimmedMessage);
    }
    
    setMessage('');
  };
  
  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };
  
  return (
    <div className="chat-input p-3 border-t-4 border-[#8B4513]">
      <div className="flex gap-2 items-center">
        <input 
          type="text" 
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-grow bg-[#2C1810] border-2 border-[#8B4513] text-[#E8D6B3] p-2 rounded-sm font-['VT323'] text-lg"
          placeholder="Say something or type /menu..."
        />
        <button 
          onClick={handleSendMessage}
          className="bg-[#8B4513] text-[#E8D6B3] p-2 rounded-sm transition hover:bg-[#9B5523] active:bg-[#7B3503] active:translate-y-[2px]"
        >
          <SendIcon className="h-6 w-6" />
        </button>
      </div>
      <div className="commands-help text-xs mt-2 text-[#E8D6B3] opacity-60 font-['VT323']">
        Commands: /menu, /order [item], /emote [action], /whisper [name] [message]
      </div>
    </div>
  );
};

export default ChatInput;
