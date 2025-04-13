import { Howl, Howler } from 'howler';

// Sound categories 
export type SoundCategory = 'ambient' | 'sfx' | 'voice' | 'music' | 'ui';

// Types for managing audio
export interface Sound {
  id: string;
  howl: Howl;
  category: SoundCategory;
  loop?: boolean;
  volume?: number;
}

interface AudioConfig {
  masterVolume: number;
  categoryVolumes: Record<SoundCategory, number>;
  muted: boolean;
}

/**
 * AudioManager - Central sound management system for the fantasy tavern
 * Uses Howler.js for cross-browser audio playback
 */
class AudioManager {
  private sounds: Map<string, Sound> = new Map();
  private playing: Map<string, number[]> = new Map(); // Track playing sound IDs
  private config: AudioConfig = {
    masterVolume: 0.8,
    categoryVolumes: {
      ambient: 0.6,  // Background ambient sounds
      sfx: 0.8,      // Sound effects like glass clinking, door opening
      voice: 1.0,    // Character voices
      music: 0.7,    // Background music
      ui: 0.5,       // UI interaction sounds
    },
    muted: false
  };

  constructor() {
    // Set global Howler configuration
    Howler.autoUnlock = true; // Try to unlock audio on first user interaction
    Howler.volume(this.config.masterVolume);
    
    // Attempt to load user preferences from localStorage
    this.loadPreferences();
    
    // Handle page visibility changes to mute/unmute
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Page is hidden, optionally mute non-essential sounds
        this.adjustCategoryVolume('sfx', 0.1);
        this.adjustCategoryVolume('ui', 0);
      } else {
        // Page is visible again, restore volumes
        this.loadPreferences();
      }
    });
  }

  /**
   * Register a sound to be used later
   * @param id - Unique identifier for the sound
   * @param src - Array of sound file URLs (different formats for browser compatibility)
   * @param options - Additional Howl options
   * @returns The registered Sound object
   */
  registerSound(
    id: string, 
    src: string[], 
    options: { 
      category: SoundCategory, 
      volume?: number, 
      loop?: boolean,
      sprite?: Record<string, [number, number]>,
      preload?: boolean
    }
  ): Sound {
    const { category, volume = 1, loop = false, ...restOptions } = options;

    // Create the Howl instance
    const howl = new Howl({
      src,
      volume: volume * this.getCategoryVolume(category),
      loop,
      ...restOptions,
      // Standard options for better performance
      html5: category === 'ambient' || category === 'music', // Use HTML5 Audio for longer sounds
      preload: options.preload !== false, // Preload by default unless specified
    });

    // Store the sound
    const sound: Sound = { id, howl, category, loop, volume };
    this.sounds.set(id, sound);
    
    // Initialize playing array
    this.playing.set(id, []);

    return sound;
  }

  /**
   * Play a registered sound
   * @param id - ID of the sound to play
   * @param sprite - Optional sprite name if using sprite sheet
   * @returns playback ID or -1 if failed
   */
  play(id: string, sprite?: string): number {
    const sound = this.sounds.get(id);
    if (!sound) {
      console.warn(`Sound not found: ${id}`);
      return -1;
    }

    // Calculate effective volume based on master and category volumes
    const effectiveVolume = this.calculateEffectiveVolume(sound);
    sound.howl.volume(effectiveVolume);

    // Play the sound (with optional sprite)
    const playId = sprite ? sound.howl.play(sprite) : sound.howl.play();
    
    // Track the playing instance
    if (playId !== null) {
      const playingIds = this.playing.get(id) || [];
      playingIds.push(playId);
      this.playing.set(id, playingIds);
      
      // Set up cleanup when sound ends (if not looping)
      if (!sound.loop) {
        sound.howl.once('end', () => {
          this.removePlayingId(id, playId);
        }, playId);
      }
    }

    return playId || -1;
  }

  /**
   * Stop a specific sound instance or all instances of a sound
   * @param id - Sound ID to stop
   * @param playId - Optional specific playback instance
   */
  stop(id: string, playId?: number): void {
    const sound = this.sounds.get(id);
    if (!sound) return;

    if (playId !== undefined) {
      // Stop specific instance
      sound.howl.stop(playId);
      this.removePlayingId(id, playId);
    } else {
      // Stop all instances of this sound
      sound.howl.stop();
      this.playing.set(id, []);
    }
  }

  /**
   * Stop all sounds in a specific category
   * @param category - Category to stop
   */
  stopCategory(category: SoundCategory): void {
    this.sounds.forEach(sound => {
      if (sound.category === category) {
        this.stop(sound.id);
      }
    });
  }

  /**
   * Stop all currently playing sounds
   */
  stopAll(): void {
    Howler.stop();
    // Reset playing tracking
    this.playing.forEach((_, key) => {
      this.playing.set(key, []);
    });
  }

  /**
   * Fade a sound to a new volume
   * @param id - Sound ID
   * @param newVolume - Target volume (0-1)
   * @param duration - Fade duration in milliseconds
   * @param playId - Optional specific playback instance
   */
  fade(id: string, newVolume: number, duration: number, playId?: number): void {
    const sound = this.sounds.get(id);
    if (!sound) return;

    const effectiveVolume = newVolume * this.getCategoryVolume(sound.category);
    
    if (playId !== undefined) {
      try {
        const currentVolume = sound.howl.volume(playId);
        if (typeof currentVolume === 'number') {
          sound.howl.fade(currentVolume, effectiveVolume, duration, playId);
        }
      } catch (error) {
        console.error('Error fading sound with ID', id, error);
      }
    } else {
      // Get all playing instances
      const playingIds = this.playing.get(id) || [];
      
      // Update the base volume for future plays
      sound.volume = newVolume;
      
      // Apply fade to all currently playing instances
      playingIds.forEach(playId => {
        try {
          const currentVolume = sound.howl.volume(playId);
          if (typeof currentVolume === 'number') {
            sound.howl.fade(currentVolume, effectiveVolume, duration, playId);
          }
        } catch (error) {
          console.error('Error fading sound with ID', id, error);
        }
      });
    }
  }

  /**
   * Adjust master volume for all sounds
   * @param volume - New master volume (0-1)
   */
  adjustMasterVolume(volume: number): void {
    this.config.masterVolume = Math.max(0, Math.min(1, volume));
    Howler.volume(this.config.masterVolume);
    this.savePreferences();
  }

  /**
   * Adjust volume for a specific sound category
   * @param category - Sound category
   * @param volume - New volume for category (0-1)
   */
  adjustCategoryVolume(category: SoundCategory, volume: number): void {
    this.config.categoryVolumes[category] = Math.max(0, Math.min(1, volume));
    
    // Update all sounds in this category
    this.sounds.forEach(sound => {
      if (sound.category === category) {
        const effectiveVolume = this.calculateEffectiveVolume(sound);
        
        // Update all playing instances
        const playingIds = this.playing.get(sound.id) || [];
        playingIds.forEach(playId => {
          sound.howl.volume(effectiveVolume, playId);
        });
      }
    });

    this.savePreferences();
  }

  /**
   * Mute or unmute all audio
   * @param muted - Whether to mute (true) or unmute (false)
   */
  setMute(muted: boolean): void {
    this.config.muted = muted;
    Howler.mute(muted);
    this.savePreferences();
  }

  /**
   * Toggle mute state
   * @returns New mute state
   */
  toggleMute(): boolean {
    this.setMute(!this.config.muted);
    return this.config.muted;
  }

  /**
   * Get current state of audio config
   * @returns Current audio configuration
   */
  getConfig(): AudioConfig {
    return { ...this.config };
  }

  /**
   * Get effective volume for a sound category
   * @param category - The sound category
   * @returns Effective volume (0-1)
   */
  getCategoryVolume(category: SoundCategory): number {
    return this.config.categoryVolumes[category] * this.config.masterVolume;
  }
  
  /**
   * Play a simple beep sound using Web Audio API (most reliable method)
   * @param options - Options for the beep sound
   */
  playBeep(options: { 
    frequency?: number; 
    duration?: number; 
    volume?: number;
    type?: OscillatorType;
  } = {}): void {
    try {
      const {
        frequency = 800,
        duration = 100,
        volume = 0.1,
        type = 'sine'
      } = options;
      
      // Create audio context
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create oscillator and gain nodes
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      // Set oscillator properties
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      
      // Set volume based on gain and category volume
      const effectiveVolume = volume * this.getCategoryVolume('ui');
      gainNode.gain.setValueAtTime(effectiveVolume, audioContext.currentTime);
      
      // Connect nodes
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Start and stop oscillator
      oscillator.start();
      oscillator.stop(audioContext.currentTime + (duration / 1000));
      
      console.log('Played direct beep sound using Web Audio API');
    } catch (error) {
      console.error('Failed to play beep sound:', error);
    }
  }

  /**
   * Calculate the effective volume for a sound, taking into account all factors
   * @param sound - The sound object
   * @returns Effective volume (0-1)
   */
  private calculateEffectiveVolume(sound: Sound): number {
    const baseVolume = sound.volume || 1;
    return baseVolume * this.getCategoryVolume(sound.category);
  }

  /**
   * Remove a playing ID from tracking when it finishes
   * @param soundId - Sound identifier
   * @param playId - Playback instance ID
   */
  private removePlayingId(soundId: string, playId: number): void {
    const playingIds = this.playing.get(soundId);
    if (playingIds) {
      const index = playingIds.indexOf(playId);
      if (index !== -1) {
        playingIds.splice(index, 1);
        this.playing.set(soundId, playingIds);
      }
    }
  }

  /**
   * Save audio preferences to localStorage
   */
  private savePreferences(): void {
    try {
      localStorage.setItem('audioConfig', JSON.stringify({
        masterVolume: this.config.masterVolume,
        categoryVolumes: this.config.categoryVolumes,
        muted: this.config.muted
      }));
    } catch (error) {
      console.warn('Failed to save audio preferences:', error);
    }
  }

  /**
   * Load audio preferences from localStorage
   */
  private loadPreferences(): void {
    try {
      const saved = localStorage.getItem('audioConfig');
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<AudioConfig>;
        
        // Apply saved settings
        if (parsed.masterVolume !== undefined) {
          this.config.masterVolume = parsed.masterVolume;
          Howler.volume(this.config.masterVolume);
        }
        
        if (parsed.categoryVolumes) {
          this.config.categoryVolumes = {
            ...this.config.categoryVolumes,
            ...parsed.categoryVolumes
          };
        }
        
        if (parsed.muted !== undefined) {
          this.config.muted = parsed.muted;
          Howler.mute(this.config.muted);
        }
      }
    } catch (error) {
      console.warn('Failed to load audio preferences:', error);
    }
  }
}

// Create and export a singleton instance
export const audioManager = new AudioManager();