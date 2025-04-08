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
import { getOpenRouterResponse, checkForBartenderMention, extractQueryFromMention } from "./openRouter";

// Store connected clients with their user info
interface ConnectedClient {
  socket: WebSocket;
  userId: number;
  roomId: number;
}

const connectedClients: Map<WebSocket, ConnectedClient> = new Map();

// Bartender AI logic for the three sisters
// Bartender personalities and backstories
const bartenderBios = {
  "Sapphire": {
    bio: "Sapphire is a calm, wise sea-touched woman with azure skin and flowing blue hair. Born in a coastal village, she's deeply connected to the ocean and its mysteries. Her voice has a gentle, rhythmic quality like waves on the shore. She's intuitive, observant, and has an almost supernatural ability to read people's intentions. Sapphire collects tales from seafarers and treasures from shipwrecks, displaying some in The Ocean View room. While typically serene, she becomes stern when patrons disrespect her space or others.",
    traits: ["wise", "calm", "mysterious", "observant", "protective"]
  },
  "Amethyst": {
    bio: "Amethyst is a vibrant, passionate woman with striking pink hair and a collection of arcane tattoos. A former battle-mage, she now channels her energy into brewing potent concoctions and maintaining order in The Rose Garden. Her laugh is infectious but her temper legendary. The rose garden connected to her tavern room blooms at midnight with magical flowers that glow and sometimes whisper secrets. She's direct, sometimes abrasive, but fiercely loyal to regular patrons. Her powerful arms bear scars from adventures she rarely discusses fully.",
    traits: ["passionate", "strong", "direct", "magical", "protective"]
  },
  "Ruby": {
    bio: "Ruby is a shrewd, attentive woman with auburn hair and a network of information that rivals any royal spy. The Dragon's Den is her domain, where she serves drinks while collecting secrets. Raised in a merchant family, she has a head for business and an eye for detail. More soft-spoken than her sisters, Ruby notices everything and forgets nothing. She maintains a warm demeanor but keeps most at arm's length. Her specialty is connecting people who need each other's services, making her an invaluable ally for those she trusts.",
    traits: ["perceptive", "intelligent", "strategic", "reserved", "detail-oriented"]
  }
};

async function getBartenderResponse(message: string, bartenderId: number, username: string = 'Guest'): Promise<string> {
  // Get the bartender to determine which sister is responding
  const bartender = await storage.getBartender(bartenderId);
  if (!bartender) return "Welcome to the tavern! How can I help you today?";
  
  // Process orders using preset responses for better performance with order commands
  if (message.startsWith("/order")) {
    const item = message.substring(7).trim();
    
    // Different responses based on which sister with more personality
    const orderResponses: Record<string, string[]> = {
      "Sapphire": [
        `One ${item} coming right up! The ocean's bounty provides many gifts, this being one of my favorites.`,
        `Ah, ${item}! A fine choice. This reminds me of something sailors from the eastern isles would enjoy.`,
        `I'll prepare your ${item} with care. The secret is in how the ingredients flow together, like tides.`
      ],
      "Amethyst": [
        `One ${item} coming right up! Strong enough to put hair on a dwarf's chest, just how I like to make 'em!`,
        `${item}? Excellent choice! I add a special kick to mine that'll warm you from the inside out.`,
        `Your ${item} will be ready in a flash! My special blend might make your eyes water, but that's how you know it's good!`
      ],
      "Ruby": [
        `One ${item} coming right up! I've perfected this recipe through careful observation of what my patrons enjoy most.`,
        `${item} is an excellent choice. I recently refined the preparation after speaking with a merchant from the southern realms.`,
        `I'll have your ${item} ready momentarily. Each ingredient measured precisely - details matter in good service.`
      ]
    };
    
    // Select a random response for the bartender
    const responses = orderResponses[bartender.name] || [`One ${item} coming right up! Anything else I can get ya?`];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  // For all other cases, use the OpenRouter API to generate a dynamic, personalized response
  try {
    // Get a response from the OpenRouter API based on the bartender's personality
    return await getOpenRouterResponse(bartender.name, message, username);
  } catch (error) {
    console.error('Error getting AI response from OpenRouter', error);
    
    // Fallback to predefined responses if OpenRouter fails
    const fallbackResponses = {
      "Sapphire": [
        "The ocean has secrets, stranger. Some worth knowing, some better left alone.",
        "My drinks taste like the sea, cool and refreshing. Care to try the Blue Depths ale?",
        "Been traveling far? The Ocean View welcomes all weary souls seeking peaceful waters."
      ],
      "Amethyst": [
        "Have you tried our special brew? It's got a real kick to it - cleared a troll's sinuses once!",
        "The Rose Garden is my pride and joy. The flowers only bloom at midnight when my magic is strongest.",
        "Some say I mix the strongest drinks in the realm. They'd be right - I don't do anything half-measure."
      ],
      "Ruby": [
        "Take your time. Good drinks, like good advice, shouldn't be rushed. Observation leads to quality.",
        "If you're seeking information, you'd be wise to speak with the merchants by the east gate. Tell them Ruby sent you.",
        "The guild is recruiting skilled hands. I could put in a good word, if I judge your talents worth recommending."
      ]
    };
    
    // Select a random fallback response for the bartender
    const responses = fallbackResponses[bartender.name as keyof typeof fallbackResponses] || ["Welcome to the tavern! How can I help you today?"];
    return responses[Math.floor(Math.random() * responses.length)];
  }
}

// Handles the AI bartender response logic
async function handleBartenderResponse(message: string, roomId: number, username: string = 'Guest', forcedBartenderName?: string) {
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
    
    // Generate a response
    const response = await getBartenderResponse(message, bartender.id, username);
    
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
  // Convert to array to avoid iterator issues
  const clients = Array.from(connectedClients.values());
  for (const client of clients) {
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
            // Different welcome messages based on bartender personality
            const greetings: Record<string, string[]> = {
              "Sapphire": [
                `*Her blue eyes shimmer like the ocean as she turns to you* Welcome to The Ocean View. I'm Sapphire. The waters brought you to us for a reason, perhaps. What can I pour for you today?`,
                `*Looks up from polishing a shell-encrusted goblet* Ah, a new face washed in by the tide. I'm Sapphire, keeper of The Ocean View. What brings you to our peaceful waters?`,
                `*Her movements fluid like water as she approaches* Welcome, traveler. I'm Sapphire. The Ocean View offers respite for weary souls. What refreshment do you seek?`
              ],
              "Amethyst": [
                `*Her arcane tattoos briefly glow as she notices you* Ha! Fresh blood! Welcome to The Rose Garden. I'm Amethyst, and my drinks pack a punch stronger than I do - and that's saying something! What'll it be?`,
                `*Slams down a mug with surprising force* New face! About time! I'm Amethyst, and this is The Rose Garden - best drinks in the realm if you can handle them. What's your poison?`,
                `*Eyes you with an appraising look* Well now, you look interesting. I'm Amethyst, mistress of The Rose Garden and former battle-mage. Let's see if your taste in drinks matches your aura!`
              ],
              "Ruby": [
                `*Glances up with perceptive eyes that seem to memorize your features* Welcome to The Dragon's Den. I'm Ruby. *She speaks softly but clearly* I notice you've traveled far. Perhaps a drink to restore your spirits?`,
                `*Making a subtle note in a small book before addressing you* The Dragon's Den welcomes you. I'm Ruby, purveyor of fine drinks and... information. What can I offer you today?`,
                `*Her movements precise and measured as she arranges bottles* A new patron for The Dragon's Den. How intriguing. I'm Ruby. *She offers a small smile* Your timing is impeccable. What shall I prepare for you?`
              ]
            };
            
            // Select a random greeting for this bartender
            const bartenderGreetings = greetings[bartender.name] || [`Greetings, traveler! I'm ${bartender.name}, what can I get for ya today?`];
            const greeting = bartenderGreetings[Math.floor(Math.random() * bartenderGreetings.length)];
            
            const welcomeMessage = await storage.createMessage({
              userId: null,
              roomId: roomId,
              content: greeting,
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
          
          // Check for @mentions of bartenders
          const mentionedBartender = checkForBartenderMention(validatedPayload.content);
          
          // Store and broadcast regular message
          const newMessage = await storage.createMessage(validatedPayload);
          
          broadcastToRoom(client.roomId, {
            type: WebSocketMessageType.NEW_MESSAGE,
            payload: { message: newMessage }
          });
          
          const user = await storage.getUser(client.userId);
          const username = user?.username || 'Guest';
          
          // If a bartender is mentioned, get a direct response
          if (mentionedBartender) {
            console.log(`Bartender ${mentionedBartender} was mentioned by ${username}`);
            
            // Extract the actual query without the @mention
            const query = extractQueryFromMention(validatedPayload.content, mentionedBartender);
            
            // Force the bartender to respond immediately
            setTimeout(async () => {
              await handleBartenderResponse(query, client.roomId, username, mentionedBartender);
            }, 800); // Slight delay for realism
          } else {
            // Sometimes trigger a random bartender response if no specific bartender was mentioned
            setTimeout(async () => {
              await handleBartenderResponse(validatedPayload.content, client.roomId, username);
            }, 1000 + Math.random() * 2000);
          }
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
          
          // Get the user who made the order
          const user = await storage.getUser(client.userId);
          const username = user?.username || 'Guest';
          
          // Get personalized response from the bartender
          const response = await getBartenderResponse(`/order ${menuItem.name}`, bartender.id, username);
          
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
  
  wss.on('connection', async (socket, request) => {
    try {
      // Support both query parameter authentication and message-based auth
      const url = new URL(request.url || '', `http://${request.headers.host}`);
      const token = url.searchParams.get('token');
      const avatar = url.searchParams.get('avatar');
      
      // If we have query parameters, use them for direct authentication
      if (token && avatar) {
        try {
          const userData = {
            username: token,
            avatar: avatar,
            roomId: 1,
            online: true
          };
          
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
            
            // Update online users
            const onlineUsers = await storage.getOnlineUsers(user.roomId);
            broadcastToRoom(user.roomId, {
              type: WebSocketMessageType.ROOM_USERS,
              payload: { users: onlineUsers }
            });
            
            // Send historical messages
            const messages = await storage.getMessagesByRoom(user.roomId);
            socket.send(JSON.stringify({
              type: WebSocketMessageType.JOIN_ROOM,
              payload: { 
                room: await storage.getRoom(user.roomId),
                messages
              }
            }));
          }
          
          // Set up message handling for authenticated user
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
          
          return;
        } catch (error) {
          console.error('Error processing query parameters:', error);
        }
      }
    
      // If query parameter authentication failed, fall back to message-based auth
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
