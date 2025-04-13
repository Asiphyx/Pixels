import { FC, useState } from 'react';
import { useWebSocketStore } from '@/lib/websocket';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';

// Create a simple Room Tab component to avoid any event handling issues
const RoomTab: FC<{id: number, name: string, active: boolean, onClick: (id: number) => void}> = ({
  id, name, active, onClick
}) => {
  return (
    <div 
      className={`py-1 px-3 cursor-pointer ${active ? 'bg-[#FFD700] text-[#2C1810]' : 'bg-[#8B4513] text-[#E8D6B3] hover:bg-opacity-80'} font-['VT323'] text-lg rounded-sm transition-all`}
      onClick={() => onClick(id)}
    >
      {name}
    </div>
  );
};

const ChatPanel: FC = () => {
  const { rooms, roomId, joinRoom } = useWebSocketStore();
  const [loading, setLoading] = useState(false);

  console.log("Available rooms:", rooms);
  console.log("Current room ID:", roomId);

  // Simple handler with loading state
  const handleRoomClick = (id: number) => {
    console.log(`Switching to room with ID: ${id}`);
    setLoading(true);
    joinRoom(id);
    setTimeout(() => setLoading(false), 500);
  };

  return (
    <div className="chat-panel md:w-1/2 lg:w-2/5 bg-[#2C1810] flex flex-col">
      {/* Room selection tabs */}
      <div className="room-tabs p-2 border-b-4 border-[#8B4513] flex overflow-x-auto gap-2">
        {rooms && rooms.length > 0 ? (
          rooms.map(room => (
            <RoomTab
              key={room.id}
              id={room.id}
              name={room.name}
              active={roomId === room.id}
              onClick={handleRoomClick}
            />
          ))
        ) : (
          <div className="text-[#E8D6B3] text-sm italic">Loading rooms...</div>
        )}
      </div>

      {/* Chat Messages */}
      <ChatMessages />

      {/* Chat Input Area */}
      <ChatInput />
    </div>
  );
};

export default ChatPanel;