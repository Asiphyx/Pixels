
import React, { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Volume2, VolumeX, Music, Wind } from 'lucide-react';
import audioSystem from '@/lib/audioSystem';
import { useSpring, animated } from '@react-spring/web';

const SoundControls: React.FC = () => {
  const [muted, setMuted] = useState(false);
  const [ambienceVolume, setAmbienceVolume] = useState(0.5);
  const [musicVolume, setMusicVolume] = useState(0.4);
  const [effectsVolume, setEffectsVolume] = useState(0.8);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [ambiencePlaying, setAmbiencePlaying] = useState(false);

  // Animation for controls
  const controlsAnimation = useSpring({
    opacity: 1,
    transform: 'translateY(0)',
    from: { opacity: 0, transform: 'translateY(20px)' },
  });

  // Effect to set initial values
  useEffect(() => {
    audioSystem.setCategoryVolume('ambience', ambienceVolume);
    audioSystem.setCategoryVolume('music', musicVolume);
    audioSystem.setCategoryVolume('effects', effectsVolume);
  }, []);

  // Toggle mute
  const handleToggleMute = () => {
    const newMuted = audioSystem.toggleMute();
    setMuted(newMuted);
  };

  // Handle ambience volume change
  const handleAmbienceVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setAmbienceVolume(newVolume);
    audioSystem.setCategoryVolume('ambience', newVolume);
  };

  // Handle music volume change
  const handleMusicVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setMusicVolume(newVolume);
    audioSystem.setCategoryVolume('music', newVolume);
  };

  // Handle effects volume change
  const handleEffectsVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setEffectsVolume(newVolume);
    audioSystem.setCategoryVolume('effects', newVolume);
  };

  // Toggle tavern music
  const toggleTavernMusic = () => {
    if (musicPlaying) {
      audioSystem.fadeOut('tavern-music', 1000);
      setMusicPlaying(false);
    } else {
      audioSystem.fadeIn('tavern-music', 1000);
      setMusicPlaying(true);
    }
  };

  // Toggle tavern ambience
  const toggleTavernAmbience = () => {
    if (ambiencePlaying) {
      audioSystem.fadeOut('tavern-ambience', 1000);
      setAmbiencePlaying(false);
    } else {
      audioSystem.fadeIn('tavern-ambience', 1000);
      setAmbiencePlaying(true);
    }
  };

  // Play sound effect
  const playDoorEffect = () => {
    audioSystem.play('door-open');
  };

  return (
    <animated.div 
      style={controlsAnimation}
      className="sound-controls bg-[#2C1810] border-2 border-[#8B4513] rounded-md p-4 text-[#E8D6B3] w-64 mx-auto"
    >
      <h3 className="font-['Press_Start_2P'] text-sm text-[#FFD700] mb-4">Tavern Sounds</h3>
      
      <div className="flex items-center justify-between mb-4">
        <Label htmlFor="mute-toggle" className="flex items-center cursor-pointer">
          {muted ? <VolumeX className="mr-2" /> : <Volume2 className="mr-2" />}
          Mute All
        </Label>
        <Switch 
          id="mute-toggle" 
          checked={muted} 
          onCheckedChange={handleToggleMute} 
        />
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="flex items-center">
              <Music className="mr-2" size={16} />
              Music
            </Label>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={toggleTavernMusic}
              className={musicPlaying ? "bg-[#FFD700] text-[#2C1810]" : ""}
            >
              {musicPlaying ? "Playing" : "Play"}
            </Button>
          </div>
          <Slider 
            value={[musicVolume]} 
            min={0} 
            max={1} 
            step={0.01} 
            onValueChange={handleMusicVolumeChange} 
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="flex items-center">
              <Wind className="mr-2" size={16} />
              Ambience
            </Label>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={toggleTavernAmbience}
              className={ambiencePlaying ? "bg-[#FFD700] text-[#2C1810]" : ""}
            >
              {ambiencePlaying ? "Playing" : "Play"}
            </Button>
          </div>
          <Slider 
            value={[ambienceVolume]} 
            min={0} 
            max={1} 
            step={0.01} 
            onValueChange={handleAmbienceVolumeChange} 
          />
        </div>
        
        <div className="space-y-2">
          <Label>Sound Effects</Label>
          <Slider 
            value={[effectsVolume]} 
            min={0} 
            max={1} 
            step={0.01} 
            onValueChange={handleEffectsVolumeChange} 
          />
          <Button 
            variant="outline" 
            size="sm" 
            onClick={playDoorEffect}
            className="w-full mt-2"
          >
            Test Door Sound
          </Button>
        </div>
      </div>
    </animated.div>
  );
};

export default SoundControls;
