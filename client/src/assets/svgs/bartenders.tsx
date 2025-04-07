import { FC } from 'react';

// Import bartender images from backgroundless assets
import { sapphire, amethyst, indigo, ruby, emerald, jade } from '@/assets/images/backgroundless';

// Map bartender names to their image paths
export const BartenderImageMap = {
  sapphire,
  amethyst,
  indigo,
  ruby,
  emerald,
  jade
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
      className={`bartender-avatar ${className}`}
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

export const RubySprite: FC = () => (
  <div className="bartender-sprite bartender-ruby">
    <img 
      src={ruby}
      alt="Bartender Ruby"
      loading="lazy" 
    />
  </div>
);

export const EmeraldSprite: FC = () => (
  <div className="bartender-sprite bartender-emerald">
    <img 
      src={emerald}
      alt="Bartender Emerald"
      loading="lazy" 
    />
  </div>
);

export const JadeSprite: FC = () => (
  <div className="bartender-sprite bartender-jade">
    <img 
      src={jade}
      alt="Bartender Jade"
      loading="lazy" 
    />
  </div>
);

// Map of sprite components for easy access
export const BartenderSpriteMap = {
  sapphire: SapphireSprite,
  amethyst: AmethystSprite,
  indigo: IndigoSprite,
  ruby: RubySprite,
  emerald: EmeraldSprite,
  jade: JadeSprite
};
