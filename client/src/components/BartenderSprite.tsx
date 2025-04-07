import { FC } from 'react';
import { BartenderSpriteMap } from '@/assets/svgs/bartenders';

interface BartenderSpriteProps {
  sprite: string;
}

const BartenderSprite: FC<BartenderSpriteProps> = ({ sprite }) => {
  const lowerSprite = sprite.toLowerCase();
  const SpriteComponent = BartenderSpriteMap[lowerSprite as keyof typeof BartenderSpriteMap] || BartenderSpriteMap.ruby;
  
  return (
    <div className="sprite-container w-[100px] h-[200px]">
      <SpriteComponent />
    </div>
  );
};

export default BartenderSprite;
