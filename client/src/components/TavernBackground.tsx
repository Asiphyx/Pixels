
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Canvas } from '@react-three/fiber';

// Ambient lighting component
const TavernLighting = () => {
  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={0.8} color="#FFD700" />
      <pointLight position={[-10, -10, -10]} intensity={0.4} color="#8B0000" />
    </>
  );
};

// Floating particle effects (dust, embers, etc.)
const Particles = ({ count = 200 }) => {
  const mesh = useRef<THREE.InstancedMesh>(null);
  
  useEffect(() => {
    if (!mesh.current) return;
    
    // Create particle positions
    const dummy = new THREE.Object3D();
    const particles = mesh.current;
    
    // Position particles randomly
    for (let i = 0; i < count; i++) {
      dummy.position.set(
        (Math.random() - 0.5) * 10,
        Math.random() * 10,
        (Math.random() - 0.5) * 10
      );
      dummy.updateMatrix();
      particles.setMatrixAt(i, dummy.matrix);
    }
    
    particles.instanceMatrix.needsUpdate = true;
  }, [count]);
  
  useFrame((state) => {
    if (!mesh.current) return;
    
    const time = state.clock.getElapsedTime();
    const particles = mesh.current;
    const dummy = new THREE.Object3D();
    
    // Animate particles
    for (let i = 0; i < count; i++) {
      particles.getMatrixAt(i, dummy.matrix);
      dummy.position.setFromMatrixPosition(dummy.matrix);
      
      // Slow upward drift
      dummy.position.y += Math.sin(time * 0.1 + i) * 0.005;
      
      // Slight horizontal movement
      dummy.position.x += Math.sin(time * 0.05 + i * 0.1) * 0.002;
      dummy.position.z += Math.cos(time * 0.05 + i * 0.1) * 0.002;
      
      // Reset particles that drift too high
      if (dummy.position.y > 10) {
        dummy.position.y = 0;
      }
      
      dummy.updateMatrix();
      particles.setMatrixAt(i, dummy.matrix);
    }
    
    particles.instanceMatrix.needsUpdate = true;
  });
  
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.02, 8, 8]} />
      <meshBasicMaterial color="#FFD700" transparent opacity={0.6} />
    </instancedMesh>
  );
};

// Main component
const TavernBackground: React.FC = () => {
  return (
    <div className="tavern-background" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: -1 }}>
      <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
        <TavernLighting />
        <Particles />
      </Canvas>
    </div>
  );
};

export default TavernBackground;
