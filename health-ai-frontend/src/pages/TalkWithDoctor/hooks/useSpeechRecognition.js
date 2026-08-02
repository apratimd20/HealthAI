import { useCallback, useEffect, useRef, useState } from 'react';

// Human-friendly messages for the common SpeechRecognition error codes.
const ERROR_MESSAGES = {
  'not-allowed':
    'Microphone access was denied. Please allow microphone permission in your browser and try again.',
  'service-not-allowed': 'Speech service is not allowed in this browser context.',
  'audio-capture': 'No microphone was found. Connect a microphone and try again.',
  'language-not-supported': 'Your browser does not support this speech recognition language.',
  'not-supported': 'Speech recognition is not supported in this browser.',
};

/**
 * Robust speech recognition hook for voice-first conversations.
 *
 * Key fixes over the previous implementation:
 * - Continuous mode with automatic restart when recognition ends (unless explicitly stopped).
 * - Fires `onFinalResult` only for committed (final) transcripts to prevent duplicate API calls.
 * - Fires `onInterimResult` for live (partial) transcripts for a "listening" UX.
 * - Ignores empty results and results produced while the mic is muted.
 * - Requests microphone permission up front and surfaces a friendly error if denied.
 * - Proper start/stop/cleanup without leaking the recognition instance.
 */
export const useSpeechRecognition = ({
  enabled = true,
  lang = 'en-US',
  continuous = true,
  interimResults = true,
  onFinalResult,
  onInterimResult,
  onError,
} = {}) => {
  const [isListening, setIsListening] = useState(false);

  const isSupported =
    typeof window !== 'undefined' &&
    Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  const recognitionRef = useRef(null);
  const shouldRestartRef = useRef(false);
  const restartTimerRef = useRef(null);
  const isActiveRef = useRef(false);

  // Keep the latest callbacks in refs so the recognition handlers never go stale.
  const onFinalResultRef = useRef(onFinalResult);
  const onInterimResultRef = useRef(onInterimResult);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onFinalResultRef.current = onFinalResult;
    onInterimResultRef.current = onInterimResult;
    onErrorRef.current = onError;
  }, [onFinalResult, onInterimResult, onError]);

  const createRecognition = useCallback(() => {
    if (!isSupported) return null;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = lang;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      isActiveRef.current = true;
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      // Iterate from resultIndex so already-processed final segments are not re-read,
      // which prevents duplicate transcripts and duplicate API calls.
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const text = result[0]?.transcript?.trim() || '';
        if (result.isFinal) {
          finalTranscript += `${text} `;
        } else {
          interimTranscript += text;
        }
      }

      const cleanFinal = finalTranscript.replace(/\s+/g, ' ').trim();
      if (cleanFinal) onFinalResultRef.current?.(cleanFinal);

      const cleanInterim = interimTranscript.replace(/\s+/g, ' ').trim();
      if (cleanInterim) onInterimResultRef.current?.(cleanInterim);
    };

    recognition.onerror = (event) => {
      const code = event?.error;

      // Expected / transient events — let onend drive auto-restart.
      if (code === 'no-speech' || code === 'aborted') return;
      // Chrome occasionally fires transient `network` errors; restart silently.
      if (code === 'network') return;

      // Hard errors: stop auto-restart and surface a friendly message.
      shouldRestartRef.current = false;
      isActiveRef.current = false;
      setIsListening(false);
      onErrorRef.current?.(ERROR_MESSAGES[code] || 'Speech recognition encountered an error. Please try again.');
    };

    recognition.onend = () => {
      isActiveRef.current = false;
      setIsListening(false);

      // Auto-restart so the conversation never drops after silence.
      if (shouldRestartRef.current) {
        restartTimerRef.current = setTimeout(() => {
          if (shouldRestartRef.current) {
            try {
              recognition.start();
            } catch {
              /* already started — ignore */
            }
          }
        }, 250);
      }
    };

    return recognition;
  }, [isSupported, continuous, interimResults, lang]);

  useEffect(() => {
    if (!enabled || !isSupported) return undefined;

    recognitionRef.current = createRecognition();

    return () => {
      // Full cleanup on unmount / disable.
      shouldRestartRef.current = false;
      isActiveRef.current = false;
      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
        restartTimerRef.current = null;
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          /* noop */
        }
        recognitionRef.current = null;
      }
    };
  }, [enabled, isSupported, createRecognition]);

  const startListening = useCallback(async () => {
    if (!recognitionRef.current) return false;
    if (isActiveRef.current) return true;

    // Request mic permission up front so we surface a friendly error instead of
    // a silent failure inside recognition.start().
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // We only need the permission — release the track immediately.
        stream.getTracks().forEach((track) => track.stop());
      }
    } catch (error) {
      onErrorRef.current?.(
        error?.message || 'Microphone permission is required to use voice input.'
      );
      return false;
    }

    shouldRestartRef.current = true;

    try {
      recognitionRef.current.start();
      return true;
    } catch (error) {
      // InvalidStateError happens if it already started — treat as success.
      console.warn('Speech recognition start warning:', error?.message);
      return true;
    }
  }, []);

  const stopListening = useCallback(() => {
    shouldRestartRef.current = false;
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        /* noop */
      }
    }
    isActiveRef.current = false;
    setIsListening(false);
  }, []);

  return { isListening, isSupported, startListening, stopListening };
};