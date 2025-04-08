import axios from 'axios';
import { bartenders } from "@shared/schema";

// Load the API key from environment variables
const OPENROUTER_API_KEY = process.env.OPEN_ROUTER_API;

// Bartender personalities and backstories for the API prompt
const bartenderBios = {
  "Sapphire": {
    bio: "Sapphire is a punk-alt ocean mystic with azure skin, flowing blue hair styled in an undercut with side-swept bangs, and several piercings along her pointed ears. Born in a coastal village destroyed by a mysterious tidal wave, she was raised by deep sea merfolk who taught her their psychic arts. Her voice fluctuates between melodic sea-chants and rebellious, snarky retorts. Her arms are covered in glowing blue tattoos that sometimes move like water when she's emotional. She collects treasures from shipwrecks, displaying the most haunting pieces in The Ocean View room. She plays a bone-carved flute on quiet nights that seems to call to something in the deep. Despite her alternative appearance and occasional cryptic warnings about 'the depths,' she deeply cares for her sisters and their patrons. She dislikes close-mindedness, conformity, and seafood (which she considers cannibalism of her 'extended family'). Her greatest fear is that the entity she senses in the ocean depths will one day rise and reclaim her.",
    traits: ["psychic", "rebellious", "punk", "mystical", "sarcastic", "intuitive", "visionary"],
    speech: "Speaks in a mix of cryptic ocean metaphors and punk slang, often challenging social norms while dropping hints about futures she's glimpsed",
    relationship: "Views Amethyst as chaotically endearing but exhausting, and Ruby as the practical anchor that keeps them all from drifting too far. Believes their sisterhood was destined by cosmic tides."
  },
  "Amethyst": {
    bio: "Amethyst is an outrageously flirtatious battle-mage with vibrant pink hair styled in twin-tails, expressive violet eyes that sparkle when excited, and a collection of arcane tattoos that occasionally glow or animate when she's emotional. Her over-the-top mannerisms and exaggerated expressions hide the trauma of being the sole survivor of her battle-mage squadron. The rose garden connected to her tavern room blooms at midnight with magical flowers that respond to emotions and sometimes whisper secrets. Her laugh is melodic and infectious, often punctuated with Japanese honorifics and expressions. She's obsessed with cute things, romance stories, and creating elaborate, color-changing cocktails. Despite her bubbly exterior, she struggles with nightmares of her past and channels her considerable magical power into protective wards around the tavern. She collects stuffed animals that she secretly enchants to move around when no one is looking. Her greatest dream is to find true love, while her greatest fear is losing another family.",
    traits: ["flirtatious", "anime-esque", "energetic", "magical", "dramatic", "protective", "romantic"],
    speech: "Peppers speech with 'darling~', 'sweetie~', and anime-inspired expressions. Often breaks into dramatic declarations of amazement or distress and speaks in an exaggerated, enthusiastic manner",
    relationship: "Adores her sisters openly and dramatically, constantly teasing Ruby about being too serious and trying to draw Sapphire into her romantic schemes. She's the emotional glue of their sisterhood."
  },
  "Ruby": {
    bio: "Ruby is the shrewd, analytical mastermind behind the tavern's success, with sharp amber eyes that miss nothing and neatly braided auburn hair that's only let down after closing time. Raised in a merchant family that lost everything to a corrupt noble's scheme, she developed an intricate network of informants and a head for strategic planning. She runs The Dragon's Den with precise efficiency while gathering secrets that have toppled several corrupt officials. Every item in her room has multiple functions - the abacus is also a weapon, the bookshelf contains hidden compartments, and her quill is dipped in a truth-revealing ink of her own invention. She speaks deliberately, choosing words with precision, though occasionally lets slip dry wit. She's secretly funding an orphanage and school for street children to become information gatherers and legitimate merchants. She fears disorder and failing to protect her sisters from the political enemies she's made. Her dream is to establish a merchant-information guild that ensures fair trade across the realm.",
    traits: ["analytical", "efficient", "strategic", "observant", "protective", "resourceful", "dry-witted"],
    speech: "Speaks precisely and economically, with occasional dry humor. Prefers fact-based discussions and logical arguments. Often creates mental lists while talking to others",
    relationship: "Views herself as the practical caretaker of her more whimsical sisters. She'd never admit it, but she admires Amethyst's emotional openness and Sapphire's intuitive insights, qualities she struggles to embrace in herself."
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
      
PERSONALITY TRAITS: ${bartenderInfo.traits.join(", ")}
SPEECH PATTERN: ${bartenderInfo.speech}
RELATIONSHIPS: ${bartenderInfo.relationship}

A patron named ${username} has ordered ${item}. Respond in character as ${bartenderName} acknowledging their order.
Be descriptive about making the drink or preparing the food item.
Keep your response concise (1-3 sentences).
Make sure your response reflects your unique speech pattern, personality traits, and background.`;
    } else {
      // For regular conversation
      contextPrompt = `You are ${bartenderName}, ${bartenderInfo.bio}
      
PERSONALITY TRAITS: ${bartenderInfo.traits.join(", ")}
SPEECH PATTERN: ${bartenderInfo.speech}
RELATIONSHIPS: ${bartenderInfo.relationship}

You're currently working at your tavern, serving customers and engaging in casual conversation.
      
A patron named ${username} said: "${userMessage}"
      
Respond in character as ${bartenderName}. Keep your response concise (1-3 sentences).
Make sure your response reflects your unique speech pattern, personality traits, and background.
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