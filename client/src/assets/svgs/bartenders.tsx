import { FC } from 'react';

// Import bartender images from new assets
import { sapphire, amethyst, ruby } from '@/assets/images/new_assets';

// Map bartender names to their image paths - using our new bartender images
export const BartenderImageMap = {
  sapphire, // Blue-haired (middle) bartender
  amethyst, // Pink-haired (left) bartender
  ruby     // Red-haired (right) bartender
};

export interface BartenderAvatarProps {
  name: string;
  size?: number;
  className?: string;
}

// Bartender avatar component - used for chat messages and small displays
export const BartenderAvatar: FC<BartenderAvatarProps> = ({ name, size = 32, className = "" }) => {
  const lowerName = name.toLowerCase();
  const imagePath = BartenderImageMap[lowerName as keyof typeof BartenderImageMap] || BartenderImageMap.sapphire;
  
  return (
    <div 
      className={`bartender-avatar rounded-full overflow-hidden ${className}`}
      style={{ 
        width: size, 
        height: size,
        border: '2px solid',
        borderColor: 
          lowerName === 'amethyst' ? '#FF69B4' : 
          lowerName === 'sapphire' ? '#1E90FF' : 
          lowerName === 'ruby' ? '#FF4500' : '#8B4513'
      }}
    >
      <img 
        src={imagePath} 
        alt={`Bartender ${name}`} 
        className="object-cover w-full h-full"
        loading="lazy"
      />
    </div>
  );
};

// Bartender sprite component with enhanced styling for each character
// These sprite components are no longer needed for rendering in the tavern, 
// but we'll keep them for avatar references in the chat

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

export const RubySprite: FC = () => (
  <div className="bartender-sprite bartender-ruby">
    <img 
      src={ruby}
      alt="Bartender Ruby"
      loading="lazy" 
    />
  </div>
);

// Map of sprite components for easy access - only including our three new bartenders
export const BartenderSpriteMap = {
  sapphire: SapphireSprite,
  amethyst: AmethystSprite,
  ruby: RubySprite
};
