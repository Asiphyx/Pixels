// Simple sentiment analysis for determining mood changes
// Determines how bartenders should react to user messages

/**
 * Analyzes the sentiment of a message to determine how it should affect bartender mood
 * @param message - The message to analyze
 * @returns A number indicating the mood change (-10 to +10)
 */
export function analyzeSentiment(message: string): number {
  const lowerMessage = message.toLowerCase();
  
  // Very positive words/phrases (big mood boost)
  const veryPositiveTerms = [
    'amazing', 'fantastic', 'excellent', 'wonderful', 'brilliant', 'love', 
    'beautiful', 'perfect', 'best', 'favorite', 'incredible', 
    'thank you so much', 'you\'re the best', 'love this place',
    'marry me', 'gorgeous', 'stunning', 'extraordinary'
  ];
  
  // Positive words/phrases (moderate mood boost)
  const positiveTerms = [
    'good', 'nice', 'great', 'cool', 'awesome', 'thanks', 'appreciate', 
    'happy', 'enjoy', 'pleased', 'glad', 'helpful', 'kind', 'sweet', 
    'fun', 'like', 'pretty', 'attractive', 'delicious', 'tasty'
  ];
  
  // Neutral conversation starters/questions (tiny mood boost for engagement)
  const neutralTerms = [
    'hello', 'hi', 'hey', 'how are you', 'what\'s up', 'greetings',
    'good morning', 'good afternoon', 'good evening', 'how\'s it going',
    'what do you recommend', 'tell me about', 'may i have', 'please'
  ];
  
  // Negative words/phrases (moderate mood decrease)
  const negativeTerms = [
    'bad', 'poor', 'terrible', 'awful', 'horrible', 'dislike', 'hate',
    'slow', 'rude', 'disappointing', 'overpriced', 'mediocre', 'boring',
    'not good', 'waste', 'unhappy', 'annoying', 'lousy'
  ];
  
  // Very negative words/phrases (big mood decrease)
  const veryNegativeTerms = [
    'worst', 'disgusting', 'pathetic', 'terrible', 'awful', 'scam',
    'ripoff', 'fraud', 'fuck', 'shit', 'stupid', 'idiot', 'useless',
    'worthless', 'never coming back', 'garbage', 'trash', 'hate'
  ];
  
  // Calculate sentiment score based on term matches
  let score = 0;
  
  // Check for very positive terms (+5 each)
  for (const term of veryPositiveTerms) {
    if (lowerMessage.includes(term)) {
      score += 5;
    }
  }
  
  // Check for positive terms (+2 each)
  for (const term of positiveTerms) {
    if (lowerMessage.includes(term)) {
      score += 2;
    }
  }
  
  // Check for neutral conversation starters (+1 each)
  for (const term of neutralTerms) {
    if (lowerMessage.includes(term)) {
      score += 1;
    }
  }
  
  // Check for negative terms (-2 each)
  for (const term of negativeTerms) {
    if (lowerMessage.includes(term)) {
      score -= 2;
    }
  }
  
  // Check for very negative terms (-5 each)
  for (const term of veryNegativeTerms) {
    if (lowerMessage.includes(term)) {
      score -= 5;
    }
  }
  
  // Limit the score to a range of -10 to +10
  return Math.max(-10, Math.min(10, score));
}

/**
 * Get a mood description based on the mood value
 * @param mood - Mood value from 0-100
 * @returns A string describing the mood
 */
export function getMoodDescription(mood: number): string {
  if (mood >= 90) return "absolutely adores you";
  if (mood >= 80) return "is very fond of you";
  if (mood >= 70) return "clearly likes you";
  if (mood >= 60) return "seems to like you";
  if (mood >= 50) return "is friendly toward you";
  if (mood >= 40) return "is somewhat cool toward you";
  if (mood >= 30) return "seems annoyed with you";
  if (mood >= 20) return "is clearly irritated by you";
  if (mood >= 10) return "strongly dislikes you";
  return "absolutely despises you";
}

/**
 * Adjust the response based on mood
 * @param response - Original response
 * @param mood - Current mood (0-100)
 * @param bartenderName - Name of the bartender
 * @returns Modified response based on mood
 */
export function adjustResponseBasedOnMood(response: string, mood: number, bartenderName: string): string {
  // Don't modify responses for order commands
  if (response.includes('/order')) {
    return response;
  }
  
  // For extremely negative moods (0-20), add snippy, rude, or cold remarks
  if (mood <= 20) {
    const negativeAdditions: Record<string, string[]> = {
      "Sapphire": [
        " *rolls her eyes* Whatever.",
        " *mutters* And I thought the depths were cold...",
        " *sharp tone* There. Happy now?",
        " *turns away* That's all you're getting from me.",
        " *glares* Hmph. Normies like you are why I prefer the abyss."
      ],
      "Amethyst": [
        " *forced smile* Is there anything ELSE you need?",
        " *turns away dramatically* Hmph!",
        " *smile fades* ...not that you'd appreciate it anyway.",
        " *straightens her apron* Is that all?",
        " *whispers to a fairy figurine* Can you believe this person?"
      ],
      "Ruby": [
        " *checks watch* Is this conversation efficiently concluding soon?",
        " *writes something in her ledger* Customer satisfaction: not a priority in this instance.",
        " *coldly* Will that be all?",
        " *adjusts glasses* I have more productive uses of my time.",
        " *calculating tone* The probability of this exchange improving is approximately 2.7%."
      ]
    };
    
    const additions = negativeAdditions[bartenderName as keyof typeof negativeAdditions] || [];
    if (additions.length > 0) {
      const addition = additions[Math.floor(Math.random() * additions.length)];
      return response + addition;
    }
  }
  
  // For extremely positive moods (80-100), add extra friendly, warm remarks
  if (mood >= 80) {
    const positiveAdditions: Record<string, string[]> = {
      "Sapphire": [
        " *her tattoos glow warmly* You're... different from the others. In a good way.",
        " *smiles genuinely* The tides bring good things when you're around.",
        " *leans in* You know, I don't say this to many surface-dwellers, but you're alright.",
        " *her eyes sparkle* The depths speak well of you.",
        " *touches your hand briefly* The currents around you feel... right."
      ],
      "Amethyst": [
        " *sparkles appear around her* You're absolutely my FAVORITE customer ever~!",
        " *twirls happily* Talking with you makes my whole day brighter!",
        " *clasps hands together* I just KNEW we were destined to be great friends!",
        " *winks playfully* You know, you're special... I can tell!",
        " *blows a magical kiss* You're simply the BEST~!"
      ],
      "Ruby": [
        " *small genuine smile* Your presence here is... statistically beneficial to my day.",
        " *adjusts a strand of hair* I've allocated 22% more time for our conversations. That's significant.",
        " *efficient nod* Your insights are consistently valuable. That's rare.",
        " *writes in her ledger* Customer satisfaction priority: exceptionally high.",
        " *meets your eyes briefly* I find our exchanges unusually satisfactory."
      ]
    };
    
    const additions = positiveAdditions[bartenderName as keyof typeof positiveAdditions] || [];
    if (additions.length > 0) {
      const addition = additions[Math.floor(Math.random() * additions.length)];
      return response + addition;
    }
  }
  
  return response;
}