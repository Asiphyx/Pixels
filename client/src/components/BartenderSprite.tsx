import { FC } from 'react';
import { BartenderSpriteMap } from '@/assets/svgs/bartenders';

interface BartenderSpriteProps {
  sprite: string;
}

const BartenderSprite: FC<BartenderSpriteProps> = ({ sprite }) => {
  const lowerSprite = sprite.toLowerCase();
  
  // Get the appropriate sprite component that uses our CSS-based bartender sprites
  const SpriteComponent = BartenderSpriteMap[lowerSprite as keyof typeof BartenderSpriteMap] || BartenderSpriteMap.sapphire;
  
  return (
    <div className="flex items-end justify-center h-72">
      <SpriteComponent />
    </div>
  );
};

export default BartenderSprite;
