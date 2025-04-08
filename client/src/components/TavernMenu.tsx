import { FC, useState } from 'react';
import { useWebSocketStore } from '@/lib/websocket';
import { MenuItemIcon } from '@/assets/svgs/menu-items';
import { XIcon, UserCircle } from 'lucide-react';

// Storage keys for saving user preferences (must match those in CharacterSelection.tsx)
const STORAGE_KEY_USERNAME = 'tavern_username';
const STORAGE_KEY_AVATAR = 'tavern_selected_avatar';
const STORAGE_KEY_AUTO_CONNECT = 'tavern_auto_connect';

interface TavernMenuProps {
  onClose: () => void;
}

const TavernMenu: FC<TavernMenuProps> = ({ onClose }) => {
  const { menuItems, orderMenuItem, disconnect } = useWebSocketStore();
  const [activeCategory, setActiveCategory] = useState<string>('drinks');
  
  const filteredItems = menuItems.filter(item => item.category === activeCategory);
  
  const handleSignOut = () => {
    // Clear stored user data
    localStorage.removeItem(STORAGE_KEY_USERNAME);
    localStorage.removeItem(STORAGE_KEY_AVATAR);
    localStorage.removeItem(STORAGE_KEY_AUTO_CONNECT);
    
    // Disconnect from the WebSocket
    disconnect();
    
    // Close the menu
    onClose();
  };
  
  const handleDisableAutoConnect = () => {
    // Just disable auto-connect but keep other preferences
    localStorage.setItem(STORAGE_KEY_AUTO_CONNECT, 'false');
    onClose();
  };
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div 
        className="menu-container bg-[#4A3429] w-5/6 max-w-md h-4/5 max-h-[600px] rounded-sm overflow-hidden 
                   shadow-[0_-4px_0_0px_#2C1810,0_4px_0_0px_#2C1810,-4px_0_0_0px_#2C1810,4px_0_0_0px_#2C1810,0_0_0_4px_#8B4513]"
      >
        <div className="menu-header bg-[#8B4513] p-3 flex justify-between items-center">
          <h2 className="font-['Press_Start_2P'] text-[#FFD700] text-xl">TAVERN MENU</h2>
          <button onClick={onClose} className="text-[#E8D6B3] hover:text-[#FFD700] text-2xl">×</button>
        </div>
        
        <div className="menu-tabs flex border-b border-[#8B4513]">
          <button 
            className={`menu-tab flex-1 py-2 px-4 font-['VT323'] text-xl text-[#E8D6B3] ${
              activeCategory === 'drinks' 
                ? 'bg-[#8B4513]' 
                : 'bg-[#2C1810] hover:bg-[#3C281A]'
            }`}
            onClick={() => setActiveCategory('drinks')}
          >
            Drinks
          </button>
          <button 
            className={`menu-tab flex-1 py-2 px-4 font-['VT323'] text-xl text-[#E8D6B3] ${
              activeCategory === 'food' 
                ? 'bg-[#8B4513]' 
                : 'bg-[#2C1810] hover:bg-[#3C281A]'
            }`}
            onClick={() => setActiveCategory('food')}
          >
            Food
          </button>
          <button 
            className={`menu-tab flex-1 py-2 px-4 font-['VT323'] text-xl text-[#E8D6B3] ${
              activeCategory === 'specials' 
                ? 'bg-[#8B4513]' 
                : 'bg-[#2C1810] hover:bg-[#3C281A]'
            }`}
            onClick={() => setActiveCategory('specials')}
          >
            Specials
          </button>
          <button 
            className={`menu-tab flex-1 py-2 px-4 font-['VT323'] text-xl text-[#E8D6B3] ${
              activeCategory === 'profile' 
                ? 'bg-[#8B4513]' 
                : 'bg-[#2C1810] hover:bg-[#3C281A]'
            }`}
            onClick={() => setActiveCategory('profile')}
          >
            Profile
          </button>
        </div>
        
        <div 
          className="menu-content p-4 overflow-y-auto"
          style={{ maxHeight: 'calc(100% - 110px)' }}
        >
          {activeCategory === 'profile' ? (
            <div className="profile-settings p-4">
              <div className="text-center mb-6">
                <div className="inline-flex justify-center items-center w-20 h-20 rounded-full bg-[#2C1810] border-2 border-[#8B4513]">
                  <UserCircle className="h-14 w-14 text-[#FFD700]" />
                </div>
                <h3 className="font-['Press_Start_2P'] text-[#FFD700] text-sm mt-2">Traveler Settings</h3>
              </div>
              
              <div className="profile-options space-y-4">
                <div 
                  className="profile-option p-3 bg-[#2C1810] border border-[#8B4513] rounded-sm cursor-pointer hover:bg-[#3C281A]"
                  onClick={handleSignOut}
                >
                  <h4 className="font-['VT323'] text-[#FFD700] text-lg">Sign Out</h4>
                  <p className="text-[#E8D6B3] opacity-80 text-sm mt-1 font-['VT323']">
                    Clear your saved info and return to the tavern entrance
                  </p>
                </div>
                
                <div 
                  className="profile-option p-3 bg-[#2C1810] border border-[#8B4513] rounded-sm cursor-pointer hover:bg-[#3C281A]"
                  onClick={handleDisableAutoConnect}
                >
                  <h4 className="font-['VT323'] text-[#FFD700] text-lg">Disable Auto-Connect</h4>
                  <p className="text-[#E8D6B3] opacity-80 text-sm mt-1 font-['VT323']">
                    Remember your name and avatar, but ask before connecting next time
                  </p>
                </div>
                
                <div className="profile-info p-3 bg-[#2C1810] border border-[#8B4513] rounded-sm mt-6">
                  <p className="text-[#E8D6B3] opacity-80 text-sm font-['VT323']">
                    Bartenders will remember how you treat them even if you leave and return later.
                  </p>
                </div>
              </div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-8 text-[#E8D6B3] font-['VT323'] text-xl">
              Nothing on the menu yet. Check back later!
            </div>
          ) : (
            filteredItems.map(item => (
              <div 
                key={item.id}
                className="menu-item mb-4 flex gap-3 p-2 border border-transparent hover:border-[#FFD700] rounded-sm cursor-pointer transition-all hover:scale-[1.03] hover:bg-[rgba(255,215,0,0.1)]"
                onClick={() => orderMenuItem(item.id)}
              >
                <div className="item-icon w-16 h-16 bg-[#2C1810] flex items-center justify-center rounded-sm">
                  <MenuItemIcon 
                    icon={item.icon} 
                    className="w-12 h-12 text-[#FFD700]"
                  />
                </div>
                <div className="item-details flex-1">
                  <h3 className="font-['Press_Start_2P'] text-[#FFD700] text-sm">{item.name}</h3>
                  <p className="text-[#E8D6B3] opacity-80 text-xs mt-1 font-['VT323']">{item.description}</p>
                  <div className="item-price mt-2 text-xs text-[#FFD700] font-['VT323']">{item.price} gold coins</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TavernMenu;
