import { FC, useEffect, useRef, useState } from 'react';
import { useWebSocketStore } from '@/lib/websocket';
import { background as newTavernBg } from '@/assets/svgs/bartenders';
import TavernBackground3D from './TavernBackground3D';

const TavernView: FC = () => {
  const tavernRef = useRef<HTMLDivElement>(null);
  const { bartenders } = useWebSocketStore();
  
  // Create dust particle effect
  useEffect(() => {
    if (!tavernRef.current) return;
    
    const createDustParticle = () => {
      if (!tavernRef.current) return;
      
      const particle = document.createElement('div');
      particle.className = 'absolute w-[2px] h-[2px] bg-[#FFD700] bg-opacity-60 pointer-events-none';
      
      // Random position
      const x = Math.random() * tavernRef.current.offsetWidth;
      const y = Math.random() * tavernRef.current.offsetHeight;
      
      particle.style.left = `${x}px`;
      particle.style.top = `${y}px`;
      
      // Random floating animation
      const duration = 3 + Math.random() * 5;
      particle.animate(
        [
          { transform: 'translateY(0)', opacity: 0.6 },
          { transform: `translateY(-${20 + Math.random() * 30}px)`, opacity: 0 }
        ],
        {
          duration: duration * 1000,
          easing: 'linear',
          fill: 'forwards'
        }
      );
      
      tavernRef.current.appendChild(particle);
      
      // Remove after animation
      setTimeout(() => {
        particle.remove();
      }, duration * 1000);
    };
    
    // Create dust particles periodically
    const intervalId = setInterval(createDustParticle, 400);
    
    return () => {
      clearInterval(intervalId);
    };
  }, []);
  
  // Optional toggle for 3D background (for performance)
  const [show3DBackground, setShow3DBackground] = useState(true);
  
  // Handle click on bartender
  const handleInteraction = (bartenderName: string) => {
    console.log(`Clicked on bartender: ${bartenderName}`);
    // Visual feedback only - no sound
  };

  return (
    <div 
      ref={tavernRef}
      className="tavern-view relative h-[400px] md:h-auto md:flex-1 overflow-hidden 
                 bg-[#2C1810] border-b-4 md:border-b-0 md:border-r-4 border-[#8B4513]"
    >
      {/* 3D Background (Three.js) */}
      {show3DBackground && <TavernBackground3D />}
      
      {/* Tavern Background Image (Semi-transparent to blend with 3D) */}
      <div 
        className="tavern-bg absolute inset-0"
        style={{
          backgroundImage: `url(${newTavernBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: '0.85' // Slightly transparent to show 3D background behind
        }}
      ></div>
      
      {/* Tavern Interior - Using the background image that already has all bartenders */}
      <div className="tavern-interior relative w-full h-full">
        {/* Bartender Interaction Areas */}
        <div 
          className="bartender-area absolute top-[15%] bottom-[35%] left-[15%] w-[20%] cursor-pointer transition-opacity hover:opacity-70"
          onClick={() => handleInteraction('Amethyst')}
          title="Talk to Amethyst"
        >
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-black bg-opacity-50 rounded-lg">
            <h2 className="font-['VT323'] text-xl font-bold text-[#FF69B4] text-shadow-sm">Amethyst</h2>
          </div>
        </div>
        
        <div 
          className="bartender-area absolute top-[15%] bottom-[35%] left-[40%] w-[20%] cursor-pointer transition-opacity hover:opacity-70"
          onClick={() => handleInteraction('Sapphire')}
          title="Talk to Sapphire"
        >
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-black bg-opacity-50 rounded-lg">
            <h2 className="font-['VT323'] text-xl font-bold text-[#1E90FF] text-shadow-sm">Sapphire</h2>
          </div>
        </div>
        
        <div 
          className="bartender-area absolute top-[15%] bottom-[35%] left-[65%] w-[20%] cursor-pointer transition-opacity hover:opacity-70"
          onClick={() => handleInteraction('Ruby')}
          title="Talk to Ruby"
        >
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-black bg-opacity-50 rounded-lg">
            <h2 className="font-['VT323'] text-xl font-bold text-[#FF4500] text-shadow-sm">Ruby</h2>
          </div>
        </div>
        
        {/* Performance toggle (for devices that might struggle with 3D) */}
        <div className="absolute bottom-2 right-2 z-10">
          <button
            onClick={() => setShow3DBackground(!show3DBackground)}
            className="text-xs bg-[#2C1810] text-[#FFD700] px-2 py-1 rounded border border-[#8B4513] opacity-50 hover:opacity-100"
            title={show3DBackground ? "Disable 3D Background (Better Performance)" : "Enable 3D Background"}
          >
            {show3DBackground ? "3D: ON" : "3D: OFF"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TavernView;
