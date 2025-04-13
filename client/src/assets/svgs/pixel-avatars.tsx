import { FC } from 'react';

// Import PNG avatar images from assets directory
import bard from '@/assets/images/backgroundless/ruby.png';
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

// Map avatar names to RPG class and race descriptions with deeper lore
export const RoleDescriptions = {
  bard: "An elven melodious wanderer who collects songs, stories and memories from all realms. Their ancient harp can briefly bring memories to life as visible apparitions.",
  knight: "A human oath-bound protector from a fallen kingdom. Their enchanted armor adapts to absorbed properties of defeated foes, granting special resistances.",
  wizard: "A human paradigm-breaking arcane researcher whose revolutionary magical theories were stolen. They can analyze and identify almost any spell encountered.",
  merchant: "A demonkind boundary broker who escaped their soul-claiming family. They craft binding agreements between realms that cannot normally interact.",
  ranger: "A troll between-worlds pathfinder who tracks and repairs rifts between dimensions. They have a unique ability to communicate with creatures from any world.",
  rogue: "A half-human half-dark elf shadow diplomat with unique biological adaptations. They can move between connected shadows and have perfect memory recall."
};

export const PixelAvatar: FC<PixelAvatarProps> = ({ name, size = 32, className = "" }) => {
  const lowerName = name.toLowerCase();
  const avatarSrc = PixelAvatarMap[lowerName as keyof typeof PixelAvatarMap] || PixelAvatarMap.knight;
  
  return (
    <div 
      className={`bg-[#2C1810] rounded-full overflow-hidden flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      title={RoleDescriptions[lowerName as keyof typeof RoleDescriptions] || ""}
    >
      <img 
        src={avatarSrc} 
        alt={`${name} avatar`}
        className="w-full h-full object-cover"
      />
    </div>
  );
};