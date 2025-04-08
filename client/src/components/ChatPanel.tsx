import { FC } from 'react';
import { useWebSocketStore } from '@/lib/websocket';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';

const ChatPanel: FC = () => {
  const { rooms, roomId, joinRoom } = useWebSocketStore();

  return (
    <div className="chat-panel md:w-1/2 lg:w-2/5 bg-[#2C1810] flex flex-col">
      {/* Room selection tabs */}
      <div className="room-tabs p-2 border-b-4 border-[#8B4513] flex overflow-x-auto gap-2">
        {rooms.map(room => (
          <button 
            key={room.id}
            className={`py-1 px-3 bg-[#8B4513] text-[#E8D6B3] font-['VT323'] text-lg rounded-sm transition-all
                      ${roomId === room.id ? 'bg-[#FFD700] text-[#2C1810]' : 'hover:bg-opacity-80'}`}
            onClick={() => joinRoom(room.id)}
          >
            {room.name}
          </button>
        ))}
      </div>

      {/* Chat Messages */}
      <ChatMessages />

      {/* Chat Input Area */}
      <ChatInput />
    </div>
  );
};

export default ChatPanel;