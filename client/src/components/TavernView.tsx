import { FC, useEffect, useRef } from 'react';
import BartenderSprite from './BartenderSprite';
import { useWebSocketStore } from '@/lib/websocket';
import { tavernBg } from '@/assets/images/tavern';

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
          backgroundImage: `url(${tavernBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: '0.9'
        }}
      ></div>
      
      {/* Tavern Interior */}
      <div className="tavern-interior relative w-full h-full">
        {/* We'll skip the counter visual since we want the sprites positioned at the tavern table */}
        
        {/* Bartenders - positioned at the tavern table */}
        <div className="bartenders absolute bottom-28 left-0 right-0 h-72 flex justify-around">
          {bartenders.map((bartender, index) => (
            <div 
              key={bartender.id}
              className={`bartender relative ${index > 0 ? 'hidden md:block' : ''} ${index > 1 ? 'md:hidden lg:block' : ''}`}
              style={{ 
                transform: 'translateY(-10%)', // Adjust to position sprites at the tavern table
                zIndex: 0
              }}
            >
              <div className="name-tag absolute -top-12 left-1/2 transform -translate-x-1/2 bg-[#2C1810] bg-opacity-75 px-3 py-1 text-sm rounded text-[#FFD700] font-['VT323'] whitespace-nowrap shadow-md border border-[#8B4513]">
                {bartender.name}
              </div>
              <BartenderSprite sprite={bartender.sprite} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TavernView;
