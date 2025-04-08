import React, { useState } from 'react';
import TavernView from '@/components/TavernView';
import TavernBackground from '@/components/TavernBackground';
import InventorySystem from '@/components/InventorySystem';
import SoundControls from '@/components/SoundControls';
import TavernItemViewer from '@/components/TavernItemViewer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useSpring, animated } from '@react-spring/web';
import Confetti from 'react-confetti';

const Tavern: React.FC = () => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Animation for sidebar
  const sidebarAnimation = useSpring({
    transform: sidebarOpen ? 'translateX(0%)' : 'translateX(100%)',
    config: { tension: 180, friction: 24 }
  });

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const triggerConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 5000);
  };

  return (
    <div className="tavern-page relative w-full min-h-screen bg-[#2C1810] text-[#E8D6B3]">
      {/* Three.js Background Layer */}
      <TavernBackground />

      {/* Main Tavern Content */}
      <div className="relative z-10">
        <TavernView />
      </div>

      {/* Sidebar Toggle Button */}
      <Button 
        className="fixed top-4 right-4 z-50 bg-[#8B4513] hover:bg-[#9B5523]"
        onClick={handleToggleSidebar}
      >
        {sidebarOpen ? 'Close' : 'Menu'}
      </Button>

      {/* Animated Sidebar */}
      <animated.div 
        style={sidebarAnimation}
        className="fixed top-0 right-0 z-40 h-screen w-80 bg-[#2C1810] border-l-4 border-[#8B4513] p-4 shadow-xl overflow-y-auto"
      >
        <h2 className="font-['Press_Start_2P'] text-xl text-[#FFD700] mb-6">
          Tavern Menu
        </h2>

        <Tabs defaultValue="inventory">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="inventory" className="w-1/2">Inventory</TabsTrigger>
            <TabsTrigger value="settings" className="w-1/2">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="inventory" className="space-y-6">
            <InventorySystem />

            <div className="mt-6">
              <TavernItemViewer itemName="Magic Amulet" itemColor="#9370DB" />
            </div>

            <Button 
              className="w-full bg-[#8B0000] hover:bg-[#A00000] mt-4"
              onClick={triggerConfetti}
            >
              Celebrate!
            </Button>
          </TabsContent>

          <TabsContent value="settings">
            <SoundControls />
          </TabsContent>
        </Tabs>
      </animated.div>

      {/* Confetti Effect */}
      {showConfetti && <Confetti recycle={false} numberOfPieces={500} />}
    </div>
  );
};

export default Tavern;