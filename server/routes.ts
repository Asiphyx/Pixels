import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { db } from "./db";
import { 
  WebSocketMessageType, 
  WebSocketMessage,
  insertUserSchema,
  insertMessageSchema,
  insertRoomSchema,
  InsertUser,
  users
} from "@shared/schema";
import { z } from "zod";
import { getOpenRouterResponse, checkForBartenderMention, extractQueryFromMention } from "./openRouter";
import { analyzeSentiment, adjustResponseBasedOnMood } from "./sentiment";

// Track which bartenders have already greeted each user (persists across room changes)
// Key is userId, value is Set of bartender IDs that have greeted this user
const userGreetedByBartenders: Map<number, Set<number>> = new Map();

// Store connected clients with their user info
interface ConnectedClient {
  socket: WebSocket;
  userId: number;
  roomId: number;
  username: string;
}

const connectedClients: Map<WebSocket, ConnectedClient> = new Map();

/**
 * Clear all connected clients when the server starts
 * This ensures we don't have stale client connections after restart
 */
export function clearConnectedClients() {
  connectedClients.clear();
  userGreetedByBartenders.clear();
  console.log("[websocket] Cleared connected clients on server start");
}

/**
 * Resets all user online statuses to false
 * This is useful when restarting the server to prevent "user already exists" errors
 */
export async function resetUserOnlineStatus() {
  try {
    await db.update(users).set({ online: false });
    console.log("[database] Reset all user online statuses to offline");
  } catch (error) {
    console.error("[database] Error resetting user online statuses:", error);
  }
}

// Handles the AI bartender response logic
async function handleBartenderResponse(message: string, roomId: number, username: string = 'Guest', forcedBartenderName?: string, userId?: number) {
  // Force a response if a specific bartender is mentioned or if the random chance is met
  const shouldRespond = forcedBartenderName ? true : Math.random() > 0.6; // 40% chance to respond if not forced
  
  if (!shouldRespond) return;
  
  try {
    // Get the appropriate bartender to respond
    let bartenderId: number;
    let bartenderName: string;
    
    if (forcedBartenderName) {
      // Use the specified bartender name
      const bartender = await storage.getBartenderByName(forcedBartenderName);
      if (!bartender) return; // Exit if bartender not found
      
      bartenderId = bartender.id;
      bartenderName = bartender.name;
    } else {
      // Use the bartender assigned to the current room
      const room = await storage.getRoom(roomId);
      if (!room || !room.bartenderId) return;
      
      const bartender = await storage.getBartender(room.bartenderId);
      if (!bartender) return;
      
      bartenderId = bartender.id;
      bartenderName = bartender.name;
    }
    
    // Get the userId for context if available
    const messageWithContext = message;
    
    // Get a response from the AI bartender
    const responseText = await getBartenderResponse(messageWithContext, bartenderId, username, userId);
    
    // Create a message from the bartender
    const bartenderMessage = await storage.createMessage({
      userId: null, // null userId indicates a system or NPC message
      roomId,
      content: responseText,
      type: "bartender",
      bartenderId
    });
    
    // Send the message to all clients in the room
    broadcastToRoom(roomId, {
      type: WebSocketMessageType.NEW_MESSAGE,
      payload: { message: bartenderMessage }
    });
  } catch (error) {
    console.error("Error handling bartender response:", error);
  }
}

// Broadcast a message to all clients in a specific room
function broadcastToRoom(roomId: number, message: WebSocketMessage) {
  for (const client of connectedClients.values()) {
    if (client.roomId === roomId) {
      client.socket.send(JSON.stringify(message));
    }
  }
}

// Handle incoming WebSocket messages
async function handleMessage(client: ConnectedClient, rawMessage: string) {
  try {
    const message: WebSocketMessage = JSON.parse(rawMessage);
    
    switch (message.type) {
      case WebSocketMessageType.NEW_MESSAGE:
        // Validate message format
        const validatedMessage = insertMessageSchema.parse({
          ...message.payload,
          userId: client.userId,
          roomId: client.roomId,
          type: "user"
        });
        
        // Check for @mentions of bartenders
        const mentionedBartender = checkForBartenderMention(validatedMessage.content);
        let messageContent = validatedMessage.content;
        
        // If bartender is mentioned, extract the actual message content without the @mention
        if (mentionedBartender) {
          messageContent = extractQueryFromMention(validatedMessage.content, mentionedBartender);
          validatedMessage.content = messageContent;
        }
        
        // Store message in database
        const newMessage = await storage.createMessage(validatedMessage);
        
        // Broadcast to all clients in the room
        broadcastToRoom(client.roomId, {
          type: WebSocketMessageType.NEW_MESSAGE,
          payload: { message: newMessage }
        });
        
        // If a bartender was mentioned, have them respond directly
        if (mentionedBartender) {
          await handleBartenderResponse(messageContent, client.roomId, client.username, mentionedBartender, client.userId);
        } else {
          // Otherwise, have random chance for ambient bartender response
          await handleBartenderResponse(messageContent, client.roomId, client.username, undefined, client.userId);
        }
        break;
        
      case WebSocketMessageType.ROOM_CHANGE:
        const { roomId } = message.payload;
        
        // Update client's room
        const oldRoomId = client.roomId;
        client.roomId = roomId;
        
        // Update user's room in database
        await storage.updateUserRoom(client.userId, roomId);
        
        // Create system message for user leaving old room
        const leaveMessage = await storage.createMessage({
          userId: null,
          roomId: oldRoomId,
          content: `${client.username} left the room.`,
          type: "system"
        });
        
        // Create system message for user joining new room
        const joinMessage = await storage.createMessage({
          userId: null,
          roomId,
          content: `${client.username} entered the room.`,
          type: "system"
        });
        
        // Broadcast leave message to old room
        broadcastToRoom(oldRoomId, {
          type: WebSocketMessageType.NEW_MESSAGE,
          payload: { message: leaveMessage }
        });
        
        // Update user list for old room
        const oldRoomUsers = await storage.getOnlineUsers(oldRoomId);
        broadcastToRoom(oldRoomId, {
          type: WebSocketMessageType.ROOM_USERS,
          payload: { users: oldRoomUsers }
        });
        
        // Broadcast join message to new room
        broadcastToRoom(roomId, {
          type: WebSocketMessageType.NEW_MESSAGE,
          payload: { message: joinMessage }
        });
        
        // Update user list for new room
        const newRoomUsers = await storage.getOnlineUsers(roomId);
        broadcastToRoom(roomId, {
          type: WebSocketMessageType.ROOM_USERS,
          payload: { users: newRoomUsers }
        });
        
        // Notify client of room change success
        client.socket.send(JSON.stringify({
          type: WebSocketMessageType.ROOM_CHANGE,
          payload: { success: true, roomId }
        }));
        
        // Get room's bartender to possibly greet the user
        const room = await storage.getRoom(roomId);
        if (!room || !room.bartenderId) break;
        
        const bartenderId = room.bartenderId;
        
        // Get user's greeted bartenders set, or create if it doesn't exist
        let userGreeted = userGreetedByBartenders.get(client.userId);
        if (!userGreeted) {
          userGreeted = new Set();
          userGreetedByBartenders.set(client.userId, userGreeted);
        }
        
        // If this bartender hasn't greeted the user yet, have them greet
        if (!userGreeted.has(bartenderId)) {
          // Mark bartender as having greeted user
          userGreeted.add(bartenderId);
          
          // Get bartender and generate greeting
          const bartender = await storage.getBartender(bartenderId);
          if (!bartender) break;
          
          // Wait a moment before bartender greets (seems more natural)
          setTimeout(async () => {
            try {
              const greetingMessage = `*looks up as you enter* Welcome to ${room.name}! I'm ${bartender.name}. What brings you to our tavern today?`;
              
              // Create greeting message
              const bartenderGreeting = await storage.createMessage({
                userId: null,
                roomId,
                content: greetingMessage,
                type: "bartender",
                bartenderId
              });
              
              // Broadcast greeting
              broadcastToRoom(roomId, {
                type: WebSocketMessageType.NEW_MESSAGE,
                payload: { message: bartenderGreeting }
              });
            } catch (error) {
              console.error("Error creating bartender greeting:", error);
            }
          }, 2000); // 2 second delay for greeting
        }
        break;
        
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

async function getBartenderResponse(message: string, bartenderId: number, username: string = 'Guest', userId?: number): Promise<string> {
  // Get the bartender to determine which sister is responding
  const bartender = await storage.getBartender(bartenderId);
  if (!bartender) return "Welcome to the tavern! How can I help you today?";
  
  // Process orders using preset responses for better performance with order commands
  if (message.startsWith("/order")) {
    const item = message.substring(7).trim();
    
    // Different responses based on each sister's unique personality
    const orderResponses: Record<string, string[]> = {
      "Sapphire": [
        `*Her tattoos ripple as she grabs a bottle* Not bad taste for a surface-dweller. ${item} coming up. This stuff's from the deep currents where mainstream beverages fear to swim. *winks enigmatically*`,
        `A ${item}? *smirks* The void beneath the waves whispered you'd order that. I add crushed coral that glows in the dark - totally toxic to some species, but you'll probably survive. Probably.`,
        `*Carves a strange symbol into the ice* ${item}? That's what the bones predicted. I've modified this recipe with essence from the abyss. Most people can't handle it, but I can sense you're... different. *her eyes flicker with blue light*`
      ],
      "Amethyst": [
        `*Gasps dramatically* Omigosh, you ordered my favorite! One super-special ${item} coming right up, darling~! *twirls a bottle with unnecessary flourish* I'll make it extra strong just for you, teehee~! *winks with a sparkle effect*`,
        `*Clasps hands together excitedly* A ${item}?! PERFECT choice! *giggles* Watch this, cutie~! *performs an overly elaborate mixing routine with magical sparkles* This is my ULTIMATE version with my secret love potion ingredient! *blows a kiss*`,
        `*Eyes widen with exaggerated surprise* Waaah~! I haven't made a ${item} since the Grand Magical Tournament! *spins dramatically* Lucky for you, I'm the BEST at making these! *strikes a cute pose* One super-special drink for my new favorite customer~!`
      ],
      "Ruby": [
        `*Nods once, efficiently* ${item}. Optimal selection based on current ambient temperature and humidity levels. *measures ingredients with scientific precision* Our batch from last Tuesday achieved a 96.8% satisfaction rating. This will be 97.2%.`,
        `*Makes a quick notation in her ledger* ${item} ordered at precisely the statistical peak time for its consumption. *analyzes glass against the light* I've adjusted the dilution ratio by 0.4% to account for barometric pressure. It will be served in exactly 42 seconds.`,
        `*Without wasted movement* One ${item}. *measures with mechanical precision* I've documented 37 variations of this recipe. Based on your pupil dilation and posture, I've selected variant 23B. *slight efficient smile* It will prove most satisfactory.`
      ]
    };
    
    // Select a random response for the bartender
    const responses = orderResponses[bartender.name] || [`One ${item} coming right up! Anything else I can get ya?`];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  // For all other cases, use the OpenRouter API to generate a dynamic, personalized response
  try {
    // Get a response from the OpenRouter API based on the bartender's personality and pass userId if available
    return await getOpenRouterResponse(bartender.name, message, username, userId, bartender.id);
  } catch (error) {
    console.error('Error getting AI response from OpenRouter', error);
    
    // Fallback to predefined responses if OpenRouter fails
    const fallbackResponses = {
      "Sapphire": [
        "*Squints with glowing eyes* The deep ones whisper when you speak. There's something... different about your aura. Most normies don't have that kind of resonance with the void.",
        "*Traces a water-like pattern on the bar* I can read the currents around you. You're swimming against something big. Most people just go with the flow. *smirks* That's why they drown.",
        "*Her tattoos shift subtly* The mainstream crowd wouldn't understand what I'm seeing, but I think you might. The ocean's been restless lately. Something's stirring in the depths beyond convention."
      ],
      "Amethyst": [
        "*Gasps dramatically* Oh. Em. Gee! You are just the CUTEST thing I've seen all day~! *clutches heart* I could just wrap you up in a sparkly bow and keep you forever, darling~! *giggles*",
        "*Twirls a lock of pink hair* Teehee~! Did you know my Rose Garden blooms at midnight? *leans in too close* That's when I use my SUPER special magic! Isn't that just the most amazing thing EVER?! *bounces excitedly*",
        "*Eyes widen with enthusiasm* Waaah~! You remind me of this hero from my favorite love story! So brave and dashing! *dramatic sigh* Do you believe in love at first sight, sweetie? Because I think I've fallen for you! *winks flirtatiously*"
      ],
      "Ruby": [
        "*Makes precise note in ledger* Current conversation efficiency: 76.4%. Projected information exchange value: moderate to high. *slight nod* Proceed with query when ready. I'm collecting data for the quarterly assessment.",
        "*Arranges bottles in perfect alignment* According to my records, this is your first visit to The Dragon's Den. *calculates briefly* Based on observed preferences of demographically similar patrons, there is an 83.2% probability you'll enjoy our house mead.",
        "*Polishes glass methodically* The Dragon's Den information exchange network has documented 347 rumors in the past week. *assesses you carefully* With the correct investment, access could be arranged to precisely the data you require."
      ]
    };
    
    // Select a random fallback response for the bartender
    const responses = fallbackResponses[bartender.name as keyof typeof fallbackResponses] || ["Welcome to the tavern! How can I help you today?"];
    return responses[Math.floor(Math.random() * responses.length)];
  }
}

// Export registerRoutes to use in index.ts
export async function registerRoutes(app: Express): Promise<Server> {
  // WebSocket server for real-time communication
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ noServer: true });
  
  httpServer.on('upgrade', (request, socket, head) => {
    // Parse URL query parameters for auth info
    try {
      const parsedUrl = new URL(request.url || "", `http://${request.headers.host}`);
      const token = parsedUrl.searchParams.get('token');
      const avatar = parsedUrl.searchParams.get('avatar');
      
      if (token && avatar) {
        try {
          // Try to authenticate user from URL parameters
          const userData: InsertUser = {
            username: token,
            avatar: avatar,
            roomId: 1 // Default to first room (The Rose Garden)
          };
          
          wss.handleUpgrade(request, socket, head, async (socket) => {
            wss.emit('connection', socket, request, userData);
          });
        } catch (error) {
          console.error('Error processing query parameters:', error);
        }
      } else {
        // No token provided, upgrade anyway and handle auth in connection message
        wss.handleUpgrade(request, socket, head, async (socket) => {
          wss.emit('connection', socket, request);
        });
      }
    } catch (err) {
      console.error("WebSocket upgrade error:", err);
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
    }
  });
  
  // Handle WebSocket connections
  wss.on('connection', (socket, request, userData?: InsertUser) => {
    console.log('WebSocket connection established');
    
    // If we have user data from URL params, authenticate immediately
    if (userData) {
      handleUserConnection(socket, userData);
      return;
    }
    
    // Otherwise wait for auth message
    socket.once('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        // User registration or login message
        if (message.type === WebSocketMessageType.USER_JOINED || message.type === WebSocketMessageType.LOGIN) {
          try {
            const userData = insertUserSchema.parse(message.payload);
            await handleUserConnection(socket, userData, message.type === WebSocketMessageType.LOGIN);
          } catch (err) {
            console.error("Invalid user data:", err);
            socket.send(JSON.stringify({
              type: WebSocketMessageType.ERROR,
              payload: { message: "Invalid user data" }
            }));
            socket.close();
          }
        } else {
          // First message must be auth
          socket.send(JSON.stringify({
            type: WebSocketMessageType.ERROR,
            payload: { message: "You must authenticate first" }
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
  });
  
  // Handle user login/registration and connection setup
  async function handleUserConnection(socket: WebSocket, userData: InsertUser, isLogin: boolean = false) {
    try {
      // Check if username exists for login or registration
      const existingUser = await storage.getUserByUsername(userData.username);
      
      if (isLogin) {
        // LOGIN Flow
        if (!existingUser) {
          // User not found, send error
          socket.send(JSON.stringify({
            type: WebSocketMessageType.ERROR,
            payload: { message: "Account not found. Please register first." }
          }));
          socket.close();
          return;
        }
        
        if (existingUser.online) {
          // User already online, can't log in twice
          socket.send(JSON.stringify({
            type: WebSocketMessageType.ERROR,
            payload: { message: "This account is already logged in elsewhere." }
          }));
          socket.close();
          return;
        }
        
        // Update user online status
        await storage.updateUserStatus(existingUser.id, true);
        
        // Add client to connected clients
        connectedClients.set(socket, {
          socket,
          userId: existingUser.id,
          roomId: existingUser.roomId,
          username: existingUser.username
        });
        
        // Initialize greeted bartenders for this user if needed
        if (!userGreetedByBartenders.has(existingUser.id)) {
          userGreetedByBartenders.set(existingUser.id, new Set());
        }
        
        // Send welcome back message with user data
        socket.send(JSON.stringify({
          type: WebSocketMessageType.USER_JOINED,
          payload: { 
            user: existingUser,
            rooms: await storage.getRooms(),
            bartenders: await storage.getBartenders() 
          }
        }));
        
        // Create system message for user logging in
        const systemMessage = await storage.createMessage({
          userId: null,
          roomId: existingUser.roomId,
          content: `${existingUser.username} returned to the tavern.`,
          type: "system"
        });
        
        // Broadcast user joined message
        broadcastToRoom(existingUser.roomId, {
          type: WebSocketMessageType.NEW_MESSAGE,
          payload: { message: systemMessage }
        });
        
        // Send this user recent messages from the room
        const messages = await storage.getRecentMessages(existingUser.roomId);
        socket.send(JSON.stringify({
          type: WebSocketMessageType.ROOM_MESSAGES,
          payload: { messages }
        }));
        
        // Update user list
        const onlineUsers = await storage.getOnlineUsers(existingUser.roomId);
        broadcastToRoom(existingUser.roomId, {
          type: WebSocketMessageType.ROOM_USERS,
          payload: { users: onlineUsers }
        });
      } else {
        // REGISTRATION Flow
        if (existingUser) {
          // Username exists, handle reconnection
          if (existingUser.online) {
            // User is marked as online, reject
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
              roomId: existingUser.roomId,
              username: existingUser.username
            });
            
            // Initialize greeted bartenders for this user if needed
            if (!userGreetedByBartenders.has(existingUser.id)) {
              userGreetedByBartenders.set(existingUser.id, new Set());
            }
            
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
            
            // Send this user recent messages from the room
            const messages = await storage.getRecentMessages(existingUser.roomId);
            socket.send(JSON.stringify({
              type: WebSocketMessageType.ROOM_MESSAGES,
              payload: { messages }
            }));
            
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
            roomId: user.roomId,
            username: user.username
          });
          
          // Initialize greeted bartenders for this user
          userGreetedByBartenders.set(user.id, new Set());
          
          // Send welcome message with user data
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
            content: `${user.username} entered the tavern for the first time.`,
            type: "system"
          });
          
          broadcastToRoom(user.roomId, {
            type: WebSocketMessageType.NEW_MESSAGE,
            payload: { message: systemMessage }
          });
          
          // Send this user recent messages from the room
          const messages = await storage.getRecentMessages(user.roomId);
          socket.send(JSON.stringify({
            type: WebSocketMessageType.ROOM_MESSAGES,
            payload: { messages }
          }));
          
          // Update user list
          const onlineUsers = await storage.getOnlineUsers(user.roomId);
          broadcastToRoom(user.roomId, {
            type: WebSocketMessageType.ROOM_USERS,
            payload: { users: onlineUsers }
          });
        }
      }
      
      // Listen for messages after authentication
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
          try {
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
          } catch (err) {
            console.error("Error handling disconnection:", err);
          }
        }
      });
    } catch (err) {
      console.error("WebSocket error:", err);
      socket.close();
    }
  }
  
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

  return httpServer;
}