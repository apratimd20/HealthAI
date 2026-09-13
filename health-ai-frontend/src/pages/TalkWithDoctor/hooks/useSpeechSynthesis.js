import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Clean markdown and special symbols from text so the voice speaks smoothly.
 */
function cleanTextForSpeech(text) {
  if (!text) return '';
  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, '') // Remove reasoning blocks
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/`([^`]+)`/g, '$1') // Inline code
    .replace(/#{1,6}\s?/g, '') // Headings
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Bold
    .replace(/\*([^*]+)\*/g, '$1') // Italic
    .replace(/_{1,2}([^_]+)_{1,2}/g, '$1') // Underline/Italics
    .replace(/\|[^\n]+\|/g, ' ') // Table rows
    .replace(/[-*+]\s+/g, ' ') // Bullet points
    .replace(/^\d+\.\s+/gm, ' ') // Numbered lists
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
    .replace(/[#*~`|>]/g, '') // Remaining markdown chars
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Check if text contains Devanagari (Hindi script) characters.
 */
function isHindiText(text) {
  if (!text) return false;
  // Unicode range for Devanagari script: 0900 - 097F
  const devanagariRegex = /[\u0900-\u097F]/;
  return devanagariRegex.test(text);
}

/**
 * Speech synthesis hook for the voice-first doctor conversation.
 * Automatically detects whether response is in Hindi or English and
 * selects the best available native voice.
 */
export const useSpeechSynthesis = ({
  defaultLang = 'en-US',
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

  const pickVoiceForLanguage = useCallback((isHindi) => {
    if (!isSupported) return { voice: null, lang: 'en-US' };
    const voices = window.speechSynthesis.getVoices();

    if (isHindi) {
      // 1. Look for native Hindi voices (Google Hindi, Microsoft Swara/Hemant/Kalpana)
      const hindiVoice =
        voices.find((v) => /hindi|हिन्दी|swara|hemant|kalpana/i.test(v.name)) ||
        voices.find((v) => v.lang === 'hi-IN' || v.lang === 'hi_IN' || v.lang?.toLowerCase().startsWith('hi')) ||
        // 2. Fallback to Indian English (accustomed to Hindi phonetics)
        voices.find((v) => v.lang === 'en-IN' || v.lang === 'en_IN' || /india|heera|neerja|ravi/i.test(v.name));

      return { voice: hindiVoice || null, lang: 'hi-IN' };
    }

    // English voice selection
    const englishVoice =
      voices.find((voice) =>
        /Google UK English Female|Samantha|Microsoft Aria|Google US English|Natural/i.test(
          voice.name
        )
      ) ||
      voices.find((voice) => voice.lang === 'en-US' || voice.lang === 'en-GB') ||
      voices.find((voice) => voice.lang?.startsWith('en')) ||
      voices[0];

    return { voice: englishVoice || null, lang: 'en-US' };
  }, [isSupported]);

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

      const cleanedText = cleanTextForSpeech(text);
      if (!cleanedText) return false;

      const isHindi = isHindiText(cleanedText);
      const { voice, lang } = pickVoiceForLanguage(isHindi);

      const utterance = new SpeechSynthesisUtterance(cleanedText);
      utterance.lang = lang;
      utterance.rate = isHindi ? 0.95 : rate; // Slightly relaxed pace for natural Hindi cadence
      utterance.pitch = pitch;
      utterance.volume = 1;

      if (voice) {
        utterance.voice = voice;
      }

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
    [isSupported, rate, pitch, pickVoiceForLanguage]
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
