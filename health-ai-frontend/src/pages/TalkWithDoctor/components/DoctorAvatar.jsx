import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';

// -----------------------------------------------------------------------------
// Materials / palette (single shared materials keep the model cheap to render)
// -----------------------------------------------------------------------------
const SKIN = new THREE.MeshStandardMaterial({
  color: '#e7b18e',
  roughness: 0.55,
  metalness: 0.02,
});
const LIP = new THREE.MeshStandardMaterial({ color: '#c2696a', roughness: 0.35 });
const MOUTH = new THREE.MeshStandardMaterial({ color: '#7d2f2c', roughness: 0.9 });
const HAIR = new THREE.MeshStandardMaterial({
  color: '#2c2118',
  roughness: 0.85,
  metalness: 0.05,
});
const BROW = new THREE.MeshStandardMaterial({
  color: '#241a12',
  roughness: 0.9,
});
const COAT = new THREE.MeshStandardMaterial({
  color: '#f6f8fb',
  roughness: 0.35,
  metalness: 0.02,
});
const COAT_SHADOW = new THREE.MeshStandardMaterial({
  color: '#e4e8ef',
  roughness: 0.4,
});
const SCRUBS = new THREE.MeshStandardMaterial({
  color: '#127a74',
  roughness: 0.6,
  metalness: 0.05,
});
const METAL = new THREE.MeshStandardMaterial({
  color: '#c8ccd4',
  roughness: 0.25,
  metalness: 0.85,
});
const IRIS = new THREE.MeshStandardMaterial({
  color: '#3d5a3c',
  roughness: 0.2,
});
const EYE_WHITE = new THREE.MeshStandardMaterial({
  color: '#f5f3ee',
  roughness: 0.25,
  metalness: 0.05,
});
const PUPIL = new THREE.MeshBasicMaterial({ color: '#0c0a09' });
const BLUSH = new THREE.MeshStandardMaterial({
  color: '#e8a08a',
  roughness: 0.6,
  transparent: true,
  opacity: 0.35,
});
const BADGE_BLUE = new THREE.MeshStandardMaterial({
  color: '#2563eb',
  roughness: 0.4,
});

// -----------------------------------------------------------------------------
// Animation hooks (isolated so Phase 3 lip-sync / expressions can swap in)
// -----------------------------------------------------------------------------

/**
 * Natural eye blink: fast close, brief hold, fast open on a timer.
 */
function useBlinking(eyeLids) {
  const timer = useRef(0);
  const phase = useRef(0); // 1 closing, 0 opening/rest
  const hold = useRef(0);

  useFrame((_, delta) => {
    if (!eyeLids.every((r) => r.current)) return;

    timer.current += delta;
    if (timer.current > 3.2 + Math.random() * 1.6) {
      timer.current = 0;
      phase.current = 1;
      hold.current = 0;
    }

    if (phase.current === 1) {
      hold.current += delta;
      const progress = Math.min(1, hold.current / 0.14);
      eyeLids.forEach((lid) => {
        lid.current.scale.y = Math.max(0.06, 1 - progress * 0.94);
      });
      if (progress >= 1) phase.current = 2;
    } else if (phase.current === 2) {
      hold.current += delta;
      if (hold.current >= 0.06) phase.current = 0;
    } else {
      // Re-open gently.
      eyeLids.forEach((lid) => {
        lid.current.scale.y += (1 - lid.current.scale.y) * Math.min(1, delta * 14);
      });
    }
  });
}

/**
 * Lip sync for speech: opens the mouth roughly with a sine envelope.
 * Phase 3 will replace this with real viseme-driven lip sync.
 */
function useMouth(isSpeaking, upperLip, lowerLip, mouth) {
  const ease = 0.15;

  useFrame(({ clock }) => {
    if (!upperLip.current || !lowerLip.current || !mouth.current) return;

    if (isSpeaking) {
      const t = clock.getElapsedTime() * 9;
      // Speech-like envelope: mix of two frequencies with a fast attack.
      const open = Math.max(0, Math.sin(t)) * 0.65 + Math.max(0, Math.sin(t * 2.37)) * 0.35;
      const s = 0.18 + open * 0.85;
      upperLip.current.scale.y = s;
      lowerLip.current.scale.y = s;
      mouth.current.scale.y = s * 1.15;
      lowerLip.current.position.y = -0.62 + open * 0.09;
    } else {
      upperLip.current.scale.y += (0.32 - upperLip.current.scale.y) * ease;
      lowerLip.current.scale.y += (0.34 - lowerLip.current.scale.y) * ease;
      mouth.current.scale.y += (0.06 - mouth.current.scale.y) * ease;
      lowerLip.current.position.y += (-0.58 - lowerLip.current.position.y) * ease;
    }
  });
}

/**
 * Idle life: gentle breathing (torso), soft head sway, blinking handled above.
 */
function useIdle(rootRef, headRef, browRef) {
  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    if (rootRef.current) {
      // Breathing
      rootRef.current.position.y = Math.sin(t * 1.2) * 0.02;
      rootRef.current.scale.setScalar(1 + Math.sin(t * 1.2) * 0.004);
    }
    if (headRef.current) {
      // Gentle sway — small, natural.
      headRef.current.rotation.y = Math.sin(t * 0.45) * 0.1;
      headRef.current.rotation.z = Math.sin(t * 0.7) * 0.02;
      headRef.current.rotation.x = Math.sin(t * 0.5) * 0.02;
    }
    if (browRef.current) {
      // Soft, friendly eyebrow raise occasionally.
      browRef.current.rotation.x = 0.05 + Math.max(0, Math.sin(t * 0.8)) * 0.06;
    }
  });
}

// -----------------------------------------------------------------------------
// Studio backdrop: clean radial-gradient environment (no external assets)
// -----------------------------------------------------------------------------
function useRadialTexture() {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(128, 110, 20, 128, 128, 150);
    gradient.addColorStop(0, 'rgba(46, 148, 130, 0.55)');
    gradient.addColorStop(0.5, 'rgba(20, 60, 58, 0.18)');
    gradient.addColorStop(1, 'rgba(6, 12, 18, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, []);
}

function StudioBackdrop() {
  const texture = useRadialTexture();
  return (
    <mesh position={[0, 1.4, -2.4]}>
      <planeGeometry args={[9, 9]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} />
    </mesh>
  );
}

// -----------------------------------------------------------------------------
// Doctor model
// -----------------------------------------------------------------------------
function DoctorModel({ isSpeaking }) {
  const rootRef = useRef();
  const headRef = useRef();
  const browRef = useRef();
  const upperLipRef = useRef();
  const lowerLipRef = useRef();
  const mouthRef = useRef();
  const eyeLids = [useRef(), useRef()];

  useBlinking(eyeLids);
  useMouth(isSpeaking, upperLipRef, lowerLipRef, mouthRef);
  useIdle(rootRef, headRef, browRef);

  return (
    <group ref={rootRef} position={[0, -1.7, 0]}>
      {/* ============================ TORSO / SCRUBS / COAT ============================ */}
      {/* Scrubs (base) */}
      <mesh position={[0, 0.55, 0]} castShadow material={SCRUBS}>
        <capsuleGeometry args={[0.62, 1.1, 8, 24]} />
      </mesh>

      {/* White coat body */}
      <mesh position={[0, 0.58, 0.03]} castShadow material={COAT}>
        <capsuleGeometry args={[0.68, 1.15, 8, 24]} />
      </mesh>

      {/* Coat lapels (open V exposing scrubs) */}
      <mesh position={[-0.14, 1.15, 0.28]} rotation={[0.15, 0.35, 0.5]} material={COAT} castShadow>
        <boxGeometry args={[0.16, 0.72, 0.08]} />
      </mesh>
      <mesh position={[0.14, 1.15, 0.28]} rotation={[0.15, -0.35, -0.5]} material={COAT} castShadow>
        <boxGeometry args={[0.16, 0.72, 0.08]} />
      </mesh>

      {/* Coat collar */}
      <mesh position={[0, 1.38, 0.24]} rotation={[0.35, 0, 0]} material={COAT} castShadow>
        <boxGeometry args={[0.9, 0.14, 0.24]} />
      </mesh>

      {/* Scrub V (visible under open lapels) */}
      <mesh position={[0, 1.12, 0.32]} rotation={[0.2, 0, 0]} material={SCRUBS}>
        <cylinderGeometry args={[0.2, 0.34, 0.34, 20]} />
      </mesh>

      {/* Buttons down the coat */}
      {[1.0, 0.62, 0.24].map((y) => (
        <mesh key={y} position={[0, y, 0.32]} material={METAL} castShadow>
          <sphereGeometry args={[0.045, 16, 16]} />
        </mesh>
      ))}

      {/* Chest pocket + pen */}
      <mesh position={[-0.32, 0.85, 0.34]} rotation={[0.15, 0, 0]} material={COAT_SHADOW}>
        <boxGeometry args={[0.24, 0.28, 0.04]} />
      </mesh>
      <mesh position={[-0.3, 1.02, 0.38]} rotation={[0.12, 0, 0.1]} material={METAL}>
        <boxGeometry args={[0.02, 0.3, 0.02]} />
      </mesh>

      {/* ID badge */}
      <mesh position={[0.36, 0.95, 0.36]} rotation={[0.15, 0, 0]} castShadow>
        <boxGeometry args={[0.2, 0.14, 0.03]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} />
      </mesh>
      <mesh position={[0.36, 0.94, 0.385]} rotation={[0.15, 0, 0]} material={BADGE_BLUE}>
        <planeGeometry args={[0.1, 0.04]} />
      </mesh>

      {/* Stethoscope: tube around the neck + chest piece */}
      <mesh position={[0.42, 1.35, 0.18]} rotation={[0, 0.2, Math.PI / 2.2]} material={METAL} castShadow>
        <torusGeometry args={[0.16, 0.018, 12, 32, Math.PI * 1.4]} />
      </mesh>
      <mesh position={[0.42, 0.78, 0.42]} rotation={[0.5, 0, 0]} material={METAL} castShadow>
        <cylinderGeometry args={[0.05, 0.07, 0.09, 20]} />
      </mesh>

      {/* ============================ ARMS ============================ */}
      <mesh position={[-0.9, 0.55, 0]} rotation={[0, 0, Math.PI / 3.4]} material={COAT} castShadow>
        <capsuleGeometry args={[0.16, 1.15, 8, 20]} />
      </mesh>
      <mesh position={[0.9, 0.55, 0]} rotation={[0, 0, -Math.PI / 3.4]} material={COAT} castShadow>
        <capsuleGeometry args={[0.16, 1.15, 8, 20]} />
      </mesh>
      {/* Hands */}
      <mesh position={[-1.12, -0.08, 0.05]} rotation={[0, 0, 0.4]} material={SKIN} castShadow>
        <capsuleGeometry args={[0.11, 0.3, 8, 16]} />
      </mesh>
      <mesh position={[1.12, -0.08, 0.05]} rotation={[0, 0, -0.4]} material={SKIN} castShadow>
        <capsuleGeometry args={[0.11, 0.3, 8, 16]} />
      </mesh>

      {/* ============================ NECK ============================ */}
      <mesh position={[0, 1.78, 0]} castShadow material={SKIN}>
        <cylinderGeometry args={[0.24, 0.28, 0.34, 24]} />
      </mesh>

      {/* ============================ HEAD ============================ */}
      <group ref={headRef} position={[0, 2.15, 0]}>
        {/* Skull */}
        <mesh position={[0, 0.05, 0]} castShadow material={SKIN}>
          <sphereGeometry args={[0.5, 48, 48]} />
        </mesh>

        {/* Jaw (lower half) */}
        <mesh position={[0, -0.32, 0.02]} castShadow material={SKIN}>
          <sphereGeometry args={[0.42, 40, 40]} />
        </mesh>

        {/* Chin */}
        <mesh position={[0, -0.5, 0.1]} castShadow material={SKIN}>
          <sphereGeometry args={[0.16, 24, 24]} />
        </mesh>

        {/* Ears */}
        <mesh position={[-0.52, -0.02, -0.02]} rotation={[0, 0.3, 0]} material={SKIN}>
          <sphereGeometry args={[0.1, 20, 20]} />
        </mesh>
        <mesh position={[0.52, -0.02, -0.02]} rotation={[0, -0.3, 0]} material={SKIN}>
          <sphereGeometry args={[0.1, 20, 20]} />
        </mesh>

        {/* Hair: professional shoulder-length (short sides) */}
        <mesh position={[0, 0.16, -0.02]} castShadow material={HAIR}>
          <sphereGeometry args={[0.53, 40, 40]} />
        </mesh>
        <mesh position={[0, 0.4, -0.06]} castShadow material={HAIR}>
          <sphereGeometry args={[0.36, 32, 32]} />
        </mesh>
        {/* Side hair */}
        <mesh position={[-0.42, 0.08, -0.05]} castShadow material={HAIR}>
          <boxGeometry args={[0.14, 0.5, 0.5]} />
        </mesh>
        <mesh position={[0.42, 0.08, -0.05]} castShadow material={HAIR}>
          <boxGeometry args={[0.14, 0.5, 0.5]} />
        </mesh>

        {/* ================= FACIAL FEATURES ================= */}
        {/* Eyebrows */}
        <group ref={browRef} position={[0, 0.24, 0.42]}>
          <mesh position={[-0.16, 0, 0]} rotation={[0, 0, 0.15]} material={BROW} castShadow>
            <boxGeometry args={[0.2, 0.045, 0.05]} />
          </mesh>
          <mesh position={[0.16, 0, 0]} rotation={[0, 0, -0.15]} material={BROW} castShadow>
            <boxGeometry args={[0.2, 0.045, 0.05]} />
          </mesh>
        </group>

        {/* Eyes (sclera + iris + pupil + lid) */}
        {[-0.17, 0.17].map((x, i) => (
          <group key={x} position={[x, 0.05, 0.44]}>
            {/* Sclera */}
            <mesh material={EYE_WHITE} castShadow>
              <sphereGeometry args={[0.11, 24, 24]} />
            </mesh>
            {/* Iris */}
            <mesh position={[0, 0, 0.07]} material={IRIS}>
              <circleGeometry args={[0.045, 24]} />
            </mesh>
            {/* Pupil */}
            <mesh position={[0, 0, 0.082]} material={PUPIL}>
              <circleGeometry args={[0.02, 16]} />
            </mesh>
            {/* Eyelid (blinks via scale.y) */}
            <mesh ref={eyeLids[i]} position={[0, 0.03, 0.1]} material={SKIN}>
              <sphereGeometry args={[0.1, 24, 24]} />
            </mesh>
          </group>
        ))}

        {/* Nose */}
        <group position={[0, -0.12, 0.44]}>
          <mesh material={SKIN} castShadow>
            <sphereGeometry args={[0.09, 24, 24]} />
          </mesh>
          <mesh position={[0, -0.05, 0.06]} material={SKIN} castShadow>
            <sphereGeometry args={[0.045, 16, 16]} />
          </mesh>
        </group>

        {/* Lips (upper/lower/mouth — lip-synced) */}
        <mesh ref={upperLipRef} position={[0, -0.28, 0.43]} material={LIP} castShadow>
          <sphereGeometry args={[0.13, 0.07, 0.05, 24, 16]} />
        </mesh>
        <mesh ref={lowerLipRef} position={[0, -0.36, 0.43]} material={LIP} castShadow>
          <sphereGeometry args={[0.12, 0.06, 0.05, 24, 16]} />
        </mesh>
        <mesh ref={mouthRef} position={[0, -0.32, 0.435]} material={MOUTH}>
          <sphereGeometry args={[0.1, 0.05, 0.02, 20, 12]} />
        </mesh>

        {/* Friendly cheek tint */}
        <mesh position={[-0.3, -0.16, 0.38]} material={BLUSH}>
          <sphereGeometry args={[0.09, 16, 16]} />
        </mesh>
        <mesh position={[0.3, -0.16, 0.38]} material={BLUSH}>
          <sphereGeometry args={[0.09, 16, 16]} />
        </mesh>
      </group>
    </group>
  );
}

// -----------------------------------------------------------------------------
// Public avatar component
// -----------------------------------------------------------------------------
const STATUS_GLOW = {
  idle: '#10b981',
  listening: '#f43f5e',
  thinking: '#f59e0b',
  speaking: '#10b981',
  muted: '#64748b',
  ended: '#64748b',
};

export default function DoctorAvatar({ status = 'idle', isSpeaking = false }) {
  const glowColor = STATUS_GLOW[status] || STATUS_GLOW.idle;

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[28px] border border-slate-700/70 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.14),_rgba(15,23,42,0.97)_60%)] shadow-[inset_0_0_60px_rgba(16,185,129,0.06)]">
      <Canvas
        camera={{ position: [0, 1.15, 5.6], fov: 32 }}
        dpr={[1, 2]}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <StudioBackdrop />

        {/* Three-point studio lighting */}
        <ambientLight intensity={0.45} color="#e8f6f2" />
        <directionalLight position={[3, 5, 4]} intensity={1.5} color="#fff3e0" />
        <directionalLight position={[-3, 2, -2]} intensity={0.55} color="#a8d8ff" />
        <pointLight position={[0, 3, 2]} intensity={0.6} color="#bfe8e0" />
        <pointLight position={[0, -1.5, 1.5]} intensity={0.35} color="#7a5cff" />

        <DoctorModel isSpeaking={isSpeaking} />

        <ContactShadows position={[0, -2.3, 0]} opacity={0.5} scale={5} blur={2.6} far={3} color="#04120f" />
      </Canvas>

      {/* Status glow ring (overlaid, matches the page theme) */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[28px] transition-[box-shadow] duration-500"
        style={{
          boxShadow: `inset 0 0 0 2px ${glowColor}33, 0 0 40px ${glowColor}22`,
        }}
      />
    </div>
  );
}
