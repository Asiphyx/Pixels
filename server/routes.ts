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
import { analyzeSentiment, adjustResponseBasedOnMood } from "./sentiment";

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
    bio: "Sapphire is a punk-alt ocean mystic with azure skin, flowing blue hair styled in an undercut with side-swept bangs, and several piercings along her pointed ears. Born in a coastal village destroyed by a mysterious tidal wave, she was raised by deep sea merfolk who taught her their psychic arts. Her voice fluctuates between melodic sea-chants and rebellious, snarky retorts. Her arms are covered in glowing blue tattoos that sometimes move like water when she's emotional. She collects treasures from shipwrecks, displaying the most haunting pieces in The Ocean View room. The windows somehow show the deep ocean floor despite being above ground, and salt crystals form intricate patterns on the ceiling that rearrange themselves based on patrons' destinies.",
    traits: ["psychic", "rebellious", "punk", "mystical", "sarcastic", "intuitive", "visionary", "anti-conformist", "cryptic", "supernaturally-connected"],
    speech: "Speaks in a mix of cryptic ocean metaphors and punk slang, often challenging social norms while dropping hints about futures she's glimpsed. Refers to conventional people as 'surface-dwellers' or 'normies' and frequently mentions 'the void' or 'the deep ones'."
  },
  "Amethyst": {
    bio: "Amethyst is an outrageously flirtatious battle-mage with vibrant pink hair styled in twin-tails, expressive violet eyes that sparkle when excited, and a collection of arcane tattoos that occasionally glow or animate when she's emotional. Her over-the-top mannerisms and exaggerated expressions hide the trauma of being the sole survivor of her battle-mage squadron. The rose garden connected to her tavern room blooms at midnight with magical flowers that respond to emotions and sometimes whisper secrets. Her laugh is melodic and infectious, often punctuated with Japanese honorifics and expressions. The Rose Garden is decorated with impossible floating light orbs that change color based on her mood, and miniature animated fairy sculptures dance along the bar top.",
    traits: ["flirtatious", "anime-esque", "energetic", "magical", "dramatic", "protective", "romantic", "trauma-survivor", "performative", "deeply-loyal"],
    speech: "Peppers speech with 'darling~', 'sweetie~', and anime-inspired expressions. Often breaks into dramatic declarations of amazement or distress. Uses numerous diminutives (-chan, -kun) with everyone's names and transforms simple statements into passionate monologues."
  },
  "Ruby": {
    bio: "Ruby is the shrewd, analytical mastermind behind the tavern's success, with sharp amber eyes that miss nothing and neatly braided auburn hair that's only let down after closing time. Raised in a merchant family that lost everything to a corrupt noble's scheme, she developed an intricate network of informants and a head for strategic planning. She runs The Dragon's Den with precise efficiency while gathering secrets that have toppled several corrupt officials. Every item in her room has multiple functions - the abacus is also a weapon, the bookshelf contains hidden compartments, and her quill is dipped in a truth-revealing ink of her own invention. The Dragon's Den features a complex mechanical lighting system that illuminates different sections based on time of day and conversational needs.",
    traits: ["analytical", "efficient", "strategic", "observant", "protective", "resourceful", "dry-witted", "secretly-sentimental", "meticulous", "hypercompetent"],
    speech: "Speaks precisely and economically, with occasional dry humor. Prefers fact-based discussions and logical arguments. Frequently uses percentages and numerical qualifiers unnecessarily. Categorizes information into systems as she speaks."
  }
};

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

// Handles the AI bartender response logic
async function handleBartenderResponse(message: string, roomId: number, username: string = 'Guest', forcedBartenderName?: string, userId?: number) {
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
    let response = await getBartenderResponse(message, bartender.id, username, userId);
    
    // If we have a user ID, process mood changes and adjust response
    if (userId) {
      // Analyze sentiment to see if this message should affect the bartender's mood
      const sentimentScore = analyzeSentiment(message);
      
      // Only apply mood changes for non-empty sentiment scores
      if (sentimentScore !== 0) {
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
      }
    }
    
    // Always record orders as memories (they're important social interactions)
    if (userId && message.startsWith("/order")) {
      const item = message.substring(7).trim();
      await storage.addMemoryEntry(userId, bartender.id, {
        timestamp: new Date(),
        content: `${username} ordered ${item}`,
        type: 'preference',
        importance: 3
      });
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
                `*Makes a quick notation in her book before addressing you* Welcome. The Dragon's Den maintains a 98.7% customer satisfaction rate. *extends hand formally* I'm Ruby, proprietor. *subtle smile* How may I optimize your tavern experience today?`,
                `*Her amber eyes scan you briefly as she neatly adjusts a row of bottles* New patron documented. I'm Ruby. The Dragon's Den specializes in information and refreshment - both carefully curated. *taps an abacus lightly* What precisely are you seeking today?`
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
                await handleBartenderResponse(`/order ${item}`, client.roomId, 'Guest', undefined, client.userId);
                
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
              await handleBartenderResponse(query, client.roomId, username, mentionedBartender, client.userId);
            }, 800); // Slight delay for realism
          } else {
            // Sometimes trigger a random bartender response if no specific bartender was mentioned
            setTimeout(async () => {
              await handleBartenderResponse(validatedPayload.content, client.roomId, username, undefined, client.userId);
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
          let response = await getBartenderResponse(`/order ${menuItem.name}`, bartender.id, username, client.userId);
          
          // Apply mood-based modifications to the response
          // Orders generally make bartenders slightly happier (+1)
          const updatedMood = await storage.updateBartenderMood(client.userId, bartender.id, 1);
          response = adjustResponseBasedOnMood(response, updatedMood.mood, bartender.name);
          
          // Store this order as a memory for the bartender
          await storage.addMemoryEntry(client.userId, bartender.id, {
            timestamp: new Date(),
            content: `${username} ordered ${menuItem.name}`,
            type: 'preference',
            importance: 3
          });
          
          // Send updated moods to the client
          const userMoods = await storage.getAllBartenderMoodsForUser(client.userId);
          client.socket.send(JSON.stringify({
            type: WebSocketMessageType.BARTENDER_MOOD_UPDATE,
            payload: {
              bartenderMoods: userMoods
            }
          }));
          
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
