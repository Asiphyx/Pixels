import { FC, useState } from 'react';
import { useWebSocketStore } from '@/lib/websocket';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import { CustomAvatar, deserializeAvatarOptions, defaultAvatarOptions } from '@/assets/svgs/avatar-creator';

const OnlineUsers: FC = () => {
  const { onlineUsers } = useWebSocketStore();
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      {/* Hanging Tavern Sign in Header */}
      <div 
        className="hanging-sign cursor-pointer flex items-center gap-2 relative"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
      >
        <div className="flex items-center gap-1 px-3 py-1 bg-[#4A3429] border-2 border-[#8B4513] rounded-md relative">
          <Users size={16} className="text-[#FFD700]" />
          <span className="font-['VT323'] text-[#FFD700] text-lg">
            {onlineUsers.length}
          </span>
          
          {/* Hanging chains */}
          <div className="absolute -top-4 left-3 w-1 h-4 bg-[#8B4513] rounded-sm"></div>
          <div className="absolute -top-4 right-3 w-1 h-4 bg-[#8B4513] rounded-sm"></div>
        </div>
      
        {/* Sliding Menu Dropdown */}
        <motion.div 
          className="patrons-menu absolute top-full right-0 bg-[#4A3429] w-64 border-4 border-[#8B4513] p-4 rounded-md shadow-lg z-50"
          initial={{ opacity: 0, y: -10 }}
          animate={{ 
            opacity: isOpen ? 1 : 0,
            y: isOpen ? 0 : -10,
            pointerEvents: isOpen ? 'auto' : 'none'
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <div className="users-list max-h-80 overflow-y-auto pr-2">
            <h3 className="font-['Press_Start_2P'] text-[#FFD700] text-center text-sm mb-4">PATRONS</h3>
            {onlineUsers.length === 0 ? (
              <div className="text-center text-[#E8D6B3] opacity-50 font-['VT323'] text-lg">
                No other patrons in this room yet...
              </div>
            ) : (
              onlineUsers.map((user) => {
                const avatarOptions = deserializeAvatarOptions(user.avatar || '');
                return (
                  <div 
                    key={user.id}
                    className="user-item flex items-center gap-2 mb-2 p-2 rounded-sm hover:bg-[#8B4513] transition-colors"
                  >
                    <CustomAvatar options={avatarOptions} size={32} />
                    <div className="user-name text-[#E8D6B3] font-['VT323'] text-lg">{user.username}</div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default OnlineUsers;
