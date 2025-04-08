// Utility functions for sound management

// Function to check if a sound file is accessible, loading a fallback if not
export async function checkSoundFile(soundPath: string): Promise<boolean> {
  try {
    const response = await fetch(soundPath, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error(`Error checking sound file ${soundPath}:`, error);
    return false;
  }
}

// Generic list of fallback sound URLs if local files aren't available
// These are royalty-free ambient sounds that can be used as fallbacks
export const fallbackSoundUrls: Record<string, string> = {
  'tavern-background': 'https://cdn.freesound.org/previews/368/368403_1676145-lq.mp3',
  'tavern-murmurs': 'https://cdn.freesound.org/previews/328/328862_3450800-lq.mp3',
  'ocean-waves': 'https://cdn.freesound.org/previews/417/417830_5121236-lq.mp3',
  'distant-seagulls': 'https://cdn.freesound.org/previews/512/512978_4445487-lq.mp3',
  'rose-garden-ambience': 'https://cdn.freesound.org/previews/341/341695_5865517-lq.mp3',
  'magical-chimes': 'https://cdn.freesound.org/previews/457/457043_9497060-lq.mp3',
  'fire-crackling': 'https://cdn.freesound.org/previews/191/191822_2558537-lq.mp3',
  'drink-pour': 'https://cdn.freesound.org/previews/446/446636_6142149-lq.mp3',
  'door-open': 'https://cdn.freesound.org/previews/401/401659_7292308-lq.mp3',
  'glass-clink': 'https://cdn.freesound.org/previews/448/448262_7487117-lq.mp3',
  'coin-drop': 'https://cdn.freesound.org/previews/469/469716_9459038-lq.mp3',
  'chair-move': 'https://cdn.freesound.org/previews/416/416179_8199000-lq.mp3'
};

// Get the available URL for a sound file
export async function getSoundUrl(soundId: string, localPath: string): Promise<string> {
  const isLocal = await checkSoundFile(localPath);
  
  if (isLocal) {
    return localPath;
  } else if (fallbackSoundUrls[soundId]) {
    console.log(`Using fallback for ${soundId}`);
    return fallbackSoundUrls[soundId];
  } else {
    console.error(`No sound file available for ${soundId}`);
    return '';
  }
}

// This helps cache sound URLs to avoid repeated checks
const soundUrlCache: Record<string, string> = {};

// Get sound URL with caching
export async function getCachedSoundUrl(soundId: string, localPath: string): Promise<string> {
  const cacheKey = `${soundId}:${localPath}`;
  
  if (soundUrlCache[cacheKey]) {
    return soundUrlCache[cacheKey];
  }
  
  const url = await getSoundUrl(soundId, localPath);
  soundUrlCache[cacheKey] = url;
  return url;
}

export default { 
  checkSoundFile, 
  getSoundUrl, 
  getCachedSoundUrl, 
  fallbackSoundUrls 
};