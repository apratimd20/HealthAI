import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Speech synthesis hook for the voice-first doctor conversation.
 *
 * Improvements over the previous implementation:
 * - Picks the most natural-sounding English voice available on the device.
 * - Exposes an `onEnd` callback (fired when speech completes or is interrupted)
 *   so the conversation can automatically resume listening.
 * - `speak` cancels any in-flight utterance before starting a new one.
 */
export const useSpeechSynthesis = ({
  lang = 'en-US',
  rate = 1,
  pitch = 1,
  onEnd,
} = {}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState(null);

  const isSupported =
    typeof window !== 'undefined' && 'speechSynthesis' in window;

  const utteranceRef = useRef(null);
  const onEndRef = useRef(onEnd);

  useEffect(() => {
    onEndRef.current = onEnd;
  }, [onEnd]);

  const pickVoice = useCallback(() => {
    const voices = window.speechSynthesis.getVoices();
    const preferred =
      voices.find((voice) =>
        /Google UK English Female|Samantha|Microsoft Aria|Google US English|Natural/i.test(
          voice.name
        )
      ) ||
      voices.find((voice) => voice.lang === 'en-US') ||
      voices.find((voice) => voice.lang?.startsWith('en')) ||
      voices[0];
    return preferred || null;
  }, []);

  // Some browsers populate voices asynchronously; force a refresh.
  useEffect(() => {
    if (isSupported && typeof window.speechSynthesis.onvoiceschanged !== 'undefined') {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, [isSupported]);

  const speak = useCallback(
    (text) => {
      if (!text || !isSupported) {
        setError('Speech synthesis is not supported in this browser.');
        return false;
      }

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = 1;

      const voice = pickVoice();
      if (voice) utterance.voice = voice;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        utteranceRef.current = null;
        onEndRef.current?.();
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        utteranceRef.current = null;
        setError('Unable to play the response aloud.');
        onEndRef.current?.();
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
      setError(null);
      return true;
    },
    [isSupported, lang, rate, pitch, pickVoice]
  );

  const stop = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
    }
    utteranceRef.current = null;
    setIsSpeaking(false);
  }, [isSupported]);

  return { isSpeaking, error, speak, stop, isSupported };
};
