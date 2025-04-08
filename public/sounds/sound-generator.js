// Simple utility to generate sound effects for immediate use
function generateSoundDataUrl(createBuffer) {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const buffer = createBuffer(audioContext);
  
  // Only works in browsers that support OfflineAudioContext
  if (window.OfflineAudioContext) {
    const offlineCtx = new OfflineAudioContext(
      buffer.numberOfChannels,
      buffer.length,
      buffer.sampleRate
    );
    
    const source = offlineCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(offlineCtx.destination);
    source.start();
    
    return offlineCtx.startRendering()
      .then(renderedBuffer => {
        const wav = bufferToWave(renderedBuffer, 0, renderedBuffer.length);
        return URL.createObjectURL(wav);
      });
  }
  
  // Fallback for browsers without OfflineAudioContext
  return Promise.resolve(null);
}

// Convert AudioBuffer to WAV format
function bufferToWave(buffer, start, end) {
  const numOfChan = buffer.numberOfChannels;
  const length = end - start;
  const sampleRate = buffer.sampleRate;
  const bitsPerSample = 16;
  const blockAlign = numOfChan * bitsPerSample / 8;
  const byteRate = sampleRate * blockAlign;
  const dataSize = length * blockAlign;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;
  const arrayBuffer = new ArrayBuffer(totalSize);
  const view = new DataView(arrayBuffer);
  
  // RIFF identifier
  writeString(view, 0, 'RIFF');
  // File size
  view.setUint32(4, totalSize - 8, true);
  // RIFF type
  writeString(view, 8, 'WAVE');
  // Format chunk identifier
  writeString(view, 12, 'fmt ');
  // Format chunk length
  view.setUint32(16, 16, true);
  // Sample format (PCM)
  view.setUint16(20, 1, true);
  // Channel count
  view.setUint16(22, numOfChan, true);
  // Sample rate
  view.setUint32(24, sampleRate, true);
  // Byte rate
  view.setUint32(28, byteRate, true);
  // Block align
  view.setUint16(32, blockAlign, true);
  // Bits per sample
  view.setUint16(34, bitsPerSample, true);
  // Data chunk identifier
  writeString(view, 36, 'data');
  // Data chunk length
  view.setUint32(40, dataSize, true);
  
  // Write audio data
  const floatSamples = new Float32Array(length * numOfChan);
  let offset = 0;
  
  for (let channel = 0; channel < numOfChan; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      floatSamples[offset++] = channelData[i + start];
    }
  }
  
  // Convert float samples to 16-bit PCM
  const int16Samples = new Int16Array(floatSamples.length);
  for (let i = 0; i < floatSamples.length; i++) {
    const s = Math.max(-1, Math.min(1, floatSamples[i]));
    int16Samples[i] = (s < 0 ? s * 0x8000 : s * 0x7FFF);
  }
  
  writeInt16Samples(view, headerSize, int16Samples);
  
  return new Blob([view], { type: 'audio/wav' });
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function writeInt16Samples(view, offset, samples) {
  for (let i = 0; i < samples.length; i++, offset += 2) {
    view.setInt16(offset, samples[i], true);
  }
}

// Sound generator functions
const SoundEffects = {
  // Generate a door sound
  doorOpen: (audioContext) => {
    const duration = 1.5;
    const buffer = audioContext.createBuffer(
      2,
      audioContext.sampleRate * duration,
      audioContext.sampleRate
    );
    
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const data = buffer.getChannelData(channel);
      
      for (let i = 0; i < buffer.length; i++) {
        const t = i / audioContext.sampleRate;
        const phase = t / duration;
        
        // Creaking sound
        const creak1 = Math.sin(t * 50 + 5 * Math.sin(t * 2)) * 0.1 * (phase < 0.6 ? 1 - phase : 0);
        
        data[i] = creak1;
      }
    }
    
    return buffer;
  },
  
  // Generate a coin drop sound
  coinDrop: (audioContext) => {
    const duration = 0.8;
    const buffer = audioContext.createBuffer(
      2,
      audioContext.sampleRate * duration,
      audioContext.sampleRate
    );
    
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const data = buffer.getChannelData(channel);
      
      for (let i = 0; i < buffer.length; i++) {
        const t = i / audioContext.sampleRate;
        const phase = t / duration;
        
        // High-pitched clink followed by "bounces"
        const clink = Math.sin(6000 * t) * Math.pow(Math.E, -10 * phase) * 0.2;
        const bounce1 = phase > 0.3 ? Math.sin(4000 * t) * Math.pow(Math.E, -20 * (phase - 0.3)) * 0.1 : 0;
        const bounce2 = phase > 0.5 ? Math.sin(3500 * t) * Math.pow(Math.E, -20 * (phase - 0.5)) * 0.05 : 0;
        const bounce3 = phase > 0.65 ? Math.sin(3000 * t) * Math.pow(Math.E, -20 * (phase - 0.65)) * 0.02 : 0;
        
        data[i] = clink + bounce1 + bounce2 + bounce3;
      }
    }
    
    return buffer;
  },
  
  // Generate a glass clink sound
  glassClink: (audioContext) => {
    const duration = 1.0;
    const buffer = audioContext.createBuffer(
      2,
      audioContext.sampleRate * duration,
      audioContext.sampleRate
    );
    
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const data = buffer.getChannelData(channel);
      
      for (let i = 0; i < buffer.length; i++) {
        const t = i / audioContext.sampleRate;
        const phase = t / duration;
        
        // Glass resonance
        const clink = Math.sin(2400 * t) * Math.pow(Math.E, -8 * phase) * 0.2;
        const ring = Math.sin(3600 * t) * Math.pow(Math.E, -6 * phase) * 0.1;
        
        data[i] = clink + ring;
      }
    }
    
    return buffer;
  },
  
  // Generate a drink pour sound
  drinkPour: (audioContext) => {
    const duration = 2.0;
    const buffer = audioContext.createBuffer(
      2,
      audioContext.sampleRate * duration,
      audioContext.sampleRate
    );
    
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const data = buffer.getChannelData(channel);
      
      for (let i = 0; i < buffer.length; i++) {
        const t = i / audioContext.sampleRate;
        const phase = t / duration;
        
        // Pouring liquid sound
        const noise = Math.random() * 0.1 * (1 - phase * 0.7);
        const bubbles = Math.random() < 0.02 ? Math.random() * 0.2 : 0;
        
        data[i] = noise + bubbles;
      }
    }
    
    return buffer;
  },
  
  // Generate a chair moving sound
  chairMove: (audioContext) => {
    const duration = 0.8;
    const buffer = audioContext.createBuffer(
      2,
      audioContext.sampleRate * duration,
      audioContext.sampleRate
    );
    
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const data = buffer.getChannelData(channel);
      
      for (let i = 0; i < buffer.length; i++) {
        const t = i / audioContext.sampleRate;
        const phase = t / duration;
        
        // Chair drag sound
        let noise = Math.random() * 0.03;
        // Add some lower frequency rumble
        const rumble = Math.sin(100 * t + Math.sin(60 * t) * 2) * 0.05 * (phase < 0.7 ? 1 : 7 * (1 - phase));
        
        data[i] = noise * (phase < 0.7 ? 1 : 7 * (1 - phase)) + rumble;
      }
    }
    
    return buffer;
  },
  
  // Generate a tavern ambient sound
  tavernAmbience: (audioContext) => {
    const duration = 10.0;
    const buffer = audioContext.createBuffer(
      2,
      audioContext.sampleRate * duration,
      audioContext.sampleRate
    );
    
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const data = buffer.getChannelData(channel);
      
      for (let i = 0; i < buffer.length; i++) {
        const t = i / audioContext.sampleRate;
        
        // Background murmur
        const murmur = Math.random() * 0.01;
        // Add occasional clinks at random intervals
        const glassRandom = Math.random();
        const glassClink = glassRandom < 0.0005 ? Math.sin(2000 * t % 1) * 0.03 * Math.min(1, 10 * (1 - (t % 0.3))) : 0;
        // Low-frequency rumble for "room tone"
        const rumble = Math.sin(30 * t) * 0.003;
        
        data[i] = murmur + glassClink + rumble;
      }
    }
    
    return buffer;
  }
};

// API to generate all sounds
window.generateSounds = async function() {
  const sounds = {};
  
  try {
    sounds.doorOpen = await generateSoundDataUrl(SoundEffects.doorOpen);
    sounds.coinDrop = await generateSoundDataUrl(SoundEffects.coinDrop);
    sounds.glassClink = await generateSoundDataUrl(SoundEffects.glassClink);
    sounds.drinkPour = await generateSoundDataUrl(SoundEffects.drinkPour);
    sounds.chairMove = await generateSoundDataUrl(SoundEffects.chairMove);
    sounds.tavernAmbience = await generateSoundDataUrl(SoundEffects.tavernAmbience);
    
    // Set all keys that should reference the same sound
    sounds.drinkServe = sounds.glassClink;
    sounds.tavernBackground = sounds.tavernAmbience;
    sounds.tavernMurmurs = sounds.tavernAmbience;
    sounds.oceanWaves = sounds.tavernAmbience; // Placeholder - would be better with specific water sounds
    sounds.roseGardenAmbience = sounds.tavernAmbience; // Placeholder
    sounds.magicalChimes = sounds.glassClink; // Placeholder - higher pitched glass sound
    sounds.cracklingFire = sounds.tavernAmbience; // Placeholder
    sounds.distantSeagulls = sounds.tavernAmbience; // Placeholder
    
    console.log('All sounds generated successfully');
    return sounds;
  } catch (error) {
    console.error('Error generating sounds:', error);
    return null;
  }
};