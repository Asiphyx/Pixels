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
 * Get CSS color class based on mood value
 * @param mood - Mood value from 0-100
 * @returns A CSS color class
 */
export function getMoodColor(mood: number): string {
  if (mood >= 80) return "text-[#6EFF6E]"; // Bright green
  if (mood >= 60) return "text-[#B4FF6E]"; // Light green
  if (mood >= 50) return "text-[#FFD700]"; // Gold
  if (mood >= 40) return "text-[#FFB347]"; // Orange
  if (mood >= 20) return "text-[#FF6E6E]"; // Light red
  return "text-[#FF4040]"; // Bright red
}

/**
 * Get mood icon based on mood value
 * @param mood - Mood value from 0-100
 * @returns An ASCII mood icon
 */
export function getMoodIcon(mood: number): string {
  if (mood >= 80) return "♥"; // Heart
  if (mood >= 60) return "★"; // Star
  if (mood >= 50) return "●"; // Circle
  if (mood >= 40) return "◆"; // Diamond
  if (mood >= 20) return "▲"; // Triangle
  return "✖"; // X
}