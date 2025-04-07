import { FC } from 'react';
import { BartenderImageMap } from '@/assets/svgs/bartenders';

interface BartenderSpriteProps {
  sprite: string;
}

const BartenderSprite: FC<BartenderSpriteProps> = ({ sprite }) => {
  const lowerSprite = sprite.toLowerCase();
  const imagePath = BartenderImageMap[lowerSprite as keyof typeof BartenderImageMap] || BartenderImageMap.sapphire;
  
  // Different style for each bartender to handle the specific image
  let imageStyle = {};
  
  if (lowerSprite === 'sapphire') {
    imageStyle = {
      background: `url(${imagePath}) no-repeat center center`,
      backgroundSize: 'contain',
      width: '250px',
      height: '400px',
      imageRendering: 'pixelated'
    };
  } 
  else if (lowerSprite === 'amethyst') {
    imageStyle = {
      background: `url(${imagePath}) no-repeat center center`,
      backgroundSize: 'contain',
      width: '250px',
      height: '400px',
      imageRendering: 'pixelated'
    };
  }
  else if (lowerSprite === 'indigo') {
    imageStyle = {
      background: `url(${imagePath}) no-repeat center center`,
      backgroundSize: 'contain',
      width: '250px',
      height: '400px',
      imageRendering: 'pixelated'
    };
  }
  
  return (
    <div className="sprite-container flex items-center justify-center">
      <div 
        style={imageStyle}
        className="mix-blend-multiply" 
        title={`Bartender ${sprite}`}
      />
    </div>
  );
};

export default BartenderSprite;
