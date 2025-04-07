import { FC } from 'react';
import { useWebSocketStore } from '@/lib/websocket';
import { CharacterAvatar } from '@/assets/svgs/avatars';

const OnlineUsers: FC = () => {
  const { onlineUsers } = useWebSocketStore();
  
  return (
    <aside className="online-users hidden lg:block bg-[#4A3429] w-64 border-l-4 border-[#8B4513] absolute right-0 top-16 bottom-0 p-4">
      <h2 className="font-['Press_Start_2P'] text-[#FFD700] text-center mb-4 text-sm">
        PATRONS ({onlineUsers.length})
      </h2>
      
      <div className="users-list">
        {onlineUsers.length === 0 ? (
          <div className="text-center text-[#E8D6B3] opacity-50 font-['VT323']">
            No other patrons in this room yet...
          </div>
        ) : (
          onlineUsers.map((user) => (
            <div 
              key={user.id}
              className="user-item flex items-center gap-2 mb-2 p-2 rounded-sm hover:bg-[#8B4513]"
            >
              <CharacterAvatar name={user.avatar} size={32} />
              <div className="user-name text-[#E8D6B3] font-['VT323']">{user.username}</div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
};

export default OnlineUsers;
