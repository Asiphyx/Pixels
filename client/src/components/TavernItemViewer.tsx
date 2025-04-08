
import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useSpring, animated } from '@react-spring/web';
import * as THREE from 'three';

// Rotating 3D object
const SpinningItem = ({ color = '#FFD700', hovered }: { color: string, hovered: boolean }) => {
  const mesh = useRef<THREE.Mesh>(null);
  
  // Animation with react-spring
  const springs = useSpring({
    scale: hovered ? 1.2 : 1,
    rotation: hovered ? Math.PI * 2 : 0,
    config: { mass: 1, tension: 180, friction: 12 }
  });
  
  useFrame(() => {
    if (!mesh.current) return;
    mesh.current.rotation.y += 0.01;
  });
  
  return (
    <animated.mesh 
      ref={mesh}
      scale={springs.scale}
      rotation-x={springs.rotation}
    >
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial 
        color={color} 
        metalness={0.8} 
        roughness={0.2} 
      />
    </animated.mesh>
  );
};

interface TavernItemViewerProps {
  itemName: string;
  itemColor?: string;
}

const TavernItemViewer: React.FC<TavernItemViewerProps> = ({ 
  itemName, 
  itemColor = '#FFD700' 
}) => {
  const [hovered, setHovered] = useState(false);
  
  // Wrapper animation with react-spring
  const containerSpring = useSpring({
    boxShadow: hovered 
      ? '0 0 25px rgba(255, 215, 0, 0.8)' 
      : '0 0 5px rgba(255, 215, 0, 0.3)',
    from: { boxShadow: '0 0 5px rgba(255, 215, 0, 0.3)' }
  });
  
  return (
    <animated.div 
      className="pixel-border"
      style={{
        width: '200px',
        height: '200px',
        margin: '20px auto',
        ...containerSpring
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Canvas>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={2} />
        <SpinningItem color={itemColor} hovered={hovered} />
      </Canvas>
      <div className="text-center font-['VT323'] text-xl mt-2">{itemName}</div>
    </animated.div>
  );
};

export default TavernItemViewer;
