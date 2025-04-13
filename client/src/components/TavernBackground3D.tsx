import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { tavernScene } from '@/lib/3d/tavernScene';

interface TavernBackground3DProps {
  className?: string;
}

/**
 * TavernBackground3D - Renders an immersive 3D tavern background
 * Uses Three.js for rendering and integrates with audio for weather effects
 */
const TavernBackground3D: React.FC<TavernBackground3DProps> = ({ className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Initialize the 3D scene when the component mounts
  useEffect(() => {
    const container = containerRef.current;
    
    if (container && !isInitialized) {
      // Initialize the tavern scene
      tavernScene.initialize(container);
      setIsInitialized(true);
      
      // Set the scene to evening time by default
      tavernScene.setTimeOfDay(18.5);
      
      // Start with clear weather
      tavernScene.setWeather('clear');
      
      // Add some candles to the scene
      tavernScene.addCandleLight(new THREE.Vector3(-3, 1.5, 0));
      tavernScene.addCandleLight(new THREE.Vector3(3, 1.5, 0));
      tavernScene.addCandleLight(new THREE.Vector3(0, 1.5, 3));
    }
    
    // Clean up when the component unmounts
    return () => {
      if (isInitialized) {
        tavernScene.dispose();
        setIsInitialized(false);
      }
    };
  }, [isInitialized]);
  
  // Handle window resize events
  useEffect(() => {
    const handleResize = () => {
      // Update will be handled internally by the scene
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Handle random weather changes (for demonstration)
  useEffect(() => {
    // Change weather occasionally for atmospheric effect
    const randomWeatherInterval = setInterval(() => {
      const weathers = ['clear', 'rain', 'storm'] as const;
      const randomIndex = Math.floor(Math.random() * weathers.length);
      const randomWeather = weathers[randomIndex];
      const intensity = 0.3 + Math.random() * 0.7;
      
      // Set the weather visually
      tavernScene.setWeather(randomWeather, intensity);
    }, 180000); // Change weather every 3 minutes
    
    return () => {
      clearInterval(randomWeatherInterval);
    };
  }, []);
  
  return (
    <div 
      ref={containerRef}
      className={`tavern-background-3d absolute inset-0 -z-10 overflow-hidden pointer-events-none ${className}`}
    />
  );
};

export default TavernBackground3D;