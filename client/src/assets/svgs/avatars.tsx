import { FC } from 'react';

interface AvatarIconProps {
  className?: string;
}

// Character Avatar Icons
export const ElwynIcon: FC<AvatarIconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="28" fill="#FFD8BE" />
    <path d="M20 26c0-2 2-4 4-4s4 2 4 4M36 26c0-2 2-4 4-4s4 2 4 4" stroke="#1E1E1E" strokeWidth="2" />
    <path d="M32 34a4 4 0 100 8 4 4 0 000-8z" fill="#C41E3A" />
    <path d="M20 42c4 8 20 8 24 0" stroke="#1E1E1E" strokeWidth="2" />
    <path d="M18 22c-4-8 0-14 14-14 14 0 18 6 14 14" fill="#8B5CF6" />
    <path d="M14 24c-2 2-2 4 0 6M50 24c2 2 2 4 0 6" fill="#FFD8BE" />
  </svg>
);

export const ThorgrimIcon: FC<AvatarIconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="28" fill="#FFD8BE" />
    <path d="M20 26c0-2 2-4 4-4s4 2 4 4M36 26c0-2 2-4 4-4s4 2 4 4" stroke="#1E1E1E" strokeWidth="2" />
    <path d="M26 42c0-2 3-4 6-4s6 2 6 4" stroke="#1E1E1E" strokeWidth="2" />
    <path d="M16 20c0-8 6-14 16-14s16 6 16 14c0 4-2 8-6 10 4-2 8-2 10 0 0 4-4 8-10 8-4 0-6-2-10-2s-6 2-10 2c-6 0-10-4-10-8 2-2 6-2 10 0-4-2-6-6-6-10z" fill="#8B4513" />
  </svg>
);

export const MerlinIcon: FC<AvatarIconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="28" fill="#FFD8BE" />
    <path d="M22 28a4 4 0 108 0 4 4 0 00-8 0zM34 28a4 4 0 108 0 4 4 0 00-8 0z" fill="#1E1E1E" />
    <path d="M26 40c0-2 3-4 6-4s6 2 6 4" stroke="#1E1E1E" strokeWidth="2" />
    <path d="M12 16c4-10 36-10 40 0 2 6-2 12-8 14 4 0 8 2 10 6-4 6-10 8-16 8h-12c-6 0-12-2-16-8 2-4 6-6 10-6-6-2-10-8-8-14z" fill="#3F88C5" />
    <path d="M26 18a2 2 0 100 4 2 2 0 000-4zM38 18a2 2 0 100 4 2 2 0 000-4z" fill="#FFFFFF" />
  </svg>
);

export const LilithIcon: FC<AvatarIconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="28" fill="#FFD8BE" />
    <path d="M24 28a2 2 0 104 0 2 2 0 00-4 0zM36 28a2 2 0 104 0 2 2 0 00-4 0z" fill="#C41E3A" />
    <path d="M28 36a4 4 0 108 0 4 4 0 00-8 0z" fill="#C41E3A" />
    <path d="M14 8c6-2 10 2 10 8-4 4-8 4-10 0 0-4 0-6 0-8zM50 8c-6-2-10 2-10 8 4 4 8 4 10 0 0-4 0-6 0-8z" fill="#1E1E1E" />
    <path d="M14 8c8-4 28-4 36 0 4 2 6 6 6 12s-2 10-6 14c4 2 6 6 6 10-2 8-8 12-16 12h-16c-8 0-14-4-16-12 0-4 2-8 6-10-4-4-6-8-6-14s2-10 6-12z" fill="#1E1E1E" />
    <path d="M24 20a2 2 0 100 4 2 2 0 000-4zM38 20a2 2 0 100 4 2 2 0 000-4z" fill="#FFFFFF" />
  </svg>
);

export const FlameKnightIcon: FC<AvatarIconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="28" fill="#FFD8BE" />
    <path d="M24 28a2 2 0 104 0 2 2 0 00-4 0zM36 28a2 2 0 104 0 2 2 0 00-4 0z" fill="#1E1E1E" />
    <path d="M26 38a6 3 0 1012 0" stroke="#1E1E1E" strokeWidth="2" />
    <path d="M12 14c0-4 8-10 20-10s20 6 20 10c0 6-4 10-8 12 6 4 8 8 8 16 0 8-8 14-20 14s-20-6-20-14c0-8 2-12 8-16-4-2-8-6-8-12z" fill="#A32020" />
    <path d="M16 18c2-4 6-6 16-6s14 2 16 6c0 6-4 10-8 12 4 2 6 4 6 10-2 6-6 8-14 8s-12-2-14-8c0-6 2-8 6-10-4-2-8-6-8-12z" fill="#FF6240" />
    <path d="M22 22c2-2 6-3 10-3s8 1 10 3c0 4-2 6-4 8 2 1 4 2 4 6-2 4-4 5-10 5s-8-1-10-5c0-4 2-5 4-6-2-2-4-4-4-8z" fill="#FFF323" />
  </svg>
);

export const RangerIcon: FC<AvatarIconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="28" fill="#FFD8BE" />
    <path d="M22 28a3 3 0 106 0 3 3 0 00-6 0zM36 28a3 3 0 106 0 3 3 0 00-6 0z" fill="#1E1E1E" />
    <path d="M26 40c0-2 3-4 6-4s6 2 6 4" stroke="#1E1E1E" strokeWidth="2" />
    <path d="M16 10c0-4 7-6 16-6s16 2 16 6c0 8-2 12-6 16-2 2-4 4-4 8 0 2 0 4-6 4s-6-2-6-4c0-4-2-6-4-8-4-4-6-8-6-16z" fill="#228B22" />
    <path d="M26 18a2 2 0 100 4 2 2 0 000-4zM38 18a2 2 0 100 4 2 2 0 000-4z" fill="#FFFFFF" />
    <path d="M22 10l4 4M42 10l-4 4" stroke="#228B22" strokeWidth="2" />
  </svg>
);

export const AvatarIconMap = {
  elwyn: ElwynIcon,
  thorgrim: ThorgrimIcon,
  merlin: MerlinIcon,
  lilith: LilithIcon,
  flameKnight: FlameKnightIcon,
  ranger: RangerIcon
};

interface CharacterAvatarProps {
  name: string;
  size?: number;
  className?: string;
}

export const CharacterAvatar: FC<CharacterAvatarProps> = ({ name, size = 32, className }) => {
  const lowerName = name.toLowerCase();
  const AvatarComponent = AvatarIconMap[lowerName as keyof typeof AvatarIconMap] || AvatarIconMap.thorgrim;
  
  return (
    <div 
      className={`bg-dark-wood rounded-full overflow-hidden flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <AvatarComponent className="w-full h-full" />
    </div>
  );
};
