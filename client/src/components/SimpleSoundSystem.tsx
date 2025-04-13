import { useEffect } from 'react';

/**
 * A simplified sound system component that uses Web Audio API directly with maximized volume
 * for guaranteed sound output even in sandbox environments
 */
const SimpleSoundSystem = () => {
  useEffect(() => {
    // Create a super loud, basic beep sound that will be heard even at low system volumes
    const createVeryLoudBeep = (frequency = 440, durationMs = 200, volume = 0.8) => {
      try {
        // Create the audio context
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Create oscillator
        const oscillator = audioContext.createOscillator();
        oscillator.type = 'sine'; // sine wave - smooth sound
        oscillator.frequency.value = frequency; // value in hertz
        
        // Create gain node for volume control with compressor for extra loudness
        const gainNode = audioContext.createGain();
        gainNode.gain.value = volume; // very loud at 0.8
        
        // Create compressor to make the sound louder and more present
        const compressor = audioContext.createDynamicsCompressor();
        compressor.threshold.value = -50;
        compressor.knee.value = 40;
        compressor.ratio.value = 12;
        compressor.attack.value = 0;
        compressor.release.value = 0.25;
        
        // Connect the nodes: oscillator -> gain -> compressor -> destination (speakers)
        oscillator.connect(gainNode);
        gainNode.connect(compressor);
        compressor.connect(audioContext.destination);
        
        // Start the sound
        oscillator.start();
        
        // Stop the sound after duration
        setTimeout(() => {
          oscillator.stop();
          console.log('Very loud beep played:', { frequency, volume });
        }, durationMs);
        
        return true;
      } catch (error) {
        console.error('Failed to create beep sound:', error);
        return false;
      }
    };
    
    // Play different notification sounds
    const playMessageNotification = () => {
      // Play a two-tone notification
      createVeryLoudBeep(880, 100, 0.8);
      setTimeout(() => createVeryLoudBeep(440, 100, 0.6), 150);
    };
    
    const playAlertNotification = () => {
      // Play a three-tone alert
      createVeryLoudBeep(740, 100, 0.8);
      setTimeout(() => createVeryLoudBeep(880, 100, 0.8), 130);
      setTimeout(() => createVeryLoudBeep(1100, 80, 0.6), 260);
    };
    
    // Make these functions globally available
    (window as any).playVeryLoudBeep = createVeryLoudBeep;
    (window as any).playMessageNotification = playMessageNotification;
    (window as any).playAlertNotification = playAlertNotification;
    
    // Add a keyboard shortcut to test sounds
    const handleKeyDown = (e: KeyboardEvent) => {
      // Press 'B' key to test the beep
      if (e.code === 'KeyB' && !e.shiftKey && !e.ctrlKey && !e.altKey) {
        console.log('Testing beep sound via keyboard shortcut');
        createVeryLoudBeep(440, 200, 0.8);
      }
      
      // Press 'N' key to test notification
      if (e.code === 'KeyN' && !e.shiftKey && !e.ctrlKey && !e.altKey) {
        console.log('Testing notification sound via keyboard shortcut');
        playMessageNotification();
      }
    };
    
    // Register keyboard handler
    document.addEventListener('keydown', handleKeyDown);
    
    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      delete (window as any).playVeryLoudBeep;
      delete (window as any).playMessageNotification;
      delete (window as any).playAlertNotification;
    };
  }, []);
  
  // No visible UI
  return null;
};

export default SimpleSoundSystem;