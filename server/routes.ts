import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { 
  WebSocketMessageType, 
  WebSocketMessage,
  insertUserSchema,
  insertMessageSchema,
  insertRoomSchema
} from "@shared/schema";
import { z } from "zod";

// Store connected clients with their user info
interface ConnectedClient {
  socket: WebSocket;
  userId: number;
  roomId: number;
}

const connectedClients: Map<WebSocket, ConnectedClient> = new Map();

// Bartender AI logic for the three sisters
async function getBartenderResponse(message: string, bartenderId: number): Promise<string> {
  // Get the bartender to determine which sister is responding
  const bartender = await storage.getBartender(bartenderId);
  
  // Process orders
  if (message.startsWith("/order")) {
    const item = message.substring(7).trim();
    
    // Different responses based on which sister
    if (bartender?.name === "Sapphire") {
      return `Coming right up! One ${item} for ya! Want anything else with that?`;
    } else if (bartender?.name === "Amethyst") {
      return `Ah, the ${item}... an interesting choice. Your aura suggests you'll enjoy it.`;
    } else {
      return `One ${item}, prepared with care. Take your time enjoying it.`;
    }
  }
  
  // Personality-specific responses for each sister
  const sapphireResponses = [
    "Need a refill? Just give me a shout!",
    "Did you hear about the dragon sightings? So exciting!",
    "You should try our Dragon's Breath Ale - it's our specialty!",
    "The locals say there's treasure in the mountains! We should go looking sometime!",
    "I love meeting new travelers! Where are you from?",
    "My sisters and I have been running this tavern since our parents retired to the coast",
    "Weather's perfect for an adventure, don't you think?",
    "You look like someone with some amazing stories - care to share one?"
  ];
  
  const amethystResponses = [
    "I sense an interesting aura about you...",
    "The stars are aligned strangely tonight. Be cautious in your travels.",
    "Some say the forest whispers secrets at midnight. I've heard them.",
    "This tavern stands on ancient grounds. Sometimes the past bleeds through.",
    "Have you tried our Midnight Whiskey? It reveals hidden truths...",
    "Your future is... hmm, unclear. The paths diverge in interesting ways.",
    "That weapon you carry has seen blood, hasn't it? It remembers.",
    "My tattoos? Each one tells a story of power gained or secrets learned."
  ];
  
  const rubyResponses = [
    "Take your time. Good drinks, like good advice, shouldn't be rushed.",
    "If you're seeking information, you'd be wise to speak with the merchants by the east gate.",
    "The guild is recruiting skilled hands. I could put in a good word.",
    "Mind your coin purse. Not everyone in here is as honest as they appear.",
    "My sisters are excellent company, but I notice what others miss.",
    "Need a quiet place to rest? The rooms upstairs are well-kept and private.",
    "That injury looks fresh. We have healing potions if you require one.",
    "The trouble up north has brought many refugees to our doors lately."
  ];
  
  // Select responses based on bartender
  if (bartender?.name === "Sapphire") {
    return sapphireResponses[Math.floor(Math.random() * sapphireResponses.length)];
  } else if (bartender?.name === "Amethyst") {
    return amethystResponses[Math.floor(Math.random() * amethystResponses.length)];
  } else if (bartender?.name === "Ruby") {
    return rubyResponses[Math.floor(Math.random() * rubyResponses.length)];
  } else {
    // Default response for unknown bartender
    return "Welcome to the tavern! How can I help you today?";
  }
}

// Handles the AI bartender response logic
async function handleBartenderResponse(message: string, roomId: number) {
  const shouldRespond = Math.random() > 0.6; // 40% chance to respond
  
  if (shouldRespond) {
    // Get the bartender for this specific room
    // Room 1 = Amethyst (The Rose Garden)
    // Room 2 = Sapphire (The Ocean View)
    // Room 3 = Ruby (The Dragon's Den)
    let bartenderId = 1; // Default to Amethyst (first room)
    
    if (roomId === 1) {
      bartenderId = 1; // Amethyst for The Rose Garden
    } else if (roomId === 2) {
      bartenderId = 2; // Sapphire for The Ocean View
    } else if (roomId === 3) {
      bartenderId = 3; // Ruby for The Dragon's Den
    }
    
    const bartender = await storage.getBartender(bartenderId);
    
    if (!bartender) {
      return false;
    }
    
    // Generate a response
    const response = await getBartenderResponse(message, bartender.id);
    
    // Create and store the bartender message
    const bartenderMessage = await storage.createMessage({
      userId: null,
      roomId,
      content: response,
      type: "bartender",
      bartenderId: bartender.id
    });
    
    // Broadcast the bartender's message
    broadcastToRoom(roomId, {
      type: WebSocketMessageType.BARTENDER_RESPONSE,
      payload: {
        message: bartenderMessage,
        bartender: bartender
      }
    });
    
    return true;
  }
  
  return false;
}

// Broadcast a message to all clients in a room
function broadcastToRoom(roomId: number, message: WebSocketMessage) {
  for (const client of connectedClients.values()) {
    if (client.roomId === roomId && client.socket.readyState === WebSocket.OPEN) {
      client.socket.send(JSON.stringify(message));
    }
  }
}

// Handles websocket messages
async function handleMessage(client: ConnectedClient, rawMessage: string) {
  try {
    const message: WebSocketMessage = JSON.parse(rawMessage);
    const { type, payload } = message;
    
    switch (type) {
      case WebSocketMessageType.JOIN_ROOM: {
        const roomId = z.number().parse(payload.roomId);
        const room = await storage.getRoom(roomId);
        
        if (!room) {
          client.socket.send(JSON.stringify({
            type: WebSocketMessageType.ERROR,
            payload: { message: "Room not found" }
          }));
          return;
        }
        
        // Update client's room
        const oldRoomId = client.roomId;
        client.roomId = roomId;
        
        // Update user's room in storage
        await storage.updateUserRoom(client.userId, roomId);
        
        // Get recent messages
        const messages = await storage.getMessagesByRoom(roomId);
        
        // Send room info and messages to client
        client.socket.send(JSON.stringify({
          type: WebSocketMessageType.JOIN_ROOM,
          payload: { room, messages }
        }));
        
        // Notify others in old room that user left
        broadcastToRoom(oldRoomId, {
          type: WebSocketMessageType.USER_LEFT,
          payload: { userId: client.userId }
        });
        
        // Send system message to new room
        const user = await storage.getUser(client.userId);
        if (user) {
          const systemMessage = await storage.createMessage({
            userId: null,
            roomId,
            content: `${user.username} joined the room.`,
            type: "system"
          });
          
          broadcastToRoom(roomId, {
            type: WebSocketMessageType.NEW_MESSAGE,
            payload: { message: systemMessage }
          });
          
          // Notify others in new room that user joined
          broadcastToRoom(roomId, {
            type: WebSocketMessageType.USER_JOINED,
            payload: { user }
          });
          
          // Send updated user list to everyone in the room
          const onlineUsers = await storage.getOnlineUsers(roomId);
          broadcastToRoom(roomId, {
            type: WebSocketMessageType.ROOM_USERS,
            payload: { users: onlineUsers }
          });
          
          // Send welcome message from the appropriate bartender for this room
          // Room 1 = Amethyst (The Rose Garden)
          // Room 2 = Sapphire (The Ocean View)
          // Room 3 = Ruby (The Dragon's Den)
          let bartenderId = 1; // Default to Amethyst (first room)
          
          if (roomId === 1) {
            bartenderId = 1; // Amethyst for The Rose Garden
          } else if (roomId === 2) {
            bartenderId = 2; // Sapphire for The Ocean View
          } else if (roomId === 3) {
            bartenderId = 3; // Ruby for The Dragon's Den
          }
          
          const bartender = await storage.getBartender(bartenderId);
          
          if (bartender) {
            const welcomeMessage = await storage.createMessage({
              userId: null,
              roomId: roomId,
              content: `Greetings, traveler! I'm ${bartender.name}, what can I get for ya today?`,
              type: "bartender",
              bartenderId: bartender.id
            });
            
            broadcastToRoom(roomId, {
              type: WebSocketMessageType.BARTENDER_RESPONSE,
              payload: {
                message: welcomeMessage,
                bartender: bartender
              }
            });
          }
        }
        break;
      }
      
      case WebSocketMessageType.SEND_MESSAGE: {
        try {
          const validatedPayload = insertMessageSchema.parse(payload);
          validatedPayload.roomId = client.roomId; // Ensure message goes to current room
          
          // Handle emote messages
          if (validatedPayload.type === 'emote') {
            const user = await storage.getUser(client.userId);
            const username = user?.username || 'Someone';
            
            // Create the emote message
            const emoteMessage = await storage.createMessage({
              userId: client.userId,
              roomId: client.roomId,
              content: `${username} ${validatedPayload.content}`,
              type: "emote"
            });
            
            // Broadcast the emote to everyone in the room
            broadcastToRoom(client.roomId, {
              type: WebSocketMessageType.NEW_MESSAGE,
              payload: { message: emoteMessage }
            });
            
            return;
          }
          
          // Process commands
          if (validatedPayload.content.startsWith("/")) {
            if (validatedPayload.content.startsWith("/menu")) {
              // Handle menu command
              const systemMessage = await storage.createMessage({
                userId: null,
                roomId: client.roomId,
                content: "Opening the tavern menu...",
                type: "system"
              });
              
              client.socket.send(JSON.stringify({
                type: WebSocketMessageType.NEW_MESSAGE,
                payload: { message: systemMessage }
              }));
              
              // Send menu items
              const menuItems = await storage.getMenuItems();
              client.socket.send(JSON.stringify({
                type: WebSocketMessageType.ORDER_ITEM,
                payload: { 
                  action: "open_menu",
                  menuItems
                }
              }));
              return;
            }
            else if (validatedPayload.content.startsWith("/order")) {
              // Handle order command
              const item = validatedPayload.content.substring(7).trim();
              
              const systemMessage = await storage.createMessage({
                userId: null,
                roomId: client.roomId,
                content: `You ordered: ${item}`,
                type: "system"
              });
              
              broadcastToRoom(client.roomId, {
                type: WebSocketMessageType.NEW_MESSAGE,
                payload: { message: systemMessage }
              });
              
              // Trigger bartender response
              setTimeout(async () => {
                await handleBartenderResponse(`/order ${item}`, client.roomId);
                
                // After a delay, show serving animation with the appropriate bartender
                setTimeout(async () => {
                  // Get the bartender for this specific room
                  // Room 1 = Amethyst (The Rose Garden)
                  // Room 2 = Sapphire (The Ocean View)
                  // Room 3 = Ruby (The Dragon's Den)
                  let bartenderId = 1; // Default to Amethyst (first room)
                  
                  if (client.roomId === 1) {
                    bartenderId = 1; // Amethyst for The Rose Garden
                  } else if (client.roomId === 2) {
                    bartenderId = 2; // Sapphire for The Ocean View
                  } else if (client.roomId === 3) {
                    bartenderId = 3; // Ruby for The Dragon's Den
                  }
                  
                  const bartender = await storage.getBartender(bartenderId);
                  
                  if (bartender) {
                    const serveMessage = await storage.createMessage({
                      userId: null,
                      roomId: client.roomId,
                      content: `${bartender.name} slides a fresh ${item} across the counter to you.`,
                      type: "system"
                    });
                    
                    broadcastToRoom(client.roomId, {
                      type: WebSocketMessageType.NEW_MESSAGE,
                      payload: { message: serveMessage }
                    });
                  }
                }, 2000);
              }, 1000);
              
              return;
            }
          }
          
          // Store and broadcast regular message
          const newMessage = await storage.createMessage(validatedPayload);
          
          broadcastToRoom(client.roomId, {
            type: WebSocketMessageType.NEW_MESSAGE,
            payload: { message: newMessage }
          });
          
          // Sometimes trigger a bartender response
          setTimeout(async () => {
            await handleBartenderResponse(validatedPayload.content, client.roomId);
          }, 1000 + Math.random() * 2000);
        } catch (err) {
          client.socket.send(JSON.stringify({
            type: WebSocketMessageType.ERROR,
            payload: { message: "Invalid message format" }
          }));
        }
        break;
      }
      
      case WebSocketMessageType.ORDER_ITEM: {
        const itemId = z.number().parse(payload.itemId);
        const menuItem = await storage.getMenuItem(itemId);
        
        if (!menuItem) {
          client.socket.send(JSON.stringify({
            type: WebSocketMessageType.ERROR,
            payload: { message: "Menu item not found" }
          }));
          return;
        }
        
        // Create system message about the order
        const systemMessage = await storage.createMessage({
          userId: null,
          roomId: client.roomId,
          content: `You ordered: ${menuItem.name}`,
          type: "system"
        });
        
        broadcastToRoom(client.roomId, {
          type: WebSocketMessageType.NEW_MESSAGE,
          payload: { message: systemMessage }
        });
        
        // Trigger bartender response
        setTimeout(async () => {
          // Get the bartender for this specific room
          // Room 1 = Amethyst (The Rose Garden)
          // Room 2 = Sapphire (The Ocean View)
          // Room 3 = Ruby (The Dragon's Den)
          let bartenderId = 1; // Default to Amethyst (first room)
          
          if (client.roomId === 1) {
            bartenderId = 1; // Amethyst for The Rose Garden
          } else if (client.roomId === 2) {
            bartenderId = 2; // Sapphire for The Ocean View
          } else if (client.roomId === 3) {
            bartenderId = 3; // Ruby for The Dragon's Den
          }
          
          const bartender = await storage.getBartender(bartenderId);
          
          if (!bartender) {
            return;
          }
          
          // Get personalized response from the bartender
          const response = await getBartenderResponse(`/order ${menuItem.name}`, bartender.id);
          
          const responseMessage = await storage.createMessage({
            userId: null,
            roomId: client.roomId,
            content: response,
            type: "bartender",
            bartenderId: bartender.id
          });
          
          broadcastToRoom(client.roomId, {
            type: WebSocketMessageType.BARTENDER_RESPONSE,
            payload: {
              message: responseMessage,
              bartender: bartender
            }
          });
          
          // After a delay, show serving animation
          setTimeout(async () => {
            const serveMessage = await storage.createMessage({
              userId: null,
              roomId: client.roomId,
              content: `${bartender.name} slides a fresh ${menuItem.name} across the counter to you.`,
              type: "system"
            });
            
            broadcastToRoom(client.roomId, {
              type: WebSocketMessageType.NEW_MESSAGE,
              payload: { message: serveMessage }
            });
          }, 2000);
        }, 1000);
        
        break;
      }
      
      default:
        client.socket.send(JSON.stringify({
          type: WebSocketMessageType.ERROR,
          payload: { message: "Unknown message type" }
        }));
    }
  } catch (err) {
    console.error("Error handling message:", err);
    client.socket.send(JSON.stringify({
      type: WebSocketMessageType.ERROR,
      payload: { message: "Error processing message" }
    }));
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Setup API routes
  app.get("/api/rooms", async (req, res) => {
    try {
      const rooms = await storage.getRooms();
      res.json(rooms);
    } catch (err) {
      res.status(500).json({ message: "Error fetching rooms" });
    }
  });
  
  app.post("/api/rooms", async (req, res) => {
    try {
      const validatedRoom = insertRoomSchema.parse(req.body);
      const room = await storage.createRoom(validatedRoom);
      res.status(201).json(room);
    } catch (err) {
      res.status(400).json({ message: "Invalid room data" });
    }
  });
  
  app.get("/api/bartenders", async (req, res) => {
    try {
      const bartenders = await storage.getBartenders();
      res.json(bartenders);
    } catch (err) {
      res.status(500).json({ message: "Error fetching bartenders" });
    }
  });
  
  app.get("/api/menu", async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const menuItems = await storage.getMenuItems(category);
      res.json(menuItems);
    } catch (err) {
      res.status(500).json({ message: "Error fetching menu items" });
    }
  });
  
  // Setup WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', async (socket) => {
    try {
      // Wait for initial authentication/registration message
      socket.once('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());
          
          // User registration message
          if (message.type === WebSocketMessageType.USER_JOINED) {
            try {
              const userData = insertUserSchema.parse(message.payload);
              
              // Check if username is taken
              const existingUser = await storage.getUserByUsername(userData.username);
              if (existingUser) {
                if (existingUser.online) {
                  socket.send(JSON.stringify({
                    type: WebSocketMessageType.ERROR,
                    payload: { message: "Username already taken" }
                  }));
                  socket.close();
                  return;
                } else {
                  // User exists but is offline, update to online
                  await storage.updateUserStatus(existingUser.id, true);
                  
                  // Add client to connected clients
                  connectedClients.set(socket, {
                    socket,
                    userId: existingUser.id,
                    roomId: existingUser.roomId
                  });
                  
                  // Send welcome back message
                  socket.send(JSON.stringify({
                    type: WebSocketMessageType.USER_JOINED,
                    payload: { 
                      user: existingUser,
                      rooms: await storage.getRooms(),
                      bartenders: await storage.getBartenders() 
                    }
                  }));
                  
                  // Create system message for welcome back
                  const systemMessage = await storage.createMessage({
                    userId: null,
                    roomId: existingUser.roomId,
                    content: `${existingUser.username} returned to the tavern.`,
                    type: "system"
                  });
                  
                  broadcastToRoom(existingUser.roomId, {
                    type: WebSocketMessageType.NEW_MESSAGE,
                    payload: { message: systemMessage }
                  });
                  
                  // Update user list
                  const onlineUsers = await storage.getOnlineUsers(existingUser.roomId);
                  broadcastToRoom(existingUser.roomId, {
                    type: WebSocketMessageType.ROOM_USERS,
                    payload: { users: onlineUsers }
                  });
                }
              } else {
                // Create new user
                const user = await storage.createUser(userData);
                
                // Add client to connected clients
                connectedClients.set(socket, {
                  socket,
                  userId: user.id,
                  roomId: user.roomId
                });
                
                // Send welcome message
                socket.send(JSON.stringify({
                  type: WebSocketMessageType.USER_JOINED,
                  payload: { 
                    user,
                    rooms: await storage.getRooms(),
                    bartenders: await storage.getBartenders() 
                  }
                }));
                
                // Create system message for new user
                const systemMessage = await storage.createMessage({
                  userId: null,
                  roomId: user.roomId,
                  content: `${user.username} entered the tavern.`,
                  type: "system"
                });
                
                // Broadcast to all users in the room
                broadcastToRoom(user.roomId, {
                  type: WebSocketMessageType.NEW_MESSAGE,
                  payload: { message: systemMessage }
                });
                
                // Send welcome message from the appropriate bartender for this room
                // Room 1 = Amethyst (The Rose Garden)
                // Room 2 = Sapphire (The Ocean View)
                // Room 3 = Ruby (The Dragon's Den)
                let bartenderId = 1; // Default to Amethyst (first room)
                
                if (user.roomId === 1) {
                  bartenderId = 1; // Amethyst for The Rose Garden
                } else if (user.roomId === 2) {
                  bartenderId = 2; // Sapphire for The Ocean View
                } else if (user.roomId === 3) {
                  bartenderId = 3; // Ruby for The Dragon's Den
                }
                
                const bartender = await storage.getBartender(bartenderId);
                
                if (bartender) {
                  const welcomeMessage = await storage.createMessage({
                    userId: null,
                    roomId: user.roomId,
                    content: `Greetings, traveler! I'm ${bartender.name}, what can I get for ya today?`,
                    type: "bartender",
                    bartenderId: bartender.id
                  });
                  
                  broadcastToRoom(user.roomId, {
                    type: WebSocketMessageType.BARTENDER_RESPONSE,
                    payload: {
                      message: welcomeMessage,
                      bartender: bartender
                    }
                  });
                }
                
                // Update user list
                const onlineUsers = await storage.getOnlineUsers(user.roomId);
                broadcastToRoom(user.roomId, {
                  type: WebSocketMessageType.ROOM_USERS,
                  payload: { users: onlineUsers }
                });
              }
              
              // Handle subsequent messages
              socket.on('message', (data) => {
                const client = connectedClients.get(socket);
                if (client) {
                  handleMessage(client, data.toString());
                }
              });
              
              // Handle disconnection
              socket.on('close', async () => {
                const client = connectedClients.get(socket);
                if (client) {
                  // Update user status to offline
                  await storage.updateUserStatus(client.userId, false);
                  
                  // Get user info before removing from connected clients
                  const user = await storage.getUser(client.userId);
                  
                  // Remove from connected clients
                  connectedClients.delete(socket);
                  
                  if (user) {
                    // Create system message for user leaving
                    const systemMessage = await storage.createMessage({
                      userId: null,
                      roomId: client.roomId,
                      content: `${user.username} left the tavern.`,
                      type: "system"
                    });
                    
                    broadcastToRoom(client.roomId, {
                      type: WebSocketMessageType.NEW_MESSAGE,
                      payload: { message: systemMessage }
                    });
                    
                    // Update user list
                    const onlineUsers = await storage.getOnlineUsers(client.roomId);
                    broadcastToRoom(client.roomId, {
                      type: WebSocketMessageType.ROOM_USERS,
                      payload: { users: onlineUsers }
                    });
                  }
                }
              });
              
            } catch (err) {
              console.error("Error in user registration:", err);
              socket.send(JSON.stringify({
                type: WebSocketMessageType.ERROR,
                payload: { message: "Invalid user data" }
              }));
              socket.close();
            }
          } else {
            socket.send(JSON.stringify({
              type: WebSocketMessageType.ERROR,
              payload: { message: "First message must be user registration" }
            }));
            socket.close();
          }
          
        } catch (err) {
          console.error("Error parsing initial message:", err);
          socket.send(JSON.stringify({
            type: WebSocketMessageType.ERROR,
            payload: { message: "Invalid message format" }
          }));
          socket.close();
        }
      });
    } catch (err) {
      console.error("WebSocket error:", err);
      socket.close();
    }
  });
  
  return httpServer;
}
