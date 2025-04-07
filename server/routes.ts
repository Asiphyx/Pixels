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

// Simple bartender AI logic
function getBartenderResponse(message: string, bartenderId: number): string {
  // Process commands
  if (message.startsWith("/order")) {
    const item = message.substring(7).trim();
    return `Coming right up! One ${item} for ya!`;
  }
  
  // Generic responses
  const genericResponses = [
    "Need a refill on that drink?",
    "You haven't heard about the dragon sightings, have ya?",
    "Keep it down, some patrons are trying to enjoy their meals!",
    "Interesting tale, traveler! Got any more stories to share?",
    "The innkeeper's been lookin' for help with some odd jobs. Interested?",
    "Have ya tried our Dragon's Breath Ale? It's our specialty!",
    "Been seeing some strange folk around these parts lately...",
    "Did ya hear about the treasure in the mountains? Just rumors, I'm sure.",
    "Mind yer manners in here, we don't want any trouble tonight.",
    "That's quite the weapon you've got there. Hope you don't need to use it.",
    "Weather's been strange lately. Some say it's magical in nature."
  ];
  
  return genericResponses[Math.floor(Math.random() * genericResponses.length)];
}

// Handles the AI bartender response logic
async function handleBartenderResponse(message: string, roomId: number) {
  const shouldRespond = Math.random() > 0.6; // 40% chance to respond
  
  if (shouldRespond) {
    // Get a random bartender
    const bartenders = await storage.getBartenders();
    const randomBartender = bartenders[Math.floor(Math.random() * bartenders.length)];
    
    // Generate a response
    const response = getBartenderResponse(message, randomBartender.id);
    
    // Create and store the bartender message
    const bartenderMessage = await storage.createMessage({
      userId: null,
      roomId,
      content: response,
      type: "bartender",
      bartenderId: randomBartender.id
    });
    
    // Broadcast the bartender's message
    broadcastToRoom(roomId, {
      type: WebSocketMessageType.BARTENDER_RESPONSE,
      payload: {
        message: bartenderMessage,
        bartender: randomBartender
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
        }
        break;
      }
      
      case WebSocketMessageType.SEND_MESSAGE: {
        try {
          const validatedPayload = insertMessageSchema.parse(payload);
          validatedPayload.roomId = client.roomId; // Ensure message goes to current room
          
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
                
                // After a delay, show serving animation
                setTimeout(async () => {
                  const bartenders = await storage.getBartenders();
                  const randomBartender = bartenders[Math.floor(Math.random() * bartenders.length)];
                  
                  const serveMessage = await storage.createMessage({
                    userId: null,
                    roomId: client.roomId,
                    content: `${randomBartender.name} slides a fresh ${item} across the counter to you.`,
                    type: "system"
                  });
                  
                  broadcastToRoom(client.roomId, {
                    type: WebSocketMessageType.NEW_MESSAGE,
                    payload: { message: serveMessage }
                  });
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
          const bartenders = await storage.getBartenders();
          const randomBartender = bartenders[Math.floor(Math.random() * bartenders.length)];
          
          const responseMessage = await storage.createMessage({
            userId: null,
            roomId: client.roomId,
            content: `Coming right up! One ${menuItem.name} for ya!`,
            type: "bartender",
            bartenderId: randomBartender.id
          });
          
          broadcastToRoom(client.roomId, {
            type: WebSocketMessageType.BARTENDER_RESPONSE,
            payload: {
              message: responseMessage,
              bartender: randomBartender
            }
          });
          
          // After a delay, show serving animation
          setTimeout(async () => {
            const serveMessage = await storage.createMessage({
              userId: null,
              roomId: client.roomId,
              content: `${randomBartender.name} slides a fresh ${menuItem.name} across the counter to you.`,
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
                
                // Send welcome message from a random bartender
                const bartenders = await storage.getBartenders();
                const randomBartender = bartenders[Math.floor(Math.random() * bartenders.length)];
                
                const welcomeMessage = await storage.createMessage({
                  userId: null,
                  roomId: user.roomId,
                  content: `Greetings, traveler! I'm ${randomBartender.name}, what can I get for ya today?`,
                  type: "bartender",
                  bartenderId: randomBartender.id
                });
                
                broadcastToRoom(user.roomId, {
                  type: WebSocketMessageType.BARTENDER_RESPONSE,
                  payload: {
                    message: welcomeMessage,
                    bartender: randomBartender
                  }
                });
                
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
