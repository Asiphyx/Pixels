import React, { FC } from 'react';

// Define the customization options
type AvatarPart = 'skin' | 'eyes' | 'hair' | 'mouth' | 'accessory';
type AvatarPartOption = string;

// Skin tone options
const skinTones = {
  light: '#FFD8BE',
  medium: '#F1C27D',
  tan: '#E0AC69',
  brown: '#C68642',
  dark: '#8D5524'
};

// Eye options
const eyeStyles = {
  round: (
    <path d="M22 28a3 3 0 106 0 3 3 0 00-6 0zM36 28a3 3 0 106 0 3 3 0 00-6 0z" fill="#1E1E1E" />
  ),
  almond: (
    <path d="M20 26c0-2 2-4 4-4s4 2 4 4M36 26c0-2 2-4 4-4s4 2 4 4" stroke="#1E1E1E" strokeWidth="2" />
  ),
  happy: (
    <path d="M24 28a2 2 0 104 0 2 2 0 00-4 0zM36 28a2 2 0 104 0 2 2 0 00-4 0z" fill="#1E1E1E" />
  ),
  angry: (
    <path d="M20 26l8 2M44 26l-8 2" stroke="#1E1E1E" strokeWidth="2" />
  ),
  surprised: (
    <path d="M24 28a3 3 0 106 0 3 3 0 00-6 0zM34 28a3 3 0 106 0 3 3 0 00-6 0z" fill="#1E1E1E" />
  )
};

// Hair options
const hairStyles = {
  none: null,
  short: (
    <path d="M16 20c0-8 6-14 16-14s16 6 16 14c0 4-2 8-6 10" fill="#8B4513" />
  ),
  long: (
    <path d="M12 16c4-10 36-10 40 0 2 6-2 12-8 14 4 0 8 2 10 6-4 6-10 8-16 8h-12c-6 0-12-2-16-8 2-4 6-6 10-6-6-2-10-8-8-14z" fill="#8B4513" />
  ),
  spiky: (
    <path d="M18 22c-4-8 0-14 14-14 14 0 18 6 14 14" fill="#8B4513" />
  ),
  hood: (
    <path d="M16 10c0-4 7-6 16-6s16 2 16 6c0 8-2 12-6 16-2 2-4 4-4 8 0 2 0 4-6 4s-6-2-6-4c0-4-2-6-4-8-4-4-6-8-6-16z" fill="#228B22" />
  ),
  hat: (
    <path d="M14 8c6-2 10 2 10 8-4 4-8 4-10 0 0-4 0-6 0-8zM50 8c-6-2-10 2-10 8 4 4 8 4 10 0 0-4 0-6 0-8z" fill="#1E1E1E" />
  )
};

// Mouth options
const mouthStyles = {
  smile: (
    <path d="M26 38a6 3 0 1012 0" stroke="#1E1E1E" strokeWidth="2" />
  ),
  neutral: (
    <path d="M26 40h12" stroke="#1E1E1E" strokeWidth="2" />
  ),
  frown: (
    <path d="M26 38c0 2 3 4 6 4s6-2 6-4" stroke="#1E1E1E" strokeWidth="2" />
  ),
  open: (
    <path d="M28 36a4 4 0 108 0 4 4 0 00-8 0z" fill="#C41E3A" />
  ),
  smirk: (
    <path d="M26 38c0 0 3 3 12 0" stroke="#1E1E1E" strokeWidth="2" />
  )
};

// Accessory options
const accessoryStyles = {
  none: null,
  earring: (
    <path d="M18 30a2 2 0 104 0 2 2 0 00-4 0zM42 30a2 2 0 104 0 2 2 0 00-4 0z" fill="#FFD700" />
  ),
  scar: (
    <path d="M38 22l4 12" stroke="#C41E3A" strokeWidth="2" />
  ),
  freckles: (
    <>
      <circle cx="26" cy="34" r="1" fill="#8B4513" />
      <circle cx="30" cy="35" r="1" fill="#8B4513" />
      <circle cx="34" cy="34" r="1" fill="#8B4513" />
      <circle cx="38" cy="33" r="1" fill="#8B4513" />
      <circle cx="24" cy="32" r="1" fill="#8B4513" />
    </>
  ),
  glasses: (
    <path d="M20 26c0-6 6-6 12-6s12 0 12 6M20 26c0 4 3 6 6 6s6-2 6-6M38 26c0 4 3 6 6 6s6-2 6-6" stroke="#1E1E1E" strokeWidth="1" />
  ),
  monocle: (
    <path d="M38 24c0-4 3-6 6-6s6 2 6 6c0 4-3 6-6 6s-6-2-6-6zM38 24l-2-4" stroke="#1E1E1E" strokeWidth="1" />
  )
};

// Colors for hair
const hairColors = {
  brown: '#8B4513',
  black: '#1E1E1E',
  blonde: '#F0E68C',
  red: '#A52A2A',
  white: '#F5F5F5',
  blue: '#4169E1',
  purple: '#8B5CF6',
  green: '#228B22'
};

export interface AvatarCustomizationOptions {
  skin: keyof typeof skinTones;
  eyes: keyof typeof eyeStyles;
  hair: keyof typeof hairStyles;
  hairColor: keyof typeof hairColors;
  mouth: keyof typeof mouthStyles;
  accessory: keyof typeof accessoryStyles;
}

interface CustomAvatarProps {
  options: AvatarCustomizationOptions;
  className?: string;
  size?: number;
}

export const defaultAvatarOptions: AvatarCustomizationOptions = {
  skin: 'light',
  eyes: 'round',
  hair: 'short',
  hairColor: 'brown',
  mouth: 'smile',
  accessory: 'none'
};

export const CustomAvatar: FC<CustomAvatarProps> = ({ options, className, size = 64 }) => {
  const {
    skin = 'light',
    eyes = 'round',
    hair = 'short',
    hairColor = 'brown',
    mouth = 'smile',
    accessory = 'none'
  } = options;

  const skinColor = skinTones[skin];
  const currentHairStyle = hairStyles[hair];
  const currentHairColor = hairColors[hairColor];
  const currentEyeStyle = eyeStyles[eyes];
  const currentMouthStyle = mouthStyles[mouth];
  const currentAccessoryStyle = accessoryStyles[accessory];

  return (
    <div 
      className={`bg-dark-wood rounded-full overflow-hidden flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg className="w-full h-full" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        {/* Base */}
        <circle cx="32" cy="32" r="28" fill={skinColor} />
        
        {/* Hair (below features) */}
        {currentHairStyle && React.cloneElement(currentHairStyle, { fill: currentHairColor })}
        
        {/* Eyes */}
        {currentEyeStyle}
        
        {/* Mouth */}
        {currentMouthStyle}
        
        {/* Accessory */}
        {currentAccessoryStyle}
      </svg>
    </div>
  );
};

// Helper to convert avatar options to a string representation for storage
export const serializeAvatarOptions = (options: AvatarCustomizationOptions): string => {
  return Object.entries(options).map(([key, value]) => `${key}:${value}`).join(',');
};

// Helper to convert a serialized string back to avatar options
export const deserializeAvatarOptions = (serialized: string): AvatarCustomizationOptions => {
  if (!serialized) return defaultAvatarOptions;
  
  try {
    const parts = serialized.split(',');
    const options: Partial<AvatarCustomizationOptions> = {};
    
    for (const part of parts) {
      const [key, value] = part.split(':');
      if (key === 'skin' && value in skinTones) {
        options.skin = value as keyof typeof skinTones;
      } else if (key === 'eyes' && value in eyeStyles) {
        options.eyes = value as keyof typeof eyeStyles;
      } else if (key === 'hair' && value in hairStyles) {
        options.hair = value as keyof typeof hairStyles;
      } else if (key === 'hairColor' && value in hairColors) {
        options.hairColor = value as keyof typeof hairColors;
      } else if (key === 'mouth' && value in mouthStyles) {
        options.mouth = value as keyof typeof mouthStyles;
      } else if (key === 'accessory' && value in accessoryStyles) {
        options.accessory = value as keyof typeof accessoryStyles;
      }
    }
    
    return { ...defaultAvatarOptions, ...options };
  } catch (error) {
    console.error('Error deserializing avatar options:', error);
    return defaultAvatarOptions;
  }
};