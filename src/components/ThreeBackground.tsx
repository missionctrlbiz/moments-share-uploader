"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function generateParticles(count: number) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 20;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10;

    const color = new THREE.Color();
    color.setHSL(0.6 + Math.random() * 0.2, 0.7, 0.6);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;

    sizes[i] = Math.random() * 3 + 1;
  }

  return { positions, colors, sizes };
}

function FloatingParticles({ count = 50 }: { count?: number }) {
  const mesh = useRef<THREE.Points>(null);

  // eslint-disable-next-line react-hooks/purity
  const particles = useMemo(() => generateParticles(count), [count]);

  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.y = state.clock.getElapsedTime() * 0.02;
      mesh.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.01) * 0.1;
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
        size={0.08}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function FloatingOrbs() {
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (group.current) {
      group.current.children.forEach((child, i) => {
        const mesh = child as THREE.Mesh;
        mesh.position.y += Math.sin(state.clock.getElapsedTime() + i) * 0.002;
        mesh.rotation.x += 0.001;
        mesh.rotation.y += 0.002;
      });
    }
  });

  return (
    <group ref={group}>
      {[...Array(5)].map((_, i) => (
        <mesh key={i} position={[(i - 2) * 3, Math.sin(i) * 2, -3]}>
          <sphereGeometry args={[0.3 + i * 0.1, 32, 32]} />
          <meshStandardMaterial
            color={new THREE.Color().setHSL(0.6 + i * 0.05, 0.5, 0.5)}
            transparent
            opacity={0.3}
            roughness={0.1}
            metalness={0.8}
          />
        </mesh>
      ))}
    </group>
  );
}

export default function ThreeBackground() {
  return (
    <div className="fixed inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={0.5} color="#818cf8" />
        <pointLight position={[-10, -10, -5]} intensity={0.3} color="#f472b6" />
        <FloatingParticles count={60} />
        <FloatingOrbs />
      </Canvas>
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-transparent to-pink-50/50 dark:from-indigo-950/30 dark:via-transparent dark:to-pink-950/30" />
    </div>
  );
}
