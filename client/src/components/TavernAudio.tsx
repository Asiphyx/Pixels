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
    id: 'drink-pour', 
    volume: 0.5, 
    loop: false 
  },
  'door-open': { 
    id: 'door-open', 
    volume: 0.4, 
    loop: false 
  },
  'drink-serve': { 
    id: 'drink-serve', 
    volume: 0.4, 
    loop: false 
  },
  'coin-drop': {
    id: 'coin-drop',
    volume: 0.4,
    loop: false
  },
  'chair-move': {
    id: 'chair-move',
    volume: 0.3,
    loop: false
  },
  'glass-clink': {
    id: 'glass-clink',
    volume: 0.4,
    loop: false
  }
};

// Sound generation utilities
const generateAudioBuffer = (ctx: AudioContext, createFn: (ctx: AudioContext) => AudioBuffer): AudioBuffer => {
  return createFn(ctx);
};

// Sound generator functions
const SoundEffects = {
  // Generate a door sound
  doorOpen: (audioContext: AudioContext): AudioBuffer => {
    const duration = 1.5;
    const buffer = audioContext.createBuffer(
      2, 
      audioContext.sampleRate * duration, 
      audioContext.sampleRate
    );
    
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const data = buffer.getChannelData(channel);
      
      for (let i = 0; i < buffer.length; i++) {
        const t = i / audioContext.sampleRate;
        const phase = t / duration;
        
        // Creaking sound
        const creak1 = Math.sin(t * 50 + 5 * Math.sin(t * 2)) * 0.1 * (phase < 0.6 ? 1 - phase : 0);
        
        data[i] = creak1;
      }
    }
    
    return buffer;
  },
  
  // Generate a coin drop sound
  coinDrop: (audioContext: AudioContext): AudioBuffer => {
    const duration = 0.8;
    const buffer = audioContext.createBuffer(
      2,
      audioContext.sampleRate * duration,
      audioContext.sampleRate
    );
    
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const data = buffer.getChannelData(channel);
      
      for (let i = 0; i < buffer.length; i++) {
        const t = i / audioContext.sampleRate;
        const phase = t / duration;
        
        // High-pitched clink followed by "bounces"
        const clink = Math.sin(6000 * t) * Math.pow(Math.E, -10 * phase) * 0.2;
        const bounce1 = phase > 0.3 ? Math.sin(4000 * t) * Math.pow(Math.E, -20 * (phase - 0.3)) * 0.1 : 0;
        const bounce2 = phase > 0.5 ? Math.sin(3500 * t) * Math.pow(Math.E, -20 * (phase - 0.5)) * 0.05 : 0;
        const bounce3 = phase > 0.65 ? Math.sin(3000 * t) * Math.pow(Math.E, -20 * (phase - 0.65)) * 0.02 : 0;
        
        data[i] = clink + bounce1 + bounce2 + bounce3;
      }
    }
    
    return buffer;
  },
  
  // Generate a glass clink sound
  glassClink: (audioContext: AudioContext): AudioBuffer => {
    const duration = 1.0;
    const buffer = audioContext.createBuffer(
      2,
      audioContext.sampleRate * duration,
      audioContext.sampleRate
    );
    
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const data = buffer.getChannelData(channel);
      
      for (let i = 0; i < buffer.length; i++) {
        const t = i / audioContext.sampleRate;
        const phase = t / duration;
        
        // Glass resonance
        const clink = Math.sin(2400 * t) * Math.pow(Math.E, -8 * phase) * 0.2;
        const ring = Math.sin(3600 * t) * Math.pow(Math.E, -6 * phase) * 0.1;
        
        data[i] = clink + ring;
      }
    }
    
    return buffer;
  },
  
  // Generate a drink pour sound
  drinkPour: (audioContext: AudioContext): AudioBuffer => {
    const duration = 2.0;
    const buffer = audioContext.createBuffer(
      2,
      audioContext.sampleRate * duration,
      audioContext.sampleRate
    );
    
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const data = buffer.getChannelData(channel);
      
      for (let i = 0; i < buffer.length; i++) {
        const t = i / audioContext.sampleRate;
        const phase = t / duration;
        
        // Pouring liquid sound
        const noise = Math.random() * 0.1 * (1 - phase * 0.7);
        const bubbles = Math.random() < 0.02 ? Math.random() * 0.2 : 0;
        
        data[i] = noise + bubbles;
      }
    }
    
    return buffer;
  },
  
  // Generate a chair moving sound
  chairMove: (audioContext: AudioContext): AudioBuffer => {
    const duration = 0.8;
    const buffer = audioContext.createBuffer(
      2,
      audioContext.sampleRate * duration,
      audioContext.sampleRate
    );
    
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const data = buffer.getChannelData(channel);
      
      for (let i = 0; i < buffer.length; i++) {
        const t = i / audioContext.sampleRate;
        const phase = t / duration;
        
        // Chair drag sound
        let noise = Math.random() * 0.03;
        // Add some lower frequency rumble
        const rumble = Math.sin(100 * t + Math.sin(60 * t) * 2) * 0.05 * (phase < 0.7 ? 1 : 7 * (1 - phase));
        
        data[i] = noise * (phase < 0.7 ? 1 : 7 * (1 - phase)) + rumble;
      }
    }
    
    return buffer;
  },
  
  // Generate a tavern ambient sound
  tavernAmbience: (audioContext: AudioContext): AudioBuffer => {
    const duration = 10.0;
    const buffer = audioContext.createBuffer(
      2,
      audioContext.sampleRate * duration,
      audioContext.sampleRate
    );
    
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const data = buffer.getChannelData(channel);
      
      for (let i = 0; i < buffer.length; i++) {
        const t = i / audioContext.sampleRate;
        
        // Background murmur
        const murmur = Math.random() * 0.01;
        // Add occasional clinks at random intervals
        const glassRandom = Math.random();
        const glassClink = glassRandom < 0.0005 ? Math.sin(2000 * t % 1) * 0.03 * Math.min(1, 10 * (1 - (t % 0.3))) : 0;
        // Low-frequency rumble for "room tone"
        const rumble = Math.sin(30 * t) * 0.003;
        
        data[i] = murmur + glassClink + rumble;
      }
    }
    
    return buffer;
  }
};

const TavernAudio: React.FC = () => {
  const { roomId } = useWebSocketStore();
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const soundBuffers = useRef<Record<string, AudioBuffer>>({});
  const [soundsLoaded, setSoundsLoaded] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  
  // Initialize audio context and load sounds - but don't auto-start
  useEffect(() => {
    const initAudio = async () => {
      try {
        // Create audio context - but don't autostart it
        // This addresses browser autoplay policies
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) {
          console.error('Web Audio API is not supported by this browser');
          return;
        }
        
        // Create audio context in suspended state (will be resumed on user interaction)
        audioCtxRef.current = new AudioContext();
        
        // Generate sound buffers
        console.log('Generating sound buffers...');
        
        // Map of sound IDs to generator functions
        const soundGenerators: Record<string, (ctx: AudioContext) => AudioBuffer> = {
          'door-open': SoundEffects.doorOpen,
          'coin-drop': SoundEffects.coinDrop,
          'glass-clink': SoundEffects.glassClink,
          'drink-pour': SoundEffects.drinkPour,
          'chair-move': SoundEffects.chairMove,
          'tavern-background': SoundEffects.tavernAmbience
        };
        
        // Generate each sound buffer
        for (const [id, generator] of Object.entries(soundGenerators)) {
          try {
            soundBuffers.current[id] = generateAudioBuffer(audioCtxRef.current, generator);
            console.log(`Generated sound: ${id}`);
          } catch (error) {
            console.error(`Error generating sound ${id}:`, error);
          }
        }
        
        // Use tavern ambience for other ambient sounds as well
        soundBuffers.current['rose-garden-ambience'] = soundBuffers.current['tavern-background'];
        soundBuffers.current['magical-chimes'] = soundBuffers.current['glass-clink'];
        soundBuffers.current['ocean-waves'] = soundBuffers.current['tavern-background'];
        soundBuffers.current['distant-seagulls'] = soundBuffers.current['tavern-background'];
        soundBuffers.current['tavern-murmurs'] = soundBuffers.current['tavern-background'];
        soundBuffers.current['crackling-fire'] = soundBuffers.current['tavern-background'];
        soundBuffers.current['drink-serve'] = soundBuffers.current['glass-clink'];
        
        setSoundsLoaded(true);
        console.log('All sound buffers generated successfully');
      } catch (error) {
        console.error('Error initializing audio:', error);
      }
    };
    
    initAudio();
    
    // Add a one-time click handler to the document to start audio
    const enableAudio = () => {
      if (audioCtxRef.current?.state === 'suspended') {
        console.log('Resuming audio context on user interaction');
        audioCtxRef.current.resume().then(() => {
          console.log('Audio context resumed successfully');
        }).catch(err => {
          console.error('Failed to resume audio context:', err);
        });
      }
      document.removeEventListener('click', enableAudio);
      document.removeEventListener('touchstart', enableAudio);
    };
    
    document.addEventListener('click', enableAudio);
    document.addEventListener('touchstart', enableAudio);
    
    return () => {
      document.removeEventListener('click', enableAudio);
      document.removeEventListener('touchstart', enableAudio);
      if (audioCtxRef.current?.state !== 'closed') {
        audioCtxRef.current?.close();
      }
    };
  }, []);
  
  // Handle room changes
  useEffect(() => {
    if (isMuted || !soundsLoaded || !audioCtxRef.current) return;
    
    const playRoomSounds = async () => {
      // Play the door opening sound when changing rooms
      try {
        playSound('door-open');
      } catch (e) {
        console.warn("Error with door sound:", e);
      }
      
      // Short delay for the door sound to play
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Play ambient sounds for the current room
      if (roomSounds[roomId]) {
        roomSounds[roomId].forEach(sound => {
          try {
            playAmbientSound(sound.id, sound.volume, sound.loop, sound.playbackRate);
          } catch (e) {
            console.warn(`Error playing room sound ${sound.id}:`, e);
          }
        });
      }
      
      // Play common sounds
      commonSounds.forEach(sound => {
        try {
          playAmbientSound(sound.id, sound.volume, sound.loop);
        } catch (e) {
          console.warn(`Error playing common sound ${sound.id}:`, e);
        }
      });
    };
    
    playRoomSounds();
  }, [roomId, isMuted, soundsLoaded]);
  
  // Create a function to play ambient sounds
  const playAmbientSound = (id: string, baseVolume: number, loop: boolean, playbackRate?: number) => {
    if (!audioCtxRef.current || !soundBuffers.current[id]) return;
    
    const source = audioCtxRef.current.createBufferSource();
    source.buffer = soundBuffers.current[id];
    
    const gainNode = audioCtxRef.current.createGain();
    gainNode.gain.value = isMuted ? 0 : baseVolume * volume;
    
    source.connect(gainNode);
    gainNode.connect(audioCtxRef.current.destination);
    
    if (playbackRate) {
      source.playbackRate.value = playbackRate;
    }
    
    source.loop = loop;
    source.start();
    
    // Return cleanup function
    return () => {
      try {
        source.stop();
        source.disconnect();
        gainNode.disconnect();
      } catch (e) {
        console.warn(`Error stopping sound ${id}:`, e);
      }
    };
  };
  
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
    if (isMuted || !soundsLoaded || !audioCtxRef.current) return;
    
    console.log(`Playing sound: ${soundId}`);
    
    const sound = actionSounds[soundId];
    if (sound && soundBuffers.current[sound.id]) {
      try {
        const source = audioCtxRef.current.createBufferSource();
        source.buffer = soundBuffers.current[sound.id];
        
        const gainNode = audioCtxRef.current.createGain();
        gainNode.gain.value = sound.volume * volume;
        
        source.connect(gainNode);
        gainNode.connect(audioCtxRef.current.destination);
        
        source.start();
        
        // Automatically clean up
        source.onended = () => {
          source.disconnect();
          gainNode.disconnect();
        };
      } catch (e) {
        console.warn(`Error with action sound ${sound.id}:`, e);
      }
    } else {
      console.warn(`Sound not found or not loaded: ${soundId}`);
    }
  };
  
  // Wake up AudioContext if it's suspended (needed for some browsers)
  const resumeAudioContext = () => {
    if (audioCtxRef.current?.state === 'suspended') {
      audioCtxRef.current.resume().then(() => {
        console.log('Audio context resumed successfully');
        setAudioEnabled(true);
        
        // Test sound to confirm audio is working
        playSound('glass-clink');
      }).catch(err => {
        console.error('Failed to resume audio context:', err);
      });
    } else if (audioCtxRef.current?.state === 'running') {
      setAudioEnabled(true);
    }
  };
  
  // Check if audio needs to be enabled first
  const needsAudioActivation = audioCtxRef.current?.state === 'suspended' && !audioEnabled;
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      {needsAudioActivation ? (
        <div className="flex flex-col items-center">
          <button 
            onClick={resumeAudioContext}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md shadow-md hover:bg-primary/90 transition-colors mb-2 text-sm font-medium animate-pulse"
          >
            Click to Enable Sound
          </button>
          <div className="bg-background/80 border border-border rounded-lg p-2 text-xs text-center max-w-[200px]">
            Browser security requires user interaction to play audio
          </div>
        </div>
      ) : (
        <div>
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
      )}
    </div>
  );
};

// Add AudioContext to the Window interface
declare global {
  interface Window {
    AudioContext: typeof AudioContext;
    webkitAudioContext: typeof AudioContext;
  }
}

export default TavernAudio;