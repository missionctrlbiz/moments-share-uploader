"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function generateParticles(count: number, isDark: boolean) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);

  const baseLightness = isDark ? 0.3 : 0.8;

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 20;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10;

    const color = new THREE.Color();
    // Monochrome/Slate elegant colors
    color.setHSL(0, 0, baseLightness + (Math.random() * 0.2 - 0.1));
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;

    sizes[i] = Math.random() * 2 + 0.5;
  }

  return { positions, colors, sizes };
}

function FloatingParticles({ count = 100 }: { count?: number }) {
  const mesh = useRef<THREE.Points>(null);
  
  // We'll use a neutral lightness since CSS mix-blend-mode handles the rest
  const particles = useMemo(() => generateParticles(count, false), [count]);

  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.y = state.clock.getElapsedTime() * 0.015;
      mesh.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.01) * 0.05;
    }
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[particles.positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[particles.colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        vertexColors
        transparent
        opacity={0.4}
        sizeAttenuation
        blending={THREE.NormalBlending}
        depthWrite={false}
      />
    </points>
  );
}

function AbstractWireframes() {
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (group.current) {
      group.current.rotation.y = state.clock.getElapsedTime() * 0.02;
      group.current.rotation.z = state.clock.getElapsedTime() * 0.01;
    }
  });

  return (
    <group ref={group}>
      <mesh position={[2, 1, -4]} rotation={[0.5, 0.5, 0]}>
        <icosahedronGeometry args={[1.5, 1]} />
        <meshBasicMaterial color="#a1a1aa" wireframe transparent opacity={0.15} />
      </mesh>
      <mesh position={[-3, -2, -5]} rotation={[-0.5, 0.2, 0.1]}>
        <octahedronGeometry args={[2, 0]} />
        <meshBasicMaterial color="#a1a1aa" wireframe transparent opacity={0.1} />
      </mesh>
    </group>
  );
}

export default function ThreeBackground() {
  return (
    <div className="fixed inset-0 -z-10 bg-background transition-colors duration-700">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.5} />
        <FloatingParticles count={150} />
        <AbstractWireframes />
      </Canvas>
      {/* Subtle vignette/gradient to focus attention to the center */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_0%,var(--background)_100%)] opacity-80" />
    </div>
  );
}
