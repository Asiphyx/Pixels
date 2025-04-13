import { useEffect, useRef } from 'react';

/**
 * This component creates and preloads notification audio elements
 * It's an invisible component that only handles audio management
 */
const AudioPreloader = () => {
  // Create refs for the audio elements
  const notificationRef = useRef<HTMLAudioElement | null>(null);
  const messageRef = useRef<HTMLAudioElement | null>(null);
  
  // Load and initialize audio elements
  useEffect(() => {
    // Create the audio elements
    notificationRef.current = new Audio('/sounds/notification.mp3?v=preload');
    messageRef.current = new Audio('/sounds/message_send.mp3?v=preload');
    
    // Set attributes
    if (notificationRef.current) {
      notificationRef.current.preload = 'auto';
      notificationRef.current.volume = 1.0;
    }
    
    if (messageRef.current) {
      messageRef.current.preload = 'auto';
      messageRef.current.volume = 1.0;
    }
    
    // Cleanup
    return () => {
      notificationRef.current = null;
      messageRef.current = null;
    };
  }, []);
  
  // Expose a global function for playing notification sounds
  useEffect(() => {
    // Define global play function
    (window as any).playNotificationSound = () => {
      console.log('Explicit notification sound play requested');
      try {
        // Create a fresh audio element
        const audio = new Audio('/sounds/notification.mp3?v=' + Date.now());
        audio.volume = 1.0;
        const playPromise = audio.play();
        
        if (playPromise) {
          playPromise.then(() => {
            console.log('Notification sound played successfully!');
          }).catch(error => {
            console.error('Failed to play notification sound:', error);
          });
        }
      } catch (e) {
        console.error('Error playing notification:', e);
      }
    };
    
    return () => {
      delete (window as any).playNotificationSound;
    };
  }, []);
  
  // Try to play a notification sound when a user clicks anywhere on the document
  useEffect(() => {
    const handleClick = () => {
      console.log('Document clicked - trying to play notification');
      try {
        if (notificationRef.current) {
          notificationRef.current.currentTime = 0;
          const playPromise = notificationRef.current.play();
          
          if (playPromise) {
            playPromise.then(() => {
              console.log('Click-triggered notification played successfully!');
              // Remove listener if we succeed
              document.removeEventListener('click', handleClick);
            }).catch(e => {
              console.error('Click-triggered notification failed:', e);
            });
          }
        }
      } catch (e) {
        console.error('Error in click notification:', e);
      }
    };
    
    // Add click listener
    document.addEventListener('click', handleClick);
    
    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, []);
  
  // This component doesn't render anything visible
  return null;
};

export default AudioPreloader;