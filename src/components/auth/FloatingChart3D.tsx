import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere, Box, RoundedBox, Environment } from '@react-three/drei';
import * as THREE from 'three';

function AnalyticsBar({ position, height, color, delay }: { position: [number, number, number]; height: number; color: string; delay: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.scale.y = 0.5 + Math.sin(state.clock.elapsedTime * 0.8 + delay) * 0.3 + 0.5;
    }
  });
  
  return (
    <RoundedBox
      ref={meshRef}
      args={[0.3, height, 0.3]}
      radius={0.05}
      position={position}
    >
      <meshStandardMaterial color={color} metalness={0.4} roughness={0.2} />
    </RoundedBox>
  );
}

function FloatingOrb({ position, scale, color }: { position: [number, number, number]; scale: number; color: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
    }
  });
  
  return (
    <Sphere ref={meshRef} args={[scale, 32, 32]} position={position}>
      <MeshDistortMaterial
        color={color}
        transparent
        opacity={0.8}
        metalness={0.5}
        roughness={0.1}
        distort={0.2}
        speed={2}
      />
    </Sphere>
  );
}

function RotatingRing({ radius, color }: { radius: number; color: string }) {
  const ringRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.z = state.clock.elapsedTime * 0.3;
      ringRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.2;
    }
  });
  
  const geometry = useMemo(() => new THREE.TorusGeometry(radius, 0.02, 16, 100), [radius]);
  
  return (
    <mesh ref={ringRef} geometry={geometry}>
      <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} transparent opacity={0.6} />
    </mesh>
  );
}

function DataCube() {
  const cubeRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (cubeRef.current) {
      cubeRef.current.rotation.y = state.clock.elapsedTime * 0.2;
      cubeRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });
  
  return (
    <group ref={cubeRef}>
      {/* Main glass cube */}
      <RoundedBox args={[1.2, 1.2, 1.2]} radius={0.1}>
        <meshStandardMaterial
          color="#a855f7"
          transparent
          opacity={0.15}
          metalness={0.9}
          roughness={0.1}
        />
      </RoundedBox>
      
      {/* Inner wireframe */}
      <Box args={[1.1, 1.1, 1.1]}>
        <meshBasicMaterial color="#a855f7" wireframe transparent opacity={0.3} />
      </Box>
      
      {/* Analytics bars inside */}
      <AnalyticsBar position={[-0.3, -0.2, 0]} height={0.6} color="#06b6d4" delay={0} />
      <AnalyticsBar position={[0, -0.1, 0]} height={0.8} color="#8b5cf6" delay={1} />
      <AnalyticsBar position={[0.3, -0.15, 0]} height={0.7} color="#ec4899" delay={2} />
    </group>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#a855f7" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#06b6d4" />
      <spotLight position={[0, 10, 0]} intensity={0.8} color="#ffffff" angle={0.3} />
      
      <Float
        speed={2}
        rotationIntensity={0.5}
        floatIntensity={1}
      >
        <DataCube />
      </Float>
      
      {/* Orbiting elements */}
      <FloatingOrb position={[1.8, 0.5, -1]} scale={0.2} color="#06b6d4" />
      <FloatingOrb position={[-1.5, -0.8, -0.5]} scale={0.15} color="#ec4899" />
      <FloatingOrb position={[1.2, -1, 0.5]} scale={0.12} color="#a855f7" />
      
      {/* Decorative rings */}
      <RotatingRing radius={2} color="#a855f7" />
      <RotatingRing radius={2.3} color="#06b6d4" />
      
      <Environment preset="night" />
    </>
  );
}

export default function FloatingChart3D() {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        style={{ background: 'transparent' }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
