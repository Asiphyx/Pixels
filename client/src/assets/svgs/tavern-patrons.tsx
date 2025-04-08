import { FC } from 'react';

interface PatronIconProps {
  className?: string;
}

// Patron 1: Bard
export const BardIcon: FC<PatronIconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="28" fill="#EAC086" />
    <path d="M20 26c0-2 2-4 4-4s4 2 4 4M36 26c0-2 2-4 4-4s4 2 4 4" stroke="#472D1E" strokeWidth="2" />
    <path d="M26 40c0-2 3-4 6-4s6 2 6 4" stroke="#472D1E" strokeWidth="2" />
    <path d="M16 18c0-6 6-12 16-12s16 6 16 12c0 4-3 6-3 6 0 0 3-1 6 0 0 0-1 8-9 9-3 0-6-1-10-1s-6 1-10 1c-8 0-9-9-9-9 3-1 6 0 6 0s-3-2-3-6z" fill="#6B4226" />
    <path d="M20 44c0 0 4 8 12 8s12-8 12-8" stroke="#472D1E" strokeWidth="2" />
    <path d="M48 24a4 4 0 01-4 4M16 24a4 4 0 004 4" fill="#EAC086" />
    <path d="M18 14c2-4 6-6 14-6 8 0 12 2 14 6" stroke="#FFD700" strokeWidth="2" />
    <path d="M24 18a2 2 0 100-4 2 2 0 000 4zM40 18a2 2 0 100-4 2 2 0 000 4z" fill="#FFD700" />
  </svg>
);

// Patron 2: Knight
export const KnightIcon: FC<PatronIconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="28" fill="#D0A77D" />
    <path d="M20 26c0-2 2-4 4-4s4 2 4 4M36 26c0-2 2-4 4-4s4 2 4 4" stroke="#472D1E" strokeWidth="2" />
    <path d="M26 42c0-2 3-4 6-4s6 2 6 4" stroke="#472D1E" strokeWidth="2" />
    <path d="M16 14c0-4 6-8 16-8s16 4 16 8c0 6-4 10-4 14 0 0 4 0 4 4 0 2-2 4-4 4-2 4-6 6-12 6h-4c-6 0-10-2-12-6-2 0-4-2-4-4 0-4 4-4 4-4 0-4-4-8-4-14z" fill="#888888" />
    <path d="M24 14h16M22 18h20M20 22h24" stroke="#555555" strokeWidth="2" />
  </svg>
);

// Patron 3: Wizard
export const WizardIcon: FC<PatronIconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="28" fill="#EAC086" />
    <path d="M24 26a4 4 0 01-4-4M40 26a4 4 0 004-4" stroke="#472D1E" strokeWidth="2" />
    <path d="M26 40c0-2 3-4 6-4s6 2 6 4" stroke="#472D1E" strokeWidth="2" />
    <path d="M16 18C17 8 24 2 32 2s15 6 16 16c0 4-2 8-6 10 4-2 10-2 10 0-2 6-6 8-10 8-4 0-6-2-10-2s-6 2-10 2c-4 0-8-2-10-8 0-2 6-2 10 0-4-2-6-6-6-10z" fill="#4B0082" />
    <path d="M30 10l4 6M32 5l2 7M34 10l-4 6" stroke="#FFD700" strokeWidth="1" />
    <circle cx="32" cy="16" r="3" fill="#FFD700" />
    <path d="M24 18a2 2 0 100-4 2 2 0 000 4zM40 18a2 2 0 100-4 2 2 0 000 4z" fill="#FFFFFF" />
  </svg>
);

// Patron 4: Merchant
export const MerchantIcon: FC<PatronIconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="28" fill="#D0A77D" />
    <path d="M24 26a4 4 0 01-4-4M40 26a4 4 0 004-4" stroke="#472D1E" strokeWidth="2" />
    <path d="M26 40c0-2 3-4 6-4s6 2 6 4" stroke="#472D1E" strokeWidth="2" />
    <path d="M18 16c2-8 8-10 14-10s12 2 14 10c0 4-4 8-4 8s4 0 6 2c0 8-4 10-8 10-6 0-8-2-8-2s-2 2-8 2c-4 0-8-2-8-10 2-2 6-2 6-2s-4-4-4-8z" fill="#8B4513" />
    <path d="M24 18c0-1 1-2 2-2s2 1 2 2M36 18c0-1 1-2 2-2s2 1 2 2" fill="#472D1E" />
    <path d="M26 44h12M24 47h16" stroke="#8B4513" strokeWidth="2" />
    <circle cx="32" cy="14" r="3" fill="#FFD700" />
  </svg>
);

// Patron 5: Ranger
export const RangerIcon: FC<PatronIconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="28" fill="#D0A77D" />
    <path d="M20 26c0-2 2-4 4-4s4 2 4 4M36 26c0-2 2-4 4-4s4 2 4 4" stroke="#472D1E" strokeWidth="2" />
    <path d="M26 42c0-2 3-4 6-4s6 2 6 4" stroke="#472D1E" strokeWidth="2" />
    <path d="M16 18c0-8 6-14 16-14s16 6 16 14c0 4-2 8-6 10 4-2 8-2 10 0 0 4-4 8-10 8-4 0-6-2-10-2s-6 2-10 2c-6 0-10-4-10-8 2-2 6-2 10 0-4-2-6-6-6-10z" fill="#006400" />
    <path d="M17 12l10 4M47 12l-10 4" stroke="#472D1E" strokeWidth="1" />
    <path d="M24 18a2 2 0 100-4 2 2 0 000 4zM40 18a2 2 0 100-4 2 2 0 000 4z" fill="#472D1E" />
  </svg>
);

// Patron 6: Rogue
export const RogueIcon: FC<PatronIconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="28" fill="#EAC086" />
    <path d="M24 26a4 4 0 01-4-4M40 26a4 4 0 004-4" stroke="#472D1E" strokeWidth="2" />
    <path d="M26 42c0-2 3-4 6-4s6 2 6 4" stroke="#472D1E" strokeWidth="2" />
    <path d="M14 18c0-6 8-12 18-12s18 6 18 12c0 0-2 6-6 8 4 0 6 2 6 4s-4 6-12 6c-2 0-4-2-6-2s-4 2-6 2c-8 0-12-4-12-6s2-4 6-4c-4-2-6-8-6-8z" fill="#2F4F4F" />
    <path d="M24 18a2 2 0 100-4 2 2 0 000 4zM40 18a2 2 0 100-4 2 2 0 000 4z" fill="#FFD700" />
    <path d="M26 16l6 4 6-4" stroke="#472D1E" strokeWidth="1" />
  </svg>
);

// Map of avatar icons 
export const PatronIconMap = {
  bard: BardIcon,
  knight: KnightIcon,
  wizard: WizardIcon,
  merchant: MerchantIcon,
  ranger: RangerIcon,
  rogue: RogueIcon
};

export interface PatronAvatarProps {
  name: string;
  size?: number;
  className?: string;
}

export const PatronAvatar: FC<PatronAvatarProps> = ({ name, size = 32, className = "" }) => {
  const lowerName = name.toLowerCase();
  const AvatarComponent = PatronIconMap[lowerName as keyof typeof PatronIconMap] || PatronIconMap.bard;
  
  return (
    <div 
      className={`bg-[#2C1810] rounded-full overflow-hidden flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <AvatarComponent className="w-full h-full" />
    </div>
  );
};