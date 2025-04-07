import { FC } from 'react';

// Import actual image files instead of using SVGs
import sapphireImg from '@/assets/images/bartenders/sapphire.jpg';
import amethystImg from '@/assets/images/bartenders/amethyst.jpg'; 
import indigoImg from '@/assets/images/bartenders/indigo.jpg';

// Map bartender names to their image paths
export const BartenderImageMap = {
  sapphire: sapphireImg,
  amethyst: amethystImg,
  indigo: indigoImg
};

export interface BartenderAvatarProps {
  name: string;
  size?: number;
}

export const BartenderAvatar: FC<BartenderAvatarProps> = ({ name, size = 32 }) => {
  const lowerName = name.toLowerCase();
  // Get the appropriate image path or default to sapphire
  const imagePath = BartenderImageMap[lowerName as keyof typeof BartenderImageMap] || BartenderImageMap.sapphire;
  
  return (
    <div 
      className="bg-dark-wood rounded-full overflow-hidden"
      style={{ width: size, height: size }}
    >
      <img 
        src={imagePath} 
        alt={`Bartender ${name}`} 
        className="w-full h-full object-cover object-top"
      />
    </div>
  );
};
