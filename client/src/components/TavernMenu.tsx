import { FC, useState } from 'react';
import { useWebSocketStore } from '@/lib/websocket';
import { MenuItemIcon } from '@/assets/svgs/menu-items';
import { UserCircle, Trophy, HeartHandshake, Book, BookOpen } from 'lucide-react';
import { getMoodDescription, getMoodColor, getMoodIcon } from '../utils/mood';
import LoreBook from './LoreBook';

// Storage keys for saving user preferences (must match those in CharacterSelection.tsx)
const STORAGE_KEY_USERNAME = 'tavern_username';
const STORAGE_KEY_AVATAR = 'tavern_selected_avatar';
const STORAGE_KEY_AUTO_CONNECT = 'tavern_auto_connect';

interface TavernMenuProps {
  onClose: () => void;
}

const TavernMenu: FC<TavernMenuProps> = ({ onClose }) => {
  const { menuItems, orderMenuItem, disconnect, bartenders, bartenderMoods, user } = useWebSocketStore();
  const [activeCategory, setActiveCategory] = useState<string>('drinks');
  const [showLoreBook, setShowLoreBook] = useState<boolean>(false);
  
  const filteredItems = menuItems.filter(item => item.category === activeCategory);
  
  const handleSignOut = () => {
    // First disconnect from the WebSocket
    disconnect();
    
    // Small delay to ensure disconnect completes before clearing storage
    setTimeout(() => {
      // Clear stored user data
      localStorage.removeItem(STORAGE_KEY_USERNAME);
      localStorage.removeItem(STORAGE_KEY_AVATAR);
      localStorage.removeItem(STORAGE_KEY_AUTO_CONNECT);
      
      // Close the menu
      onClose();
      
      // Reload the page to ensure a clean state
      window.location.reload();
    }, 200);
  };
  
  const handleDisableAutoConnect = () => {
    // Just disable auto-connect but keep other preferences
    localStorage.setItem(STORAGE_KEY_AUTO_CONNECT, 'false');
    onClose();
  };
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      {showLoreBook ? (
        <LoreBook onClose={() => setShowLoreBook(false)} />
      ) : (
        <div 
          className="menu-container bg-[#4A3429] w-5/6 max-w-md h-4/5 max-h-[600px] rounded-sm overflow-hidden 
                     shadow-[0_-4px_0_0px_#2C1810,0_4px_0_0px_#2C1810,-4px_0_0_0px_#2C1810,4px_0_0_0px_#2C1810,0_0_0_4px_#8B4513]"
        >
        <div className="menu-header bg-[#8B4513] p-3 flex justify-between items-center">
          <h2 className="font-['Press_Start_2P'] text-[#FFD700] text-xl">TAVERN MENU</h2>
          <button onClick={onClose} className="text-[#E8D6B3] hover:text-[#FFD700] text-2xl">×</button>
        </div>
        
        <div className="menu-tabs flex flex-wrap border-b border-[#8B4513]">
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
              activeCategory === 'moods' 
                ? 'bg-[#8B4513]' 
                : 'bg-[#2C1810] hover:bg-[#3C281A]'
            }`}
            onClick={() => setActiveCategory('moods')}
          >
            <div className="flex items-center justify-center">
              <HeartHandshake className="w-4 h-4 mr-1" />
              <span>Moods</span>
            </div>
          </button>
          <button 
            className={`menu-tab flex-1 py-2 px-4 font-['VT323'] text-xl text-[#E8D6B3] ${
              activeCategory === 'lore' 
                ? 'bg-[#8B4513]' 
                : 'bg-[#2C1810] hover:bg-[#3C281A]'
            }`}
            onClick={() => setActiveCategory('lore')}
          >
            <div className="flex items-center justify-center">
              <Book className="w-4 h-4 mr-1" />
              <span>Lore</span>
            </div>
          </button>
          <button 
            className={`menu-tab flex-1 py-2 px-4 font-['VT323'] text-xl text-[#E8D6B3] ${
              activeCategory === 'achievements' 
                ? 'bg-[#8B4513]' 
                : 'bg-[#2C1810] hover:bg-[#3C281A]'
            }`}
            onClick={() => setActiveCategory('achievements')}
          >
            <div className="flex items-center justify-center">
              <Trophy className="w-4 h-4 mr-1" />
              <span>Badges</span>
            </div>
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
          ) : activeCategory === 'moods' ? (
            <div className="moods-container p-4">
              <div className="text-center mb-6">
                <div className="inline-flex justify-center items-center w-20 h-20 rounded-full bg-[#2C1810] border-2 border-[#8B4513]">
                  <HeartHandshake className="h-14 w-14 text-[#FFD700]" />
                </div>
                <h3 className="font-['Press_Start_2P'] text-[#FFD700] text-sm mt-2">Bartender Moods</h3>
              </div>
              
              {user ? (
                bartenderMoods.length > 0 ? (
                  <div className="mood-list space-y-4">
                    {bartenders.map(bartender => {
                      // Find the mood for this bartender
                      const moodRecord = bartenderMoods.find(
                        m => m.bartenderId === bartender.id && m.userId === user.id
                      );
                      
                      // Default mood is 50 (neutral) if no record exists
                      const moodValue = moodRecord ? moodRecord.mood : 50;
                      
                      return (
                        <div 
                          key={bartender.id}
                          className="mood-item p-3 bg-[#2C1810] border border-[#8B4513] rounded-sm"
                        >
                          <div className="flex justify-between items-center">
                            <h4 className="font-['VT323'] text-[#FFD700] text-lg">{bartender.name}</h4>
                            <span className={`mood-icon font-['VT323'] text-lg ${getMoodColor(moodValue)}`}>
                              {getMoodIcon(moodValue)}
                            </span>
                          </div>
                          <div className="mood-bar w-full h-2 bg-[#2C1810] my-2 border border-[#8B4513]">
                            <div 
                              className={`h-full ${getMoodColor(moodValue)}`}
                              style={{ width: `${moodValue}%` }}
                            ></div>
                          </div>
                          <p className={`text-sm font-['VT323'] ${getMoodColor(moodValue)}`}>
                            {bartender.name} {getMoodDescription(moodValue)}
                          </p>
                          <p className="text-[#E8D6B3] opacity-80 text-xs mt-2 font-['VT323']">
                            {moodValue >= 60 
                              ? 'They appreciate how you treat them.' 
                              : moodValue <= 40 
                                ? 'They remember your previous interactions.' 
                                : 'Their opinion of you could change with time.'}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-[#E8D6B3] font-['VT323'] text-xl">
                    <p>Chat with the bartenders first!</p>
                    <p className="mt-2 text-sm opacity-80">The bartenders will form opinions about you based on your interactions.</p>
                  </div>
                )
              ) : (
                <div className="text-center py-8 text-[#E8D6B3] font-['VT323'] text-xl">
                  Please sign in first to view bartender moods.
                </div>
              )}
            </div>
          ) : activeCategory === 'achievements' ? (
            <div className="achievements-container p-4">
              <div className="text-center mb-6">
                <div className="inline-flex justify-center items-center w-20 h-20 rounded-full bg-[#2C1810] border-2 border-[#8B4513]">
                  <Trophy className="h-14 w-14 text-[#FFD700]" />
                </div>
                <h3 className="font-['Press_Start_2P'] text-[#FFD700] text-sm mt-2">Traveler Badges</h3>
              </div>
              
              {user ? (
                <div className="grid grid-cols-2 gap-4">
                  {/* Returning Customer Badge */}
                  <div className={`achievement-item p-3 text-center 
                    ${bartenderMoods.length > 0 ? 'bg-[#2C1810]' : 'bg-[#1a0d0d] opacity-50'} 
                    border border-[#8B4513] rounded-sm`}
                  >
                    <div className="badge-icon w-16 h-16 mx-auto rounded-full bg-[#462207] flex items-center justify-center">
                      <span className="font-['VT323'] text-3xl text-[#FFD700]">
                        {bartenderMoods.length > 0 ? '★' : '?'}
                      </span>
                    </div>
                    <h4 className="font-['VT323'] text-[#FFD700] text-lg mt-2">Regular</h4>
                    <p className="text-[#E8D6B3] opacity-80 text-xs mt-1 font-['VT323']">
                      {bartenderMoods.length > 0 
                        ? 'Earned by becoming a recognized customer' 
                        : 'Chat with any bartender to earn this'}
                    </p>
                  </div>
                  
                  {/* Adored Badge */}
                  <div className={`achievement-item p-3 text-center 
                    ${bartenderMoods.some(m => m.mood >= 80) ? 'bg-[#2C1810]' : 'bg-[#1a0d0d] opacity-50'} 
                    border border-[#8B4513] rounded-sm`}
                  >
                    <div className="badge-icon w-16 h-16 mx-auto rounded-full bg-[#462207] flex items-center justify-center">
                      <span className="font-['VT323'] text-3xl text-[#FFD700]">
                        {bartenderMoods.some(m => m.mood >= 80) ? '♥' : '?'}
                      </span>
                    </div>
                    <h4 className="font-['VT323'] text-[#FFD700] text-lg mt-2">Adored</h4>
                    <p className="text-[#E8D6B3] opacity-80 text-xs mt-1 font-['VT323']">
                      {bartenderMoods.some(m => m.mood >= 80)
                        ? 'You\'ve truly charmed at least one bartender' 
                        : 'Be exceptionally nice to any bartender'}
                    </p>
                  </div>
                  
                  {/* Patron of All Badge */}
                  <div className={`achievement-item p-3 text-center 
                    ${bartenders.length > 0 && bartenderMoods.length >= bartenders.length ? 'bg-[#2C1810]' : 'bg-[#1a0d0d] opacity-50'} 
                    border border-[#8B4513] rounded-sm`}
                  >
                    <div className="badge-icon w-16 h-16 mx-auto rounded-full bg-[#462207] flex items-center justify-center">
                      <span className="font-['VT323'] text-3xl text-[#FFD700]">
                        {bartenders.length > 0 && bartenderMoods.length >= bartenders.length ? '♦' : '?'}
                      </span>
                    </div>
                    <h4 className="font-['VT323'] text-[#FFD700] text-lg mt-2">Patron of All</h4>
                    <p className="text-[#E8D6B3] opacity-80 text-xs mt-1 font-['VT323']">
                      {bartenders.length > 0 && bartenderMoods.length >= bartenders.length
                        ? 'You\'ve chatted with every bartender' 
                        : 'Interact with all bartenders at least once'}
                    </p>
                  </div>
                  
                  {/* Orderer Badge */}
                  <div className={`achievement-item p-3 text-center 
                    ${false ? 'bg-[#2C1810]' : 'bg-[#1a0d0d] opacity-50'} 
                    border border-[#8B4513] rounded-sm`}
                  >
                    <div className="badge-icon w-16 h-16 mx-auto rounded-full bg-[#462207] flex items-center justify-center">
                      <span className="font-['VT323'] text-3xl text-[#FFD700]">?</span>
                    </div>
                    <h4 className="font-['VT323'] text-[#FFD700] text-lg mt-2">Connoisseur</h4>
                    <p className="text-[#E8D6B3] opacity-80 text-xs mt-1 font-['VT323']">
                      Order every item on the menu at least once
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-[#E8D6B3] font-['VT323'] text-xl">
                  Please sign in first to view your badges.
                </div>
              )}
            </div>
          ) : activeCategory === 'lore' ? (
            <div className="lore-container p-4">
              <div className="text-center mb-6">
                <div className="inline-flex justify-center items-center w-20 h-20 rounded-full bg-[#2C1810] border-2 border-[#8B4513]">
                  <Book className="h-14 w-14 text-[#FFD700]" />
                </div>
                <h3 className="font-['Press_Start_2P'] text-[#FFD700] text-sm mt-2">Tavern Lore</h3>
              </div>
              
              <div 
                className="tavern-lore-button p-3 bg-[#2C1810] border border-[#8B4513] rounded-sm cursor-pointer hover:bg-[#3C281A] mb-4"
                onClick={() => setShowLoreBook(true)}
              >
                <h4 className="font-['VT323'] text-[#FFD700] text-lg flex items-center">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Open Lore Book
                </h4>
                <p className="text-[#E8D6B3] opacity-80 text-sm mt-1 font-['VT323']">
                  Read about the Hidden Gems Tavern, its patrons, and the fantastical world beyond
                </p>
              </div>
              
              <div className="lore-preview p-4 bg-[#2C1810] border border-[#8B4513] rounded-sm">
                <p className="text-[#E8D6B3] font-['VT323'] text-center italic">
                  "The Hidden Gems Tavern was born from necessity and magic during The Great Rift Crisis over two centuries ago. Three sisters - Ruby, Sapphire, and Amethyst - found themselves caught in a cataclysmic magical event while attempting to escape the collapse of the Grand Arcanum Academy..."
                </p>
                <p className="text-[#FFD700] text-center text-sm mt-4 font-['VT323']">
                  ~ Open the Lore Book to continue reading ~
                </p>
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
