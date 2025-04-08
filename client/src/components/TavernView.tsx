import { FC, useEffect, useRef } from 'react';
import BartenderSprite from './BartenderSprite';
import { useWebSocketStore } from '@/lib/websocket';
import { background as newTavernBg } from '@/assets/images/new_assets';

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
  
  return (
    <div 
      ref={tavernRef}
      className="tavern-view relative h-[400px] md:h-auto md:flex-1 overflow-hidden 
                 bg-[#2C1810] border-b-4 md:border-b-0 md:border-r-4 border-[#8B4513]"
    >
      {/* Tavern Background Image */}
      <div 
        className="tavern-bg absolute inset-0"
        style={{
          backgroundImage: `url(${newTavernBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: '1'
        }}
      ></div>
      
      {/* Tavern Interior - Using the background image that already has all bartenders */}
      <div className="tavern-interior relative w-full h-full">
        {/* Tavern Name Display */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-md">
          <h1 className="font-['VT323'] text-3xl font-bold text-[#FFD700] text-shadow-md">The Hidden Gems</h1>
        </div>
      </div>
    </div>
  );
};

export default TavernView;
