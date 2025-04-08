import { FC } from 'react';
import { sapphire, amethyst, ruby } from '@/assets/images/new_assets';

interface BartenderSpriteProps {
  sprite: string;
}

// This component is no longer needed to display sprites as we're using a single background image
// It's kept for compatibility with existing code but doesn't render anything visible
const BartenderSprite: FC<BartenderSpriteProps> = ({ sprite }) => {
  return null;
};

export default BartenderSprite;
