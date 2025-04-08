// This is a simple utility to create placeholder ambient sounds
// In a real application, you would use actual recorded sound files

class SoundGenerator {
  constructor(audioContext) {
    this.audioContext = audioContext;
  }

  // Generate a simple tavern background sound
  generateTavernBackground(duration = 10) {
    const buffer = this.audioContext.createBuffer(
      2, // stereo
      this.audioContext.sampleRate * duration,
      this.audioContext.sampleRate
    );
    
    // Fill buffer with low-level noise for each channel
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const data = buffer.getChannelData(channel);
      
      for (let i = 0; i < buffer.length; i++) {
        // Mix of low frequency ambient noise with occasional higher sounds
        const t = i / buffer.length;
        const noise = Math.random() * 0.05; // Base noise
        
        // Add some low murmurs
        const murmur = Math.sin(i * 0.01) * 0.02 * Math.sin(i * 0.00023);
        
        // Add occasional clinks
        const glassFrequency = 0.0001;
        const glassChance = Math.random() < 0.0005 ? 0.1 : 0;
        const glassClink = Math.sin(i * glassFrequency) * glassChance;
        
        data[i] = noise + murmur + glassClink;
      }
    }
    
    return buffer;
  }
  
  // Generate ocean waves sound
  generateOceanWaves(duration = 10) {
    const buffer = this.audioContext.createBuffer(
      2, // stereo
      this.audioContext.sampleRate * duration,
      this.audioContext.sampleRate
    );
    
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const data = buffer.getChannelData(channel);
      
      for (let i = 0; i < buffer.length; i++) {
        const t = i / this.audioContext.sampleRate;
        
        // Create wave-like sounds with different phases
        const wave1 = Math.sin(t * 0.5) * 0.01;
        const wave2 = Math.sin(t * 0.3 + 0.2) * 0.01;
        const wave3 = Math.sin(t * 0.7 + 0.5) * 0.005;
        
        // Add some noise for "spray" sound
        const spray = Math.random() * 0.01;
        
        data[i] = wave1 + wave2 + wave3 + spray;
      }
    }
    
    return buffer;
  }
  
  // Generate magical garden ambient sound
  generateMagicalGarden(duration = 10) {
    const buffer = this.audioContext.createBuffer(
      2, // stereo
      this.audioContext.sampleRate * duration,
      this.audioContext.sampleRate
    );
    
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const data = buffer.getChannelData(channel);
      
      for (let i = 0; i < buffer.length; i++) {
        const t = i / this.audioContext.sampleRate;
        
        // Soft, ethereal tones
        const tone1 = Math.sin(t * 440 * 1.5) * 0.005 * Math.sin(t * 0.2);
        const tone2 = Math.sin(t * 523.25 * 1.5) * 0.003 * Math.sin(t * 0.3 + 0.4);
        const tone3 = Math.sin(t * 659.26 * 1.5) * 0.002 * Math.sin(t * 0.1 + 0.8);
        
        // Gentle wind
        const wind = Math.sin(t * 0.1) * 0.005 + Math.random() * 0.002;
        
        data[i] = tone1 + tone2 + tone3 + wind;
      }
    }
    
    return buffer;
  }
  
  // Generate fire crackling sound
  generateFireCrackling(duration = 5) {
    const buffer = this.audioContext.createBuffer(
      2, // stereo
      this.audioContext.sampleRate * duration,
      this.audioContext.sampleRate
    );
    
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const data = buffer.getChannelData(channel);
      
      for (let i = 0; i < buffer.length; i++) {
        // Base noise for fire
        const noise = Math.random() * 0.04;
        
        // Crackling effect
        const crackChance = Math.random() < 0.001 ? 0.2 : 0;
        const crackle = crackChance * Math.random();
        
        // Burning hum
        const t = i / this.audioContext.sampleRate;
        const hum = Math.sin(t * 100) * 0.002 * (1 + Math.sin(t * 0.5) * 0.5);
        
        data[i] = noise * (1 + Math.sin(t * 0.1) * 0.2) + crackle + hum;
      }
    }
    
    return buffer;
  }
  
  // Generate sound for a glass being filled
  generateDrinkPour(duration = 2) {
    const buffer = this.audioContext.createBuffer(
      2, // stereo
      this.audioContext.sampleRate * duration,
      this.audioContext.sampleRate
    );
    
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const data = buffer.getChannelData(channel);
      
      for (let i = 0; i < buffer.length; i++) {
        const t = i / this.audioContext.sampleRate;
        const phase = t / duration;
        
        // Start strong, then fade out
        const envelope = Math.max(0, 1 - phase * 1.5);
        
        // Stream sound with bubbles
        const stream = Math.random() * 0.15 * envelope;
        
        // Add "glug" sounds
        const glugInterval = 0.25; // seconds between glugs
        const glugPhase = (t % glugInterval) / glugInterval;
        const glug = glugPhase < 0.1 ? Math.sin(glugPhase * 30) * 0.1 : 0;
        
        data[i] = (stream + glug) * envelope;
      }
    }
    
    return buffer;
  }
  
  // Generate a door opening sound
  generateDoorOpen(duration = 1.5) {
    const buffer = this.audioContext.createBuffer(
      2, // stereo
      this.audioContext.sampleRate * duration,
      this.audioContext.sampleRate
    );
    
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const data = buffer.getChannelData(channel);
      
      for (let i = 0; i < buffer.length; i++) {
        const t = i / this.audioContext.sampleRate;
        const phase = t / duration;
        
        // Creaking sound
        const creak1 = Math.sin(t * 100 + 10 * Math.sin(t * 2)) * 0.1 * (phase < 0.6 ? 1 - phase : 0);
        
        // Hinge squeal
        const hinge = Math.sin(800 - phase * 600) * 0.05 * Math.max(0, 0.2 - Math.abs(phase - 0.3));
        
        data[i] = creak1 + hinge;
      }
    }
    
    return buffer;
  }
  
  // Export these sounds as audio files (in a real app, use actual recordings)
  exportSoundsToFiles() {
    // This is a simplified placeholder function
    // In an actual implementation, you would encode these buffers as audio files
    // and save them. However, this would need to be done server-side and
    // is beyond the scope of this demo.
    console.log("In a real app, we would export the generated sounds to files.");
    console.log("For this demo, we're using embedded audio or remote urls.");
  }
}

export default SoundGenerator;