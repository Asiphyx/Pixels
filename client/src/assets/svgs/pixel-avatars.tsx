import { FC } from 'react';

// Import PNG avatar images from assets directory
import bard from '@/assets/images/characters/PixelBard.png';
import knight from '@/assets/images/backgroundless/sapphire.png';
import wizard from '@/assets/images/backgroundless/amethyst.png';
import merchant from '@/assets/images/backgroundless/emerald.png';
import ranger from '@/assets/images/backgroundless/jade.png';
import rogue from '@/assets/images/backgroundless/indigo.png';

// Map avatar names to their PNG images
export const PixelAvatarMap = {
  bard,
  knight,
  wizard,
  merchant,
  ranger,
  rogue
};

export interface PixelAvatarProps {
  name: string;
  size?: number;
  className?: string;
}

// Map avatar names to RPG class descriptions
export const RoleDescriptions = {
  bard: "A charismatic performer with magical music",
  knight: "A stalwart defender with heavy armor and weapons",
  wizard: "A master of arcane magic and spellcasting",
  merchant: "A trader with shrewd business skills",
  ranger: "A wilderness expert and skilled archer",
  rogue: "A stealthy scout with nimble reflexes"
};

export const PixelAvatar: FC<PixelAvatarProps> = ({ name, size = 32, className = "" }) => {
  const lowerName = name.toLowerCase();
  const avatarSrc = PixelAvatarMap[lowerName as keyof typeof PixelAvatarMap] || PixelAvatarMap.knight;
  
  return (
    <div 
      className={`bg-[#3A2419] overflow-hidden flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      title={RoleDescriptions[lowerName as keyof typeof RoleDescriptions] || ""}
    >
      <img 
        src={avatarSrc} 
        alt={`${name} avatar`}
        className="w-full h-full object-contain"
      />
    </div>
  );
};