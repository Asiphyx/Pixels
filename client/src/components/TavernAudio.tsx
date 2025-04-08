import { useEffect, useRef, useState } from 'react';
import { useWebSocketStore } from '@/lib/websocket';
import { ActionSoundType } from '@/hooks/use-tavern-audio';
import { getCachedSoundUrl, fallbackSoundUrls } from '@/utils/sound-utils';

// Define sound types and their properties
interface SoundEffect {
  id: string;
  src: string;
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
      src: '/sounds/rose-garden-ambience.mp3', 
      volume: 0.3, 
      loop: true 
    },
    { 
      id: 'magical-chimes', 
      src: '/sounds/magical-chimes.mp3', 
      volume: 0.1, 
      loop: true,
      playbackRate: 0.8
    }
  ],
  
  // Room 2: The Ocean View (Sapphire) - ocean and water sounds
  2: [
    { 
      id: 'ocean-waves', 
      src: '/sounds/ocean-waves.mp3', 
      volume: 0.3, 
      loop: true 
    },
    { 
      id: 'distant-seagulls', 
      src: '/sounds/seagulls.mp3', 
      volume: 0.1, 
      loop: true 
    }
  ],
  
  // Room 3: The Dragon's Den (Ruby) - murmurs and tavern sounds
  3: [
    { 
      id: 'tavern-murmurs', 
      src: '/sounds/tavern-murmurs.mp3',
      volume: 0.3, 
      loop: true 
    },
    { 
      id: 'crackling-fire', 
      src: '/sounds/fire-crackling.mp3', 
      volume: 0.2, 
      loop: true 
    }
  ]
};

// Common tavern sounds that play in all rooms
const commonSounds: SoundEffect[] = [
  { 
    id: 'tavern-background', 
    src: '/sounds/tavern-background.mp3', 
    volume: 0.15, 
    loop: true 
  }
];

// Action sounds
const actionSounds: Record<string, SoundEffect> = {
  'drink-pour': { 
    id: 'drink-pour', 
    src: '/sounds/drink-pour.mp3', 
    volume: 0.5, 
    loop: false 
  },
  'door-open': { 
    id: 'door-open', 
    src: '/sounds/door-open.mp3', 
    volume: 0.4, 
    loop: false 
  },
  'drink-serve': { 
    id: 'drink-serve', 
    src: '/sounds/glass-clink.mp3', 
    volume: 0.4, 
    loop: false 
  },
  'coin-drop': {
    id: 'coin-drop',
    src: '/sounds/coin-drop.mp3',
    volume: 0.4,
    loop: false
  },
  'chair-move': {
    id: 'chair-move',
    src: '/sounds/chair-move.mp3',
    volume: 0.3,
    loop: false
  },
  'glass-clink': {
    id: 'glass-clink',
    src: '/sounds/glass-clink.mp3',
    volume: 0.4,
    loop: false
  }
};

const TavernAudio: React.FC = () => {
  const { roomId } = useWebSocketStore();
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});
  const [soundsLoaded, setSoundsLoaded] = useState(false);
  
  // Preload all audio files
  useEffect(() => {
    const loadSounds = async () => {
      // Create audio elements for all sounds
      const allSounds = [
        ...commonSounds,
        ...Object.values(actionSounds),
        ...Object.values(roomSounds).flat()
      ];
      
      // Process each sound and load with fallback if needed
      for (const sound of allSounds) {
        if (!audioRefs.current[sound.id]) {
          try {
            // Skip local file checks and directly use fallbacks
            const sourceUrl = fallbackSoundUrls[sound.id];
            
            if (sourceUrl) {
              console.log(`Loading sound: ${sound.id} from ${sourceUrl}`);
              const audio = new Audio();
              
              // Set up event handlers first
              const loadPromise = new Promise<void>((resolve) => {
                audio.addEventListener('canplaythrough', () => {
                  console.log(`Sound loaded successfully: ${sound.id}`);
                  resolve();
                }, { once: true });
                
                audio.addEventListener('error', (e) => {
                  console.error(`Error loading sound ${sound.id}:`, e);
                  resolve(); // Resolve anyway to not block other sounds
                });
              });
              
              // Then set the source
              audio.src = sourceUrl;
              audio.volume = sound.volume * volume;
              audio.loop = sound.loop;
              if (sound.playbackRate) {
                audio.playbackRate = sound.playbackRate;
              }
              audio.preload = 'auto';
              
              // Store the audio element
              audioRefs.current[sound.id] = audio;
              
              // Wait for this sound to load before continuing
              await loadPromise;
            } else {
              console.warn(`No fallback found for sound: ${sound.id}`);
            }
          } catch (error) {
            console.error(`Error setting up sound ${sound.id}:`, error);
          }
        }
      }
      
      console.log("All sounds loaded");
      setSoundsLoaded(true);
    };
    
    loadSounds();
    
    return () => {
      // Cleanup
      Object.values(audioRefs.current).forEach(audio => {
        if (audio) {
          audio.pause();
          audio.src = '';
        }
      });
      audioRefs.current = {};
    };
  }, [volume]);
  
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
              const playPromise = audio.play();
              if (playPromise) {
                playPromise.catch(e => console.error(`Error playing ${sound.id}:`, e));
              }
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
            const playPromise = audio.play();
            if (playPromise) {
              playPromise.catch(e => console.error(`Error playing ${sound.id}:`, e));
            }
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
          audio.currentTime = 0;
          const playPromise = audio.play();
          if (playPromise) {
            playPromise.catch(e => {
              console.error(`Error playing ${sound.id}:`, e);
              
              // Try to recreate the audio element and play it
              if (fallbackSoundUrls[sound.id]) {
                console.log(`Retrying with new audio element for ${sound.id}`);
                const newAudio = new Audio(fallbackSoundUrls[sound.id]);
                newAudio.volume = sound.volume * volume;
                newAudio.play().catch(e2 => console.error(`Second attempt failed for ${sound.id}:`, e2));
              }
            });
          }
        } catch (e) {
          console.warn(`Error with action sound ${sound.id}:`, e);
        }
      }
    } else {
      console.warn(`Sound not found or not loaded: ${soundId}`);
      
      // Try to play directly from fallback
      if (fallbackSoundUrls[soundId]) {
        console.log(`Attempting direct playback of ${soundId}`);
        const directAudio = new Audio(fallbackSoundUrls[soundId]);
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

export default TavernAudio;