// Audio Unlock Script
// This script attempts to unlock audio playback on iOS and other mobile browsers
(function() {
  // Create an audio context
  window.AudioContext = window.AudioContext || window.webkitAudioContext;
  
  // Create context
  let context;
  try {
    context = new AudioContext();
  } catch (e) {
    console.warn('Web Audio API not supported in this browser');
    return;
  }
  
  // Check if we need to unlock (context is in suspended state)
  if (context.state === 'suspended') {
    console.log('Audio context is suspended. Waiting for user interaction to unlock...');
    
    const unlock = function() {
      console.log('Attempting to unlock audio...');
      
      // Create an empty buffer
      const buffer = context.createBuffer(1, 1, 22050);
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(context.destination);
      
      // Play the empty buffer
      if (typeof source.start === 'undefined') {
        source.noteOn(0);
      } else {
        source.start(0);
      }
      
      // By checking the context state again, we know it was unlocked
      if (context.state === 'running') {
        console.log('Audio context unlocked successfully');
      }
      
      // Try playing a short sound
      try {
        const audio = new Audio('/sounds/notification.mp3?unlock=' + Date.now());
        audio.volume = 1.0;
        audio.play().then(() => {
          console.log('Test notification played successfully!');
        }).catch(e => {
          console.error('Error in test notification:', e);
        });
      } catch (e) {
        console.error('Error testing notification sound:', e);
      }
      
      // Clean up event listeners
      document.removeEventListener('click', unlock);
      document.removeEventListener('touchstart', unlock);
      document.removeEventListener('touchend', unlock);
    };
    
    // Add event listeners for user interaction
    document.addEventListener('click', unlock, false);
    document.addEventListener('touchstart', unlock, false);
    document.addEventListener('touchend', unlock, false);
  } else {
    console.log('Audio context already running. No unlock needed.');
  }
  
  // Also try a direct audio playback approach
  document.addEventListener('click', function tryPlaySound() {
    try {
      const audio = new Audio('/sounds/notification.mp3?click=' + Date.now());
      audio.volume = 1.0;
      audio.play().then(() => {
        console.log('Click test sound played successfully');
        // If we got here, we can remove the listener
        document.removeEventListener('click', tryPlaySound);
      }).catch(e => {
        console.error('Click test sound failed:', e);
      });
    } catch (e) {
      console.error('Error in click test sound:', e);
    }
  }, false);
})();