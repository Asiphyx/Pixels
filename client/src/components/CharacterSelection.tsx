import { FC, useState } from 'react';
import { useWebSocketStore } from '@/lib/websocket';
import { CharacterAvatar, AvatarIconMap } from '@/assets/svgs/avatars';

const CharacterSelection: FC = () => {
  const { connect, user } = useWebSocketStore();
  const [selectedAvatar, setSelectedAvatar] = useState<string>('thorgrim');
  const [username, setUsername] = useState<string>('');
  
  const handleConfirm = () => {
    if (username.trim()) {
      // Connect to WebSocket with selected character
      connect(username, selectedAvatar);
    }
  };
  
  const characterOptions = [
    { name: 'Elwyn', avatar: 'elwyn' },
    { name: 'Thorgrim', avatar: 'thorgrim' },
    { name: 'Merlin', avatar: 'merlin' },
    { name: 'Lilith', avatar: 'lilith' },
    { name: 'Flame Knight', avatar: 'flameKnight' },
    { name: 'Ranger', avatar: 'ranger' }
  ];
  
  // Only show character selection if user is not connected
  // This prevents the patron screen from staying visible after connection
  return (
    <div 
      id="character-select"
      className={`${user ? 'hidden' : 'flex'} fixed inset-0 items-center justify-center z-50 bg-black bg-opacity-50`}
    >
      <div className="character-modal w-5/6 max-w-md z-10 bg-[#4A3429] rounded-sm overflow-hidden
                      shadow-[0_-4px_0_0px_#2C1810,0_4px_0_0px_#2C1810,-4px_0_0_0px_#2C1810,4px_0_0_0px_#2C1810,0_0_0_4px_#8B4513]">
        <div className="modal-header bg-[#8B4513] p-3">
          <h2 className="font-['Press_Start_2P'] text-[#FFD700] text-center text-lg">CHOOSE YOUR AVATAR</h2>
        </div>
        
        <div className="character-options p-6 grid grid-cols-2 md:grid-cols-3 gap-4">
          {characterOptions.map((character) => (
            <div 
              key={character.avatar}
              className="character-option flex flex-col items-center cursor-pointer hover:scale-105 transition-transform"
              onClick={() => setSelectedAvatar(character.avatar)}
            >
              <div 
                className={`avatar-preview w-20 h-20 rounded-full overflow-hidden bg-[#2C1810] mb-2 border-2 ${
                  selectedAvatar === character.avatar 
                    ? 'border-[#FFD700]' 
                    : 'border-[#8B4513]'
                }`}
              >
                <CharacterAvatar name={character.avatar} size={80} />
              </div>
              <span className="character-name text-[#E8D6B3] text-sm font-['VT323']">{character.name}</span>
            </div>
          ))}
        </div>
        
        <div className="custom-name p-4 border-t border-[#8B4513]">
          <label className="block mb-2 text-sm text-[#FFD700] font-['VT323']">YOUR NAME:</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-[#2C1810] text-[#E8D6B3] border border-[#8B4513] p-2 flex-grow font-['VT323']" 
              placeholder="Enter name..."
            />
            <button 
              className="bg-[#8B4513] text-[#E8D6B3] px-4 py-2 font-['Press_Start_2P'] text-xs hover:bg-[#9B5523] active:bg-[#7B3503] active:translate-y-[2px]"
              onClick={handleConfirm}
            >
              ENTER
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterSelection;
