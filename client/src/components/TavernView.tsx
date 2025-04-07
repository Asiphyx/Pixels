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
        {/* Bar Counter */}
        <div className="bar-counter absolute bottom-16 left-0 right-0 h-16 bg-[#8B4513]"></div>
        
        {/* Shelves */}
        <div className="shelves absolute top-8 left-0 right-0 h-24 bg-[#4A3429] opacity-90 flex justify-around px-4">
          {/* Bottles on shelves */}
          {[
            '#4A8F26', '#8F4A26', '#26648F', '#8F2626', 
            '#7A268F', '#8F7A26', '#26418F', '#8F266E'
          ].map((color, index) => (
            <div 
              key={index}
              className="bottle mx-1 mt-auto" 
              style={{ 
                backgroundColor: color,
                height: `${10 + Math.random() * 6}px`,
                width: '6px'
              }}
            ></div>
          ))}
        </div>
        
        {/* Lights */}
        <div className="lights absolute top-0 left-0 right-0 flex justify-around">
          {[1, 2, 3].map((num) => (
            <div 
              key={num}
              className="light w-8 h-16 bg-[#FFD700] opacity-60 rounded-full blur-md animate-pulse"
              style={{ animationDelay: `${num * 0.3}s` }}
            ></div>
          ))}
        </div>
        
        {/* Bartenders */}
        <div className="bartenders absolute bottom-16 left-0 right-0 h-56 flex justify-around">
          {bartenders.map((bartender, index) => (
            <div 
              key={bartender.id}
              className={`bartender relative ${index > 0 ? 'hidden md:block' : ''} ${index > 1 ? 'md:hidden lg:block' : ''}`}
            >
              <BartenderSprite sprite={bartender.sprite} />
              <div className="name-tag absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-[#8B4513] px-2 py-1 text-xs rounded text-[#E8D6B3] font-['VT323'] whitespace-nowrap shadow-md">
                {bartender.name}
              </div>
            </div>
          ))}
        </div>
        
        {/* Stools */}
        <div className="stools absolute bottom-0 left-0 right-0 h-16 flex justify-around px-8">
          <div className="stool w-10 h-10 rounded-full bg-[#4A3429]"></div>
          <div className="stool w-10 h-10 rounded-full bg-[#4A3429]"></div>
          <div className="stool w-10 h-10 rounded-full bg-[#4A3429] hidden md:block"></div>
          <div className="stool w-10 h-10 rounded-full bg-[#4A3429] hidden lg:block"></div>
        </div>
      </div>
    </div>
  );
};

export default TavernView;
