import { FC } from 'react';

// Import PNG avatar images from assets directory
import bard from '@/assets/ruby_avatar.png';
import knight from '@/assets/sapphire_avatar.png';
import wizard from '@/assets/amethyst_avatar.png';
import merchant from '@/assets/amethyst_new.png';
import ranger from '@/assets/ruby_new.png';
import rogue from '@/assets/sapphire_new.png';

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

export const PixelAvatar: FC<PixelAvatarProps> = ({ name, size = 32, className = "" }) => {
  const lowerName = name.toLowerCase();
  const avatarSrc = PixelAvatarMap[lowerName as keyof typeof PixelAvatarMap] || PixelAvatarMap.knight;
  
  return (
    <div 
      className={`bg-[#2C1810] rounded-full overflow-hidden flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <img 
        src={avatarSrc} 
        alt={`${name} avatar`}
        className="w-full h-full object-cover"
      />
    </div>
  );
};