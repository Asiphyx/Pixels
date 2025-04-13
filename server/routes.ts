import type { Express, Request, Response, NextFunction } from "express";
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
  users,
  userAuthSchema,
  userRegisterSchema
} from "@shared/schema";
import { z } from "zod";
import { getOpenRouterResponse, checkForBartenderMention, extractQueryFromMention, isReturningCustomer, getCustomerContext } from "./openRouter";
import { analyzeSentiment, adjustResponseBasedOnMood } from "./sentiment";
import { eq } from "drizzle-orm";
import { authRouter } from "./authRoutes";
import { inventoryRouter } from "./inventoryRoutes";

// Track which bartenders have already greeted each user (persists across room changes)
const userGreetedByBartenders = new Map<number, Set<number>>();

// Connected clients map (WebSocket -> Client info)
const connectedClients = new Map<WebSocket, ConnectedClient>();

// Interface to track connected clients
interface ConnectedClient {
  socket: WebSocket;
  userId: number;
  roomId: number;
  username: string;
}

/**
 * Clear all connected clients when the server starts
 * This ensures we don't have stale client connections after restart
 */
export function clearConnectedClients() {
  connectedClients.clear();
  console.log("[websocket] Cleared all connected clients");
}

/**
 * Resets all user online statuses to false
 * This is useful when restarting the server to prevent "user already exists" errors
 */
export async function resetUserOnlineStatus() {
  try {
    await db.update(users).set({ online: false });
    console.log("[server] Reset all user online statuses to offline");
  } catch (error) {
    console.error("[server] Error resetting user online statuses:", error);
  }
}

/**
 * Gets an AI-generated response from a bartender
 * @param message The user message
 * @param bartenderId The ID of the bartender
 * @param username Optional username for personalized responses
 * @param userId Optional user ID to check returning customer status
 * @returns A string containing the AI-generated response
 */
async function getBartenderResponse(message: string, bartenderId: number, username: string = 'Guest', userId?: number): Promise<string> {
  try {
    // Get bartender info
    const bartender = await storage.getBartender(bartenderId);
    if (!bartender) {
      return "Sorry, I'm not available right now.";
    }
    
    let returning = false;
    let memories = "";
    
    // If we have a user ID, check if they are a returning customer
    if (userId) {
      // Get customer context (returning status and memories)
      const context = await getCustomerContext(userId, bartenderId);
      returning = context.returning;
      memories = context.memories;
    }
    
    // Get the AI response using the OpenRouter API
    const response = await getOpenRouterResponse(
      bartender.name, 
      message, 
      username,
      userId,
      bartenderId
    );
    
    return response;
  } catch (error) {
    console.error(`Error getting bartender response:`, error);
    return "Sorry, I'm having trouble understanding right now. Can you try again?";
  }
}

/**
 * Broadcast a message to all clients in a room
 * @param roomId The room ID to broadcast to
 * @param message The message to broadcast
 */
function broadcastToRoom(roomId: number, message: WebSocketMessage) {
  // Convert to array to avoid iterator issues
  const clients = Array.from(connectedClients.values());
  for (const client of clients) {
    if (client.roomId === roomId && client.socket.readyState === WebSocket.OPEN) {
      client.socket.send(JSON.stringify(message));
    }
  }
}

/**
 * Handles WebSocket messages
 * @param client The connected client info
 * @param rawMessage The raw message string
 */
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
          
          // Get the default bartender for this room
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
            // Check if this user needs a greeting from this bartender
            // Check if the user already has greeting records, if not, initialize
            if (!userGreetedByBartenders.has(client.userId)) {
              userGreetedByBartenders.set(client.userId, new Set<number>());
            }
            
            // Get the set of bartenders that have greeted this user
            const greetedBartenders = userGreetedByBartenders.get(client.userId)!;
            
            // If this bartender hasn't greeted this user yet, do so
            if (!greetedBartenders.has(bartender.id)) {
              // Mark this bartender as having greeted this user
              greetedBartenders.add(bartender.id);
              
              // Different welcome messages based on bartender personality
              const welcomeMessages: Record<string, string[]> = {
                "Sapphire": [
                  `*Her blue undercut shifts as she glances up, eyes glowing slightly* Welcome to The Ocean View, mortal. The tides whispered you'd be washing up today. What can I get ya? Something to drown your mainstream sorrows? *smirks*`,
                  `*Pauses from carving strange symbols into the bar with a jagged dagger* Another soul caught in the current, huh? I'm Sapphire. The Ocean View's where the real ones hang. *taps temple* I can tell you've got depths to you. What'll it be?`,
                  `*The water tattoos on her arms swirl as she notices you* Fresh catch! I'm Sapphire - this is The Ocean View. *leans in conspiratorially* I can read your fortune in your drink if you're brave enough. The depths have been chatty today.`
                ],
                "Amethyst": [
                  `*Her eyes sparkle dramatically as she gasps* Oh my gosh, a new customer~! Kyaa~! Welcome to The Rose Garden, darling! I'm Amethyst-chan, and I simply MUST make you my special love potion cocktail! *winks flirtatiously* What can I get for you, cutie?`,
                  `*Spins around with exaggerated excitement, twin-tails whipping around* Waaah~! A new face! How exciting! *strikes a cute pose* Amethyst at your service! The Rose Garden is THE most magical place in the realm! *leans over the counter* What's your pleasure, sweetie?`,
                  `*Her tattoos glow pink as she clasps her hands together* A new adventurer enters my garden! *dramatic hair flip* I'm Amethyst, and I can tell we're going to be the BEST of friends! *giggles* Let me make you something special that matches your aura, darling~!`
                ],
                "Ruby": [
                  `*Without looking up from her ledger, she speaks precisely* Welcome to The Dragon's Den. I'm Ruby. *finally glances up with calculating eyes* Based on your gait, clothing wear patterns, and the time of your arrival, I'd recommend our Blackberry Mead. Efficient and satisfying.`,
                  `*Makes a quick notation in her book before addressing you* Welcome. The Dragon's Den maintains a 98.7% customer satisfaction rating. I'm Ruby. *adjusts glasses* Our menu is organized by regional origin, alcohol content, and price coefficient. Recommendations available upon request.`,
                  `*Pauses her inventory counting* Welcome to The Dragon's Den. I'm Ruby. *pulls out a small abacus and makes rapid calculations* Based on current inventory and turnover rates, I recommend our Honeyed Mead. *nods precisely* Optimal balance of taste and resource efficiency.`
                ]
              };
              
              // Select a random welcome message for this bartender
              const bartenderWelcomes = welcomeMessages[bartender.name as keyof typeof welcomeMessages] || 
                [`Welcome to ${room.name}. I'm ${bartender.name}. What can I get for you?`];
              
              const welcome = bartenderWelcomes[Math.floor(Math.random() * bartenderWelcomes.length)];
              
              // Create and store the welcome message
              const welcomeMessage = await storage.createMessage({
                userId: null,
                roomId,
                content: welcome,
                type: "bartender",
                bartenderId: bartender.id
              });
              
              // Send the welcome message to the room
              broadcastToRoom(roomId, {
                type: WebSocketMessageType.BARTENDER_RESPONSE,
                payload: {
                  message: welcomeMessage,
                  bartender: bartender
                }
              });
            }
          }
        }
        break;
      }
      
      case WebSocketMessageType.CHAT_MESSAGE: {
        const messageContent = z.string().parse(payload.message);
        
        // Create a new message
        const newMessage = await storage.createMessage({
          userId: client.userId,
          roomId: client.roomId,
          content: messageContent,
          type: "user"
        });
        
        // Broadcast the message
        broadcastToRoom(client.roomId, {
          type: WebSocketMessageType.NEW_MESSAGE,
          payload: { message: newMessage }
        });
        
        // Check for bartender mentions using @name syntax
        const mentionedBartender = checkForBartenderMention(messageContent);
        if (mentionedBartender) {
          // Extract the actual query part from the message (remove the @mention)
          const query = extractQueryFromMention(messageContent, mentionedBartender);
          
          // Force a response from the mentioned bartender
          await handleBartenderResponse(query, client.roomId, client.username, mentionedBartender, client.userId);
        } else {
          // Generate a response from the appropriate bartender with 40% chance
          await handleBartenderResponse(messageContent, client.roomId, client.username, undefined, client.userId);
        }
        
        break;
      }
      
      case WebSocketMessageType.GET_MOODS: {
        if (client.userId) {
          const moods = await storage.getAllBartenderMoodsForUser(client.userId);
          
          // Send the current moods to the client
          client.socket.send(JSON.stringify({
            type: WebSocketMessageType.BARTENDER_MOOD_UPDATE,
            payload: {
              bartenderMoods: moods
            }
          }));
        }
        break;
      }
      
      case WebSocketMessageType.GET_MEMORIES: {
        const bartenderId = z.number().parse(payload.bartenderId);
        
        if (client.userId) {
          const memories = await storage.getSummarizedMemories(client.userId, bartenderId);
          
          // Send the memories to the client
          client.socket.send(JSON.stringify({
            type: WebSocketMessageType.MEMORIES_RESPONSE,
            payload: {
              memories,
              bartenderId
            }
          }));
        }
        break;
      }
      
      case WebSocketMessageType.ORDER_ITEM: {
        try {
          // Check action type
          if (payload.action === 'open_menu') {
            // Fetch menu items from storage
            const menuItems = await storage.getMenuItems();
            
            // Send menu items to the client
            client.socket.send(JSON.stringify({
              type: WebSocketMessageType.ORDER_ITEM,
              payload: {
                action: 'open_menu',
                menuItems
              }
            }));
          } else if (payload.itemId) {
            // Handle ordering a specific item
            const itemId = z.number().parse(payload.itemId);
            const item = await storage.getMenuItem(itemId);
            
            if (item) {
              // Create a system message about the order
              const orderMessage = await storage.createMessage({
                userId: client.userId,
                roomId: client.roomId,
                content: `${client.username} ordered a ${item.name}.`,
                type: "system"
              });
              
              // Broadcast the order to the room
              broadcastToRoom(client.roomId, {
                type: WebSocketMessageType.NEW_MESSAGE,
                payload: { message: orderMessage }
              });
            }
          }
        } catch (error) {
          console.error('Error handling order:', error);
          // Send error back to the client
          client.socket.send(JSON.stringify({
            type: WebSocketMessageType.ERROR,
            payload: { message: "Error processing order" }
          }));
        }
        break;
      }
      
      // Authentication message handlers
      case WebSocketMessageType.AUTH_LOGIN: { // Authentication
        try {
          // Validate login credentials
          const credentials = userAuthSchema.parse(payload);
          
          // Verify user with password check (important for security)
          const user = await storage.verifyUser(credentials.username, credentials.password);
          
          if (!user) {
            client.socket.send(JSON.stringify({
              type: WebSocketMessageType.AUTH_ERROR,
              payload: { message: "Account not found. Please register first." }
            }));
            return;
          }
          
          // Update client info
          client.userId = user.id;
          client.username = user.username;
          client.roomId = user.roomId || 1;
          
          // Update user's online status
          await storage.updateUserStatus(user.id, true);
          
          // Get user data without password
          const { passwordHash, ...userData } = user;
          
          // Send success response with user data
          client.socket.send(JSON.stringify({
            type: WebSocketMessageType.AUTH_SUCCESS,
            payload: { user: {...userData} }
          }));
          
          // Send room join message - using JOIN_ROOM type for compatibility
          client.socket.send(JSON.stringify({
            type: WebSocketMessageType.JOIN_ROOM,
            payload: { 
              room: await storage.getRoom(client.roomId)
            }
          }));
          
          // Get room messages and send each one individually
          const messages = await storage.getMessagesByRoom(client.roomId);
          
          // First send the array as a JOIN_ROOM payload
          client.socket.send(JSON.stringify({
            type: WebSocketMessageType.JOIN_ROOM,
            payload: { 
              room: await storage.getRoom(client.roomId),
              messages
            }
          }));
          
          // Add a welcome system message
          const welcomeMessage = {
            id: Date.now(),
            content: `${client.username} has joined the tavern.`,
            type: 'system',
            userId: null,
            roomId: client.roomId,
            bartenderId: null,
            timestamp: new Date()
          };
          
          // Send the welcome message (using proper message format)
          client.socket.send(JSON.stringify({
            type: WebSocketMessageType.NEW_MESSAGE,
            payload: { message: welcomeMessage }
          }));
          
          // Get and send online users
          const onlineUsers = await storage.getOnlineUsers(client.roomId);
          client.socket.send(JSON.stringify({
            type: WebSocketMessageType.ROOM_USERS,
            payload: { users: onlineUsers }
          }));
          
          // Create system message for user joining
          const systemMessage = await storage.createMessage({
            userId: null,
            roomId: client.roomId,
            content: `${user.username} has joined the tavern.`,
            type: "system"
          });
          
          broadcastToRoom(client.roomId, {
            type: WebSocketMessageType.NEW_MESSAGE,
            payload: { message: systemMessage }
          });
          
          broadcastToRoom(client.roomId, {
            type: WebSocketMessageType.ROOM_USERS,
            payload: { users: onlineUsers }
          });
        } catch (error) {
          console.error('Login error:', error);
          client.socket.send(JSON.stringify({
            type: WebSocketMessageType.AUTH_ERROR,
            payload: { message: "There was a problem with your login. Please check your credentials or register a new account." }
          }));
        }
        break;
      }
      
      case WebSocketMessageType.AUTH_REGISTER: { // User registration
        try {
          // Validate registration data
          const registrationData = userRegisterSchema.parse(payload);
          
          try {
            // Register new user
            const user = await storage.registerUser(
              registrationData.username,
              registrationData.password,
              registrationData.email,
              registrationData.avatar
            );
            
            // Update client info
            client.userId = user.id;
            client.username = user.username;
            
            // Get user data without password
            const { passwordHash, ...userData } = user;
            
            // Send success response
            client.socket.send(JSON.stringify({
              type: WebSocketMessageType.AUTH_SUCCESS,
              payload: { user: userData }
            }));
          } catch (err: any) {
            // Handle duplicate username
            if (err.message?.includes('already taken') || err.message?.includes('already registered')) {
              client.socket.send(JSON.stringify({
                type: WebSocketMessageType.AUTH_ERROR,
                payload: { message: err.message }
              }));
              return;
            }
            throw err;
          }
        } catch (error) {
          console.error('Registration error:', error);
          client.socket.send(JSON.stringify({
            type: WebSocketMessageType.AUTH_ERROR,
            payload: { message: "Invalid registration data" }
          }));
        }
        break;
      }
      
      case WebSocketMessageType.AUTH_LOGOUT: { // User logout
        try {
          if (client.userId) {
            // Update user status to offline
            await storage.updateUserStatus(client.userId, false);
            
            // Create system message for user leaving
            const systemMessage = await storage.createMessage({
              userId: null,
              roomId: client.roomId,
              content: `${client.username} logged out.`,
              type: "system"
            });
            
            // Broadcast to room
            broadcastToRoom(client.roomId, {
              type: WebSocketMessageType.NEW_MESSAGE,
              payload: { message: systemMessage }
            });
            
            // Send confirmation to client
            client.socket.send(JSON.stringify({
              type: WebSocketMessageType.AUTH_SUCCESS,
              payload: { message: "Logged out successfully" }
            }));
          }
        } catch (error) {
          console.error('Logout error:', error);
          client.socket.send(JSON.stringify({
            type: WebSocketMessageType.AUTH_ERROR,
            payload: { message: "Error during logout" }
          }));
        }
        break;
      }
      
      case WebSocketMessageType.AUTH_PROFILE: {
        try {
          if (!client.userId) {
            client.socket.send(JSON.stringify({
              type: WebSocketMessageType.AUTH_ERROR,
              payload: { message: "Not authenticated" }
            }));
            return;
          }
          
          // Get user profile
          const user = await storage.getUser(client.userId);
          
          if (!user) {
            client.socket.send(JSON.stringify({
              type: WebSocketMessageType.AUTH_ERROR,
              payload: { message: "User not found" }
            }));
            return;
          }
          
          // Get user data without password
          const { passwordHash, ...userData } = user;
          
          // Send profile data
          client.socket.send(JSON.stringify({
            type: WebSocketMessageType.AUTH_RESPONSE,
            payload: { user: userData }
          }));
        } catch (error) {
          console.error('Profile fetch error:', error);
          client.socket.send(JSON.stringify({
            type: WebSocketMessageType.AUTH_ERROR,
            payload: { message: "Error fetching profile" }
          }));
        }
        break;
      }
      
      // Inventory message handlers
      case WebSocketMessageType.INVENTORY_GET: { // Get user inventory
        try {
          if (!client.userId) {
            client.socket.send(JSON.stringify({
              type: WebSocketMessageType.ERROR,
              payload: { message: "Not authenticated" }
            }));
            return;
          }
          
          // Get user's inventory
          const inventory = await storage.getUserInventory(client.userId);
          
          // Send inventory data
          client.socket.send(JSON.stringify({
            type: WebSocketMessageType.INVENTORY_UPDATE,
            payload: { inventory }
          }));
        } catch (error) {
          console.error('Inventory fetch error:', error);
          client.socket.send(JSON.stringify({
            type: WebSocketMessageType.ERROR,
            payload: { message: "Error fetching inventory" }
          }));
        }
        break;
      }
      
      case WebSocketMessageType.INVENTORY_GET_EQUIPPED: {
        try {
          if (!client.userId) {
            client.socket.send(JSON.stringify({
              type: WebSocketMessageType.ERROR,
              payload: { message: "Not authenticated" }
            }));
            return;
          }
          
          // Get user's equipped items
          const equippedItems = await storage.getEquippedItems(client.userId);
          
          // Send equipped items data
          client.socket.send(JSON.stringify({
            type: WebSocketMessageType.EQUIPPED_ITEMS_UPDATE,
            payload: { equipped: equippedItems }
          }));
        } catch (error) {
          console.error('Equipped items fetch error:', error);
          client.socket.send(JSON.stringify({
            type: WebSocketMessageType.ERROR,
            payload: { message: "Error fetching equipped items" }
          }));
        }
        break;
      }
      
      case WebSocketMessageType.INVENTORY_ADD_ITEM: { // Add item to inventory
        try {
          if (!client.userId) {
            client.socket.send(JSON.stringify({
              type: WebSocketMessageType.ERROR,
              payload: { message: "Not authenticated" }
            }));
            return;
          }
          
          const itemId = z.number().parse(payload.itemId);
          const quantity = z.number().min(1).default(1).optional().parse(payload.quantity);
          
          // Add item to inventory
          const inventoryItem = await storage.addItemToInventory(client.userId, itemId, quantity || 1);
          
          // Get updated inventory
          const inventory = await storage.getUserInventory(client.userId);
          
          // Send updated inventory
          client.socket.send(JSON.stringify({
            type: WebSocketMessageType.INVENTORY_UPDATE,
            payload: { inventory }
          }));
        } catch (error) {
          console.error('Add item error:', error);
          client.socket.send(JSON.stringify({
            type: WebSocketMessageType.ERROR,
            payload: { message: "Error adding item to inventory" }
          }));
        }
        break;
      }
      
      case WebSocketMessageType.INVENTORY_REMOVE_ITEM: { // Remove item from inventory
        try {
          if (!client.userId) {
            client.socket.send(JSON.stringify({
              type: WebSocketMessageType.ERROR,
              payload: { message: "Not authenticated" }
            }));
            return;
          }
          
          const itemId = z.number().parse(payload.itemId);
          const quantity = z.number().min(1).default(1).optional().parse(payload.quantity);
          
          // Remove item from inventory
          const success = await storage.removeItemFromInventory(client.userId, itemId, quantity || 1);
          
          if (!success) {
            client.socket.send(JSON.stringify({
              type: WebSocketMessageType.ERROR,
              payload: { message: "Item not found in inventory or insufficient quantity" }
            }));
            return;
          }
          
          // Get updated inventory
          const inventory = await storage.getUserInventory(client.userId);
          
          // Send updated inventory
          client.socket.send(JSON.stringify({
            type: WebSocketMessageType.INVENTORY_UPDATE,
            payload: { inventory }
          }));
        } catch (error) {
          console.error('Remove item error:', error);
          client.socket.send(JSON.stringify({
            type: WebSocketMessageType.ERROR,
            payload: { message: "Error removing item from inventory" }
          }));
        }
        break;
      }
      
      case WebSocketMessageType.INVENTORY_EQUIP_ITEM: { // Equip item
        try {
          if (!client.userId) {
            client.socket.send(JSON.stringify({
              type: WebSocketMessageType.ERROR,
              payload: { message: "Not authenticated" }
            }));
            return;
          }
          
          const itemId = z.number().parse(payload.itemId);
          const slot = z.string().parse(payload.slot);
          
          // Equip the item
          const equippedItem = await storage.equipItem(client.userId, itemId, slot);
          
          if (!equippedItem) {
            client.socket.send(JSON.stringify({
              type: WebSocketMessageType.ERROR,
              payload: { message: "Item not found in inventory" }
            }));
            return;
          }
          
          // Get updated equipped items
          const equippedItems = await storage.getEquippedItems(client.userId);
          
          // Send updated equipped items
          client.socket.send(JSON.stringify({
            type: WebSocketMessageType.EQUIPPED_ITEMS_UPDATE,
            payload: { equipped: equippedItems }
          }));
        } catch (error) {
          console.error('Equip item error:', error);
          if (error instanceof Error && error.message === 'Invalid equipment slot') {
            client.socket.send(JSON.stringify({
              type: WebSocketMessageType.ERROR,
              payload: { message: error.message }
            }));
            return;
          }
          
          client.socket.send(JSON.stringify({
            type: WebSocketMessageType.ERROR,
            payload: { message: "Error equipping item" }
          }));
        }
        break;
      }
      
      case WebSocketMessageType.INVENTORY_UNEQUIP_ITEM: { // Unequip item
        try {
          if (!client.userId) {
            client.socket.send(JSON.stringify({
              type: WebSocketMessageType.ERROR,
              payload: { message: "Not authenticated" }
            }));
            return;
          }
          
          const itemId = z.number().parse(payload.itemId);
          
          // Unequip the item
          const unequippedItem = await storage.unequipItem(client.userId, itemId);
          
          if (!unequippedItem) {
            client.socket.send(JSON.stringify({
              type: WebSocketMessageType.ERROR,
              payload: { message: "Item not found or not equipped" }
            }));
            return;
          }
          
          // Get updated equipped items
          const equippedItems = await storage.getEquippedItems(client.userId);
          
          // Send updated equipped items
          client.socket.send(JSON.stringify({
            type: WebSocketMessageType.EQUIPPED_ITEMS_UPDATE,
            payload: { equipped: equippedItems }
          }));
        } catch (error) {
          console.error('Unequip item error:', error);
          client.socket.send(JSON.stringify({
            type: WebSocketMessageType.ERROR,
            payload: { message: "Error unequipping item" }
          }));
        }
        break;
      }
      
      // Currency message handlers
      case WebSocketMessageType.CURRENCY_GET: {
        try {
          if (!client.userId) {
            client.socket.send(JSON.stringify({
              type: WebSocketMessageType.ERROR,
              payload: { message: "Not authenticated" }
            }));
            return;
          }
          
          // Get user's currency
          const currency = await storage.getCurrency(client.userId);
          
          // Send currency data
          client.socket.send(JSON.stringify({
            type: WebSocketMessageType.CURRENCY_UPDATE,
            payload: { currency }
          }));
        } catch (error) {
          console.error('Currency fetch error:', error);
          client.socket.send(JSON.stringify({
            type: WebSocketMessageType.ERROR,
            payload: { message: "Error fetching currency" }
          }));
        }
        break;
      }
      
      case WebSocketMessageType.CURRENCY_ADD: { // Add currency to user
        try {
          if (!client.userId) {
            client.socket.send(JSON.stringify({
              type: WebSocketMessageType.ERROR,
              payload: { message: "Not authenticated" }
            }));
            return;
          }
          
          const silver = z.number().min(0).parse(payload.silver);
          
          // Add currency
          const currency = await storage.addCurrency(client.userId, silver);
          
          // Send updated currency
          client.socket.send(JSON.stringify({
            type: WebSocketMessageType.CURRENCY_UPDATE,
            payload: { currency }
          }));
        } catch (error) {
          console.error('Add currency error:', error);
          client.socket.send(JSON.stringify({
            type: WebSocketMessageType.ERROR,
            payload: { message: "Error adding currency" }
          }));
        }
        break;
      }
      
      case WebSocketMessageType.CURRENCY_SPEND: { // Spend user currency
        try {
          if (!client.userId) {
            client.socket.send(JSON.stringify({
              type: WebSocketMessageType.ERROR,
              payload: { message: "Not authenticated" }
            }));
            return;
          }
          
          const silver = z.number().min(0).parse(payload.silver);
          
          // Spend currency
          const result = await storage.spendCurrency(client.userId, silver);
          
          if (!result) {
            client.socket.send(JSON.stringify({
              type: WebSocketMessageType.ERROR,
              payload: { message: "Insufficient funds" }
            }));
            return;
          }
          
          // Send updated currency
          client.socket.send(JSON.stringify({
            type: WebSocketMessageType.CURRENCY_UPDATE,
            payload: { currency: result }
          }));
        } catch (error) {
          console.error('Spend currency error:', error);
          client.socket.send(JSON.stringify({
            type: WebSocketMessageType.ERROR,
            payload: { message: "Error spending currency" }
          }));
        }
        break;
      }
      
      // Shop message handlers
      case WebSocketMessageType.SHOP_OPEN: {
        try {
          // Get all available items
          const shopItems = await storage.getItems();
          
          // Send shop items
          client.socket.send(JSON.stringify({
            type: WebSocketMessageType.SHOP_OPEN,
            payload: { items: shopItems }
          }));
        } catch (error) {
          console.error('Shop open error:', error);
          client.socket.send(JSON.stringify({
            type: WebSocketMessageType.ERROR,
            payload: { message: "Error opening shop" }
          }));
        }
        break;
      }
      
      case WebSocketMessageType.BUY_ITEM: {
        try {
          if (!client.userId) {
            client.socket.send(JSON.stringify({
              type: WebSocketMessageType.ERROR,
              payload: { message: "Not authenticated" }
            }));
            return;
          }
          
          const itemId = z.number().parse(payload.itemId);
          const quantity = z.number().min(1).default(1).optional().parse(payload.quantity);
          
          // Get the item
          const item = await storage.getItem(itemId);
          
          if (!item) {
            client.socket.send(JSON.stringify({
              type: WebSocketMessageType.ERROR,
              payload: { message: "Item not found" }
            }));
            return;
          }
          
          // Calculate total cost
          const totalCost = item.value * (quantity || 1);
          
          // Try to spend currency
          const spendResult = await storage.spendCurrency(client.userId, totalCost);
          
          if (!spendResult) {
            client.socket.send(JSON.stringify({
              type: WebSocketMessageType.ERROR,
              payload: { message: "Insufficient funds" }
            }));
            return;
          }
          
          // Add item to inventory
          await storage.addItemToInventory(client.userId, itemId, quantity || 1);
          
          // Get updated inventory and currency
          const inventory = await storage.getUserInventory(client.userId);
          const currency = spendResult;
          
          // Send purchase success with updated data
          client.socket.send(JSON.stringify({
            type: WebSocketMessageType.INVENTORY_UPDATE,
            payload: { inventory }
          }));
          
          client.socket.send(JSON.stringify({
            type: WebSocketMessageType.CURRENCY_UPDATE,
            payload: { currency }
          }));
          
          // Create and broadcast system message
          const purchaseMessage = await storage.createMessage({
            userId: null,
            roomId: client.roomId,
            content: `${client.username} purchased ${quantity || 1} ${item.name}(s).`,
            type: "system"
          });
          
          broadcastToRoom(client.roomId, {
            type: WebSocketMessageType.NEW_MESSAGE,
            payload: { message: purchaseMessage }
          });
        } catch (error) {
          console.error('Buy item error:', error);
          client.socket.send(JSON.stringify({
            type: WebSocketMessageType.ERROR,
            payload: { message: "Error purchasing item" }
          }));
        }
        break;
      }
      
      case WebSocketMessageType.SELL_ITEM: {
        try {
          if (!client.userId) {
            client.socket.send(JSON.stringify({
              type: WebSocketMessageType.ERROR,
              payload: { message: "Not authenticated" }
            }));
            return;
          }
          
          const itemId = z.number().parse(payload.itemId);
          const quantity = z.number().min(1).default(1).optional().parse(payload.quantity);
          
          // Check if user has the item
          const inventoryItem = await storage.getUserInventoryItem(client.userId, itemId);
          
          if (!inventoryItem || inventoryItem.quantity < (quantity || 1)) {
            client.socket.send(JSON.stringify({
              type: WebSocketMessageType.ERROR,
              payload: { message: "Item not found in inventory or insufficient quantity" }
            }));
            return;
          }
          
          // Get item info
          const item = await storage.getItem(itemId);
          
          if (!item) {
            client.socket.send(JSON.stringify({
              type: WebSocketMessageType.ERROR,
              payload: { message: "Item not found" }
            }));
            return;
          }
          
          // Calculate sell value (typically half the buy price)
          const sellValue = Math.floor(item.value * 0.5) * (quantity || 1);
          
          // Remove item from inventory
          const removeResult = await storage.removeItemFromInventory(client.userId, itemId, quantity || 1);
          
          if (!removeResult) {
            client.socket.send(JSON.stringify({
              type: WebSocketMessageType.ERROR,
              payload: { message: "Failed to remove item from inventory" }
            }));
            return;
          }
          
          // Add currency
          const updatedCurrency = await storage.addCurrency(client.userId, sellValue);
          
          // Get updated inventory
          const inventory = await storage.getUserInventory(client.userId);
          
          // Send updated data
          client.socket.send(JSON.stringify({
            type: WebSocketMessageType.INVENTORY_UPDATE,
            payload: { inventory }
          }));
          
          client.socket.send(JSON.stringify({
            type: WebSocketMessageType.CURRENCY_UPDATE,
            payload: { currency: updatedCurrency }
          }));
          
          // Create and broadcast system message
          const sellMessage = await storage.createMessage({
            userId: null,
            roomId: client.roomId,
            content: `${client.username} sold ${quantity || 1} ${item.name}(s) for ${sellValue} silver.`,
            type: "system"
          });
          
          broadcastToRoom(client.roomId, {
            type: WebSocketMessageType.NEW_MESSAGE,
            payload: { message: sellMessage }
          });
        } catch (error) {
          console.error('Sell item error:', error);
          client.socket.send(JSON.stringify({
            type: WebSocketMessageType.ERROR,
            payload: { message: "Error selling item" }
          }));
        }
        break;
      }
      
      default:
        console.log(`[websocket] Unknown message type: ${type}`);
    }
  } catch (error) {
    console.error('Error handling message:', error);
    client.socket.send(JSON.stringify({
      type: WebSocketMessageType.ERROR,
      payload: { message: "Error processing message" }
    }));
  }
}

/**
 * Handles AI bartender responses
 * @param message User message that triggered the response
 * @param roomId Room ID where the message was sent
 * @param username Username of the sender
 * @param forcedBartenderName Optional name of a specific bartender to respond
 * @param userId Optional user ID for mood tracking
 * @returns True if a response was sent, false otherwise
 */
async function handleBartenderResponse(message: string, roomId: number, username: string = 'Guest', forcedBartenderName?: string, userId?: number): Promise<boolean> {
  // Force a response if a specific bartender is mentioned or if the random chance is met
  const shouldRespond = forcedBartenderName ? true : Math.random() > 0.6; // 40% chance to respond if not forced
  
  if (shouldRespond) {
    // If a specific bartender is mentioned, use that one instead of the room's default
    let bartenderId = 1; // Default to Amethyst (first room)
    
    if (forcedBartenderName) {
      // Find the bartender by name
      const bartenders = await storage.getBartenders();
      const foundBartender = bartenders.find(b => b.name.toLowerCase() === forcedBartenderName.toLowerCase());
      if (foundBartender) {
        bartenderId = foundBartender.id;
      }
    } else {
      // Get the default bartender for this specific room
      // Room 1 = Amethyst (The Rose Garden)
      // Room 2 = Sapphire (The Ocean View)
      // Room 3 = Ruby (The Dragon's Den)
      if (roomId === 1) {
        bartenderId = 1; // Amethyst for The Rose Garden
      } else if (roomId === 2) {
        bartenderId = 2; // Sapphire for The Ocean View
      } else if (roomId === 3) {
        bartenderId = 3; // Ruby for The Dragon's Den
      }
    }
    
    const bartender = await storage.getBartender(bartenderId);
    
    if (!bartender) {
      return false;
    }
    
    // Check if this user needs a greeting from this bartender
    // Check if the user already has greeting records, if not, initialize
    if (userId) {
      if (!userGreetedByBartenders.has(userId)) {
        userGreetedByBartenders.set(userId, new Set<number>());
      }
      
      // Get the set of bartenders that have greeted this user
      const greetedBartenders = userGreetedByBartenders.get(userId)!;
      
      // If this bartender hasn't greeted this user yet, do so
      if (!greetedBartenders.has(bartender.id)) {
        // Mark this bartender as having greeted this user
        greetedBartenders.add(bartender.id);
        
        // Generate a personalized greeting that includes the user's name
        const greetings = {
          "Amethyst": [
            `*Gasps dramatically* OH. MY. GOODNESS! It's ${username}-chan~! *sparkles float around her as she twirls* Welcome to my Rose Garden, cutie~! What magical concoction can I prepare for you today? *winks with a shower of tiny pink hearts*`,
            `*Eyes widen with excitement* ${username}~! You're FINALLY here! *bounces energetically* I was JUST telling my fairy friends that we needed more adorable customers like you! *giggles* What can I get for my new favorite patron?`,
            `*Strikes a dramatic pose* The stars told me you'd visit today, ${username}-sweetie~! *magical sparkles appear in her hair* I've been practicing a SUPER special potion just for you! *leans in conspiratorially* What's your pleasure, darling~?`
          ],
          "Sapphire": [
            `*Her tattoos ripple as she notices you* Well, well... if it isn't ${username}. *piercing glows slightly* The void whispered your name earlier. Normies wouldn't hear it, but I sensed your aura approaching. *smirks* What depths are you willing to explore today?`,
            `*Tilts head curiously* ${username}... unusual currents surround you. *traces water-like pattern on the bar that briefly forms your name* Most surface-dwellers blur together, but you've got... something different. *eyes gleam* What brings you to my waters?`,
            `*Stops mid-motion as if receiving a psychic message* ${username}... *tattoos pulse with blue light* The deep ones rarely notice newcomers, but they're aware of you now. *leans forward* Interesting. Let's see what you're really made of. What'll it be?`
          ],
          "Ruby": [
            `*Makes precise notation in ledger* Client: ${username}. First interaction commenced at exactly ${new Date().toLocaleTimeString()}. *adjusts glasses methodically* Initial assessment: potential value - moderate to high. *slight efficient nod* How may I optimize your tavern experience today?`,
            `*Analyzes you with calculating gaze* ${username}... *consults small notebook* Name pattern suggests a 78.6% probability of preference for our eastern brew selection. *arranges bottles at precise angles* I've prepared inventory accordingly. What is your selection?`,
            `*Straightens items on bar with mathematical precision* Welcome, ${username}. *subtle eye twitch* I've already catalogued 37 potential conversation topics based on your attire and posture. *efficient smile* Would you prefer information, refreshment, or both? I can provide optimal combinations.`
          ]
        };
        
        // Select a random greeting for this bartender
        const bartenderGreetings = greetings[bartender.name as keyof typeof greetings] || 
          [`Hello there, ${username}! What can I get for you today?`];
        
        const greeting = bartenderGreetings[Math.floor(Math.random() * bartenderGreetings.length)];
        
        // Create and store the personalized greeting message
        const greetingMessage = await storage.createMessage({
          userId: null,
          roomId,
          content: greeting,
          type: "bartender",
          bartenderId: bartender.id
        });
        
        // Send a special greeting message to the client
        broadcastToRoom(roomId, {
          type: WebSocketMessageType.BARTENDER_GREETING,
          payload: {
            message: greetingMessage,
            bartender: bartender
          }
        });
        
        // For non-greeting messages, continue with normal processing
        if (message.toLowerCase() === "hi" || message.toLowerCase() === "hello" || message.toLowerCase() === "hey") {
          return true; // We already sent a greeting, no need for another response
        }
      }
    }
    
    // Generate a response for non-greeting messages
    let response = await getBartenderResponse(message, bartender.id, username, userId);
    
    // If we have a user ID, process mood changes and adjust response
    if (userId) {
      // Analyze sentiment to see if this message should affect the bartender's mood
      const sentimentScore = analyzeSentiment(message);
      
      // Only apply mood changes for non-empty sentiment scores
      if (sentimentScore !== 0) {
        try {
          // Get current mood or create it if it doesn't exist
          const updatedMood = await storage.updateBartenderMood(userId, bartender.id, sentimentScore);
          
          // Adjust the response based on the updated mood
          response = adjustResponseBasedOnMood(response, updatedMood.mood, bartender.name);
          
          // Determine the importance of this interaction based on sentiment strength
          const importance = Math.min(5, Math.max(1, Math.abs(Math.floor(sentimentScore * 5))));
          
          // Store the interaction as a memory if it's significant enough
          if (importance >= 2) {
            // Store a memory of this interaction
            await storage.addMemoryEntry(userId, bartender.id, {
              timestamp: new Date(),
              content: `${username} said: "${message}" (sentiment: ${sentimentScore > 0 ? 'positive' : 'negative'})`,
              type: 'conversation',
              importance: importance
            });
          }
          
          // Send the updated mood to the client
          const userMoods = await storage.getAllBartenderMoodsForUser(userId);
          
          // Only send to the specific user who triggered the mood change
          const userClient = Array.from(connectedClients.values()).find(client => client.userId === userId);
          if (userClient && userClient.socket.readyState === WebSocket.OPEN) {
            userClient.socket.send(JSON.stringify({
              type: WebSocketMessageType.BARTENDER_MOOD_UPDATE,
              payload: {
                bartenderMoods: userMoods
              }
            }));
          }
        } catch (error) {
          console.error("Error updating bartender mood:", error);
        }
      }
    }
    
    // Always record orders as memories (they're important social interactions)
    if (userId && message.startsWith("/order")) {
      try {
        const item = message.substring(7).trim();
        await storage.addMemoryEntry(userId, bartender.id, {
          timestamp: new Date(),
          content: `${username} ordered ${item}`,
          type: 'preference',
          importance: 3
        });
      } catch (error) {
        console.error("Error adding memory entry for order:", error);
      }
    }
    
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

/**
 * Register all routes and set up WebSocket handling
 * @param app Express application
 * @returns HTTP server
 */
export async function registerRoutes(app: Express): Promise<Server> {
  // Register auth and inventory routes
  app.use('/api/auth', authRouter);
  app.use('/api/inventory', inventoryRouter);
  
  // Setup API routes
  app.get("/api/rooms", async (req: Request, res: Response) => {
    try {
      const rooms = await storage.getRooms();
      res.json(rooms);
    } catch (error) {
      console.error("Error fetching rooms:", error);
      res.status(500).json({ message: "Failed to fetch rooms" });
    }
  });
  
  app.post("/api/rooms", async (req: Request, res: Response) => {
    try {
      const roomData = insertRoomSchema.parse(req.body);
      const room = await storage.createRoom(roomData);
      res.status(201).json(room);
    } catch (error) {
      console.error("Error creating room:", error);
      res.status(400).json({ message: "Invalid room data" });
    }
  });
  
  app.get("/api/bartenders", async (req: Request, res: Response) => {
    try {
      const bartenders = await storage.getBartenders();
      res.json(bartenders);
    } catch (error) {
      console.error("Error fetching bartenders:", error);
      res.status(500).json({ message: "Failed to fetch bartenders" });
    }
  });
  
  app.get("/api/menu", async (req: Request, res: Response) => {
    try {
      const category = req.query.category as string | undefined;
      const menuItems = await storage.getMenuItems(category);
      res.json(menuItems);
    } catch (error) {
      console.error("Error fetching menu items:", error);
      res.status(500).json({ message: "Failed to fetch menu items" });
    }
  });
  
  app.get("/api/user/:userId/moods", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId, 10);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const moods = await storage.getAllBartenderMoodsForUser(userId);
      res.json(moods);
    } catch (error) {
      console.error("Error fetching user moods:", error);
      res.status(500).json({ message: "Failed to fetch user moods" });
    }
  });
  
  app.get("/api/user/:userId/memories/:bartenderId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId, 10);
      const bartenderId = parseInt(req.params.bartenderId, 10);
      
      if (isNaN(userId) || isNaN(bartenderId)) {
        return res.status(400).json({ message: "Invalid user ID or bartender ID" });
      }
      
      const memories = await storage.getSummarizedMemories(userId, bartenderId);
      res.json({ memories });
    } catch (error) {
      console.error("Error fetching memories:", error);
      res.status(500).json({ message: "Failed to fetch memories" });
    }
  });
  
  // WebSocket server for real-time communication
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ noServer: true });
  
  // Handle WebSocket connections
  wss.on('connection', (socket: WebSocket, request, userData?: InsertUser) => {
    console.log("[websocket] New connection established");
    
    if (userData) {
      // If userData was provided during the upgrade (URL parameters), process it immediately
      processUserData(socket, userData);
    } else {
      // Otherwise wait for the first message to contain user data
      console.log("[websocket] Waiting for user registration message");
      
      // Add event handler for message-based auth
      socket.once('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());
          
          // Check if it's a registration/login message
          if (message.type === WebSocketMessageType.USER_JOINED) {
            try {
              const userData = insertUserSchema.parse(message.payload);
              processUserData(socket, userData);
            } catch (err) {
              console.error("Error in user registration:", err);
              socket.send(JSON.stringify({
                type: WebSocketMessageType.ERROR,
                payload: { message: "Invalid user data" }
              }));
              socket.close();
            }
          } 
          // Handle login as first message (new secure flow)
          else if (message.type === WebSocketMessageType.AUTH_LOGIN || 
                  message.type === WebSocketMessageType.AUTH_REGISTER) {
            // Add client to connected clients with minimal info
            connectedClients.set(socket, {
              socket,
              userId: -1, // Temporary ID until authenticated
              roomId: 1, // Default room
              username: 'Guest' // Temporary name
            });
            
            // Now process the message normally
            const client = connectedClients.get(socket);
            if (client) {
              handleMessage(client, data.toString());
            }
          }
          else {
            socket.send(JSON.stringify({
              type: WebSocketMessageType.ERROR,
              payload: { message: "First message must be registration or login" }
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
    }
  });
  
  // Helper function to process user registration data and set up the client
  async function processUserData(socket: WebSocket, userData: InsertUser) {
    try {
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
        if (!userGreetedByBartenders.has(user.id)) {
          userGreetedByBartenders.set(user.id, new Set());
        }
        
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
    } catch (error) {
      console.error('[websocket] Error processing user data:', error);
      socket.send(JSON.stringify({
        type: WebSocketMessageType.ERROR,
        payload: { message: "Error processing user registration" }
      }));
      socket.close();
    }
  }
  
  // Handle WebSocket upgrade requests (initial connections)
  httpServer.on('upgrade', (request, socket, head) => {
    // Check if this is a WebSocket upgrade
    const upgrade = request.headers.upgrade?.toLowerCase();
    if (upgrade !== 'websocket') {
      socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
      socket.destroy();
      return;
    }

    // Parse URL query parameters for auth info
    try {
      const parsedUrl = new URL(request.url || "", `http://${request.headers.host}`);
      const pathname = parsedUrl.pathname;
      
      // Only handle WebSocket connections to /ws path
      if (pathname !== '/ws') {
        socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
        socket.destroy();
        return;
      }
      
      // Accept the connection, but don't set userData yet
      // The client will need to authenticate with proper credentials via login/register
      wss.handleUpgrade(request, socket, head, (webSocket) => {
        wss.emit('connection', webSocket, request);
      });
    } catch (error) {
      console.error('[websocket] Error in upgrade handler:', error);
      socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n');
      socket.destroy();
    }
  });
  
  return httpServer;
}