import { useEffect, useRef } from 'react';
import { useWebSocketStore } from '@/lib/websocket';

/**
 * This component provides a direct audio notification system
 * It's a fallback for when the main audio system doesn't work
 */
const AudioNotificationSystem = () => {
  // Keep track of user and message state
  const { user, messages } = useWebSocketStore();
  const messagesRef = useRef(messages);
  const userRef = useRef(user);
  
  // Reference to audio elements
  const notificationAudioRef = useRef<HTMLAudioElement | null>(null);
  const messageSendAudioRef = useRef<HTMLAudioElement | null>(null);
  
  // Update refs when values change
  useEffect(() => {
    messagesRef.current = messages;
    userRef.current = user;
  }, [messages, user]);
  
  // Create audio elements on mount
  useEffect(() => {
    const notificationAudio = new Audio('/sounds/notification.mp3?v=3');
    notificationAudio.volume = 1.0;
    notificationAudio.preload = 'auto';
    
    const messageSendAudio = new Audio('/sounds/message_send.mp3?v=3');
    messageSendAudio.volume = 1.0;
    messageSendAudio.preload = 'auto';
    
    notificationAudioRef.current = notificationAudio;
    messageSendAudioRef.current = messageSendAudio;
    
    // Clean up
    return () => {
      notificationAudioRef.current = null;
      messageSendAudioRef.current = null;
    };
  }, []);
  
  // Watch for new messages and play sounds
  useEffect(() => {
    // Return early if no messages or no audio refs
    if (messages.length === 0 || !notificationAudioRef.current) return;
    
    // Get the most recent message
    const latestMessage = messages[messages.length - 1];
    
    // Only play if it's a new message (not an initial load)
    if (messagesRef.current.length > 0 && messages.length > messagesRef.current.length) {
      try {
        // Check if it's from another user or a bartender
        if (latestMessage.userId !== user?.id || latestMessage.bartenderId) {
          console.log('Playing direct notification for new message');
          notificationAudioRef.current?.play().catch(e => 
            console.error('Error playing direct notification:', e)
          );
        } 
      } catch (error) {
        console.error('Error in notification sound system:', error);
      }
    }
  }, [messages, user?.id]);
  
  // Invisible component - renders nothing
  return null;
};

export default AudioNotificationSystem;