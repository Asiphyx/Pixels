import { FC, useEffect, useState } from 'react';
import TavernView from './TavernView';
import ChatPanel from './ChatPanel';
import OnlineUsers from './OnlineUsers';
import CharacterSelection from './CharacterSelection';
import TavernMenu from './TavernMenu';
import { useWebSocketStore } from '@/lib/websocket';
import { Menu, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { tavernSoundscape } from '@/lib/audio/tavernSoundscape';
import { audioManager } from '@/lib/audio/audioManager';
import { InventoryButton, InventoryItemPicker } from './inventory';
import AudioNotificationSystem from './AudioNotificationSystem';
import AudioPreloader from './AudioPreloader';
import SimpleSoundSystem from './SimpleSoundSystem';

const TavernApp: FC = () => {
  const { user, showMenu, toggleMenu } = useWebSocketStore();
  const [audioMuted, setAudioMuted] = useState(false);

  // Track if audio has been initialized
  const [audioInitialized, setAudioInitialized] = useState(false);
  
  // Initialize audio when component mounts with user interaction
  useEffect(() => {
    if (audioInitialized) return; // Skip if already initialized
    
    // Create an initialization function that requires user interaction
    const initAudio = () => {
      console.log('Initializing audio system on user interaction...');
      
      // Try forcing audio context to resume
      if (window.AudioContext || (window as any).webkitAudioContext) {
        try {
          const tempAudio = new Audio();
          tempAudio.play().catch(e => console.log('Initial audio play attempt:', e));
        } catch (e) {
          console.log('Audio context setup attempt:', e);
        }
      }
      
      // Register bartender voices
      tavernSoundscape.registerBartenderVoice('Ruby', 'high');
      tavernSoundscape.registerBartenderVoice('Sapphire', 'neutral');
      tavernSoundscape.registerBartenderVoice('Amethyst', 'deep');
      
      // Start ambient tavern soundscape
      tavernSoundscape.startAmbience();
      
      // Play tavern music
      tavernSoundscape.playMusic('mellow');
      
      // Try playing a notification sound after a delay
      setTimeout(() => {
        // Directly create and play a notification sound as a test
        const audio = new Audio('/sounds/notification.mp3?v=3');
        audio.volume = 1.0;
        audio.play().catch(e => console.error('Error playing test notification:', e));
        
        // Also try through our system
        tavernSoundscape.playUiSound('notification', 1.0);
        console.log('Test notification sound played');
      }, 1000);
      
      // Mark audio as initialized
      setAudioInitialized(true);
      
      // Remove event listeners
      document.removeEventListener('click', initAudio);
      document.removeEventListener('touchstart', initAudio);
    };
    
    // Add event listeners for user interaction
    document.addEventListener('click', initAudio);
    document.addEventListener('touchstart', initAudio);
    
    // Clean up
    return () => {
      document.removeEventListener('click', initAudio);
      document.removeEventListener('touchstart', initAudio);
      
      // Stop audio if component unmounts
      tavernSoundscape.stopAmbience();
      tavernSoundscape.stopMusic();
    };
  }, [audioInitialized]);

  // Handle audio mute toggle
  const toggleMute = () => {
    const newMutedState = audioManager.toggleMute();
    setAudioMuted(newMutedState);
    
    // Play UI sound if we're unmuting
    if (!newMutedState) {
      tavernSoundscape.playUiSound('ui_click');
    }
  };

  // Play UI sounds on interactions
  const handleMenuToggle = () => {
    tavernSoundscape.playUiSound('menu_open');
    toggleMenu();
  };

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
            
            {/* Audio Controls */}
            <div className="audio-controls mr-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-[#FFD700] hover:text-[#FFF] hover:bg-transparent"
                onClick={toggleMute}
                title={audioMuted ? "Unmute Sounds" : "Mute Sounds"}
              >
                {audioMuted ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </Button>
            </div>
            
            {/* Inventory */}
            <div className="inventory-controls flex items-center space-x-2">
              <InventoryButton className="bg-[#4A3429] text-[#FFD700] border-2 border-[#8B4513] hover:bg-[#3A2419]" />
              {user && <InventoryItemPicker />}
            </div>
            
            {user ? (
              <div className="menu-icon-container relative">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-[#4A3429] text-[#FFD700] border-2 border-[#8B4513] rounded-md hover:bg-[#3A2419] relative overflow-hidden"
                  onClick={handleMenuToggle}
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
      {showMenu && <TavernMenu onClose={handleMenuToggle} />}
      
      {/* Invisible components that handle audio notifications directly */}
      <AudioNotificationSystem />
      <AudioPreloader />
      <SimpleSoundSystem />
    </div>
  );
};

export default TavernApp;
