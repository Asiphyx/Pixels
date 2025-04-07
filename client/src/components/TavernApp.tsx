import { FC, useEffect } from 'react';
import TavernView from './TavernView';
import ChatPanel from './ChatPanel';
import OnlineUsers from './OnlineUsers';
import CharacterSelection from './CharacterSelection';
import TavernMenu from './TavernMenu';
import { useWebSocketStore } from '@/lib/websocket';
import { Heading6 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TavernApp: FC = () => {
  const { user, showMenu, toggleMenu } = useWebSocketStore();

  return (
    <div className="tavern-app min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-[#2C1810] py-4 px-6 border-b-4 border-[#8B4513] relative z-50">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="font-['Press_Start_2P'] text-xl text-[#FFD700]">PIXEL TAVERN</h1>
          <div className="user-info flex items-center gap-3">
            <OnlineUsers />
            <span className="hidden md:inline-block font-['VT323'] text-xl text-[#E8D6B3]">
              {user ? `Welcome, ${user.username}!` : 'Welcome, Adventurer!'}
            </span>
            {user ? (
              <Button 
                variant="outline" 
                size="sm"
                className="bg-[#8B4513] text-[#E8D6B3] border-none hover:bg-[#9B5523] font-['VT323']"
                onClick={toggleMenu} // Use menu button for logged in users
              >
                <Heading6 className="h-5 w-5" />
              </Button>
            ) : (
              <Button 
                variant="outline" 
                size="sm"
                className="bg-[#8B4513] text-[#E8D6B3] border-none hover:bg-[#9B5523] font-['VT323']"
                disabled // Disable button if not logged in, character selection already shows automatically
              >
                <Heading6 className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-grow flex flex-col md:flex-row">
        {/* Tavern View */}
        <TavernView />
        
        {/* Chat & Interaction Panel */}
        <ChatPanel />
      </main>
      
      {/* Modals */}
      <CharacterSelection />
      
      {/* Menu */}
      {showMenu && <TavernMenu onClose={toggleMenu} />}
    </div>
  );
};

export default TavernApp;
