import { useEffect, useRef, useState } from 'react';

// Define the action sound types
export type ActionSoundType = 
  | 'drink-pour' 
  | 'door-open' 
  | 'drink-serve'
  | 'coin-drop'
  | 'chair-move'
  | 'glass-clink';

interface TavernAudioContextProps {
  playSound: (soundId: ActionSoundType) => void;
  toggleMute: () => void;
  isMuted: boolean;
  setVolume: (volume: number) => void;
  volume: number;
}

// Custom hook to provide access to the audio system
export const useTavernAudio = (): TavernAudioContextProps => {
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.5);
  
  // Function to play a specific sound effect
  const playSound = (soundId: ActionSoundType) => {
    if (isMuted) return;
    
    // Dispatch a custom event that will be caught by the TavernAudio component
    const event = new CustomEvent('tavern-audio-play', { 
      detail: { soundId, volume } 
    });
    window.dispatchEvent(event);
  };
  
  // Toggle mute functionality
  const toggleMute = () => {
    setIsMuted(!isMuted);
    
    // Dispatch a custom event to notify the TavernAudio component
    const event = new CustomEvent('tavern-audio-mute', { 
      detail: { isMuted: !isMuted } 
    });
    window.dispatchEvent(event);
  };
  
  // Function to set volume
  const handleSetVolume = (newVolume: number) => {
    setVolume(newVolume);
    
    // Dispatch a custom event to notify the TavernAudio component
    const event = new CustomEvent('tavern-audio-volume', { 
      detail: { volume: newVolume } 
    });
    window.dispatchEvent(event);
  };
  
  return {
    playSound,
    toggleMute,
    isMuted,
    setVolume: handleSetVolume,
    volume
  };
};

export default useTavernAudio;