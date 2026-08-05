import React from 'react';
import { motion } from 'framer-motion';

/**
 * Small animated equalizer bars shown while the AI doctor is "speaking".
 * Purely visual — the actual audio comes from speechSynthesis.
 */
const SpeechPlayer = ({ isSpeaking, isMuted = false }) => {
  if (!isSpeaking || isMuted) return null;

  const bars = [0, 1, 2, 3, 4];

  return (
    <div className="flex items-end gap-1" aria-hidden="true">
      {bars.map((bar) => (
        <motion.span
          key={bar}
          className="block w-1.5 rounded-full bg-emerald-400"
          style={{ height: 14 }}
          animate={{ height: [10, 22, 10, 16, 10] }}
          transition={{
            duration: 0.9,
            repeat: Infinity,
            delay: bar * 0.12,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};

export default SpeechPlayer;
