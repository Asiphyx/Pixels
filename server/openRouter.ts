import axios from 'axios';
import { bartenders } from "@shared/schema";

// Load the API key from environment variables
const OPENROUTER_API_KEY = process.env.OPEN_ROUTER_API;

// Bartender personalities and backstories for the API prompt
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

/**
 * Get a response from the OpenRouter API based on the bartender's personality and the user message
 * @param bartenderName - Name of the bartender character
 * @param userMessage - The message from the user
 * @param username - The username of the user
 * @returns Promise<string> - The AI-generated response
 */
export async function getOpenRouterResponse(bartenderName: string, userMessage: string, username: string = "Guest"): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    console.warn("OPEN_ROUTER_API is not set. Using fallback responses.");
    throw new Error("OpenRouter API key is not configured");
  }

  try {
    // Get bartender bio and traits
    const bartenderInfo = bartenderBios[bartenderName as keyof typeof bartenderBios];
    if (!bartenderInfo) {
      throw new Error(`Unknown bartender: ${bartenderName}`);
    }

    // Handle order commands differently
    let contextPrompt = "";
    if (userMessage.startsWith("/order")) {
      const item = userMessage.substring(7).trim();
      contextPrompt = `You are ${bartenderName}, ${bartenderInfo.bio}
      
A patron named ${username} has ordered ${item}. Respond in character as ${bartenderName} acknowledging their order.
Be descriptive about making the drink or preparing the food item.
Keep your response concise (1-3 sentences).
Your personality is: ${bartenderInfo.traits.join(", ")}.
Your response should reflect your unique personality and background.`;
    } else {
      // For regular conversation
      contextPrompt = `You are ${bartenderName}, ${bartenderInfo.bio}
      
You're currently working at your tavern, serving customers and engaging in casual conversation.
Your personality is: ${bartenderInfo.traits.join(", ")}.
      
A patron named ${username} said: "${userMessage}"
      
Respond in character as ${bartenderName}. Keep your response concise (1-3 sentences).
Your response should reflect your unique personality and background.
If you're asked a question you don't know the answer to, respond in a way that fits your character.
Always stay in character as a fantasy tavern bartender in a medieval world with some magic elements.`;
    }

    // Make request to OpenRouter API using the meta-llama/llama-4-maverick:free model
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: "meta-llama/llama-4-maverick:free",
        messages: [
          { role: "system", content: contextPrompt },
          { role: "user", content: userMessage }
        ],
        temperature: 0.7, // Medium creativity
        max_tokens: 150,  // Keep responses concise
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://replit.com', // Required by OpenRouter
          'X-Title': 'Fantasy Tavern Chat', // Optional but good practice
        },
      }
    );

    // Extract and return the response content
    if (response.data.choices && response.data.choices[0]?.message?.content) {
      return response.data.choices[0].message.content.trim();
    } else {
      throw new Error('Unexpected API response structure');
    }
  } catch (error) {
    console.error('Error getting response from OpenRouter:', error);
    throw error;
  }
}

/**
 * Check if a message mentions a bartender using @mention syntax
 * @param messageContent - Message to check for mentions
 * @returns string | null - Bartender name if mentioned, null if no mention
 */
export function checkForBartenderMention(messageContent: string): string | null {
  // Check for @Bartender mentions using regex
  const mentionRegex = /@(Sapphire|Amethyst|Ruby)\b/i;
  const match = messageContent.match(mentionRegex);
  
  if (match && match[1]) {
    // Return the bartender name with correct capitalization
    const bartenderName = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
    
    // Verify this is a valid bartender name
    if (["Sapphire", "Amethyst", "Ruby"].includes(bartenderName)) {
      return bartenderName;
    }
  }
  
  return null;
}

/**
 * Extract the query part from a message that mentions a bartender
 * @param messageContent - Full message content
 * @param bartenderName - Name of the mentioned bartender
 * @returns string - Message without the @mention part
 */
export function extractQueryFromMention(messageContent: string, bartenderName: string): string {
  // Remove the @Bartender mention and any leading/trailing whitespace
  return messageContent.replace(new RegExp(`@${bartenderName}\\b`, 'i'), '').trim();
}