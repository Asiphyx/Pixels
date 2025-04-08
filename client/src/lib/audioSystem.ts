
import { Howl, HowlOptions } from 'howler';

// Sound categories
type SoundCategory = 'ambience' | 'effects' | 'music' | 'voices';

// Interface for sound configuration
interface SoundConfig {
  src: string[];
  volume?: number;
  loop?: boolean;
  autoplay?: boolean;
  preload?: boolean;
  html5?: boolean;
  category: SoundCategory;
}

class AudioSystem {
  private sounds: Map<string, Howl> = new Map();
  private categoryVolumes: Map<SoundCategory, number> = new Map([
    ['ambience', 0.5],
    ['effects', 0.8],
    ['music', 0.4],
    ['voices', 1.0]
  ]);
  private soundCategories: Map<string, SoundCategory> = new Map();
  private muted: boolean = false;

  // Register a new sound
  registerSound(id: string, config: SoundConfig): void {
    const { category, ...howlConfig } = config;
    
    // Apply category volume
    const categoryVolume = this.categoryVolumes.get(category) || 1.0;
    const finalVolume = (config.volume !== undefined) ? config.volume * categoryVolume : categoryVolume;
    
    const sound = new Howl({
      ...howlConfig,
      volume: finalVolume,
    });
    
    this.sounds.set(id, sound);
    this.soundCategories.set(id, category);
  }

  // Play a sound by ID
  play(id: string): number | undefined {
    const sound = this.sounds.get(id);
    if (sound) {
      return sound.play();
    }
    console.warn(`Sound "${id}" not found`);
    return undefined;
  }

  // Stop a sound by ID
  stop(id: string): void {
    const sound = this.sounds.get(id);
    if (sound) {
      sound.stop();
    }
  }

  // Fade in a sound
  fadeIn(id: string, duration: number = 1000): number | undefined {
    const sound = this.sounds.get(id);
    if (sound) {
      const category = this.soundCategories.get(id);
      const targetVolume = category ? (this.categoryVolumes.get(category) || 1.0) : 1.0;
      
      sound.volume(0);
      const soundId = sound.play();
      sound.fade(0, targetVolume, duration, soundId);
      return soundId;
    }
    return undefined;
  }

  // Fade out a sound
  fadeOut(id: string, duration: number = 1000): void {
    const sound = this.sounds.get(id);
    if (sound) {
      sound.fade(sound.volume(), 0, duration);
      setTimeout(() => sound.stop(), duration);
    }
  }

  // Set volume for a category
  setCategoryVolume(category: SoundCategory, volume: number): void {
    this.categoryVolumes.set(category, Math.max(0, Math.min(1, volume)));
    
    // Update volumes of all sounds in this category
    this.sounds.forEach((sound, id) => {
      if (this.soundCategories.get(id) === category) {
        sound.volume(volume);
      }
    });
  }

  // Mute/unmute all sounds
  setMuted(muted: boolean): void {
    this.muted = muted;
    Howler.mute(muted);
  }

  // Toggle mute state
  toggleMute(): boolean {
    this.muted = !this.muted;
    Howler.mute(this.muted);
    return this.muted;
  }
}

// Create singleton instance
const audioSystem = new AudioSystem();

// Register default tavern sounds
audioSystem.registerSound('tavern-ambience', {
  src: ['https://assets.codepen.io/21542/TavernAmbience.mp3'],
  loop: true,
  volume: 0.4,
  html5: true,
  category: 'ambience'
});

audioSystem.registerSound('pour-drink', {
  src: ['https://assets.codepen.io/21542/PourDrink.mp3'],
  volume: 0.7,
  category: 'effects'
});

audioSystem.registerSound('tavern-music', {
  src: ['https://assets.codepen.io/21542/TavernMusic.mp3'],
  loop: true,
  volume: 0.3,
  html5: true,
  category: 'music'
});

audioSystem.registerSound('door-open', {
  src: ['https://assets.codepen.io/21542/DoorOpen.mp3'],
  volume: 0.6,
  category: 'effects'
});

export default audioSystem;
