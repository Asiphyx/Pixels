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

async function getBartenderResponse(message: string, bartenderId: number): Promise<string> {
  // Get the bartender to determine which sister is responding
  const bartender = await storage.getBartender(bartenderId);
  if (!bartender) return "Welcome to the tavern! How can I help you today?";
  
  // Process orders
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
  
  // Enhanced personality-specific responses for each sister
  const sapphireResponses = [
    "The ocean has secrets, stranger. Some worth knowing, some better left alone.",
    "My drinks taste like the sea, cool and refreshing. Care to try the Blue Depths ale?",
    "Been traveling far? The Ocean View welcomes all weary souls seeking peaceful waters.",
    "Watch the patrons carefully. You might learn more from their silences than from my words.",
    "The waves bring all sorts to our shore. Stay a while, why don't you?",
    "These blue markings on my skin? Ancient magic from the deep. A story for another time, perhaps.",
    "Keep your coin purse close. Not all here are honest folk, though the waters reveal all truths eventually.",
    "My sisters and I keep this place running. Each room has its own... atmosphere, like currents in the sea.",
    "The tides shift and change, much like the fortunes of those who visit us.",
    "I can tell by your eyes you've seen the open water. There's always a sailor's look that never fades.",
    "Some say the ocean speaks to me. Perhaps... but I don't share all its whispers.",
    "This blue ale? It contains a single mermaid's tear, collected with permission during the full moon. Brings clarity of thought."
  ];
  
  const amethystResponses = [
    "Have you tried our special brew? It's got a real kick to it - cleared a troll's sinuses once!",
    "The Rose Garden is my pride and joy. The flowers only bloom at midnight when my magic is strongest.",
    "Some say I mix the strongest drinks in the realm. They'd be right - I don't do anything half-measure.",
    "Looking for work? The guild always needs brave souls... or expendable ones. I can spot which you are.",
    "My tattoos? Each tells a story of triumph... or warning. This one here? From the Battle of Crimson Vale.",
    "Stay for the music later. The bard knows tales that'll chill your blood - I made sure of it.",
    "That weapon you carry has seen blood, hasn't it? It remembers every life it's taken. I can sense it.",
    "These scars? From when I was in the mage battalion. The northern campaign was brutal but necessary.",
    "Another battle-mage passed through recently. I can always spot them by their stance and how they carry their scars.",
    "The roses outside? Don't try picking them after dark. They have... defensive enchantments I personally placed.",
    "I once punched a troll unconscious. That's how I got this tavern, believe it or not. Previous owner lost a bet.",
    "You look like you could use something that burns going down. I've got just the thing - melts steel but goes down smooth."
  ];
  
  const rubyResponses = [
    "Take your time. Good drinks, like good advice, shouldn't be rushed. Observation leads to quality.",
    "If you're seeking information, you'd be wise to speak with the merchants by the east gate. Tell them Ruby sent you.",
    "The guild is recruiting skilled hands. I could put in a good word, if I judge your talents worth recommending.",
    "Mind your coin purse. Not everyone in here is as honest as they appear. Table by the window - especially watch him.",
    "My sisters are excellent company, but I notice what others miss. It's the quiet details that tell the full story.",
    "Need a quiet place to rest? The rooms upstairs are well-kept and private. Third door has the finest view.",
    "That injury looks fresh. We have healing potions if you require one - specially imported from the elvish valleys.",
    "The trouble up north has brought many refugees to our doors lately. Listen to their stories - there's profit in knowing.",
    "I've heard whispers of a new trading route opening beyond the mountains. Profitable, if dangerous.",
    "The quiet ones are always worth watching. They collect information without even trying, much like myself.",
    "Three separate patrons mentioned the same dream last night. Coincidence? I think not. I record such patterns.",
    "Your accent... northeastern provinces? Your secret's safe, but you might want to work on that if discretion matters."
  ];
  
  // Select responses based on bartender
  if (bartender.name === "Sapphire") {
    return sapphireResponses[Math.floor(Math.random() * sapphireResponses.length)];
  } else if (bartender.name === "Amethyst") {
    return amethystResponses[Math.floor(Math.random() * amethystResponses.length)];
  } else if (bartender.name === "Ruby") {
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
