import { FC } from 'react';

// Reference image paths (keeping for reference but not using directly)
import sapphireImgRef from '@/assets/images/bartenders/sapphire.jpg';
import amethystImgRef from '@/assets/images/bartenders/amethyst.jpg'; 
import indigoImgRef from '@/assets/images/bartenders/indigo.jpg';

// Bartender Pixel Art Sprites as SVGs
// These are custom Stardew Valley style pixel art bartenders
const SapphireSprite = () => (
  <svg width="64" height="128" viewBox="0 0 64 128" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Head */}
    <rect x="24" y="8" width="16" height="16" fill="#F8D8C0" />
    {/* Hair (Blue) */}
    <rect x="20" y="4" width="24" height="8" fill="#395F8F" />
    <rect x="16" y="8" width="8" height="16" fill="#395F8F" />
    <rect x="40" y="8" width="8" height="16" fill="#395F8F" />
    <rect x="16" y="24" width="8" height="8" fill="#395F8F" />
    <rect x="40" y="24" width="8" height="8" fill="#395F8F" />
    <rect x="44" y="16" width="4" height="12" fill="#395F8F" />
    <rect x="12" y="12" width="4" height="16" fill="#395F8F" />
    {/* Facial features */}
    <rect x="24" y="16" width="4" height="4" fill="#21130D" />
    <rect x="36" y="16" width="4" height="4" fill="#21130D" />
    <rect x="28" y="20" width="8" height="2" fill="#FF6B81" />
    {/* Earrings */}
    <rect x="14" y="20" width="2" height="4" fill="#FFD700" />
    <rect x="48" y="20" width="2" height="4" fill="#FFD700" />
    {/* Neck and shoulders */}
    <rect x="28" y="24" width="8" height="4" fill="#F8D8C0" />
    <rect x="24" y="28" width="16" height="8" fill="#F8D8C0" />
    {/* Bartender outfit - top */}
    <rect x="20" y="36" width="24" height="8" fill="#111111" />
    <rect x="16" y="44" width="32" height="4" fill="#111111" />
    {/* Arms */}
    <rect x="12" y="36" width="8" height="24" fill="#F8D8C0" />
    <rect x="44" y="36" width="8" height="24" fill="#F8D8C0" />
    {/* Tattoos */}
    <rect x="12" y="44" width="4" height="12" fill="#438945" opacity="0.7" />
    <rect x="48" y="44" width="4" height="12" fill="#438945" opacity="0.7" />
    {/* Bartender outfit - bottom */}
    <rect x="20" y="48" width="24" height="24" fill="#111111" />
    <rect x="24" y="48" width="16" height="4" fill="#FFD700" />
    {/* Legs */}
    <rect x="20" y="72" width="8" height="24" fill="#F8D8C0" />
    <rect x="36" y="72" width="8" height="24" fill="#F8D8C0" />
    {/* Shoes/boots */}
    <rect x="20" y="96" width="8" height="4" fill="#111111" />
    <rect x="36" y="96" width="8" height="4" fill="#111111" />
    {/* Beer mug accessory */}
    <rect x="6" y="38" width="6" height="10" fill="#F9C22E" />
    <rect x="4" y="36" width="10" height="2" fill="#FFFFFF" />
  </svg>
);

const AmethystSprite = () => (
  <svg width="64" height="128" viewBox="0 0 64 128" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Head */}
    <rect x="24" y="8" width="16" height="16" fill="#F8D8C0" />
    {/* Hair (Purple) */}
    <rect x="20" y="4" width="24" height="8" fill="#8A2BE2" />
    <rect x="18" y="8" width="6" height="20" fill="#8A2BE2" />
    <rect x="40" y="8" width="8" height="16" fill="#8A2BE2" />
    <rect x="16" y="12" width="4" height="12" fill="#8A2BE2" />
    {/* Hair accessory (flower) */}
    <rect x="18" y="6" width="4" height="4" fill="#FF6B81" />
    {/* Facial features */}
    <rect x="24" y="16" width="4" height="4" fill="#21130D" />
    <rect x="36" y="16" width="4" height="4" fill="#21130D" />
    <rect x="28" y="20" width="8" height="2" fill="#FF6B81" />
    {/* Earrings */}
    <rect x="16" y="20" width="2" height="4" fill="#FF6B81" />
    <rect x="46" y="20" width="2" height="4" fill="#FF6B81" />
    {/* Neck and shoulders */}
    <rect x="28" y="24" width="8" height="4" fill="#F8D8C0" />
    <rect x="24" y="28" width="16" height="8" fill="#F8D8C0" />
    {/* Bartender outfit - top */}
    <rect x="20" y="36" width="24" height="8" fill="#111111" />
    <rect x="16" y="44" width="32" height="4" fill="#111111" />
    {/* Arms */}
    <rect x="12" y="36" width="8" height="24" fill="#F8D8C0" />
    <rect x="44" y="36" width="8" height="24" fill="#F8D8C0" />
    {/* Tattoos */}
    <rect x="12" y="44" width="8" height="12" fill="#FF6B81" opacity="0.7" />
    <rect x="44" y="44" width="8" height="12" fill="#438945" opacity="0.7" />
    {/* Bartender outfit - bottom */}
    <rect x="20" y="48" width="24" height="24" fill="#111111" />
    {/* Legs */}
    <rect x="20" y="72" width="8" height="24" fill="#F8D8C0" />
    <rect x="36" y="72" width="8" height="24" fill="#F8D8C0" />
    {/* Shoes/boots */}
    <rect x="20" y="96" width="8" height="4" fill="#111111" />
    <rect x="36" y="96" width="8" height="4" fill="#111111" />
    {/* Beer mug accessory */}
    <rect x="46" y="38" width="10" height="14" fill="#F9C22E" />
    <rect x="44" y="36" width="14" height="2" fill="#FFFFFF" />
  </svg>
);

const IndigoSprite = () => (
  <svg width="64" height="128" viewBox="0 0 64 128" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Head */}
    <rect x="24" y="8" width="16" height="16" fill="#F8D8C0" />
    {/* Hair (Purple/Blue) */}
    <rect x="20" y="4" width="24" height="4" fill="#663399" />
    <rect x="22" y="0" width="20" height="4" fill="#663399" />
    <rect x="16" y="8" width="8" height="20" fill="#663399" />
    <rect x="40" y="8" width="8" height="20" fill="#663399" />
    {/* Hair Buns */}
    <rect x="14" y="10" width="6" height="6" fill="#663399" />
    <rect x="44" y="10" width="6" height="6" fill="#663399" />
    {/* Hair accessories (bun covers) */}
    <rect x="14" y="8" width="6" height="2" fill="#FF6B81" />
    <rect x="44" y="8" width="6" height="2" fill="#FF6B81" />
    {/* Facial features */}
    <rect x="24" y="16" width="4" height="4" fill="#21130D" />
    <rect x="36" y="16" width="4" height="4" fill="#21130D" />
    <rect x="28" y="20" width="8" height="2" fill="#FF6B81" />
    {/* Earrings */}
    <rect x="14" y="18" width="2" height="4" fill="#FFD700" />
    <rect x="48" y="18" width="2" height="4" fill="#FFD700" />
    {/* Neck and shoulders */}
    <rect x="28" y="24" width="8" height="4" fill="#F8D8C0" />
    <rect x="24" y="28" width="16" height="8" fill="#F8D8C0" />
    {/* Bartender outfit - top */}
    <rect x="20" y="36" width="24" height="8" fill="#111111" />
    <rect x="16" y="44" width="32" height="4" fill="#111111" />
    {/* Arms */}
    <rect x="12" y="36" width="8" height="24" fill="#F8D8C0" />
    <rect x="44" y="36" width="8" height="24" fill="#F8D8C0" />
    {/* Tattoos/markings */}
    <rect x="12" y="44" width="8" height="12" fill="#6B4CF5" opacity="0.7" />
    <rect x="44" y="44" width="8" height="12" fill="#6B4CF5" opacity="0.7" />
    {/* Bartender outfit - bottom */}
    <rect x="16" y="48" width="32" height="4" fill="#111111" />
    <rect x="20" y="52" width="24" height="20" fill="#111111" />
    <rect x="24" y="48" width="16" height="4" fill="#FFD700" />
    {/* Legs */}
    <rect x="20" y="72" width="8" height="24" fill="#F8D8C0" />
    <rect x="36" y="72" width="8" height="24" fill="#F8D8C0" />
    {/* Shoes/boots */}
    <rect x="20" y="96" width="8" height="4" fill="#111111" />
    <rect x="36" y="96" width="8" height="4" fill="#111111" />
    {/* Sweet dessert accessory */}
    <rect x="8" y="38" width="8" height="8" fill="#FFFFFF" />
    <rect x="9" y="36" width="6" height="2" fill="#6B4026" />
    <rect x="10" y="34" width="4" height="2" fill="#FF6B81" />
  </svg>
);

// Stardew Valley style portrait sprites
const SapphirePortrait = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Face */}
    <rect x="20" y="12" width="24" height="28" fill="#F8D8C0" />
    {/* Hair */}
    <rect x="16" y="8" width="32" height="12" fill="#395F8F" />
    <rect x="12" y="12" width="8" height="24" fill="#395F8F" />
    <rect x="44" y="12" width="8" height="24" fill="#395F8F" />
    {/* Eyes */}
    <rect x="22" y="20" width="6" height="6" fill="#21130D" />
    <rect x="36" y="20" width="6" height="6" fill="#21130D" />
    <rect x="24" y="22" width="2" height="2" fill="#FFFFFF" />
    <rect x="38" y="22" width="2" height="2" fill="#FFFFFF" />
    {/* Mouth */}
    <rect x="28" y="30" width="8" height="4" fill="#FF6B81" />
    {/* Earrings */}
    <rect x="12" y="28" width="2" height="6" fill="#FFD700" />
    <rect x="50" y="28" width="2" height="6" fill="#FFD700" />
    {/* Outfit collar */}
    <rect x="24" y="40" width="16" height="8" fill="#111111" />
  </svg>
);

const AmethystPortrait = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Face */}
    <rect x="20" y="12" width="24" height="28" fill="#F8D8C0" />
    {/* Hair */}
    <rect x="16" y="8" width="32" height="12" fill="#8A2BE2" />
    <rect x="14" y="12" width="10" height="20" fill="#8A2BE2" />
    <rect x="44" y="14" width="6" height="16" fill="#8A2BE2" />
    {/* Flower in Hair */}
    <rect x="18" y="10" width="6" height="6" fill="#FF6B81" />
    {/* Eyes */}
    <rect x="22" y="20" width="6" height="6" fill="#21130D" />
    <rect x="36" y="20" width="6" height="6" fill="#21130D" />
    <rect x="24" y="22" width="2" height="2" fill="#FFFFFF" />
    <rect x="38" y="22" width="2" height="2" fill="#FFFFFF" />
    {/* Mouth */}
    <rect x="28" y="30" width="8" height="4" fill="#FF6B81" />
    {/* Earrings */}
    <rect x="14" y="28" width="2" height="6" fill="#FF6B81" />
    <rect x="48" y="28" width="2" height="6" fill="#FF6B81" />
    {/* Outfit collar */}
    <rect x="24" y="40" width="16" height="8" fill="#111111" />
  </svg>
);

const IndigoPortrait = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Face */}
    <rect x="20" y="12" width="24" height="28" fill="#F8D8C0" />
    {/* Hair */}
    <rect x="16" y="6" width="32" height="10" fill="#663399" />
    {/* Buns */}
    <rect x="10" y="12" width="10" height="10" fill="#663399" />
    <rect x="44" y="12" width="10" height="10" fill="#663399" />
    {/* Pink Accessories */}
    <rect x="12" y="10" width="6" height="2" fill="#FF6B81" />
    <rect x="46" y="10" width="6" height="2" fill="#FF6B81" />
    {/* Eyes */}
    <rect x="22" y="20" width="6" height="6" fill="#21130D" />
    <rect x="36" y="20" width="6" height="6" fill="#21130D" />
    <rect x="24" y="22" width="2" height="2" fill="#FFFFFF" />
    <rect x="38" y="22" width="2" height="2" fill="#FFFFFF" />
    {/* Mouth */}
    <rect x="28" y="30" width="8" height="4" fill="#FF6B81" />
    {/* Earrings */}
    <rect x="10" y="18" width="2" height="6" fill="#FFD700" />
    <rect x="52" y="18" width="2" height="6" fill="#FFD700" />
    {/* Outfit collar */}
    <rect x="24" y="40" width="16" height="8" fill="#111111" />
  </svg>
);

// Mapping components for accessing the sprites
export const BartenderSpriteMap = {
  sapphire: SapphireSprite,
  amethyst: AmethystSprite,
  indigo: IndigoSprite
};

// Mapping components for accessing the portraits
export const BartenderPortraitMap = {
  sapphire: SapphirePortrait,
  amethyst: AmethystPortrait,
  indigo: IndigoPortrait
};

// Legacy image map for reference/compatibility
export const BartenderImageMap = {
  sapphire: sapphireImgRef,
  amethyst: amethystImgRef,
  indigo: indigoImgRef
};

export interface BartenderAvatarProps {
  name: string;
  size?: number;
}

export const BartenderAvatar: FC<BartenderAvatarProps> = ({ name, size = 32 }) => {
  const lowerName = name.toLowerCase();
  
  // Get the portrait component
  const PortraitComponent = BartenderPortraitMap[lowerName as keyof typeof BartenderPortraitMap] || BartenderPortraitMap.sapphire;
  
  return (
    <div 
      className="rounded-full overflow-hidden bg-tavern-gold/10"
      style={{ width: size, height: size }}
    >
      <PortraitComponent />
    </div>
  );
};
