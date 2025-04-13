import React, { useEffect, useRef } from 'react';

/**
 * A simple sound system that uses HTML5 Audio
 * This is a fallback for when Howler.js has issues on some browsers
 */
const SimpleSoundSystem: React.FC = () => {
  // Create audio element references
  const notificationRef = useRef<HTMLAudioElement | null>(null);
  const clickRef = useRef<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    // Create audio elements in the DOM
    const createAudioElement = (id: string, src: string) => {
      const existingEl = document.getElementById(id) as HTMLAudioElement;
      if (existingEl) return existingEl;
      
      const audio = document.createElement('audio');
      audio.id = id;
      audio.src = src;
      audio.preload = 'auto';
      
      // Hide the element
      audio.style.display = 'none';
      document.body.appendChild(audio);
      
      return audio;
    };
    
    // Create the notification sound
    const notificationEl = createAudioElement(
      'tavern-notification-sound',
      '/sounds/notification.mp3?v=simple'
    );
    notificationRef.current = notificationEl;
    
    // Create the click sound
    const clickEl = createAudioElement(
      'tavern-click-sound',
      '/sounds/message_send.mp3?v=simple'
    );
    clickRef.current = clickEl;
    
    // Add a global function to play notification sound
    (window as any).playSimpleNotification = () => {
      if (notificationRef.current) {
        notificationRef.current.volume = 1.0;
        notificationRef.current.currentTime = 0;
        const playPromise = notificationRef.current.play();
        
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error('Simple notification playback failed:', error);
          });
        }
      }
    };
    
    // Add a click listener to try playing the notification
    const tryPlayOnClick = () => {
      if (notificationRef.current) {
        notificationRef.current.volume = 1.0;
        notificationRef.current.currentTime = 0;
        const playPromise = notificationRef.current.play();
        
        if (playPromise !== undefined) {
          playPromise.then(() => {
            console.log('Click notification successful');
            // If successful, remove the listener
            document.removeEventListener('click', tryPlayOnClick);
          }).catch(error => {
            console.error('Click notification failed:', error);
          });
        }
      }
    };
    
    document.addEventListener('click', tryPlayOnClick);
    
    // Cleanup function
    return () => {
      document.removeEventListener('click', tryPlayOnClick);
      
      if (notificationRef.current) {
        document.body.removeChild(notificationRef.current);
      }
      
      if (clickRef.current) {
        document.body.removeChild(clickRef.current);
      }
      
      delete (window as any).playSimpleNotification;
    };
  }, []);
  
  // Create a MutationObserver to watch for new messages
  useEffect(() => {
    // Wait for the chat messages container to be available
    const findChatContainer = () => {
      return document.querySelector('.chat-messages');
    };
    
    // Check for container
    let container = findChatContainer();
    
    // If not found, wait a bit and try again
    if (!container) {
      const intervalId = setInterval(() => {
        container = findChatContainer();
        if (container) {
          clearInterval(intervalId);
          setupObserver(container);
        }
      }, 1000);
      
      return () => clearInterval(intervalId);
    } else {
      setupObserver(container);
    }
    
    function setupObserver(element: Element) {
      // Create an observer to watch for new messages
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList' && mutation.addedNodes.length) {
            // A new message was added
            console.log('New chat message detected by observer');
            
            // Play notification sound
            if (notificationRef.current) {
              notificationRef.current.volume = 1.0;
              notificationRef.current.currentTime = 0;
              notificationRef.current.play().catch(e => 
                console.error('Observer notification failed:', e)
              );
            }
            
            // Also try the global method
            if ((window as any).playSimpleNotification) {
              (window as any).playSimpleNotification();
            }
          }
        });
      });
      
      // Start observing
      observer.observe(element, { childList: true });
      
      // Cleanup
      return () => observer.disconnect();
    }
  }, []);
  
  // This is a non-rendering component
  return null;
};

export default SimpleSoundSystem;