import { FC } from 'react';

// Import bartender images from attached assets
import { sapphire, amethyst, indigo } from '@/assets/images/bartenders';

// Map bartender names to their image paths
export const BartenderImageMap = {
  sapphire,
  amethyst,
  indigo
};

export interface BartenderAvatarProps {
  name: string;
  size?: number;
}

// Bartender avatar component - used for chat messages and small displays
export const BartenderAvatar: FC<BartenderAvatarProps> = ({ name, size = 32 }) => {
  const lowerName = name.toLowerCase();
  const imagePath = BartenderImageMap[lowerName as keyof typeof BartenderImageMap] || BartenderImageMap.sapphire;
  
  return (
    <div 
      className="bartender-avatar"
      style={{ width: size, height: size }}
    >
      <img 
        src={imagePath} 
        alt={`Bartender ${name}`} 
        loading="lazy"
      />
    </div>
  );
};

// Bartender sprite component with enhanced styling for each character
export const SapphireSprite: FC = () => (
  <div className="bartender-sprite bartender-sapphire">
    <img 
      src={sapphire}
      alt="Bartender Sapphire"
      loading="lazy" 
    />
  </div>
);

export const AmethystSprite: FC = () => (
  <div className="bartender-sprite bartender-amethyst">
    <img 
      src={amethyst}
      alt="Bartender Amethyst"
      loading="lazy" 
    />
  </div>
);

export const IndigoSprite: FC = () => (
  <div className="bartender-sprite bartender-indigo">
    <img 
      src={indigo}
      alt="Bartender Indigo"
      loading="lazy" 
    />
  </div>
);

// Map of sprite components for easy access
export const BartenderSpriteMap = {
  sapphire: SapphireSprite,
  amethyst: AmethystSprite,
  indigo: IndigoSprite
};
