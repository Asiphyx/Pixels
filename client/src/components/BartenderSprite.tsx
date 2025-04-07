import { FC } from 'react';
import { BartenderImageMap } from '@/assets/svgs/bartenders';

interface BartenderSpriteProps {
  sprite: string;
}

const BartenderSprite: FC<BartenderSpriteProps> = ({ sprite }) => {
  const lowerSprite = sprite.toLowerCase();
  const imagePath = BartenderImageMap[lowerSprite as keyof typeof BartenderImageMap] || BartenderImageMap.sapphire;
  
  return (
    <div className="sprite-container w-[200px] h-[400px] flex items-center justify-center">
      <img 
        src={imagePath} 
        alt={`Bartender ${sprite}`}
        className="max-h-full max-w-full object-contain"
      />
    </div>
  );
};

export default BartenderSprite;
