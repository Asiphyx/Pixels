import { FC } from 'react';
import { BartenderSpriteMap } from '@/assets/svgs/bartenders';

interface BartenderSpriteProps {
  sprite: string;
}

const BartenderSprite: FC<BartenderSpriteProps> = ({ sprite }) => {
  const lowerSprite = sprite.toLowerCase();
  
  // Get the appropriate sprite component
  const SpriteComponent = BartenderSpriteMap[lowerSprite as keyof typeof BartenderSpriteMap] || BartenderSpriteMap.sapphire;
  
  return (
    <div className="sprite-container flex items-center justify-center">
      <div 
        className="scale-[2.5] transform-gpu" 
        style={{ imageRendering: 'pixelated' }}
        title={`Bartender ${sprite}`}
      >
        <SpriteComponent />
      </div>
    </div>
  );
};

export default BartenderSprite;
