import { create } from 'zustand';
import { WebSocketMessageType, WebSocketMessage, User, Room, Message, Bartender, MenuItem, BartenderMood } from '@shared/schema';

// Define the websocket store state
interface WebSocketState {
  socket: WebSocket | null;
  connected: boolean;
  user: User | null;
  roomId: number;
  rooms: Room[];
  messages: Message[];
  bartenders: Bartender[];
  onlineUsers: User[];
  menuItems: MenuItem[];
  showMenu: boolean;
  bartenderMoods: BartenderMood[];
  
  // Actions
  connect: (username: string, avatar: string) => void;
  disconnect: () => void;
  sendMessage: (content: string, type?: string) => void;
  joinRoom: (roomId: number) => void;
  orderMenuItem: (itemId: number) => void;
  toggleMenu: () => void;
}

export const useWebSocketStore = create<WebSocketState>((set, get) => ({
  socket: null,
  connected: false,
  user: null,
  roomId: 1, // Default to first room
  rooms: [],
  messages: [],
  bartenders: [],
  onlineUsers: [],
  menuItems: [],
  showMenu: false,
  bartenderMoods: [],
  
  connect: (username, avatar) => {
    try {
      // Close any existing connection
      if (get().socket) {
        get().socket?.close();
      }
      
      // Create a new WebSocket connection
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.host; // Use the current host for both dev and prod
      // Ensure we're connecting to the /ws endpoint with proper parameters
      const wsUrl = `${protocol}//${host}/ws?token=${encodeURIComponent(username)}&avatar=${encodeURIComponent(avatar)}`;
      console.log('Connecting to WebSocket URL:', wsUrl);
      
      // Set up a WebSocket with explicit error handling
      const socket = new WebSocket(wsUrl);
      
      socket.onopen = () => {
        // No need to send user info as we already included it in the URL query parameters
        console.log('WebSocket connection established');
        
        set({ 
          socket,
          connected: true
        });
      };
      
      socket.onmessage = (event) => {
        try {
          // Safely handle binary messages
          if (typeof event.data !== 'string') {
            console.log('Received binary data, ignoring');
            return;
          }
          
          const data: WebSocketMessage = JSON.parse(event.data);
          console.log('WebSocket message received:', data.type);
          
          switch (data.type) {
            case WebSocketMessageType.USER_JOINED:
              set({ 
                user: data.payload.user,
                rooms: data.payload.rooms || get().rooms,
                bartenders: data.payload.bartenders || get().bartenders
              });
              break;
              
            case WebSocketMessageType.JOIN_ROOM:
              set({ 
                roomId: data.payload.room.id,
                messages: data.payload.messages || []
              });
              break;
              
            case WebSocketMessageType.NEW_MESSAGE:
              set(state => ({ 
                messages: [...state.messages, data.payload.message] 
              }));
              break;
              
            case WebSocketMessageType.BARTENDER_RESPONSE:
              set(state => ({ 
                messages: [...state.messages, data.payload.message] 
              }));
              break;
              
            case WebSocketMessageType.ROOM_USERS:
              set({ onlineUsers: data.payload.users });
              break;
              
            case WebSocketMessageType.ORDER_ITEM:
              if (data.payload.action === 'open_menu') {
                set({ 
                  menuItems: data.payload.menuItems || [],
                  showMenu: true
                });
              }
              break;
              
            case WebSocketMessageType.ERROR:
              console.error('WebSocket error:', data.payload.message);
              // Add a system message for errors
              set(state => ({ 
                messages: [...state.messages, {
                  id: Date.now(),
                  content: data.payload.message || "An error occurred",
                  type: 'system',
                  userId: null,
                  roomId: state.roomId,
                  bartenderId: null,
                  timestamp: new Date()
                }]
              }));
              break;
              
            case WebSocketMessageType.BARTENDER_MOOD_UPDATE:
              set({ bartenderMoods: data.payload.bartenderMoods });
              break;
              
            default:
              console.log('Unhandled message type:', data.type);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          // Don't crash on parse errors, just log them
        }
      };
      
      socket.onclose = () => {
        set({ 
          socket: null,
          connected: false
        });
      };
      
      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        
        // Close the socket if it's still open
        try {
          if (socket.readyState === WebSocket.OPEN) {
            socket.close();
          }
        } catch (e) {
          console.error('Error closing WebSocket after error:', e);
        }
        
        // Add a message to help users understand the connection issue
        set(state => ({ 
          socket: null,
          connected: false,
          messages: [...state.messages, {
            id: Date.now(),
            content: "Connection error. The tavern doors seem stuck. Please try refreshing the page.",
            type: 'system',
            userId: null,
            roomId: state.roomId,
            bartenderId: null,
            timestamp: new Date()
          }]
        }));
        
        // Try to reconnect after a delay
        setTimeout(() => {
          if (!get().connected) {
            // Only attempt to reconnect if we're still disconnected
            console.log('Attempting to reconnect...');
            const username = localStorage.getItem('username') || 'Guest';
            const avatar = localStorage.getItem('avatar') || 'warrior';
            get().connect(username, avatar);
          }
        }, 5000); // Wait 5 seconds before reconnecting
      };
      
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      // Display error message to the user
      set(state => ({ 
        messages: [...state.messages, {
          id: Date.now(),
          content: "Failed to connect to the tavern. Please try again later.",
          type: 'system',
          userId: null,
          roomId: state.roomId || 1,
          bartenderId: null,
          timestamp: new Date()
        }]
      }));
    }
  },
  
  disconnect: () => {
    get().socket?.close();
    set({ 
      socket: null,
      connected: false,
      user: null,
      messages: [],
      onlineUsers: []
    });
  },
  
  sendMessage: (content, type = 'user') => {
    const { socket, user, roomId } = get();
    
    if (!socket || !user) return;
    
    const message = {
      type: WebSocketMessageType.CHAT_MESSAGE,
      payload: {
        userId: user.id,
        roomId,
        message: content,
        type
      }
    };
    
    socket.send(JSON.stringify(message));
  },
  
  joinRoom: (roomId) => {
    const { socket } = get();
    
    if (!socket) return;
    
    const message = {
      type: WebSocketMessageType.JOIN_ROOM,
      payload: {
        roomId
      }
    };
    
    socket.send(JSON.stringify(message));
  },
  
  orderMenuItem: (itemId) => {
    const { socket } = get();
    
    if (!socket) return;
    
    const message = {
      type: WebSocketMessageType.ORDER_ITEM,
      payload: {
        itemId
      }
    };
    
    socket.send(JSON.stringify(message));
    set({ showMenu: false });
  },
  
  toggleMenu: () => {
    const { showMenu, socket } = get();
    
    if (showMenu) {
      set({ showMenu: false });
    } else if (socket) {
      // Request menu items directly with ORDER_ITEM type
      socket.send(JSON.stringify({
        type: WebSocketMessageType.ORDER_ITEM,
        payload: {
          action: 'open_menu'
        }
      }));
    }
  }
}));
