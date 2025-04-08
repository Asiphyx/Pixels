import { useEffect, useRef, useState } from 'react';
import { useWebSocketStore } from '@/lib/websocket';
import { ActionSoundType } from '@/hooks/use-tavern-audio';

// Define sound types and their properties
interface SoundEffect {
  id: string;
  volume: number;
  loop: boolean;
  playbackRate?: number;
}

// Room-specific ambient sounds
const roomSounds: Record<number, SoundEffect[]> = {
  // Room 1: The Rose Garden (Amethyst) - magical, mystical ambience
  1: [
    { 
      id: 'rose-garden-ambience', 
      volume: 0.3, 
      loop: true 
    },
    { 
      id: 'magical-chimes', 
      volume: 0.1, 
      loop: true,
      playbackRate: 0.8
    }
  ],
  
  // Room 2: The Ocean View (Sapphire) - ocean and water sounds
  2: [
    { 
      id: 'ocean-waves', 
      volume: 0.3, 
      loop: true 
    },
    { 
      id: 'distant-seagulls', 
      volume: 0.1, 
      loop: true 
    }
  ],
  
  // Room 3: The Dragon's Den (Ruby) - murmurs and tavern sounds
  3: [
    { 
      id: 'tavern-murmurs', 
      volume: 0.3, 
      loop: true 
    },
    { 
      id: 'crackling-fire', 
      volume: 0.2, 
      loop: true 
    }
  ]
};

// Common tavern sounds that play in all rooms
const commonSounds: SoundEffect[] = [
  { 
    id: 'tavern-background', 
    volume: 0.15, 
    loop: true 
  }
];

// Action sounds
const actionSounds: Record<string, SoundEffect> = {
  'drink-pour': { 
    id: 'drinkPour', 
    volume: 0.5, 
    loop: false 
  },
  'door-open': { 
    id: 'doorOpen', 
    volume: 0.4, 
    loop: false 
  },
  'drink-serve': { 
    id: 'glassClink', 
    volume: 0.4, 
    loop: false 
  },
  'coin-drop': {
    id: 'coinDrop',
    volume: 0.4,
    loop: false
  },
  'chair-move': {
    id: 'chairMove',
    volume: 0.3,
    loop: false
  },
  'glass-clink': {
    id: 'glassClink',
    volume: 0.4,
    loop: false
  }
};

// Map our sound IDs to the sound generator's output keys
const soundIdMapping: Record<string, string> = {
  'rose-garden-ambience': 'tavernAmbience', 
  'magical-chimes': 'glassClink',
  'ocean-waves': 'tavernAmbience',
  'distant-seagulls': 'tavernAmbience',
  'tavern-murmurs': 'tavernAmbience',
  'crackling-fire': 'tavernAmbience',
  'tavern-background': 'tavernAmbience',
  'drink-pour': 'drinkPour',
  'door-open': 'doorOpen',
  'drink-serve': 'glassClink',
  'coin-drop': 'coinDrop',
  'chair-move': 'chairMove',
  'glass-clink': 'glassClink'
};

const TavernAudio: React.FC = () => {
  const { roomId } = useWebSocketStore();
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});
  const [soundsLoaded, setSoundsLoaded] = useState(false);
  const [generatedSounds, setGeneratedSounds] = useState<Record<string, string>>({});
  
  // Load the sound generator script
  useEffect(() => {
    // Create a script element for sound generator
    const scriptEl = document.createElement('script');
    scriptEl.src = '/sounds/sound-generator.js';
    scriptEl.async = true;
    
    // Append the script to the document head
    document.head.appendChild(scriptEl);
    
    // Clean up
    return () => {
      document.head.removeChild(scriptEl);
    };
  }, []);
  
  // Generate sounds when the script is loaded
  useEffect(() => {
    const generateSounds = async () => {
      // Wait for the generateSounds function to be available
      let attempts = 0;
      while (!window.generateSounds && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
      }
      
      if (!window.generateSounds) {
        console.error('Sound generator not loaded after multiple attempts');
        return;
      }
      
      try {
        console.log('Generating sounds...');
        const sounds = await window.generateSounds();
        console.log('Generated sounds:', sounds);
        
        if (sounds) {
          setGeneratedSounds(sounds);
        } else {
          console.error('Failed to generate sounds');
        }
      } catch (error) {
        console.error('Error generating sounds:', error);
      }
    };
    
    generateSounds();
  }, []);
  
  // Create audio elements when sounds are generated
  useEffect(() => {
    if (Object.keys(generatedSounds).length === 0) return;
    
    console.log('Creating audio elements from generated sounds');
    
    // Create audio elements for all sounds
    const allSounds = [
      ...commonSounds,
      ...Object.values(actionSounds),
      ...Object.values(roomSounds).flat()
    ];
    
    // Process each sound
    allSounds.forEach(sound => {
      if (!audioRefs.current[sound.id]) {
        try {
          // Get the URL mapping for this sound
          const soundKey = soundIdMapping[sound.id] || sound.id;
          const url = generatedSounds[soundKey];
          
          if (url) {
            console.log(`Creating audio for ${sound.id} using ${soundKey}`);
            const audio = new Audio(url);
            audio.volume = sound.volume * volume;
            audio.loop = sound.loop;
            if (sound.playbackRate) {
              audio.playbackRate = sound.playbackRate;
            }
            
            // Store the audio element
            audioRefs.current[sound.id] = audio;
          } else {
            console.warn(`No generated sound found for: ${sound.id}`);
          }
        } catch (error) {
          console.error(`Error setting up sound ${sound.id}:`, error);
        }
      }
    });
    
    console.log("All sounds loaded");
    setSoundsLoaded(true);
    
    return () => {
      // Cleanup
      Object.values(audioRefs.current).forEach(audio => {
        if (audio) {
          audio.pause();
        }
      });
      audioRefs.current = {};
    };
  }, [generatedSounds, volume]);
  
  // Handle room changes
  useEffect(() => {
    if (isMuted || !soundsLoaded) return;
    
    const playRoomSounds = async () => {
      // Stop all room-specific ambient sounds
      Object.values(roomSounds).flat().forEach(sound => {
        const audio = audioRefs.current[sound.id];
        if (audio) {
          audio.pause();
          try {
            audio.currentTime = 0;
          } catch (e) {
            console.warn(`Could not reset time for ${sound.id}:`, e);
          }
        }
      });
      
      // Play the door opening sound when changing rooms
      try {
        console.log("Playing door open sound");
        playSound('door-open');
      } catch (e) {
        console.warn("Error with door sound:", e);
      }
      
      // Short delay to let the door sound play first
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Play ambient sounds for the current room
      if (roomSounds[roomId]) {
        roomSounds[roomId].forEach(sound => {
          const audio = audioRefs.current[sound.id];
          if (audio) {
            try {
              console.log(`Playing room sound: ${sound.id}`);
              audio.currentTime = 0;
              audio.play().catch(e => console.error(`Error playing ${sound.id}:`, e));
            } catch (e) {
              console.warn(`Error with room sound ${sound.id}:`, e);
            }
          }
        });
      }
      
      // Make sure common sounds are playing
      commonSounds.forEach(sound => {
        const audio = audioRefs.current[sound.id];
        if (audio && audio.paused) {
          try {
            console.log(`Playing common sound: ${sound.id}`);
            audio.currentTime = 0;
            audio.play().catch(e => console.error(`Error playing ${sound.id}:`, e));
          } catch (e) {
            console.warn(`Error with common sound ${sound.id}:`, e);
          }
        }
      });
    };
    
    playRoomSounds();
  }, [roomId, isMuted, soundsLoaded]);
  
  // Volume control
  useEffect(() => {
    Object.values(audioRefs.current).forEach(audio => {
      if (audio) {
        const soundId = Object.keys(audioRefs.current).find(
          key => audioRefs.current[key] === audio
        );
        
        if (soundId) {
          // Find the original sound definition to get the base volume
          const allSounds = [
            ...commonSounds,
            ...Object.values(actionSounds),
            ...Object.values(roomSounds).flat()
          ];
          
          const soundDef = allSounds.find(s => s.id === soundId);
          if (soundDef) {
            audio.volume = isMuted ? 0 : soundDef.volume * volume;
          } else {
            audio.volume = isMuted ? 0 : 0.3 * volume; // Default volume
          }
        }
      }
    });
  }, [volume, isMuted]);
  
  // Listen for audio events from the hook
  useEffect(() => {
    const handlePlayEvent = (event: CustomEvent) => {
      const { soundId } = event.detail;
      playSound(soundId as ActionSoundType);
    };
    
    const handleMuteEvent = (event: CustomEvent) => {
      const { isMuted: newMuted } = event.detail;
      setIsMuted(newMuted);
    };
    
    const handleVolumeEvent = (event: CustomEvent) => {
      const { volume: newVolume } = event.detail;
      setVolume(newVolume);
    };
    
    // Add event listeners
    window.addEventListener('tavern-audio-play', handlePlayEvent as EventListener);
    window.addEventListener('tavern-audio-mute', handleMuteEvent as EventListener);
    window.addEventListener('tavern-audio-volume', handleVolumeEvent as EventListener);
    
    return () => {
      // Remove event listeners
      window.removeEventListener('tavern-audio-play', handlePlayEvent as EventListener);
      window.removeEventListener('tavern-audio-mute', handleMuteEvent as EventListener);
      window.removeEventListener('tavern-audio-volume', handleVolumeEvent as EventListener);
    };
  }, []);
  
  // Play action sound
  const playSound = (soundId: ActionSoundType) => {
    if (isMuted || !soundsLoaded) return;
    
    console.log(`Trying to play sound: ${soundId}`);
    
    const sound = actionSounds[soundId];
    if (sound && audioRefs.current[sound.id]) {
      const audio = audioRefs.current[sound.id];
      if (audio) {
        try {
          // Create a clone of the audio to allow overlapping sounds
          const clone = new Audio(audio.src);
          clone.volume = audio.volume;
          clone.play().catch(e => console.error(`Error playing ${sound.id}:`, e));
        } catch (e) {
          console.warn(`Error with action sound ${sound.id}:`, e);
          
          // Try direct playback with the original
          try {
            audio.currentTime = 0;
            audio.play().catch(e2 => console.error(`Original playback failed for ${sound.id}:`, e2));
          } catch (e2) {
            console.warn(`Error with original audio for ${sound.id}:`, e2);
          }
        }
      }
    } else {
      console.warn(`Sound not found or not loaded: ${soundId}`);
      
      // Try to play the raw generated sound if available
      const mappedId = soundIdMapping[soundId];
      if (mappedId && generatedSounds[mappedId]) {
        console.log(`Attempting direct playback of ${soundId} using ${mappedId}`);
        const directAudio = new Audio(generatedSounds[mappedId]);
        directAudio.volume = 0.4 * volume; // Default volume
        directAudio.play().catch(e => console.error(`Direct playback failed for ${soundId}:`, e));
      }
    }
  };
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button 
        onClick={() => setIsMuted(!isMuted)}
        className="bg-background/80 border border-border rounded-full p-2 shadow-md hover:bg-background transition-colors"
        aria-label={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
            <line x1="3" y1="3" x2="21" y2="21"></line>
            <path d="M18.36 18.36a9.9 9.9 0 0 1-5.36 1.64 10 10 0 0 1-10-10 9.9 9.9 0 0 1 1.64-5.36"></path>
            <path d="M16 16a6 6 0 0 1-6-6"></path>
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
            <polygon points="12 2 8 6 3 6 3 18 8 18 12 22 12 2"></polygon>
          </svg>
        )}
      </button>
      
      {!isMuted && (
        <div className="mt-2 bg-background/80 border border-border rounded-lg p-2 shadow-md">
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.01" 
            value={volume} 
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-full"
            aria-label="Volume"
          />
        </div>
      )}
    </div>
  );
};

// Add the generateSounds function to the Window interface
declare global {
  interface Window {
    generateSounds: () => Promise<Record<string, string>>;
  }
}

export default TavernAudio;