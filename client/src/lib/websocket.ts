import { create } from 'zustand';
import { WebSocketMessageType, WebSocketMessage, User, Room, Message, Bartender, MenuItem, BartenderMood, UserInventory, Item } from '@shared/schema';

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

  // Inventory and currency state
  inventory: (UserInventory & { item: Item })[];
  equippedItems: { [slot: string]: (UserInventory & { item: Item }) | null };
  currency: { silver: number; gold: number };
  showInventory: boolean;
  showShop: boolean;
  shopItems: Item[];

  // Authentication state
  isLoggingIn: boolean;
  isRegistering: boolean;
  authError: string | null;

  // Actions
  connect: (username: string, avatar: string, onOpenCallback?: (socket: WebSocket) => void) => void;
  disconnect: () => void;
  sendMessage: (content: string, type?: string) => void;
  joinRoom: (roomId: number) => void;
  orderMenuItem: (itemId: number) => void;
  toggleMenu: () => void;

  // Auth actions
  login: (username: string, password: string) => void;
  register: (username: string, password: string, email?: string, avatar?: string) => void;
  logout: () => void;

  // Inventory actions
  getInventory: () => void;
  getEquippedItems: () => void;
  equipItem: (itemId: number, slot: string) => void;
  unequipItem: (itemId: number) => void;
  buyItem: (itemId: number, quantity?: number) => void;
  sellItem: (itemId: number, quantity?: number) => void;
  useItem: (itemId: number) => void;

  // Currency actions
  getCurrency: () => void;

  // UI toggle actions
  toggleInventory: () => void;
  toggleShop: () => void;
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

  // Inventory and shop state
  inventory: [],
  equippedItems: {},
  currency: { silver: 0, gold: 0 },
  showInventory: false,
  showShop: false,
  shopItems: [],

  // Authentication state
  isLoggingIn: false,
  isRegistering: false,
  authError: null,

  connect: (username: string, avatar: string, onOpenCallback?: (socket: WebSocket) => void) => {
    try {
      // Close any existing connection
      if (get().socket) {
        get().socket?.close();
      }

      // Create a new WebSocket connection
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      // Use the current hostname and the specified port (9002)
      const host = window.location.hostname;
      const port = "9002";

      // Connect to WebSocket endpoint without auth info
      // This fixes security issue - we'll authenticate properly in login/register
      const wsUrl = `${protocol}//${host}/ws`;
      console.log('Connecting to WebSocket URL:', wsUrl);

      // Set up a WebSocket with explicit error handling and better error reporting
      const socket = new WebSocket(`${protocol}//${host}:${port}/ws`);

      socket.onopen = () => {
        console.log('WebSocket connection established');

        set({
          socket,
          connected: true
        });

        // Execute the provided callback if it exists
        if (onOpenCallback) {
          onOpenCallback(socket);
        }

        // Load rooms with more robust error handling
        const loadRooms = async () => {
          try {
            // First, use default rooms as an initial state
            const defaultRooms = [
              { id: 1, name: "The Rose Garden", description: "A warm and inviting space with Amethyst's sweet service." },
              { id: 2, name: "The Ocean View", description: "A thoughtful atmosphere where Sapphire offers clever insights." },
              { id: 3, name: "The Dragon's Den", description: "An exciting corner where Ruby shares thrilling tales." }
            ];

            // Set initial rooms from defaults to ensure UI has data
            set({ rooms: defaultRooms });

            // Then try to load the actual rooms from the API
            console.log('Fetching rooms from API...');
            const response = await fetch('/api/rooms');

            if (!response.ok) {
              throw new Error(`Failed to fetch rooms: ${response.status} ${response.statusText}`);
            }

            const rooms = await response.json();
            console.log('API returned rooms:', rooms);

            // Only update if we got valid rooms
            if (Array.isArray(rooms) && rooms.length > 0) {
              console.log('Setting rooms from API:', rooms);
              set({ rooms: rooms });
              return rooms;
            } else {
              console.warn('API returned empty rooms array, keeping defaults');
              return defaultRooms;
            }
          } catch (error) {
            console.error('Error loading rooms:', error);
            return get().rooms; // Return current rooms (defaults)
          }
        };

        // Execute the room loading function
        loadRooms().then(rooms => {
          console.log('Loaded rooms successfully:', rooms);
        });

        // Save avatar selection for later use
        if (avatar) {
          localStorage.setItem('tavern_selected_avatar', avatar);
        }
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

              // After joining, fetch inventory and currency if we have a user
              if (data.payload.user?.id) {
                setTimeout(() => {
                  get().getInventory();
                  get().getEquippedItems();
                  get().getCurrency();
                }, 500);
              }
              break;

            case WebSocketMessageType.JOIN_ROOM:
              console.log("JOIN_ROOM received:", data.payload);
              if (data.payload && data.payload.room) {
                // Make sure messages is always a valid array
                const validMessages = (data.payload.messages || []).filter(
                  (msg: any) => msg && typeof msg === 'object' && msg.content
                );

                set(state => {
                  // Only set messages if we received them, otherwise keep existing messages
                  const messages = validMessages.length > 0 ? validMessages : state.messages;

                  console.log(`Setting roomId to ${data.payload.room.id} with ${messages.length} messages`);
                  return {
                    roomId: data.payload.room.id,
                    messages: messages
                  };
                });

                // Immediately fetch messages for this room in case they weren't included
                if (!data.payload.messages || validMessages.length === 0) {
                  fetch(`/api/rooms/${data.payload.room.id}/messages`)
                    .then(res => res.json())
                    .then(messages => {
                      if (Array.isArray(messages) && messages.length > 0) {
                        console.log(`Fetched ${messages.length} messages for room ${data.payload.room.id}`);
                        set({ messages });
                      }
                    })
                    .catch(err => {
                      console.error("Error fetching room messages:", err);
                    });
                }
              } else {
                console.error("Invalid JOIN_ROOM data:", data.payload);
              }
              break;

            case WebSocketMessageType.NEW_MESSAGE:
              console.log("New message received:", data.payload);

              // Handle both single message and array of messages
              if (data.payload.message && typeof data.payload.message === 'object' && data.payload.message.content) {
                // Single message case
                set(state => ({
                  messages: [...state.messages, data.payload.message]
                }));
                console.log("Added single message to chat:", data.payload.message.content);
              } else if (Array.isArray(data.payload.messages)) {
                // Array of messages case (legacy support)
                const validMessages = data.payload.messages.filter(
                  (msg: any) => msg && typeof msg === 'object' && msg.content
                );

                if (validMessages.length > 0) {
                  set(state => ({
                    messages: [...state.messages, ...validMessages]
                  }));
                  console.log("Added multiple messages to chat:", validMessages.length);
                }
              } else {
                console.error("Invalid message format received:", data.payload);
              }
              break;

            case WebSocketMessageType.BARTENDER_RESPONSE:
              console.log("Bartender response received:", data.payload);

              // Handle both single message and array of messages
              if (data.payload.message && typeof data.payload.message === 'object' && data.payload.message.content) {
                // Single message case
                set(state => ({
                  messages: [...state.messages, data.payload.message]
                }));
                console.log("Added bartender message to chat:", data.payload.message.content);
              } else {
                console.error("Invalid bartender message format received:", data.payload);
              }
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

            // Authentication message handlers
            case WebSocketMessageType.AUTH_SUCCESS:
              if (data.payload.user) {
                set({
                  user: data.payload.user,
                  isLoggingIn: false,
                  isRegistering: false,
                  authError: null
                });

                // After successful login/register, fetch inventory and currency
                setTimeout(() => {
                  get().getInventory();
                  get().getEquippedItems();
                  get().getCurrency();
                }, 500);
              } else {
                // This is for logout success
                set({
                  user: null,
                  connected: false,
                  inventory: [],
                  equippedItems: {},
                  currency: { silver: 0, gold: 0 },
                });

                // Clear local storage for logout
                localStorage.removeItem('tavern_username');
                localStorage.removeItem('tavern_selected_avatar');
                localStorage.removeItem('tavern_auto_connect');
              }
              break;

            case WebSocketMessageType.AUTH_ERROR:
              console.error('Authentication error:', data.payload.message);
              set({
                authError: data.payload.message || 'Authentication failed',
                isLoggingIn: false,
                isRegistering: false
              });
              break;

            case WebSocketMessageType.AUTH_RESPONSE:
              if (data.payload.user) {
                set({ user: data.payload.user });
              }
              break;

            // Inventory message handlers
            case WebSocketMessageType.INVENTORY_UPDATE:
              if (data.payload.inventory) {
                set({ inventory: data.payload.inventory });
              }
              break;

            case WebSocketMessageType.EQUIPPED_ITEMS_UPDATE:
              if (data.payload.equipped) {
                // Convert array to object with slot as key for easier access
                const equippedObj: { [slot: string]: (UserInventory & { item: Item }) | null } = {};
                data.payload.equipped.forEach((item: UserInventory & { item: Item }) => {
                  if (item.equipSlot) {
                    equippedObj[item.equipSlot] = item;
                  }
                });
                set({ equippedItems: equippedObj });
              }
              break;

            // Currency message handlers
            case WebSocketMessageType.CURRENCY_UPDATE:
              if (data.payload.currency) {
                set({ currency: {
                  silver: data.payload.currency.silver || 0,
                  gold: data.payload.currency.gold || 0
                }});
              }
              break;

            // Shop message handlers
            case WebSocketMessageType.SHOP_OPEN:
              if (data.payload.items) {
                set({
                  shopItems: data.payload.items,
                  showShop: true
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
                }],
                authError: data.payload.message || null
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
        console.error('WebSocket connection error occurred:', error);
        
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

    if (!socket || !user) {
      console.error("Cannot send message: ", !socket ? "No socket connection" : "User not logged in");
      return;
    }

    console.log(`Sending message to room ${roomId}:`, content);

    // Add a temporary local message to show immediately
    set(state => ({
      messages: [...state.messages, {
        id: Date.now(),
        content: content,
        type: type,
        userId: user.id,
        roomId: roomId,
        bartenderId: null,
        timestamp: new Date()
      }]
    }));

    const message = {
      type: WebSocketMessageType.CHAT_MESSAGE,
      payload: {
        userId: user.id,
        roomId,
        message: content,
        type
      }
    };

    console.log("WebSocket message payload:", message);
    socket.send(JSON.stringify(message));
  },

  joinRoom: (roomId) => {
    const { socket, rooms } = get();

    if (!socket) {
      console.error("Cannot join room: No socket connection");
      return;
    }

    // Find room name for better logging
    const roomName = rooms.find(r => r.id === roomId)?.name || `Unknown (ID: ${roomId})`;
    console.log(`Joining room: ${roomName}`);

    const message = {
      type: WebSocketMessageType.JOIN_ROOM,
      payload: {
        roomId
      }
    };

    console.log("Sending JOIN_ROOM message:", message);
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

    // Toggle menu state regardless of socket connection
    set(state => ({ showMenu: !state.showMenu }));

    // If menu is being opened and socket exists, request menu items
    if (!showMenu && socket) {
      socket.send(JSON.stringify({
        type: WebSocketMessageType.ORDER_ITEM,
        payload: {
          action: 'open_menu'
        }
      }));
    }
  },

  // Authentication functions
  login: (username, password) => {
    const { socket, connect } = get();

    set({ isLoggingIn: true, authError: null });

    // Store username in localStorage if "Remember me" is checked
    const rememberMe = localStorage.getItem('tavern_auto_login') === 'true';
    if (rememberMe) {
      localStorage.setItem('tavern_username', username);
    }

    const sendLoginMessage = (ws: WebSocket) => {
      console.log('Sending AUTH_LOGIN message:', { username, password });
      ws.send(JSON.stringify({
        type: WebSocketMessageType.AUTH_LOGIN,
        payload: {
          username,
          password
          // No avatar parameter needed - server will use the one from the user's record
        }
      }));
    };

    if (socket && socket.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected, sending login message');
      sendLoginMessage(socket);
    } else {
      console.log('WebSocket not connected or not open, attempting to connect and then login');
      // If no socket or socket is not open, initiate connection and send login message on open
      connect(username, localStorage.getItem('tavern_selected_avatar') || 'bard', sendLoginMessage);
    }
  },

  register: (username, password, email, avatar) => {
    const { socket } = get();

    if (!socket) return;

    set({ isRegistering: true, authError: null });

    socket.send(JSON.stringify({
      type: WebSocketMessageType.AUTH_REGISTER,
      payload: {
        username,
        password,
        email,
        avatar
      }
    }));
  },

  logout: () => {
    const { socket } = get();

    if (!socket) return;

    socket.send(JSON.stringify({
      type: WebSocketMessageType.AUTH_LOGOUT,
      payload: {}
    }));
  },

  // Inventory functions
  getInventory: () => {
    const { socket, user } = get();

    if (!socket || !user) return;

    socket.send(JSON.stringify({
      type: WebSocketMessageType.INVENTORY_GET,
      payload: {}
    }));
  },

  getEquippedItems: () => {
    const { socket, user } = get();

    if (!socket || !user) return;

    socket.send(JSON.stringify({
      type: WebSocketMessageType.INVENTORY_GET_EQUIPPED,
      payload: {}
    }));
  },

  equipItem: (itemId, slot) => {
    const { socket, user } = get();

    if (!socket || !user) return;

    socket.send(JSON.stringify({
      type: WebSocketMessageType.INVENTORY_EQUIP_ITEM,
      payload: {
        itemId,
        slot
      }
    }));
  },

  unequipItem: (itemId) => {
    const { socket, user } = get();

    if (!socket || !user) return;

    socket.send(JSON.stringify({
      type: WebSocketMessageType.INVENTORY_UNEQUIP_ITEM,
      payload: {
        itemId
      }
    }));
  },

  buyItem: (itemId, quantity = 1) => {
    const { socket, user } = get();

    if (!socket || !user) return;

    socket.send(JSON.stringify({
      type: WebSocketMessageType.BUY_ITEM,
      payload: {
        itemId,
        quantity
      }
    }));
  },

  sellItem: (itemId, quantity = 1) => {
    const { socket, user } = get();

    if (!socket || !user) return;

    socket.send(JSON.stringify({
      type: WebSocketMessageType.SELL_ITEM,
      payload: {
        itemId,
        quantity
      }
    }));
  },

  useItem: (itemId) => {
    const { socket, user } = get();

    if (!socket || !user) return;

    socket.send(JSON.stringify({
      type: WebSocketMessageType.USE_ITEM,
      payload: {
        itemId
      }
    }));
  },

  // Currency functions
  getCurrency: () => {
    const { socket, user } = get();

    if (!socket || !user) return;

    socket.send(JSON.stringify({
      type: WebSocketMessageType.CURRENCY_GET,
      payload: {}
    }));
  },

  // UI toggle functions
  toggleInventory: () => {
    set(state => ({ showInventory: !state.showInventory, showShop: false }));
    // Fetch inventory data if we don't have any
    if (!get().inventory.length) {
      get().getInventory();
      get().getEquippedItems();
    }
  },

  toggleShop: () => {
    const { showShop, socket } = get();

    if (showShop) {
      set({ showShop: false });
    } else if (socket) {
      // Request shop items
      socket.send(JSON.stringify({
        type: WebSocketMessageType.SHOP_OPEN,
        payload: {}
      }));
      set({ showInventory: false });
    }
  }
}));
