import { FC } from 'react';

// This file contains SVG representations of bartenders for the game
// These are used as sprites in the tavern 

export const BartenderSpriteMap = {
  ruby: () => (
    <svg viewBox="0 0 100 200" xmlns="http://www.w3.org/2000/svg" className="bartender-sprite">
      <rect x="35" y="30" width="30" height="40" fill="#D12B2B" /> {/* Hair */}
      <rect x="30" y="70" width="40" height="40" fill="#FFD8BE" /> {/* Face */}
      <rect x="35" y="80" width="5" height="5" fill="#1E1E1E" /> {/* Left eye */}
      <rect x="60" y="80" width="5" height="5" fill="#1E1E1E" /> {/* Right eye */}
      <rect x="45" y="95" width="10" height="5" fill="#C41E3A" /> {/* Mouth */}
      <rect x="20" y="110" width="60" height="50" fill="#1C1C1C" /> {/* Body */}
      <rect x="15" y="160" width="30" height="30" fill="#291D18" /> {/* Left leg */}
      <rect x="55" y="160" width="30" height="30" fill="#291D18" /> {/* Right leg */}
      <rect x="15" y="110" width="15" height="40" fill="#FFD8BE" /> {/* Left arm */}
      <rect x="70" y="110" width="15" height="40" fill="#FFD8BE" /> {/* Right arm */}
      <rect x="35" y="110" width="30" height="15" fill="#FF69B4" /> {/* Top */}
    </svg>
  ),
  
  azure: () => (
    <svg viewBox="0 0 100 200" xmlns="http://www.w3.org/2000/svg" className="bartender-sprite">
      <rect x="35" y="30" width="30" height="40" fill="#3F88C5" /> {/* Hair */}
      <rect x="30" y="70" width="40" height="40" fill="#FFD8BE" /> {/* Face */}
      <rect x="35" y="80" width="5" height="5" fill="#1E1E1E" /> {/* Left eye */}
      <rect x="60" y="80" width="5" height="5" fill="#1E1E1E" /> {/* Right eye */}
      <rect x="45" y="95" width="10" height="5" fill="#C41E3A" /> {/* Mouth */}
      <rect x="20" y="110" width="60" height="50" fill="#1C1C1C" /> {/* Body */}
      <rect x="15" y="160" width="30" height="30" fill="#291D18" /> {/* Left leg */}
      <rect x="55" y="160" width="30" height="30" fill="#291D18" /> {/* Right leg */}
      <rect x="15" y="110" width="15" height="40" fill="#FFD8BE" /> {/* Left arm */}
      <rect x="70" y="110" width="15" height="40" fill="#FFD8BE" /> {/* Right arm */}
      <rect x="35" y="110" width="30" height="15" fill="#3F88C5" /> {/* Top */}
    </svg>
  ),
  
  violet: () => (
    <svg viewBox="0 0 100 200" xmlns="http://www.w3.org/2000/svg" className="bartender-sprite">
      <rect x="35" y="30" width="30" height="40" fill="#8B5CF6" /> {/* Hair */}
      <rect x="30" y="70" width="40" height="40" fill="#FFD8BE" /> {/* Face */}
      <rect x="35" y="80" width="5" height="5" fill="#1E1E1E" /> {/* Left eye */}
      <rect x="60" y="80" width="5" height="5" fill="#1E1E1E" /> {/* Right eye */}
      <rect x="45" y="95" width="10" height="5" fill="#C41E3A" /> {/* Mouth */}
      <rect x="20" y="110" width="60" height="50" fill="#1C1C1C" /> {/* Body */}
      <rect x="15" y="160" width="30" height="30" fill="#291D18" /> {/* Left leg */}
      <rect x="55" y="160" width="30" height="30" fill="#291D18" /> {/* Right leg */}
      <rect x="15" y="110" width="15" height="40" fill="#FFD8BE" /> {/* Left arm */}
      <rect x="70" y="110" width="15" height="40" fill="#FFD8BE" /> {/* Right arm */}
      <rect x="35" y="110" width="30" height="15" fill="#8B5CF6" /> {/* Top */}
    </svg>
  )
};

export interface BartenderAvatarProps {
  name: string;
  size?: number;
}

export const BartenderAvatar: FC<BartenderAvatarProps> = ({ name, size = 32 }) => {
  const lowerName = name.toLowerCase();
  const BartenderComponent = BartenderSpriteMap[lowerName as keyof typeof BartenderSpriteMap] || BartenderSpriteMap.ruby;
  
  return (
    <div 
      className="bg-dark-wood rounded-full overflow-hidden"
      style={{ width: size, height: size }}
    >
      <BartenderComponent />
    </div>
  );
};
