"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function generateParticles(count: number) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 24;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 24;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 12;

    const color = new THREE.Color();
    const hue = 0.55 + Math.random() * 0.35;
    color.setHSL(hue, 0.8, 0.55 + Math.random() * 0.3);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;

    sizes[i] = Math.random() * 4 + 1.5;
  }

  return { positions, colors, sizes };
}

function FloatingParticles({ count = 120 }: { count?: number }) {
  const mesh = useRef<THREE.Points>(null);

  const particles = useMemo(() => generateParticles(count), [count]);

  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.y = state.clock.getElapsedTime() * 0.04;
      mesh.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.015) * 0.15;
      mesh.current.rotation.z = Math.cos(state.clock.getElapsedTime() * 0.01) * 0.08;
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
        size={0.1}
        vertexColors
        transparent
        opacity={0.75}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

function FloatingOrbs() {
  const group = useRef<THREE.Group>(null);
  const orbCount = 8;

  useFrame((state) => {
    if (group.current) {
      group.current.children.forEach((child, i) => {
        const mesh = child as THREE.Mesh;
        const t = state.clock.getElapsedTime() + i * 0.7;
        mesh.position.y += Math.sin(t) * 0.003;
        mesh.position.x += Math.cos(t * 0.7) * 0.002;
        mesh.rotation.x += 0.003;
        mesh.rotation.y += 0.004;
        mesh.rotation.z += 0.002;
      });
    }
  });

  return (
    <group ref={group}>
      {Array.from({ length: orbCount }, (_, i) => {
        const radius = 0.35 + i * 0.15;
        const x = (i - 3.5) * 3.5;
        const y = Math.sin(i * 1.2) * 3;
        const z = -4 - Math.cos(i) * 2;
        const hue = 0.55 + i * 0.06;
        return (
          <mesh key={i} position={[x, y, z]}>
            <sphereGeometry args={[radius, 48, 48]} />
            <meshStandardMaterial
              color={new THREE.Color().setHSL(hue, 0.6, 0.55)}
              transparent
              opacity={0.25}
              roughness={0.05}
              metalness={0.9}
              envMapIntensity={0.3}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function FloatingRing() {
  const ring = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ring.current) {
      ring.current.rotation.x = state.clock.getElapsedTime() * 0.15;
      ring.current.rotation.y = state.clock.getElapsedTime() * 0.1;
      ring.current.rotation.z = state.clock.getElapsedTime() * 0.05;
      ring.current.position.y = Math.sin(state.clock.getElapsedTime() * 0.3) * 1.5;
    }
  });

  return (
    <mesh ref={ring} position={[3, 1, -5]} rotation={[0.5, 0.2, 0]}>
      <torusGeometry args={[2.5, 0.04, 32, 120]} />
      <meshStandardMaterial
        color="#818cf8"
        transparent
        opacity={0.5}
        roughness={0.1}
        metalness={0.95}
        emissive="#6366f1"
        emissiveIntensity={0.3}
      />
    </mesh>
  );
}

function FloatingRingTwo() {
  const ring = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ring.current) {
      ring.current.rotation.x = state.clock.getElapsedTime() * -0.12;
      ring.current.rotation.y = state.clock.getElapsedTime() * -0.08;
      ring.current.rotation.z = state.clock.getElapsedTime() * 0.06;
      ring.current.position.y = Math.cos(state.clock.getElapsedTime() * 0.25) * 1.8;
    }
  });

  return (
    <mesh ref={ring} position={[-3.5, -1, -4.5]} rotation={[1, -0.3, 0.5]}>
      <torusGeometry args={[3, 0.03, 24, 100]} />
      <meshStandardMaterial
        color="#f472b6"
        transparent
        opacity={0.4}
        roughness={0.1}
        metalness={0.9}
        emissive="#c084fc"
        emissiveIntensity={0.25}
      />
    </mesh>
  );
}

export default function ThreeBackground() {
  return (
    <div
      className="fixed inset-0 -z-10"
      style={{ background: "var(--background)" }}
    >
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 8, 8]} intensity={0.8} color="#818cf8" />
        <pointLight position={[-10, -6, -4]} intensity={0.6} color="#f472b6" />
        <pointLight position={[0, 6, -6]} intensity={0.5} color="#6366f1" />
        <pointLight position={[5, -8, -3]} intensity={0.4} color="#c084fc" />

        <FloatingParticles count={120} />
        <FloatingOrbs />
        <FloatingRing />
        <FloatingRingTwo />
      </Canvas>

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(circle at 20% 30%, rgba(99, 102, 241, 0.06) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(244, 114, 182, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.03) 0%, transparent 60%)
          `,
        }}
      />
    </div>
  );
}
