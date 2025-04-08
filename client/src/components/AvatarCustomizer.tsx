import { FC, useState } from 'react';
import { 
  CustomAvatar, 
  AvatarCustomizationOptions, 
  defaultAvatarOptions, 
  serializeAvatarOptions 
} from '@/assets/svgs/avatar-creator';

interface AvatarCustomizerProps {
  onSelect: (avatar: string) => void;
}

const AvatarCustomizer: FC<AvatarCustomizerProps> = ({ onSelect }) => {
  const [options, setOptions] = useState<AvatarCustomizationOptions>(defaultAvatarOptions);
  const [activeTab, setActiveTab] = useState<string>('skin');
  
  const handleChange = (category: keyof AvatarCustomizationOptions, value: string) => {
    setOptions(prev => ({
      ...prev,
      [category]: value
    }));
    
    // Pass the serialized avatar options to the parent component
    const serialized = serializeAvatarOptions({
      ...options,
      [category]: value
    });
    onSelect(serialized);
  };
  
  // Features available for customization
  const features = [
    { id: 'skin', label: 'Skin', options: ['light', 'medium', 'tan', 'brown', 'dark'] },
    { id: 'eyes', label: 'Eyes', options: ['round', 'almond', 'happy', 'angry', 'surprised'] },
    { id: 'hair', label: 'Hair', options: ['none', 'short', 'long', 'spiky', 'hood', 'hat'] },
    { id: 'hairColor', label: 'Hair Color', options: ['brown', 'black', 'blonde', 'red', 'white', 'blue', 'purple', 'green'] },
    { id: 'mouth', label: 'Mouth', options: ['smile', 'neutral', 'frown', 'open', 'smirk'] },
    { id: 'accessory', label: 'Accessory', options: ['none', 'earring', 'scar', 'freckles', 'glasses', 'monocle'] }
  ];
  
  // Get current feature being edited
  const currentFeature = features.find(f => f.id === activeTab);
  
  return (
    <div className="avatar-customizer w-full bg-[#2C1810] rounded-md p-4">
      <div className="preview-section flex justify-center mb-6">
        <CustomAvatar options={options} size={120} />
      </div>
      
      <div className="tabs flex w-full border-b border-[#8B4513] mb-4 overflow-x-auto">
        {features.map(feature => (
          <button
            key={feature.id}
            className={`px-3 py-2 text-sm font-['VT323'] text-[#E8D6B3] ${
              activeTab === feature.id 
              ? 'border-b-2 border-[#FFD700] text-[#FFD700]' 
              : 'hover:text-[#FFD700]'
            }`}
            onClick={() => setActiveTab(feature.id)}
          >
            {feature.label}
          </button>
        ))}
      </div>
      
      {currentFeature && (
        <div className="options-section">
          <div className="options-grid grid grid-cols-3 gap-2">
            {currentFeature.options.map(value => (
              <button
                key={value}
                className={`p-2 border rounded-sm ${
                  options[activeTab as keyof AvatarCustomizationOptions] === value
                  ? 'border-[#FFD700] bg-[#8B4513]'
                  : 'border-[#8B4513] hover:bg-[#3C2920]'
                } text-[#E8D6B3] font-['VT323'] text-sm capitalize`}
                onClick={() => handleChange(activeTab as keyof AvatarCustomizationOptions, value)}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AvatarCustomizer;