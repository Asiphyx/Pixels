import { FC } from 'react';

// This file contains SVG representations of the three bartender sisters
// Based on the reference pixel art images

export const BartenderSpriteMap = {
  sapphire: () => (
    <svg viewBox="0 0 100 200" xmlns="http://www.w3.org/2000/svg" className="bartender-sprite">
      {/* Bartender with blue hair from reference image */}
      <rect x="25" y="20" width="50" height="55" rx="5" fill="#191B2A" /> {/* Background */}
      
      {/* Hair */}
      <rect x="30" y="25" width="40" height="55" fill="#2B3F99" /> {/* Base blue hair */}
      <rect x="25" y="30" width="10" height="35" fill="#2B3F99" /> {/* Left side */}
      <rect x="65" y="30" width="10" height="35" fill="#2B3F99" /> {/* Right side */}
      <rect x="35" y="20" width="30" height="10" fill="#2B3F99" /> {/* Top */}
      
      {/* Face */}
      <rect x="35" y="35" width="30" height="35" fill="#FFC6D8" /> {/* Face shape */}
      
      {/* Eyes */}
      <rect x="40" y="45" width="6" height="8" fill="#3652B9" /> {/* Left eye */}
      <rect x="55" y="45" width="6" height="8" fill="#3652B9" /> {/* Right eye */}
      
      {/* Mouth */}
      <rect x="43" y="60" width="14" height="4" fill="#E93F78" /> {/* Lips */}
      
      {/* Body */}
      <rect x="30" y="85" width="40" height="45" fill="#191B2A" /> {/* Top/dress */}
      
      {/* Neck/cleavage */}
      <rect x="40" y="80" width="20" height="10" fill="#FFC6D8" /> {/* Neck */}
      <path d="M35,95 Q50,105 65,95" stroke="#FFC6D8" strokeWidth="8" fill="none" /> {/* Chest */}
      
      {/* Arms */}
      <rect x="20" y="90" width="10" height="40" fill="#FFC6D8" /> {/* Left arm */}
      <rect x="70" y="90" width="10" height="40" fill="#FFC6D8" /> {/* Right arm */}
      
      {/* Beer Mug */}
      <rect x="15" y="80" width="12" height="18" fill="#FFC24C" /> {/* Beer */}
      <rect x="12" y="75" width="18" height="5" fill="#FFFFFF" /> {/* Foam */}
      <rect x="10" y="80" width="5" height="15" fill="#6A4229" /> {/* Mug handle */}
      
      {/* Lower Body/shorts */}
      <rect x="30" y="130" width="40" height="20" fill="#191B2A" /> {/* Shorts */}
      
      {/* Tattoos */}
      <rect x="18" y="100" width="14" height="8" fill="#4EABDB" opacity="0.7" /> {/* Arm tattoo */}
      <rect x="35" y="150" width="12" height="12" fill="#4EABDB" opacity="0.7" /> {/* Leg tattoo */}
      
      {/* Legs */}
      <rect x="33" y="150" width="14" height="45" fill="#FFC6D8" /> {/* Left leg */}
      <rect x="53" y="150" width="14" height="45" fill="#FFC6D8" /> {/* Right leg */}
    </svg>
  ),
  
  amethyst: () => (
    <svg viewBox="0 0 100 200" xmlns="http://www.w3.org/2000/svg" className="bartender-sprite">
      {/* Bartender with purple hair from reference image */}
      <rect x="25" y="20" width="50" height="55" rx="5" fill="#191B2A" /> {/* Background */}
      
      {/* Hair */}
      <rect x="30" y="25" width="40" height="55" fill="#8A3AB9" /> {/* Base purple hair */}
      <rect x="25" y="30" width="10" height="35" fill="#8A3AB9" /> {/* Left side */}
      <rect x="65" y="30" width="10" height="35" fill="#8A3AB9" /> {/* Right side */}
      <rect x="35" y="20" width="30" height="10" fill="#8A3AB9" /> {/* Top */}
      
      {/* Face */}
      <rect x="35" y="35" width="30" height="35" fill="#FFC6D8" /> {/* Face shape */}
      
      {/* Eyes */}
      <rect x="40" y="45" width="6" height="8" fill="#B24FEE" /> {/* Left eye */}
      <rect x="55" y="45" width="6" height="8" fill="#B24FEE" /> {/* Right eye */}
      
      {/* Mouth */}
      <rect x="43" y="60" width="14" height="4" fill="#E93F78" /> {/* Lips */}
      
      {/* Body */}
      <rect x="30" y="85" width="40" height="45" fill="#191B2A" /> {/* Top/dress */}
      
      {/* Neck/cleavage */}
      <rect x="40" y="80" width="20" height="10" fill="#FFC6D8" /> {/* Neck */}
      <path d="M35,95 Q50,105 65,95" stroke="#FFC6D8" strokeWidth="8" fill="none" /> {/* Chest */}
      
      {/* Arms */}
      <rect x="20" y="90" width="10" height="40" fill="#FFC6D8" /> {/* Left arm */}
      <rect x="70" y="90" width="10" height="40" fill="#FFC6D8" /> {/* Right arm */}
      
      {/* Beer Mug */}
      <rect x="15" y="80" width="12" height="18" fill="#FFC24C" /> {/* Beer */}
      <rect x="12" y="75" width="18" height="5" fill="#FFFFFF" /> {/* Foam */}
      <rect x="10" y="80" width="5" height="15" fill="#6A4229" /> {/* Mug handle */}
      
      {/* Lower Body/bikini */}
      <rect x="30" y="130" width="40" height="20" fill="#191B2A" /> {/* Bottom */}
      
      {/* Tattoos */}
      <rect x="18" y="100" width="14" height="8" fill="#E169FE" opacity="0.7" /> {/* Arm tattoo */}
      <rect x="55" y="160" width="12" height="12" fill="#E169FE" opacity="0.7" /> {/* Leg tattoo */}
      
      {/* Legs */}
      <rect x="33" y="150" width="14" height="45" fill="#FFC6D8" /> {/* Left leg */}
      <rect x="53" y="150" width="14" height="45" fill="#FFC6D8" /> {/* Right leg */}
    </svg>
  ),
  
  indigo: () => (
    <svg viewBox="0 0 100 200" xmlns="http://www.w3.org/2000/svg" className="bartender-sprite">
      {/* Bartender with indigo/blue-purple hair from reference image */}
      <rect x="25" y="20" width="50" height="55" rx="5" fill="#191B2A" /> {/* Background */}
      
      {/* Hair */}
      <rect x="30" y="25" width="40" height="55" fill="#5C3B99" /> {/* Base blue-purple hair */}
      <rect x="25" y="30" width="10" height="35" fill="#5C3B99" /> {/* Left side */}
      <rect x="65" y="30" width="10" height="35" fill="#5C3B99" /> {/* Right side */}
      <rect x="35" y="20" width="30" height="10" fill="#5C3B99" /> {/* Top */}
      
      {/* Face */}
      <rect x="35" y="35" width="30" height="35" fill="#FFC6D8" /> {/* Face shape */}
      
      {/* Eyes */}
      <rect x="40" y="45" width="6" height="8" fill="#7649DB" /> {/* Left eye */}
      <rect x="55" y="45" width="6" height="8" fill="#7649DB" /> {/* Right eye */}
      
      {/* Mouth */}
      <rect x="43" y="60" width="14" height="4" fill="#E93F78" /> {/* Lips */}
      
      {/* Body */}
      <rect x="30" y="85" width="40" height="45" fill="#191B2A" /> {/* Top/dress */}
      
      {/* Neck/cleavage */}
      <rect x="40" y="80" width="20" height="10" fill="#FFC6D8" /> {/* Neck */}
      <path d="M35,95 Q50,105 65,95" stroke="#FFC6D8" strokeWidth="8" fill="none" /> {/* Chest */}
      
      {/* Arms */}
      <rect x="20" y="90" width="10" height="40" fill="#FFC6D8" /> {/* Left arm */}
      <rect x="70" y="90" width="10" height="40" fill="#FFC6D8" /> {/* Right arm */}
      
      {/* Beer Mug */}
      <rect x="15" y="80" width="12" height="18" fill="#FFC24C" /> {/* Beer */}
      <rect x="12" y="75" width="18" height="5" fill="#FFFFFF" /> {/* Foam */}
      <rect x="10" y="80" width="5" height="15" fill="#6A4229" /> {/* Mug handle */}
      
      {/* Lower Body/shorts */}
      <rect x="30" y="130" width="40" height="20" fill="#191B2A" /> {/* Shorts */}
      
      {/* Tattoos */}
      <rect x="18" y="100" width="14" height="8" fill="#9C7AF1" opacity="0.7" /> {/* Arm tattoo */}
      <rect x="33" y="155" width="14" height="12" fill="#17DA4F" opacity="0.7" /> {/* Leg tattoo - green rose */}
      <rect x="55" y="155" width="12" height="12" fill="#F14A7A" opacity="0.7" /> {/* Leg tattoo - red rose */}
      
      {/* Legs */}
      <rect x="33" y="150" width="14" height="45" fill="#FFC6D8" /> {/* Left leg */}
      <rect x="53" y="150" width="14" height="45" fill="#FFC6D8" /> {/* Right leg */}
    </svg>
  )
};

export interface BartenderAvatarProps {
  name: string;
  size?: number;
}

export const BartenderAvatar: FC<BartenderAvatarProps> = ({ name, size = 32 }) => {
  const lowerName = name.toLowerCase();
  const BartenderComponent = BartenderSpriteMap[lowerName as keyof typeof BartenderSpriteMap] || BartenderSpriteMap.sapphire;
  
  return (
    <div 
      className="bg-dark-wood rounded-full overflow-hidden"
      style={{ width: size, height: size }}
    >
      <BartenderComponent />
    </div>
  );
};
