import { FC } from 'react';

// Import PNG avatar images
import bard from '@assets/images/backgroundless/ruby.png';
import knight from '@assets/images/backgroundless/sapphire.png';
import wizard from '@assets/images/backgroundless/amethyst.png';
import merchant from '@assets/images/backgroundless/emerald.png';
import ranger from '@assets/images/backgroundless/jade.png';
import rogue from '@assets/images/backgroundless/indigo.png';

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