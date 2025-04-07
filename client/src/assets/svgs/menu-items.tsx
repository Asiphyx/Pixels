import { FC } from 'react';

interface MenuIconProps {
  className?: string;
}

// Menu Icons for Drinks
export const DragonAleIcon: FC<MenuIconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 10h28v45a5 5 0 01-5 5H23a5 5 0 01-5-5V10z" fill="#B85A0D"/>
    <path d="M18 10h28v8H18v-8z" fill="#F8B878"/>
    <path d="M20 18h24v37a5 5 0 01-5 5H25a5 5 0 01-5-5V18z" fill="#F8B878"/>
    <path d="M20 18h24v10H20V18z" fill="#FFFFFF" fillOpacity="0.3"/>
    <path d="M22 4h4v6h-4zM38 4h4v6h-4z" fill="#B85A0D"/>
    <path d="M26 2h12v8H26z" fill="#B85A0D"/>
    <path d="M28 14a2 2 0 100 4 2 2 0 000-4zM36 14a2 2 0 100 4 2 2 0 000-4z" fill="#B85A0D"/>
    <path d="M30 30a2 2 0 100 4 2 2 0 000-4zM34 40a2 2 0 100 4 2 2 0 000-4z" fill="#B85A0D"/>
  </svg>
);

export const ElvenMoonshineIcon: FC<MenuIconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 16h24v32a8 8 0 01-8 8h-8a8 8 0 01-8-8V16z" fill="#8FE3CF"/>
    <path d="M20 16h24v6H20v-6z" fill="#FFFFFF" fillOpacity="0.5"/>
    <path d="M22 8h20v8H22z" fill="#30A2FF"/>
    <path d="M26 4h12v4H26z" fill="#30A2FF"/>
    <path d="M24 54h16v2a4 4 0 01-4 4h-8a4 4 0 01-4-4v-2z" fill="#30A2FF"/>
    <path d="M28 22a2 2 0 100 4 2 2 0 000-4zM36 30a2 2 0 100 4 2 2 0 000-4zM30 38a2 2 0 100 4 2 2 0 000-4z" fill="#FFFFFF" fillOpacity="0.6"/>
  </svg>
);

export const DwarvenMeadIcon: FC<MenuIconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 10h32v6L42 18H22l-6-2v-6z" fill="#8B4513"/>
    <path d="M22 18h20v32a6 6 0 01-6 6H28a6 6 0 01-6-6V18z" fill="#FEC868"/>
    <path d="M22 18h20v8H22v-8z" fill="#FFFFFF" fillOpacity="0.2"/>
    <path d="M28 18v-6M36 18v-6" stroke="#8B4513" strokeWidth="2"/>
    <path d="M24 8h16v4H24z" fill="#8B4513"/>
    <path d="M30 24a2 2 0 100 4 2 2 0 000-4zM34 32a2 2 0 100 4 2 2 0 000-4zM30 40a2 2 0 100 4 2 2 0 000-4z" fill="#FFFFFF" fillOpacity="0.3"/>
    <path d="M22 54h20v2a4 4 0 01-4 4H26a4 4 0 01-4-4v-2z" fill="#8B4513"/>
  </svg>
);

export const WizardBrewIcon: FC<MenuIconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 16h24v24a12 12 0 01-12 12 12 12 0 01-12-12V16z" fill="#4361EE"/>
    <path d="M20 16h24v6H20v-6z" fill="#FFFFFF" fillOpacity="0.3"/>
    <path d="M24 8h16v8H24z" fill="#3A0CA3"/>
    <path d="M28 4h8v4h-8z" fill="#3A0CA3"/>
    <path d="M26 22a2 2 0 100 4 2 2 0 000-4zM32 28a2 2 0 100 4 2 2 0 000-4zM38 34a2 2 0 100 4 2 2 0 000-4zM28 36a2 2 0 100 4 2 2 0 000-4z" fill="#7DF9FF"/>
    <path d="M32 16v-4M24 48a8 8 0 0016 0" stroke="#3A0CA3" strokeWidth="2"/>
  </svg>
);

// Menu Icons for Food
export const HeartyStewIcon: FC<MenuIconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 24h40v8a16 16 0 01-16 16H28a16 16 0 01-16-16v-8z" fill="#8B4513"/>
    <path d="M16 18h32v6H16z" fill="#A0522D"/>
    <path d="M12 24h40v4H12z" fill="#6B3100"/>
    <path d="M22 28a4 4 0 100 8 4 4 0 000-8z" fill="#D2691E"/>
    <path d="M30 32a3 3 0 100 6 3 3 0 000-6z" fill="#FF6347"/>
    <path d="M38 28a4 4 0 100 8 4 4 0 000-8z" fill="#228B22"/>
    <path d="M20 24a2 2 0 100 4 2 2 0 000-4zM28 24a2 2 0 100 4 2 2 0 000-4zM36 24a2 2 0 100 4 2 2 0 000-4zM44 24a2 2 0 100 4 2 2 0 000-4z" fill="#6B3100"/>
  </svg>
);

export const RoastedPheasantIcon: FC<MenuIconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 32c0-8 8-18 24-12 12 4 8 24-4 24-8 0-20-4-20-12z" fill="#CD853F"/>
    <path d="M44 24c-4-4-14-8-20-4 0 0 6 2 8 6 2 4 0 8-4 10 8 4 20-8 16-12z" fill="#A0522D"/>
    <path d="M20 32a2 2 0 100 4 2 2 0 000-4zM26 28a2 2 0 100 4 2 2 0 000-4zM30 36a2 2 0 100 4 2 2 0 000-4z" fill="#FFE4B5"/>
    <path d="M12 34c-2-2 0-6 4-4 4 2 4 8 0 8-2 0-2-2-4-4z" fill="#A0522D"/>
    <path d="M44 20a4 4 0 100 8 4 4 0 000-8z" fill="#B22222"/>
    <path d="M48 14a2 2 0 100 4 2 2 0 000-4z" fill="#B22222"/>
  </svg>
);

export const ElvenBreadIcon: FC<MenuIconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 28a18 10 0 1136 0 18 10 0 01-36 0z" fill="#DEB887"/>
    <path d="M18 28a14 6 0 1128 0 14 6 0 01-28 0z" fill="#F5DEB3"/>
    <path d="M20 22h4v12h-4zM32 22h4v12h-4zM26 24h4v8h-4zM38 24h4v8h-4z" fill="#DEB887"/>
    <path d="M24 32a2 2 0 100 4 2 2 0 000-4zM36 32a2 2 0 100 4 2 2 0 000-4z" fill="#F5DEB3"/>
  </svg>
);

export const ChesePlatterIcon: FC<MenuIconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 40h48v4H8z" fill="#8B4513"/>
    <path d="M12 24h12v16H12z" fill="#F4C430"/>
    <path d="M28 18h12v22H28z" fill="#FADA5E"/>
    <path d="M44 26h8v14h-8z" fill="#B87333"/>
    <path d="M16 24a2 2 0 100 4 2 2 0 000-4zM20 32a2 2 0 100 4 2 2 0 000-4zM34 22a2 2 0 100 4 2 2 0 000-4zM32 30a2 2 0 100 4 2 2 0 000-4zM36 34a2 2 0 100 4 2 2 0 000-4zM48 28a2 2 0 100 4 2 2 0 000-4z" fill="#FFFFFF" fillOpacity="0.3"/>
  </svg>
);

// Menu Icons for Specials
export const HerosFeastIcon: FC<MenuIconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 16h40v8H12z" fill="#8B4513"/>
    <path d="M16 24h32v20H16z" fill="#CD853F"/>
    <path d="M20 28h8v8h-8z" fill="#FFD700"/>
    <path d="M32 28h8v8h-8z" fill="#FF6347"/>
    <path d="M20 40h24v4H20z" fill="#A0522D"/>
    <path d="M8 44h48v4H8z" fill="#8B4513"/>
    <path d="M24 16v-4h16v4" stroke="#8B4513" strokeWidth="2"/>
    <path d="M18 32a2 2 0 100 4 2 2 0 000-4zM30 36a2 2 0 100 4 2 2 0 000-4zM42 32a2 2 0 100 4 2 2 0 000-4z" fill="#228B22"/>
    <path d="M24 20a2 2 0 100 4 2 2 0 000-4zM32 20a2 2 0 100 4 2 2 0 000-4zM40 20a2 2 0 100 4 2 2 0 000-4z" fill="#FFD700"/>
  </svg>
);

export const FairyWineIcon: FC<MenuIconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 14h16l4 38a4 4 0 01-4 4H24a4 4 0 01-4-4l4-38z" fill="#FF00FF" fillOpacity="0.3"/>
    <path d="M24 14h16v8H24z" fill="#FFFFFF" fillOpacity="0.4"/>
    <path d="M28 8h8v6h-8z" fill="#FFD700"/>
    <path d="M26 4h12v4H26z" fill="#FFD700"/>
    <path d="M20 52c4 4 20 4 24 0" stroke="#FFD700" strokeWidth="1"/>
    <path d="M26 22a2 2 0 100 4 2 2 0 000-4zM38 22a2 2 0 100 4 2 2 0 000-4zM30 28a2 2 0 100 4 2 2 0 000-4zM34 32a2 2 0 100 4 2 2 0 000-4zM28 38a2 2 0 100 4 2 2 0 000-4zM36 44a2 2 0 100 4 2 2 0 000-4z" fill="#FFD700"/>
  </svg>
);

export const GoblinSurpriseIcon: FC<MenuIconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 20h32v24a8 8 0 01-8 8H24a8 8 0 01-8-8V20z" fill="#556B2F"/>
    <path d="M16 20h32v6H16z" fill="#6B8E23"/>
    <path d="M20 16a12 4 0 1124 0v4H20v-4z" fill="#6B8E23"/>
    <path d="M22 22h4v4h-4zM30 26h4v4h-4zM38 22h4v4h-4zM26 34h4v4h-4zM34 34h4v4h-4z" fill="#FF6347"/>
    <path d="M18 24a2 2 0 100 4 2 2 0 000-4zM46 24a2 2 0 100 4 2 2 0 000-4zM32 44a2 2 0 100 4 2 2 0 000-4z" fill="#FFA500"/>
    <path d="M24 42a6 6 0 1012 0" stroke="#FFA500" strokeWidth="2"/>
  </svg>
);

export const MidnightWhiskeyIcon: FC<MenuIconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 18h24v28a8 8 0 01-8 8H28a8 8 0 01-8-8V18z" fill="#1A1110"/>
    <path d="M24 10h16v8H24z" fill="#2F2929"/>
    <path d="M28 6h8v4h-8z" fill="#2F2929"/>
    <path d="M20 18h24v4H20z" fill="#413839"/>
    <path d="M24 22a2 2 0 100 4 2 2 0 000-4zM34 26a2 2 0 100 4 2 2 0 000-4zM28 32a2 2 0 100 4 2 2 0 000-4zM38 38a2 2 0 100 4 2 2 0 000-4z" fill="#413839"/>
    <path d="M22 46h20v2a4 4 0 01-4 4H26a4 4 0 01-4-4v-2z" fill="#2F2929"/>
  </svg>
);

export const MenuItemIconMap: Record<string, FC<MenuIconProps>> = {
  dragonAle: DragonAleIcon,
  elvenMoonshine: ElvenMoonshineIcon,
  dwarvenMead: DwarvenMeadIcon,
  wizardBrew: WizardBrewIcon,
  heartyStew: HeartyStewIcon,
  roastedPheasant: RoastedPheasantIcon,
  elvenBread: ElvenBreadIcon,
  cheesePlatter: ChesePlatterIcon,
  herosFeast: HerosFeastIcon,
  fairyWine: FairyWineIcon,
  goblinSurprise: GoblinSurpriseIcon,
  midnightWhiskey: MidnightWhiskeyIcon
};

interface MenuItemIconProps {
  icon: string;
  className?: string;
}

export const MenuItemIcon: FC<MenuItemIconProps> = ({ icon, className }) => {
  const IconComponent = MenuItemIconMap[icon] || MenuItemIconMap.dragonAle;
  
  return <IconComponent className={className} />;
};
