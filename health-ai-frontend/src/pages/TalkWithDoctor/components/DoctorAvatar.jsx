import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';

// -----------------------------------------------------------------------------
// Helper hooks / sub-components
// -----------------------------------------------------------------------------

/**
 * Blinks the eyes periodically. Phase 3 will drive expressions via a shared
 * "expression" object — this is already isolated so it can be replaced easily.
 */
function useBlinking(eyeLeftRef, eyeRightRef) {
  const blinkTimerRef = useRef(0);
  const blinkPhaseRef = useRef(0);

  useFrame((_, delta) => {
    if (!eyeLeftRef.current || !eyeRightRef.current) return;

    blinkTimerRef.current += delta;
    const scaleY = eyeLeftRef.current.scale.y;

    // Blink every ~3.5s, closing over ~120ms.
    if (blinkTimerRef.current > 3.5) {
      blinkTimerRef.current = 0;
      blinkPhaseRef.current = 1;
    }
    if (blinkPhaseRef.current > 0) {
      blinkPhaseRef.current -= delta / 0.12;
      eyeLeftRef.current.scale.y = Math.max(0.05, scaleY * 0.92);
      eyeRightRef.current.scale.y = eyeLeftRef.current.scale.y;
      if (blinkPhaseRef.current <= 0) {
        eyeLeftRef.current.scale.y = 1;
        eyeRightRef.current.scale.y = 1;
      }
    }
  });
}

/**
 * Mouth animation driven by `isSpeaking`.
 * Phase 3 will replace this with real viseme-driven lip sync.
 */
function useMouth(isSpeaking, mouthRef) {
  useFrame(({ clock }) => {
    if (!mouthRef.current) return;
    if (isSpeaking) {
      const t = clock.getElapsedTime() * 10;
      mouthRef.current.scale.y = 0.5 + Math.abs(Math.sin(t)) * 0.5;
    } else {
      mouthRef.current.scale.y = 1;
    }
  });
}

// -----------------------------------------------------------------------------
// Doctor model
// -----------------------------------------------------------------------------
function DoctorModel({ isSpeaking }) {
  const rootRef = useRef();
  const headRef = useRef();
  const eyeLeftRef = useRef();
  const eyeRightRef = useRef();
  const mouthRef = useRef();

  useBlinking(eyeLeftRef, eyeRightRef);
  useMouth(isSpeaking, mouthRef);

  // Idle: gentle breathing + head sway. Phase 3 adds head-tracking & gestures.
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (rootRef.current) {
      rootRef.current.position.y = Math.sin(t * 1.4) * 0.04;
      rootRef.current.rotation.y = Math.sin(t * 0.6) * 0.14;
    }
    if (headRef.current) {
      headRef.current.rotation.z = Math.sin(t * 0.9) * 0.03;
      headRef.current.rotation.x = Math.sin(t * 0.7) * 0.02;
    }
  });

  return (
    <group ref={rootRef} position={[0, -1.5, 0]}>
      {/* Neck */}
      <mesh position={[0, 0.45, 0]} castShadow>
        <cylinderGeometry args={[0.24, 0.28, 0.5, 24]} />
        <meshStandardMaterial color="#e8b08c" roughness={0.85} />
      </mesh>

      {/* Torso / white coat */}
      <mesh position={[0, -0.35, 0]} castShadow>
        <capsuleGeometry args={[0.78, 1.5, 8, 16]} />
        <meshStandardMaterial color="#f8fafc" metalness={0.08} roughness={0.6} />
      </mesh>

      {/* Coat lapels */}
      <mesh position={[0, 0.35, 0.62]} rotation={[0.1, 0, 0.25]} castShadow>
        <boxGeometry args={[0.34, 0.9, 0.06]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.35, 0.62]} rotation={[0.1, 0, -0.25]} castShadow>
        <boxGeometry args={[0.34, 0.9, 0.06]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.55} />
      </mesh>

      {/* Name badge */}
      <mesh position={[0.18, 0.75, 0.72]} rotation={[0.1, 0, 0]} castShadow>
        <boxGeometry args={[0.26, 0.16, 0.03]} />
        <meshStandardMaterial color="#fef3c7" roughness={0.4} />
      </mesh>

      {/* Stethoscope tube around neck */}
      <mesh position={[0.3, 0.55, 0.6]} rotation={[0, 0, Math.PI / 2.4]} castShadow>
        <cylinderGeometry args={[0.045, 0.045, 0.85, 12]} />
        <meshStandardMaterial color="#10b981" roughness={0.3} />
      </mesh>
      <mesh position={[-0.3, 0.55, 0.6]} rotation={[0, 0, -Math.PI / 2.4]} castShadow>
        <cylinderGeometry args={[0.045, 0.045, 0.85, 12]} />
        <meshStandardMaterial color="#10b981" roughness={0.3} />
      </mesh>
      {/* Chest piece */}
      <mesh position={[0.12, 0.32, 0.72]} castShadow>
        <cylinderGeometry args={[0.07, 0.07, 0.06, 16]} />
        <meshStandardMaterial color="#059669" metalness={0.4} roughness={0.25} />
      </mesh>

      {/* Arms */}
      <mesh position={[-0.92, 0.05, 0]} rotation={[0, 0, Math.PI / 2.6]} castShadow>
        <capsuleGeometry args={[0.16, 1.2, 6, 12]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.6} />
      </mesh>
      <mesh position={[0.92, 0.05, 0]} rotation={[0, 0, -Math.PI / 2.6]} castShadow>
        <capsuleGeometry args={[0.16, 1.2, 6, 12]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.6} />
      </mesh>

      {/* Hands */}
      <mesh position={[-1.05, -0.55, 0.15]} castShadow>
        <sphereGeometry args={[0.13, 16, 16]} />
        <meshStandardMaterial color="#e8b08c" roughness={0.8} />
      </mesh>
      <mesh position={[1.05, -0.55, 0.15]} castShadow>
        <sphereGeometry args={[0.13, 16, 16]} />
        <meshStandardMaterial color="#e8b08c" roughness={0.8} />
      </mesh>

      {/* Head group */}
      <group ref={headRef} position={[0, 1.5, 0]}>
        {/* Face */}
        <mesh position={[0, 0, 0]} castShadow>
          <sphereGeometry args={[0.62, 32, 32]} />
          <meshStandardMaterial color="#e8b08c" metalness={0.05} roughness={0.72} />
        </mesh>

        {/* Hair (dark bun) */}
        <mesh position={[0, 0.22, -0.02]} castShadow>
          <sphereGeometry args={[0.64, 32, 32]} />
          <meshStandardMaterial color="#2d2a26" metalness={0.1} roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.62, -0.05]} castShadow>
          <sphereGeometry args={[0.28, 24, 24]} />
          <meshStandardMaterial color="#2d2a26" metalness={0.1} roughness={0.6} />
        </mesh>

        {/* Eyes (with blinking refs) */}
        <group position={[-0.2, 0.05, 0.5]}>
          <mesh ref={eyeLeftRef} castShadow>
            <sphereGeometry args={[0.09, 18, 18]} />
            <meshStandardMaterial color="#ffffff" roughness={0.2} />
          </mesh>
        </group>
        <group position={[0.2, 0.05, 0.5]}>
          <mesh ref={eyeRightRef} castShadow>
            <sphereGeometry args={[0.09, 18, 18]} />
            <meshStandardMaterial color="#ffffff" roughness={0.2} />
          </mesh>
        </group>
        {/* Pupils */}
        <mesh position={[-0.2, 0.05, 0.56]} castShadow>
          <sphereGeometry args={[0.045, 14, 14]} />
          <meshStandardMaterial color="#1f2937" roughness={0.3} />
        </mesh>
        <mesh position={[0.2, 0.05, 0.56]} castShadow>
          <sphereGeometry args={[0.045, 14, 14]} />
          <meshStandardMaterial color="#1f2937" roughness={0.3} />
        </mesh>

        {/* Eyebrows */}
        <mesh position={[-0.2, 0.18, 0.5]} rotation={[0, 0, 0.06]} castShadow>
          <boxGeometry args={[0.16, 0.035, 0.03]} />
          <meshStandardMaterial color="#2d2a26" roughness={0.7} />
        </mesh>
        <mesh position={[0.2, 0.18, 0.5]} rotation={[0, 0, -0.06]} castShadow>
          <boxGeometry args={[0.16, 0.035, 0.03]} />
          <meshStandardMaterial color="#2d2a26" roughness={0.7} />
        </mesh>

        {/* Nose */}
        <mesh position={[0, -0.05, 0.56]} castShadow>
          <sphereGeometry args={[0.05, 14, 14]} />
          <meshStandardMaterial color="#dd9f7c" roughness={0.8} />
        </mesh>

        {/* Mouth (speech-driven) */}
        <group position={[0, -0.2, 0.55]}>
          <mesh ref={mouthRef} castShadow>
            <sphereGeometry args={[0.085, 14, 14]} />
            <meshStandardMaterial color="#c96b6b" roughness={0.5} />
          </mesh>
        </group>

        {/* Cheeks / blush for friendliness */}
        <mesh position={[-0.33, -0.08, 0.42]} castShadow>
          <sphereGeometry args={[0.06, 12, 12]} />
          <meshStandardMaterial color="#f2b8b0" transparent opacity={0.6} roughness={0.9} />
        </mesh>
        <mesh position={[0.33, -0.08, 0.42]} castShadow>
          <sphereGeometry args={[0.06, 12, 12]} />
          <meshStandardMaterial color="#f2b8b0" transparent opacity={0.6} roughness={0.9} />
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
    <div className="relative h-full w-full overflow-hidden rounded-[28px] border border-slate-700/70 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.16),_rgba(15,23,42,0.97)_58%)] shadow-[inset_0_0_60px_rgba(16,185,129,0.07)]">
      <Canvas camera={{ position: [0, 1.4, 6.4], fov: 30 }} dpr={[1, 2]}>
        <ambientLight intensity={1.2} />
        <directionalLight position={[3, 5, 5]} intensity={1.7} color="#dff8ee" />
        <directionalLight position={[-4, 1, 2]} intensity={0.65} color="#b7d8ff" />
        <pointLight position={[0, 4, 4]} intensity={1.1} color="#34d399" />
        <pointLight position={[0, -2, 2]} intensity={0.5} color="#1e293b" />

        <DoctorModel isSpeaking={isSpeaking} />

        {/* Ground shadow */}
        <mesh position={[0, -2.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[1.6, 32]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.25} />
        </mesh>
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
