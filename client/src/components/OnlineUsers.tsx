import { FC, useState } from 'react';
import { useWebSocketStore } from '@/lib/websocket';
import { CharacterAvatar } from '@/assets/svgs/avatars';
import { motion } from 'framer-motion';

const OnlineUsers: FC = () => {
  const { onlineUsers } = useWebSocketStore();
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="online-users-container fixed right-0 top-24 z-10">
      {/* Tavern Sign */}
      <div 
        className="tavern-sign cursor-pointer relative z-20"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
      >
        <div className="sign-post w-3 h-32 bg-[#8B4513] absolute -left-3 top-0"></div>
        <div className="sign-board relative w-32 h-16 bg-[#4A3429] border-4 border-[#8B4513] rounded-md flex items-center justify-center overflow-hidden shadow-lg">
          <h2 className="font-['Press_Start_2P'] text-[#FFD700] text-center text-sm relative z-10">
            PATRONS ({onlineUsers.length})
          </h2>
        </div>
        <div className="sign-chains flex justify-between px-4 absolute -top-5 w-full">
          <div className="chain w-1 h-5 bg-[#8B4513]"></div>
          <div className="chain w-1 h-5 bg-[#8B4513]"></div>
        </div>
      </div>
      
      {/* Sliding Menu */}
      <motion.aside 
        className="patrons-menu bg-[#4A3429] w-64 border-4 border-[#8B4513] p-4 rounded-b-md rounded-tl-md shadow-lg relative"
        initial={{ x: '100%' }}
        animate={{ x: isOpen ? 0 : '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="users-list max-h-80 overflow-y-auto pr-2">
          {onlineUsers.length === 0 ? (
            <div className="text-center text-[#E8D6B3] opacity-50 font-['VT323'] text-lg">
              No other patrons in this room yet...
            </div>
          ) : (
            onlineUsers.map((user) => (
              <div 
                key={user.id}
                className="user-item flex items-center gap-2 mb-2 p-2 rounded-sm hover:bg-[#8B4513] transition-colors"
              >
                <CharacterAvatar name={user.avatar} size={32} />
                <div className="user-name text-[#E8D6B3] font-['VT323'] text-lg">{user.username}</div>
              </div>
            ))
          )}
        </div>
      </motion.aside>
    </div>
  );
};

export default OnlineUsers;
