import { useEffect, useState } from 'react';

/**
 * Preloads audio context and sets up additional audio functions
 * Acts as an additional redundant system for audio playback
 */
const AudioPreloader = () => {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (initialized) return;

    // Initialize on user interaction
    const initAudio = () => {
      // Create test beep function using Audio nodes
      const playTestBeep = () => {
        try {
          // Create context
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          if (!AudioContext) {
            console.error('Web Audio API not supported');
            return false;
          }
          
          const context = new AudioContext();
          
          // Create oscillator for beep
          const oscillator = context.createOscillator();
          oscillator.type = 'triangle';
          oscillator.frequency.setValueAtTime(800, context.currentTime);
          
          // Create gain node for volume
          const gainNode = context.createGain();
          gainNode.gain.setValueAtTime(0.5, context.currentTime);
          
          // Connect nodes
          oscillator.connect(gainNode);
          gainNode.connect(context.destination);
          
          // Play beep
          oscillator.start();
          setTimeout(() => {
            oscillator.stop();
            // Optional cleanup
            setTimeout(() => {
              context.close().catch(e => console.error('Error closing audio context:', e));
            }, 100);
          }, 200);
          
          return true;
        } catch (error) {
          console.error('Error in test beep:', error);
          return false;
        }
      };

      // Make function globally available
      (window as any).playTestBeep = playTestBeep;
      
      // Don't immediately play a sound as it might be annoying
      // Instead, we'll make the function available for testing
      
      // Mark as initialized
      setInitialized(true);
      
      // Remove event listener
      document.removeEventListener('click', initAudio);
    };
    
    // Add event listener to initialize on first click
    document.addEventListener('click', initAudio);
    
    // Cleanup
    return () => {
      document.removeEventListener('click', initAudio);
      // Remove global function
      if ((window as any).playTestBeep) {
        delete (window as any).playTestBeep;
      }
    };
  }, [initialized]);

  return null; // This is a headless component
};

export default AudioPreloader;