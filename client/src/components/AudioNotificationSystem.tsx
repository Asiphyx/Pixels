import { useEffect, useRef } from 'react';
import { useWebSocketStore } from '@/lib/websocket';

const AudioNotificationSystem = () => {
  const { messages, user } = useWebSocketStore();
  const messagesLengthRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize AudioContext on first render
  useEffect(() => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioContextRef.current = new AudioContextClass();
    }
    
    // Add a click handler to initialize audio context from user interaction
    const initAudio = () => {
      if (!audioContextRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          audioContextRef.current = new AudioContextClass();
          console.log("AudioContext initialized on user interaction");
        }
      }
    };
    
    document.addEventListener('click', initAudio);
    
    return () => {
      document.removeEventListener('click', initAudio);
      audioContextRef.current?.close();
    };
  }, []);

  // A very loud, reliable beep sound guaranteed to work
  const playLoudBeep = (frequency = 600, duration = 100, volume = 0.3) => {
    try {
      if (!audioContextRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          audioContextRef.current = new AudioContextClass();
          console.log("Created new AudioContext on demand");
        } else {
          console.error("Web Audio API not supported in this browser");
          return;
        }
      }
      
      const audioCtx = audioContextRef.current;
      
      // Create oscillator
      const oscillator = audioCtx.createOscillator();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
      
      // Create gain node for volume control
      const gainNode = audioCtx.createGain();
      gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
      
      // Connect everything
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      // Play the sound
      oscillator.start();
      
      // Stop after duration
      setTimeout(() => {
        oscillator.stop();
        console.log(`Beep sound played: freq=${frequency}, vol=${volume}`);
      }, duration);
      
      // Return true to indicate success
      return true;
    } catch (error) {
      console.error('Failed to play beep sound:', error);
      return false;
    }
  };

  // Check for new messages and play notifications
  useEffect(() => {
    // Check if there are new messages
    if (messages.length > messagesLengthRef.current) {
      const latestMessage = messages[messages.length - 1];
      
      // Skip notification for user's own messages
      if (latestMessage && latestMessage.userId !== user?.id) {
        console.log('New message notification triggered');
        
        // Play different sounds based on the message type
        if (latestMessage.type === 'bartender') {
          // Higher pitched sound for bartender messages
          playLoudBeep(700, 150, 0.4);
          setTimeout(() => playLoudBeep(900, 80, 0.3), 200);
        } else {
          // Regular message sound
          playLoudBeep(600, 100, 0.3);
        }
      }
    }
    
    // Update the reference value
    messagesLengthRef.current = messages.length;
  }, [messages, user?.id]);

  // For debugging - global access to playBeep
  useEffect(() => {
    (window as any).playAudioNotification = () => {
      playLoudBeep(700, 150, 0.4);
      setTimeout(() => playLoudBeep(900, 80, 0.3), 200);
      return "Audio notification triggered";
    };
    
    return () => {
      delete (window as any).playAudioNotification;
    };
  }, []);

  // This is a headless component (no UI)
  return null;
};

export default AudioNotificationSystem;