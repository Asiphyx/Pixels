import { useEffect, useRef, useState } from 'react';
import { useWebSocketStore } from '@/lib/websocket';
import { ActionSoundType } from '@/hooks/use-tavern-audio';

// Define sound types and their properties
interface SoundEffect {
  id: string;
  volume: number;
  loop: boolean;
  playbackRate?: number;
}

// Room-specific ambient sounds
const roomSounds: Record<number, SoundEffect[]> = {
  // Room 1: The Rose Garden (Amethyst) - magical, mystical ambience
  1: [
    { 
      id: 'rose-garden-ambience', 
      volume: 0.3, 
      loop: true 
    },
    { 
      id: 'magical-chimes', 
      volume: 0.1, 
      loop: true,
      playbackRate: 0.8
    }
  ],
  
  // Room 2: The Ocean View (Sapphire) - ocean and water sounds
  2: [
    { 
      id: 'ocean-waves', 
      volume: 0.3, 
      loop: true 
    },
    { 
      id: 'distant-seagulls', 
      volume: 0.1, 
      loop: true 
    }
  ],
  
  // Room 3: The Dragon's Den (Ruby) - murmurs and tavern sounds
  3: [
    { 
      id: 'tavern-murmurs', 
      volume: 0.3, 
      loop: true 
    },
    { 
      id: 'crackling-fire', 
      volume: 0.2, 
      loop: true 
    }
  ]
};

// Common tavern sounds that play in all rooms
const commonSounds: SoundEffect[] = [
  { 
    id: 'tavern-background', 
    volume: 0.15, 
    loop: true 
  }
];

// Action sounds
const actionSounds: Record<string, SoundEffect> = {
  'drink-pour': { 
    id: 'drink-pour', 
    volume: 0.5, 
    loop: false 
  },
  'door-open': { 
    id: 'door-open', 
    volume: 0.4, 
    loop: false 
  },
  'drink-serve': { 
    id: 'drink-serve', 
    volume: 0.4, 
    loop: false 
  },
  'coin-drop': {
    id: 'coin-drop',
    volume: 0.4,
    loop: false
  },
  'chair-move': {
    id: 'chair-move',
    volume: 0.3,
    loop: false
  },
  'glass-clink': {
    id: 'glass-clink',
    volume: 0.4,
    loop: false
  }
};

// Sound generation utilities
const generateAudioBuffer = (ctx: AudioContext, createFn: (ctx: AudioContext) => AudioBuffer): AudioBuffer => {
  return createFn(ctx);
};

// Sound generator functions
const SoundEffects = {
  // Helper functions for sound generation
  getEnvelope: (t: number, attackTime: number, decayTime: number, sustainLevel: number, releaseTime: number, totalDuration: number): number => {
    const attackEnd = attackTime;
    const decayEnd = attackEnd + decayTime;
    const releaseStart = totalDuration - releaseTime;
    
    if (t < 0) return 0;
    if (t < attackEnd) return t / attackEnd; // Attack phase
    if (t < decayEnd) return 1 - (1 - sustainLevel) * (t - attackEnd) / decayTime; // Decay phase
    if (t < releaseStart) return sustainLevel; // Sustain phase
    if (t < totalDuration) return sustainLevel * (1 - (t - releaseStart) / releaseTime); // Release phase
    return 0;
  },
  
  // Simple noise generator with filtering
  filteredNoise: (t: number, lowFreq: number, highFreq: number): number => {
    // Create noise and filter by summing several sine waves at random frequencies
    let noise = 0;
    const numOvertones = 5;
    for (let i = 0; i < numOvertones; i++) {
      const freq = lowFreq + (highFreq - lowFreq) * (i / numOvertones);
      noise += Math.sin(t * freq * (0.9 + 0.2 * Math.random()) * 2 * Math.PI) * (1 / numOvertones);
    }
    return noise * 0.5;
  },
  
  // Generate a door sound
  doorOpen: (audioContext: AudioContext): AudioBuffer => {
    const duration = 1.5;
    const sampleRate = audioContext.sampleRate;
    const buffer = audioContext.createBuffer(
      2, 
      sampleRate * duration, 
      sampleRate
    );
    
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const data = buffer.getChannelData(channel);
      
      for (let i = 0; i < buffer.length; i++) {
        const t = i / sampleRate;
        const phase = t / duration;
        
        // Creaking sound - create multiple components
        const creak1 = Math.sin(t * 180 + 20 * Math.sin(t * 5)) * 0.2 * Math.pow(1 - phase, 1.5);
        
        // Add some wood resonance
        const lowResonance = Math.sin(150 * t) * 0.05 * Math.pow(1 - phase, 2);
        
        // Add some high-frequency components
        const highCreak = SoundEffects.filteredNoise(t, 2000, 4000) * 0.03 * (phase < 0.7 ? Math.pow(phase, 0.5) * Math.pow(1 - phase, 1.5) : 0);
        
        // Add a thud near the end
        const thud = phase > 0.7 ? Math.sin(80 * t) * 0.1 * Math.pow((phase - 0.7) * 3.3, 0.5) * Math.pow(1 - phase, 4) : 0;
        
        data[i] = creak1 + lowResonance + highCreak + thud;
      }
    }
    
    return buffer;
  },
  
  // Generate a coin drop sound
  coinDrop: (audioContext: AudioContext): AudioBuffer => {
    const duration = 1.2;
    const sampleRate = audioContext.sampleRate;
    const buffer = audioContext.createBuffer(
      2,
      sampleRate * duration,
      sampleRate
    );
    
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const data = buffer.getChannelData(channel);
      
      for (let i = 0; i < buffer.length; i++) {
        const t = i / sampleRate;
        const phase = t / duration;
        
        // Initial coin clink
        const initialClink = Math.sin(6000 * t) * Math.exp(-15 * t) * 0.4;
        
        // Multiple bounces with decreasing amplitude and frequency
        const bounce1 = phase > 0.15 ? Math.sin(4500 * t) * 0.2 * Math.exp(-15 * (t - 0.15)) : 0;
        const bounce2 = phase > 0.35 ? Math.sin(4000 * t) * 0.15 * Math.exp(-15 * (t - 0.35)) : 0;
        const bounce3 = phase > 0.5 ? Math.sin(3500 * t) * 0.1 * Math.exp(-15 * (t - 0.5)) : 0;
        const bounce4 = phase > 0.6 ? Math.sin(3000 * t) * 0.07 * Math.exp(-15 * (t - 0.6)) : 0;
        const bounce5 = phase > 0.7 ? Math.sin(2500 * t) * 0.05 * Math.exp(-15 * (t - 0.7)) : 0;
        
        // Rolling effect towards the end
        const rolling = phase > 0.7 ? SoundEffects.filteredNoise(t, 1000, 6000) * 0.02 * Math.exp(-5 * (t - 0.7)) : 0;
        
        data[i] = initialClink + bounce1 + bounce2 + bounce3 + bounce4 + bounce5 + rolling;
      }
    }
    
    return buffer;
  },
  
  // Generate a glass clink sound
  glassClink: (audioContext: AudioContext): AudioBuffer => {
    const duration = 1.5;
    const sampleRate = audioContext.sampleRate;
    const buffer = audioContext.createBuffer(
      2,
      sampleRate * duration,
      sampleRate
    );
    
    // Glass resonant frequencies
    const frequencies = [700, 1200, 2400, 3600, 4800];
    const decayRates = [5, 7, 10, 12, 15];  // Different decay rates for each frequency
    
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const data = buffer.getChannelData(channel);
      
      for (let i = 0; i < buffer.length; i++) {
        const t = i / sampleRate;
        
        // Create a multi-frequency resonant clink
        let sample = 0;
        
        // Primary impact
        for (let j = 0; j < frequencies.length; j++) {
          sample += Math.sin(2 * Math.PI * frequencies[j] * t) * 
                   Math.exp(-decayRates[j] * t) * 
                   (0.3 / frequencies.length) * (1 - j * 0.1);
        }
        
        // Secondary impact (slightly delayed and quieter)
        if (t > 0.1) {
          const t2 = t - 0.1;
          for (let j = 0; j < frequencies.length; j++) {
            sample += Math.sin(2 * Math.PI * frequencies[j] * t2) * 
                     Math.exp(-decayRates[j] * t2) * 
                     (0.15 / frequencies.length) * (1 - j * 0.1);
          }
        }
        
        data[i] = sample;
      }
    }
    
    return buffer;
  },
  
  // Generate a drink pour sound
  drinkPour: (audioContext: AudioContext): AudioBuffer => {
    const duration = 2.5;
    const sampleRate = audioContext.sampleRate;
    const buffer = audioContext.createBuffer(
      2,
      sampleRate * duration,
      sampleRate
    );
    
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const data = buffer.getChannelData(channel);
      
      for (let i = 0; i < buffer.length; i++) {
        const t = i / sampleRate;
        const phase = t / duration;
        
        // Create an envelope that builds up and then fades out
        let envelopeShape;
        if (phase < 0.2) {
          // Quickly fade in
          envelopeShape = phase * 5;
        } else if (phase < 0.7) {
          // Maintain pour
          envelopeShape = 1;
        } else {
          // Fade out as the pour finishes
          envelopeShape = 1 - ((phase - 0.7) / 0.3);
        }
        
        // Filtered noise for the liquid sound
        const pourNoise = SoundEffects.filteredNoise(t, 800, 4000) * 0.12 * envelopeShape;
        
        // Add occasional bubbles/splashes
        let bubbles = 0;
        if (Math.random() < 0.02) {
          const bubbleFreq = 1000 + Math.random() * 2000;
          bubbles = Math.sin(2 * Math.PI * bubbleFreq * t) * 0.1 * Math.exp(-20 * (t % 0.2));
        }
        
        // Add a gentle underlying woosh
        const woosh = SoundEffects.filteredNoise(t, 100, 600) * 0.04 * envelopeShape;
        
        data[i] = pourNoise + bubbles + woosh;
      }
    }
    
    return buffer;
  },
  
  // Generate a chair moving sound
  chairMove: (audioContext: AudioContext): AudioBuffer => {
    const duration = 1.2;
    const sampleRate = audioContext.sampleRate;
    const buffer = audioContext.createBuffer(
      2,
      sampleRate * duration,
      sampleRate
    );
    
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const data = buffer.getChannelData(channel);
      
      for (let i = 0; i < buffer.length; i++) {
        const t = i / sampleRate;
        const phase = t / duration;
        
        // Create an envelope
        let envelope;
        if (phase < 0.1) {
          envelope = phase * 10; // Quick fade in
        } else if (phase < 0.8) {
          envelope = 1.0; // Sustain
        } else {
          envelope = 1 - ((phase - 0.8) / 0.2); // Fade out
        }
        
        // Low rumble for chair movement
        const baseDrag = SoundEffects.filteredNoise(t, 50, 300) * 0.15 * envelope;
        
        // Wood creaking elements
        const woodCreak = Math.sin(120 * t + 10 * Math.sin(t * 4)) * 0.05 * envelope;
        
        // Add some higher frequency scraping
        const scrape = SoundEffects.filteredNoise(t, 2000, 6000) * 0.03 * envelope;
        
        // Random small squeaks
        let squeak = 0;
        if (phase > 0.2 && phase < 0.7 && Math.random() < 0.01) {
          const squeakFreq = 900 + Math.random() * 1000;
          squeak = Math.sin(2 * Math.PI * squeakFreq * t) * 0.05 * Math.exp(-20 * (t % 0.1));
        }
        
        data[i] = baseDrag + woodCreak + scrape + squeak;
      }
    }
    
    return buffer;
  },
  
  // Generate a tavern ambient sound
  tavernAmbience: (audioContext: AudioContext): AudioBuffer => {
    const duration = 15.0; // Longer duration to avoid obvious looping
    const sampleRate = audioContext.sampleRate;
    const buffer = audioContext.createBuffer(
      2,
      sampleRate * duration,
      sampleRate
    );
    
    // We'll use a more structured approach for this complex sound
    const murmurFreqs = [100, 120, 150, 180, 200, 240];
    const clinkTimes = []; // We'll generate random times for glass clinks
    
    // Generate 15-20 random glass clink times
    const numClinks = 15 + Math.floor(Math.random() * 5);
    for (let i = 0; i < numClinks; i++) {
      clinkTimes.push(Math.random() * duration);
    }
    
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const data = buffer.getChannelData(channel);
      
      // Begin with base room tone
      for (let i = 0; i < buffer.length; i++) {
        const t = i / sampleRate;
        
        // Add laughter at random intervals
        let laughter = 0;
        if (channel === 0) { // Only on left channel to create stereo effect
          if (Math.random() < 0.0005) {
            laughter = SoundEffects.filteredNoise(t, 300, 1000) * 0.04 * Math.exp(-2 * (t % 1));
          }
        } else {
          if (Math.random() < 0.0004) {
            laughter = SoundEffects.filteredNoise(t, 200, 800) * 0.03 * Math.exp(-3 * (t % 0.8));
          }
        }
        
        // Background murmur (layered frequencies)
        let murmur = 0;
        for (let j = 0; j < murmurFreqs.length; j++) {
          const freqVariation = Math.sin(0.1 * t * (j + 1));
          murmur += Math.sin(t * murmurFreqs[j] * (1 + 0.01 * freqVariation)) * 0.002 * (1 - j/murmurFreqs.length * 0.5);
        }
        
        // Add occasional clinks at pre-determined intervals
        let glassClink = 0;
        for (const clinkTime of clinkTimes) {
          const timeSinceClink = t - clinkTime;
          if (timeSinceClink >= 0 && timeSinceClink < 0.6) {
            const clinkFreq = 2500 + Math.random() * 1000;
            glassClink += Math.sin(2 * Math.PI * clinkFreq * timeSinceClink) * 0.03 * Math.exp(-10 * timeSinceClink);
          }
        }
        
        // Background noise
        const bgNoise = SoundEffects.filteredNoise(t, 50, 500) * 0.005;
        
        // Low-frequency rumble for "room tone"
        const rumble = Math.sin(20 * t) * 0.003 + Math.sin(30 * t) * 0.002;
        
        // Add some movement sounds
        let movement = 0;
        if (Math.random() < 0.0008) {
          movement = SoundEffects.filteredNoise(t, 200, 1000) * 0.01 * Math.exp(-5 * (t % 0.5));
        }
        
        data[i] = murmur + glassClink + bgNoise + rumble + laughter + movement;
      }
    }
    
    return buffer;
  },
  
  // Generate ocean wave sounds for Sapphire's room
  oceanWaves: (audioContext: AudioContext): AudioBuffer => {
    const duration = 15.0;
    const sampleRate = audioContext.sampleRate;
    const buffer = audioContext.createBuffer(
      2,
      sampleRate * duration,
      sampleRate
    );
    
    // Define wave patterns - timing of major waves
    const waveFrequency = 0.05; // Base frequency of waves
    const wavePhases = [0, 0.2, 0.5, 0.7]; // Offset phases for different wave components
    
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const data = buffer.getChannelData(channel);
      
      for (let i = 0; i < buffer.length; i++) {
        const t = i / sampleRate;
        
        // Create the base wave sound using filtered noise with a wave-like envelope
        let sample = 0;
        
        // Layer multiple wave sounds with different timings
        for (const phase of wavePhases) {
          const waveT = (t + phase * 10) % (1/waveFrequency);
          const wavePhase = waveT * waveFrequency;
          
          // Shape of wave: rise quickly then fall more slowly
          let waveEnvelope;
          if (wavePhase < 0.1) {
            waveEnvelope = wavePhase * 10; // Quick rise
          } else if (wavePhase < 0.5) {
            waveEnvelope = 1.0; // Peak
          } else {
            waveEnvelope = 1 - ((wavePhase - 0.5) / 0.5); // Slow fall
          }
          
          // Filtered noise for the wave sound, with different frequency ranges based on the envelope
          const lowFreq = 100 + waveEnvelope * 200;
          const highFreq = 1000 + waveEnvelope * 1000;
          
          // Create a moving, evolving wave sound
          const waveSoundBase = SoundEffects.filteredNoise(t + phase, lowFreq, highFreq) * 0.1 * waveEnvelope;
          
          // Add some "splashing" during peaks
          let splash = 0;
          if (wavePhase > 0.3 && wavePhase < 0.6 && Math.random() < 0.005) {
            splash = SoundEffects.filteredNoise(t, 2000, 8000) * 0.04 * Math.exp(-10 * (t % 0.2));
          }
          
          sample += waveSoundBase + splash;
        }
        
        // Add subtle background water movement
        const waterBackground = SoundEffects.filteredNoise(t, 200, 800) * 0.01;
        
        // Distant seagulls (occasional)
        let seagull = 0;
        if (Math.random() < 0.0003) {
          const callLength = 0.3 + Math.random() * 0.5;
          const timeSinceCall = t % callLength;
          seagull = Math.sin(2000 * timeSinceCall + 1000 * Math.sin(5 * timeSinceCall)) * 0.03 * Math.exp(-5 * timeSinceCall);
        }
        
        data[i] = sample + waterBackground + seagull;
      }
    }
    
    return buffer;
  },
  
  // Generate magical chimes for Amethyst's room
  magicalChimes: (audioContext: AudioContext): AudioBuffer => {
    const duration = 15.0;
    const sampleRate = audioContext.sampleRate;
    const buffer = audioContext.createBuffer(
      2,
      sampleRate * duration,
      sampleRate
    );
    
    // Define a pentatonic scale for a magical feel
    const chimeFreqs = [523.25, 587.33, 659.26, 783.99, 880.00]; // C5, D5, E5, G5, A5
    const chimeTimes = [];
    
    // Generate random chime times, more densely in some parts, sparse in others
    let currentTime = 0;
    while (currentTime < duration) {
      // Add some clustering of chimes
      const isCluster = Math.random() < 0.3;
      if (isCluster) {
        // Generate a cluster of 3-5 chimes close together
        const clusterSize = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < clusterSize; i++) {
          chimeTimes.push(currentTime + i * 0.2 + Math.random() * 0.1);
        }
        currentTime += clusterSize * 0.3;
      } else {
        // Single chime
        chimeTimes.push(currentTime);
        currentTime += 0.8 + Math.random() * 1.5;
      }
    }
    
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const data = buffer.getChannelData(channel);
      
      for (let i = 0; i < buffer.length; i++) {
        const t = i / sampleRate;
        
        let sample = 0;
        
        // Gentle background shimmer
        const shimmer = SoundEffects.filteredNoise(t, 4000, 8000) * 0.005;
        
        // Magical resonance layer
        let resonance = 0;
        for (let j = 0; j < 3; j++) {
          resonance += Math.sin(2 * Math.PI * (200 + j * 50) * t) * 0.002 * (1 + Math.sin(0.1 * t));
        }
        
        // Chimes at pre-determined times
        for (let j = 0; j < chimeTimes.length; j++) {
          const chimeTime = chimeTimes[j];
          const timeSinceChime = t - chimeTime;
          
          if (timeSinceChime >= 0 && timeSinceChime < 3) {
            // Select a frequency from our pentatonic scale
            const freqIndex = Math.floor(Math.random() * chimeFreqs.length);
            const chimeFreq = chimeFreqs[freqIndex] * (channel === 0 ? 1 : 1.01); // Slight detuning between channels
            
            // Bell-like envelope with attack, sustain and release
            const envelope = SoundEffects.getEnvelope(timeSinceChime, 0.02, 0.1, 0.2, 2.8, 3);
            
            // Create a bell-like tone with multiple harmonics
            let chime = Math.sin(2 * Math.PI * chimeFreq * timeSinceChime) * 0.07;
            chime += Math.sin(2 * Math.PI * chimeFreq * 2.01 * timeSinceChime) * 0.04; // Second harmonic, slightly detuned
            chime += Math.sin(2 * Math.PI * chimeFreq * 3.02 * timeSinceChime) * 0.02; // Third harmonic
            
            sample += chime * envelope;
          }
        }
        
        // Ethereal voices
        let voices = 0;
        if (Math.random() < 0.001) {
          const voiceFreq = 300 + Math.random() * 200;
          const voiceLength = 2 + Math.random();
          const timeSinceVoice = t % voiceLength;
          const voiceEnvelope = SoundEffects.getEnvelope(timeSinceVoice, 0.3, 0.3, 0.5, 1.4, voiceLength);
          
          voices = Math.sin(2 * Math.PI * voiceFreq * timeSinceVoice + 
                     3 * Math.sin(2 * Math.PI * 5 * timeSinceVoice)) * 0.03 * voiceEnvelope;
        }
        
        data[i] = sample + shimmer + resonance + voices;
      }
    }
    
    return buffer;
  },
  
  // Generate fire crackling sounds for Ruby's room
  cracklingFire: (audioContext: AudioContext): AudioBuffer => {
    const duration = 15.0;
    const sampleRate = audioContext.sampleRate;
    const buffer = audioContext.createBuffer(
      2,
      sampleRate * duration,
      sampleRate
    );
    
    // Generate times for fire crackles
    const crackleTimes = [];
    let currentTime = 0;
    while (currentTime < duration) {
      // Add crackle
      crackleTimes.push(currentTime);
      
      // Random time to next crackle
      currentTime += 0.1 + Math.random() * 0.7; // More frequent crackles
    }
    
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const data = buffer.getChannelData(channel);
      
      for (let i = 0; i < buffer.length; i++) {
        const t = i / sampleRate;
        
        let sample = 0;
        
        // Base fire sound - a gentle roar
        let fireBase = SoundEffects.filteredNoise(t, 100, 2000) * 0.04;
        
        // Add some low-frequency rumble
        const fireBass = Math.sin(2 * Math.PI * 40 * t) * 0.01 + Math.sin(2 * Math.PI * 60 * t) * 0.008;
        
        // Add crackles at random times
        for (const crackleTime of crackleTimes) {
          const timeSinceCrackle = t - crackleTime;
          
          if (timeSinceCrackle >= 0 && timeSinceCrackle < 0.1) {
            // Different kinds of crackles
            const crackleType = Math.floor(Math.random() * 3);
            
            if (crackleType === 0) {
              // Sharp crackle
              const crackle = SoundEffects.filteredNoise(timeSinceCrackle * 10, 3000, 8000) * 0.1 * Math.exp(-50 * timeSinceCrackle);
              sample += crackle;
            } else if (crackleType === 1) {
              // Longer pop
              const pop = SoundEffects.filteredNoise(timeSinceCrackle * 5, 1000, 5000) * 0.07 * Math.exp(-20 * timeSinceCrackle);
              sample += pop;
            } else {
              // Small hiss
              const hiss = SoundEffects.filteredNoise(timeSinceCrackle * 20, 4000, 10000) * 0.05 * Math.exp(-30 * timeSinceCrackle);
              sample += hiss;
            }
          }
        }
        
        // Occasionally add a wood shift/thump
        let woodShift = 0;
        if (Math.random() < 0.0003) {
          // A deeper thump as wood shifts in the fire
          woodShift = Math.sin(2 * Math.PI * 120 * t) * 0.06 * Math.exp(-5 * (t % 0.5));
          woodShift += SoundEffects.filteredNoise(t, 300, 1000) * 0.03 * Math.exp(-10 * (t % 0.3));
        }
        
        data[i] = fireBase + fireBass + sample + woodShift;
      }
    }
    
    return buffer;
  }
};

const TavernAudio: React.FC = () => {
  const { roomId } = useWebSocketStore();
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const soundBuffers = useRef<Record<string, AudioBuffer>>({});
  const [soundsLoaded, setSoundsLoaded] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  
  // Initialize audio context and load sounds - but don't auto-start
  useEffect(() => {
    const initAudio = async () => {
      try {
        // Create audio context - but don't autostart it
        // This addresses browser autoplay policies
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) {
          console.error('Web Audio API is not supported by this browser');
          return;
        }
        
        // Create audio context in suspended state (will be resumed on user interaction)
        audioCtxRef.current = new AudioContext();
        
        // Generate sound buffers
        console.log('Generating sound buffers...');
        
        // Map of sound IDs to generator functions
        const soundGenerators: Record<string, (ctx: AudioContext) => AudioBuffer> = {
          'door-open': SoundEffects.doorOpen,
          'coin-drop': SoundEffects.coinDrop,
          'glass-clink': SoundEffects.glassClink,
          'drink-pour': SoundEffects.drinkPour,
          'chair-move': SoundEffects.chairMove,
          'tavern-background': SoundEffects.tavernAmbience
        };
        
        // Generate each sound buffer
        for (const [id, generator] of Object.entries(soundGenerators)) {
          try {
            soundBuffers.current[id] = generateAudioBuffer(audioCtxRef.current, generator);
            console.log(`Generated sound: ${id}`);
          } catch (error) {
            console.error(`Error generating sound ${id}:`, error);
          }
        }
        
        // Generate specialized room sounds
        try {
          // Amethyst's room (Rose Garden)
          soundBuffers.current['rose-garden-ambience'] = SoundEffects.tavernAmbience(audioCtxRef.current);
          soundBuffers.current['magical-chimes'] = SoundEffects.magicalChimes(audioCtxRef.current);
          
          // Sapphire's room (Ocean View)
          soundBuffers.current['ocean-waves'] = SoundEffects.oceanWaves(audioCtxRef.current);
          soundBuffers.current['distant-seagulls'] = SoundEffects.oceanWaves(audioCtxRef.current);
          
          // Ruby's room (Dragon's Den)
          soundBuffers.current['tavern-murmurs'] = SoundEffects.tavernAmbience(audioCtxRef.current);
          soundBuffers.current['crackling-fire'] = SoundEffects.cracklingFire(audioCtxRef.current);
          
          // Shared sounds
          soundBuffers.current['drink-serve'] = soundBuffers.current['glass-clink'];
          
          console.log("All room-specific sounds generated successfully");
        } catch (error) {
          console.error("Error generating room-specific sounds:", error);
        }
        
        setSoundsLoaded(true);
        console.log('All sound buffers generated successfully');
      } catch (error) {
        console.error('Error initializing audio:', error);
      }
    };
    
    initAudio();
    
    // Add a one-time click handler to the document to start audio
    const enableAudio = () => {
      if (audioCtxRef.current?.state === 'suspended') {
        console.log('Resuming audio context on user interaction');
        audioCtxRef.current.resume().then(() => {
          console.log('Audio context resumed successfully');
        }).catch(err => {
          console.error('Failed to resume audio context:', err);
        });
      }
      document.removeEventListener('click', enableAudio);
      document.removeEventListener('touchstart', enableAudio);
    };
    
    document.addEventListener('click', enableAudio);
    document.addEventListener('touchstart', enableAudio);
    
    return () => {
      document.removeEventListener('click', enableAudio);
      document.removeEventListener('touchstart', enableAudio);
      if (audioCtxRef.current?.state !== 'closed') {
        audioCtxRef.current?.close();
      }
    };
  }, []);
  
  // Handle room changes
  useEffect(() => {
    if (isMuted || !soundsLoaded || !audioCtxRef.current) return;
    
    const playRoomSounds = async () => {
      // Play the door opening sound when changing rooms
      try {
        playSound('door-open');
      } catch (e) {
        console.warn("Error with door sound:", e);
      }
      
      // Short delay for the door sound to play
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Play ambient sounds for the current room
      if (roomSounds[roomId]) {
        roomSounds[roomId].forEach(sound => {
          try {
            playAmbientSound(sound.id, sound.volume, sound.loop, sound.playbackRate);
          } catch (e) {
            console.warn(`Error playing room sound ${sound.id}:`, e);
          }
        });
      }
      
      // Play common sounds
      commonSounds.forEach(sound => {
        try {
          playAmbientSound(sound.id, sound.volume, sound.loop);
        } catch (e) {
          console.warn(`Error playing common sound ${sound.id}:`, e);
        }
      });
    };
    
    playRoomSounds();
  }, [roomId, isMuted, soundsLoaded]);
  
  // Create a function to play ambient sounds
  const playAmbientSound = (id: string, baseVolume: number, loop: boolean, playbackRate?: number) => {
    if (!audioCtxRef.current || !soundBuffers.current[id]) return;
    
    const source = audioCtxRef.current.createBufferSource();
    source.buffer = soundBuffers.current[id];
    
    const gainNode = audioCtxRef.current.createGain();
    gainNode.gain.value = isMuted ? 0 : baseVolume * volume;
    
    source.connect(gainNode);
    gainNode.connect(audioCtxRef.current.destination);
    
    if (playbackRate) {
      source.playbackRate.value = playbackRate;
    }
    
    source.loop = loop;
    source.start();
    
    // Return cleanup function
    return () => {
      try {
        source.stop();
        source.disconnect();
        gainNode.disconnect();
      } catch (e) {
        console.warn(`Error stopping sound ${id}:`, e);
      }
    };
  };
  
  // Listen for audio events from the hook
  useEffect(() => {
    const handlePlayEvent = (event: CustomEvent) => {
      const { soundId } = event.detail;
      playSound(soundId as ActionSoundType);
    };
    
    const handleMuteEvent = (event: CustomEvent) => {
      const { isMuted: newMuted } = event.detail;
      setIsMuted(newMuted);
    };
    
    const handleVolumeEvent = (event: CustomEvent) => {
      const { volume: newVolume } = event.detail;
      setVolume(newVolume);
    };
    
    // Add event listeners
    window.addEventListener('tavern-audio-play', handlePlayEvent as EventListener);
    window.addEventListener('tavern-audio-mute', handleMuteEvent as EventListener);
    window.addEventListener('tavern-audio-volume', handleVolumeEvent as EventListener);
    
    return () => {
      // Remove event listeners
      window.removeEventListener('tavern-audio-play', handlePlayEvent as EventListener);
      window.removeEventListener('tavern-audio-mute', handleMuteEvent as EventListener);
      window.removeEventListener('tavern-audio-volume', handleVolumeEvent as EventListener);
    };
  }, []);
  
  // Play action sound
  const playSound = (soundId: ActionSoundType) => {
    if (isMuted || !soundsLoaded || !audioCtxRef.current) return;
    
    console.log(`Playing sound: ${soundId}`);
    
    const sound = actionSounds[soundId];
    if (sound && soundBuffers.current[sound.id]) {
      try {
        const source = audioCtxRef.current.createBufferSource();
        source.buffer = soundBuffers.current[sound.id];
        
        const gainNode = audioCtxRef.current.createGain();
        gainNode.gain.value = sound.volume * volume;
        
        source.connect(gainNode);
        gainNode.connect(audioCtxRef.current.destination);
        
        source.start();
        
        // Automatically clean up
        source.onended = () => {
          source.disconnect();
          gainNode.disconnect();
        };
      } catch (e) {
        console.warn(`Error with action sound ${sound.id}:`, e);
      }
    } else {
      console.warn(`Sound not found or not loaded: ${soundId}`);
    }
  };
  
  // Wake up AudioContext if it's suspended (needed for some browsers)
  const resumeAudioContext = () => {
    if (audioCtxRef.current?.state === 'suspended') {
      audioCtxRef.current.resume().then(() => {
        console.log('Audio context resumed successfully');
        setAudioEnabled(true);
        
        // Test sound to confirm audio is working
        playSound('glass-clink');
      }).catch(err => {
        console.error('Failed to resume audio context:', err);
      });
    } else if (audioCtxRef.current?.state === 'running') {
      setAudioEnabled(true);
    }
  };
  
  // Check if audio needs to be enabled first
  const needsAudioActivation = audioCtxRef.current?.state === 'suspended' && !audioEnabled;
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      {needsAudioActivation ? (
        <div className="flex flex-col items-center">
          <button 
            onClick={resumeAudioContext}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md shadow-md hover:bg-primary/90 transition-colors mb-2 text-sm font-medium animate-pulse"
          >
            Click to Enable Sound
          </button>
          <div className="bg-background/80 border border-border rounded-lg p-2 text-xs text-center max-w-[200px]">
            Browser security requires user interaction to play audio
          </div>
        </div>
      ) : (
        <div>
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className="bg-background/80 border border-border rounded-full p-2 shadow-md hover:bg-background transition-colors"
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <line x1="3" y1="3" x2="21" y2="21"></line>
                <path d="M18.36 18.36a9.9 9.9 0 0 1-5.36 1.64 10 10 0 0 1-10-10 9.9 9.9 0 0 1 1.64-5.36"></path>
                <path d="M16 16a6 6 0 0 1-6-6"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                <polygon points="12 2 8 6 3 6 3 18 8 18 12 22 12 2"></polygon>
              </svg>
            )}
          </button>
          
          {!isMuted && (
            <div className="mt-2 bg-background/80 border border-border rounded-lg p-2 shadow-md">
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01" 
                value={volume} 
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full"
                aria-label="Volume"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Add AudioContext to the Window interface
declare global {
  interface Window {
    AudioContext: typeof AudioContext;
    webkitAudioContext: typeof AudioContext;
  }
}

export default TavernAudio;