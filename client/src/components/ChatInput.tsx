import { FC, useState, KeyboardEvent } from 'react';
import { useWebSocketStore } from '@/lib/websocket';
import { SendIcon } from 'lucide-react';
import { tavernSoundscape } from '@/lib/audio/tavernSoundscape';

const ChatInput: FC = () => {
  const [message, setMessage] = useState<string>('');
  const { sendMessage, toggleMenu } = useWebSocketStore();
  
  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    const trimmedMessage = message.trim();
    
    // Check for commands
    if (trimmedMessage === '/menu') {
      toggleMenu();
      tavernSoundscape.playUiSound('menu_open');
    } else if (trimmedMessage.startsWith('/emote ')) {
      // Extract the emote action
      const emoteAction = trimmedMessage.substring(7).trim();
      if (emoteAction) {
        sendMessage(emoteAction, 'emote');
        
        // Play appropriate sound effect for common emotes
        if (emoteAction.includes('drink') || emoteAction.includes('sip')) {
          tavernSoundscape.playSfx('glass_clink');
        } else if (emoteAction.includes('laugh')) {
          tavernSoundscape.playSfx('crowd_laugh', 0.4);
        } else if (emoteAction.includes('sit') || emoteAction.includes('stand')) {
          tavernSoundscape.playSfx('chair_move');
        } else if (emoteAction.includes('coin') || emoteAction.includes('pay') || emoteAction.includes('tip')) {
          tavernSoundscape.playSfx('coin_drop');
        } else {
          // Generic message sound for other emotes
          tavernSoundscape.playUiSound('message_send');
        }
      }
    } else if (trimmedMessage.startsWith('/order ')) {
      // Process drink order and play pouring sound
      sendMessage(trimmedMessage);
      tavernSoundscape.playSfx('pour_drink');
      
      // Schedule a glass clink sound after pouring
      setTimeout(() => {
        tavernSoundscape.playSfx('glass_clink');
      }, 1500);
    } else {
      // Regular message
      sendMessage(trimmedMessage);
      // Play message send sound with increased volume
      tavernSoundscape.playUiSound('message_send', 0.9);
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
