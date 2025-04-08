import { create } from 'zustand';
import { WebSocketMessageType, WebSocketMessage, User, Room, Message, Bartender, MenuItem } from '@shared/schema';

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
  
  connect: (username, avatar) => {
    try {
      // Close any existing connection
      if (get().socket) {
        get().socket?.close();
      }
      
      // Create a new WebSocket connection
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = process.env.NODE_ENV === "development" ? "0.0.0.0:5000" : window.location.host;
      const wsUrl = `${protocol}//${host}/ws`;
      const socket = new WebSocket(wsUrl);
      
      socket.onopen = () => {
        // Send user information
        socket.send(JSON.stringify({
          type: WebSocketMessageType.USER_JOINED,
          payload: {
            username,
            avatar,
            roomId: 1,
            online: true
          }
        }));
        
        set({ 
          socket,
          connected: true
        });
      };
      
      socket.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          
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
              // Could add toast notification for errors
              break;
              
            default:
              console.log('Unhandled message type:', data.type);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
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
        set({ 
          socket: null,
          connected: false
        });
      };
      
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
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
      type: WebSocketMessageType.SEND_MESSAGE,
      payload: {
        userId: user.id,
        roomId,
        content,
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
      // Request menu items from the server
      socket.send(JSON.stringify({
        type: WebSocketMessageType.SEND_MESSAGE,
        payload: {
          userId: get().user?.id,
          roomId: get().roomId,
          content: '/menu',
          type: 'user'
        }
      }));
    }
  }
}));
