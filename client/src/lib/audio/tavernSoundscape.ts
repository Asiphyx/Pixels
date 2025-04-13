import { audioManager, SoundCategory } from './audioManager';

// Define the sound paths for our tavern soundscape
const SOUND_PATHS = {
  // Ambient sounds
  TAVERN_AMBIENCE: '/sounds/tavern_ambience.mp3',
  FIREPLACE_CRACKLE: '/sounds/fireplace.mp3',
  RAIN_OUTSIDE: '/sounds/rain.mp3',
  
  // Sound effects
  POUR_DRINK: '/sounds/pour_drink.mp3',
  GLASS_CLINK: '/sounds/glass_clink.mp3',
  MUG_DOWN: '/sounds/mug_down.mp3',
  COIN_DROP: '/sounds/coin_drop.mp3',
  DOOR_OPEN: '/sounds/door_open.mp3',
  DOOR_CLOSE: '/sounds/door_close.mp3',
  CROWD_LAUGH: '/sounds/crowd_laugh.mp3',
  CHAIR_MOVE: '/sounds/chair_move.mp3',
  
  // Music tracks
  TAVERN_MUSIC_LIVELY: '/sounds/tavern_music_lively.mp3',
  TAVERN_MUSIC_MELLOW: '/sounds/tavern_music_mellow.mp3',
  
  // Bartender voices - we'll create these dynamically
  
  // UI sounds
  BUTTON_CLICK: '/sounds/ui_click.mp3',
  NOTIFICATION: '/sounds/notification.mp3',
  MESSAGE_SEND: '/sounds/message_send.mp3',
  MENU_OPEN: '/sounds/menu_open.mp3'
};

// Helper to generate dummy base64 audio for development when actual files don't exist yet
// This ensures the app won't crash if sound files are missing
function generateDummyAudio(duration = 1, frequency = 440): string {
  // In a real app, we would load actual audio files
  // This is just a placeholder to prevent errors during development
  return `data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAEluZm8AAAAPAAAAAwAAAbAAkJCQkJCQkJCQkJCQkJCQwMDAwMDAwMDAwMDAwMDA4ODg4ODg4ODg4ODg4ODg4P//////////////////////////AAAAAExhdmM1OC4xMwAAAAAAAAAAAAAAACQCkAAAAAAAAAGwoYjPzfeAAAAAAAAAAAAAAAAAAAAA`;
}

/**
 * TavernSoundscape - Manages the audio environment for the fantasy tavern
 */
class TavernSoundscape {
  private currentMusicId: string | null = null;
  private ambiencePlaying: boolean = false;
  private rainPlaying: boolean = false;
  private weatherIntensity: number = 0; // 0-1 scale

  constructor() {
    this.registerSounds();
  }

  /**
   * Register all the tavern sounds with the audio manager
   */
  private registerSounds(): void {
    try {
      // Helper function to check if actual sound files exist
      // For now we'll use dummy audio, but in production we'd use real files
      const getSources = (path: string): string[] => {
        return [path, generateDummyAudio()]; // Fallback to dummy audio if file doesn't exist
      };
      
      // Register ambient sounds
      audioManager.registerSound('tavern_ambience', getSources(SOUND_PATHS.TAVERN_AMBIENCE), {
        category: 'ambient',
        loop: true,
        volume: 0.6,
        preload: true
      });
      
      audioManager.registerSound('fireplace', getSources(SOUND_PATHS.FIREPLACE_CRACKLE), {
        category: 'ambient',
        loop: true,
        volume: 0.4,
        preload: true
      });
      
      audioManager.registerSound('rain', getSources(SOUND_PATHS.RAIN_OUTSIDE), {
        category: 'ambient',
        loop: true,
        volume: 0.5,
        preload: true
      });
      
      // Register music tracks
      audioManager.registerSound('tavern_music_lively', getSources(SOUND_PATHS.TAVERN_MUSIC_LIVELY), {
        category: 'music',
        loop: true,
        volume: 0.7,
        preload: false // Stream music rather than preloading
      });
      
      audioManager.registerSound('tavern_music_mellow', getSources(SOUND_PATHS.TAVERN_MUSIC_MELLOW), {
        category: 'music',
        loop: true,
        volume: 0.7,
        preload: false
      });
      
      // Register SFX
      const sfxSounds = {
        'pour_drink': SOUND_PATHS.POUR_DRINK,
        'glass_clink': SOUND_PATHS.GLASS_CLINK,
        'mug_down': SOUND_PATHS.MUG_DOWN,
        'coin_drop': SOUND_PATHS.COIN_DROP,
        'door_open': SOUND_PATHS.DOOR_OPEN,
        'door_close': SOUND_PATHS.DOOR_CLOSE,
        'crowd_laugh': SOUND_PATHS.CROWD_LAUGH,
        'chair_move': SOUND_PATHS.CHAIR_MOVE
      };
      
      Object.entries(sfxSounds).forEach(([id, path]) => {
        audioManager.registerSound(id, getSources(path), {
          category: 'sfx',
          loop: false,
          volume: 0.8
        });
      });
      
      // Register UI sounds
      const uiSounds = {
        'ui_click': SOUND_PATHS.BUTTON_CLICK,
        'notification': SOUND_PATHS.NOTIFICATION,
        'message_send': SOUND_PATHS.MESSAGE_SEND,
        'menu_open': SOUND_PATHS.MENU_OPEN
      };
      
      Object.entries(uiSounds).forEach(([id, path]) => {
        audioManager.registerSound(id, getSources(path), {
          category: 'ui',
          loop: false,
          volume: 0.5
        });
      });
      
    } catch (error) {
      console.error('Error registering tavern sounds:', error);
    }
  }

  /**
   * Start the tavern ambient soundscape
   */
  startAmbience(): void {
    if (!this.ambiencePlaying) {
      audioManager.play('tavern_ambience');
      audioManager.play('fireplace');
      this.ambiencePlaying = true;
    }
  }

  /**
   * Stop the tavern ambient soundscape
   */
  stopAmbience(): void {
    if (this.ambiencePlaying) {
      audioManager.stop('tavern_ambience');
      audioManager.stop('fireplace');
      this.ambiencePlaying = false;
    }
  }

  /**
   * Play tavern background music
   * @param mood - The mood of music to play ('lively' or 'mellow')
   * @param crossfade - Whether to crossfade from current music
   */
  playMusic(mood: 'lively' | 'mellow', crossfade: boolean = true): void {
    const newMusicId = `tavern_music_${mood}`;
    
    // Don't restart if the same music is already playing
    if (this.currentMusicId === newMusicId) return;
    
    if (crossfade && this.currentMusicId) {
      // Fade out current music
      audioManager.fade(this.currentMusicId, 0, 2000);
      setTimeout(() => {
        audioManager.stop(this.currentMusicId!);
        
        // Start new music
        audioManager.play(newMusicId);
        audioManager.fade(newMusicId, 0.7, 2000);
        this.currentMusicId = newMusicId;
      }, 1500);
    } else {
      // Stop current music immediately if any
      if (this.currentMusicId) {
        audioManager.stop(this.currentMusicId);
      }
      
      // Start new music
      audioManager.play(newMusicId);
      this.currentMusicId = newMusicId;
    }
  }

  /**
   * Stop current background music
   * @param fadeOut - Whether to fade out (true) or stop immediately (false)
   */
  stopMusic(fadeOut: boolean = true): void {
    if (!this.currentMusicId) return;
    
    if (fadeOut) {
      audioManager.fade(this.currentMusicId, 0, 2000);
      setTimeout(() => {
        audioManager.stop(this.currentMusicId!);
        this.currentMusicId = null;
      }, 2000);
    } else {
      audioManager.stop(this.currentMusicId);
      this.currentMusicId = null;
    }
  }

  /**
   * Set the weather conditions outside the tavern
   * @param type - Type of weather ('clear', 'rain', 'storm')
   * @param intensity - Intensity from 0 (none) to 1 (heavy)
   */
  setWeather(type: 'clear' | 'rain' | 'storm', intensity: number = 0.5): void {
    intensity = Math.max(0, Math.min(1, intensity));
    this.weatherIntensity = intensity;
    
    if (type === 'clear') {
      if (this.rainPlaying) {
        audioManager.fade('rain', 0, 2000);
        setTimeout(() => {
          audioManager.stop('rain');
        }, 2000);
        this.rainPlaying = false;
      }
    } else if (type === 'rain' || type === 'storm') {
      const volume = type === 'rain' ? intensity * 0.5 : intensity * 0.8;
      
      if (!this.rainPlaying) {
        audioManager.play('rain');
        audioManager.fade('rain', 0, volume, 2000);
        this.rainPlaying = true;
      } else {
        audioManager.fade('rain', volume, 1000);
      }
    }
  }

  /**
   * Play a sound effect associated with tavern activities
   * @param type - Type of sound effect to play
   * @param volume - Optional volume override (0-1)
   * @returns The playback ID for further control
   */
  playSfx(
    type: 'pour_drink' | 'glass_clink' | 'mug_down' | 'coin_drop' | 
          'door_open' | 'door_close' | 'crowd_laugh' | 'chair_move',
    volume?: number
  ): number {
    if (volume !== undefined) {
      const sound = audioManager['sounds'].get(type);
      if (sound) {
        // Temporarily adjust the sound's base volume
        const originalVolume = sound.volume || 1;
        sound.volume = volume;
        
        // Play the sound
        const playId = audioManager.play(type);
        
        // Restore original volume after playing
        setTimeout(() => {
          sound.volume = originalVolume;
        }, 100);
        
        return playId;
      }
    }
    
    return audioManager.play(type);
  }

  /**
   * Play UI interaction sounds
   * @param type - Type of UI sound to play
   */
  playUiSound(type: 'ui_click' | 'notification' | 'message_send' | 'menu_open'): void {
    const soundMap: Record<string, string> = {
      'ui_click': 'ui_click',
      'notification': 'notification',
      'message_send': 'message_send',
      'menu_open': 'menu_open'
    };
    
    audioManager.play(soundMap[type]);
  }

  /**
   * Register a bartender voice with dynamically created sounds
   * @param bartenderName - Name of the bartender
   * @param voiceCategory - Category of voice (deep, neutral, high)
   */
  registerBartenderVoice(bartenderName: string, voiceCategory: 'deep' | 'neutral' | 'high'): void {
    // In a real implementation, we would load specific voice samples for each bartender
    // For now, we'll just create a placeholder registration
    
    // Create a base sound ID for this bartender
    const baseSoundId = `voice_${bartenderName.toLowerCase()}`;
    
    // Register with the audio manager
    audioManager.registerSound(baseSoundId, [generateDummyAudio()], {
      category: 'voice',
      volume: 0.9,
      loop: false
    });
  }

  /**
   * Play a bartender's voice sound
   * @param bartenderName - Name of the bartender
   * @param emotion - Emotional tone of the voice
   */
  playBartenderVoice(bartenderName: string, emotion: 'neutral' | 'happy' | 'confused' | 'angry'): void {
    const baseSoundId = `voice_${bartenderName.toLowerCase()}`;
    
    // Play the voice sound
    audioManager.play(baseSoundId);
  }
}

// Create and export a singleton instance
export const tavernSoundscape = new TavernSoundscape();