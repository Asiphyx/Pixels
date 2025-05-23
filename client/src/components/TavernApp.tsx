import { FC, useEffect } from 'react';
import TavernView from './TavernView';
import ChatPanel from './ChatPanel';
import OnlineUsers from './OnlineUsers';
import CharacterSelection from './CharacterSelection';
import TavernMenu from './TavernMenu';
import InventoryPanel from './InventoryPanel';
import { useWebSocketStore } from '@/lib/websocket';
import { Menu, Package, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TavernAppProps {
  loading?: boolean;
}

const TavernApp: FC<TavernAppProps> = ({ loading = false }) => {
  const { 
    user, 
    showMenu, 
    toggleMenu,
    showInventory,
    toggleInventory,
    rooms
  } = useWebSocketStore();
  
  // Log rooms state to help debug
  useEffect(() => {
    console.log("Current rooms state in TavernApp:", rooms);
  }, [rooms]);

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
              <>
                {/* Inventory Button */}
                <div className="menu-icon-container relative mr-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    title="Open Inventory"
                    className="bg-[#4A3429] text-[#FFD700] border-2 border-[#8B4513] rounded-md hover:bg-[#3A2419] relative overflow-hidden"
                    onClick={toggleInventory}
                  >
                    <div className="absolute inset-0 bg-opacity-10 pointer-events-none"
                        style={{
                          backgroundImage: "linear-gradient(45deg, #3A2419 25%, #4A3429 25%, #4A3429 50%, #3A2419 50%, #3A2419 75%, #4A3429 75%, #4A3429 100%)",
                          backgroundSize: "8px 8px"
                        }}
                    ></div>
                    <Package className="h-5 w-5 relative z-10" />
                  </Button>
                  {/* Hanging chains */}
                  <div className="absolute -top-3 left-4 w-1 h-3 bg-[#8B4513] rounded-sm"></div>
                  <div className="absolute -top-3 right-4 w-1 h-3 bg-[#8B4513] rounded-sm"></div>
                </div>
                
                {/* Menu Button */}
                <div className="menu-icon-container relative">
                  <Button 
                    variant="outline" 
                    size="sm"
                    title="Open Menu"
                    className="bg-[#4A3429] text-[#FFD700] border-2 border-[#8B4513] rounded-md hover:bg-[#3A2419] relative overflow-hidden"
                    onClick={toggleMenu}
                  >
                    <div className="absolute inset-0 bg-opacity-10 pointer-events-none"
                        style={{
                          backgroundImage: "linear-gradient(45deg, #3A2419 25%, #4A3429 25%, #4A3429 50%, #3A2419 50%, #3A2419 75%, #4A3429 75%, #4A3429 100%)",
                          backgroundSize: "8px 8px"
                        }}
                    ></div>
                    <Menu className="h-5 w-5 relative z-10" />
                  </Button>
                  {/* Hanging chains */}
                  <div className="absolute -top-3 left-4 w-1 h-3 bg-[#8B4513] rounded-sm"></div>
                  <div className="absolute -top-3 right-4 w-1 h-3 bg-[#8B4513] rounded-sm"></div>
                </div>
              </>
            ) : (
              <div className="menu-icon-container relative opacity-50">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-[#4A3429] text-[#FFD700] border-2 border-[#8B4513] rounded-md"
                  disabled
                >
                  <div className="absolute inset-0 bg-opacity-10 pointer-events-none"
                      style={{
                        backgroundImage: "linear-gradient(45deg, #3A2419 25%, #4A3429 25%, #4A3429 50%, #3A2419 50%, #3A2419 75%, #4A3429 75%, #4A3429 100%)",
                        backgroundSize: "8px 8px"
                      }}
                  ></div>
                  <Menu className="h-5 w-5 relative z-10" />
                </Button>
                {/* Hanging chains */}
                <div className="absolute -top-3 left-4 w-1 h-3 bg-[#8B4513] rounded-sm"></div>
                <div className="absolute -top-3 right-4 w-1 h-3 bg-[#8B4513] rounded-sm"></div>
              </div>
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
      
      {/* Inventory */}
      {showInventory && <InventoryPanel onClose={toggleInventory} />}
    </div>
  );
};

export default TavernApp;
