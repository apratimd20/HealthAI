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
  const startResolveRef = useRef(null);
  const noSpeechCountRef = useRef(0);

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
      console.log('[STT] onstart — recognition active');
      isActiveRef.current = true;
      setIsListening(true);
      if (startResolveRef.current) {
        startResolveRef.current(true);
        startResolveRef.current = null;
      }
    };

    recognition.onresult = (event) => {
      console.log('[STT] onresult', { resultIndex: event.resultIndex, resultsLength: event.results.length });
      noSpeechCountRef.current = 0; // got audio, reset counter
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const text = result[0]?.transcript?.trim() || '';
        console.log('[STT] result', i, { isFinal: result.isFinal, transcript: text });
        if (result.isFinal) {
          finalTranscript += `${text} `;
        } else {
          interimTranscript += text;
        }
      }

      const cleanFinal = finalTranscript.replace(/\s+/g, ' ').trim();
      if (cleanFinal) {
        console.log('[STT] final transcript:', cleanFinal);
        onFinalResultRef.current?.(cleanFinal);
      }

      const cleanInterim = interimTranscript.replace(/\s+/g, ' ').trim();
      if (cleanInterim) {
        console.log('[STT] interim:', cleanInterim);
        onInterimResultRef.current?.(cleanInterim);
      }
    };

    recognition.onerror = (event) => {
      const code = event?.error;
      console.log('[STT] onerror:', code);

      if (code === 'aborted') return;
      if (code === 'network') return;

      if (code === 'no-speech') {
        noSpeechCountRef.current += 1;
        console.log('[STT] no-speech count:', noSpeechCountRef.current);

        // After 3 consecutive no-speech errors, stop restarting and surface error
        if (noSpeechCountRef.current >= 3) {
          console.log('[STT] too many no-speech errors — stopping');
          shouldRestartRef.current = false;
          isActiveRef.current = false;
          setIsListening(false);
          onErrorRef.current?.('Microphone is not detecting any sound. Check that your microphone is not muted, the correct input device is selected, and try speaking closer to the mic.');
        }
        return;
      }

      // Hard errors: stop auto-restart and surface a friendly message.
      shouldRestartRef.current = false;
      isActiveRef.current = false;
      setIsListening(false);
      if (startResolveRef.current) {
        startResolveRef.current(false);
        startResolveRef.current = null;
      }
      onErrorRef.current?.(ERROR_MESSAGES[code] || 'Speech recognition encountered an error. Please try again.');
    };

    recognition.onend = () => {
      console.log('[STT] onend, shouldRestart:', shouldRestartRef.current, 'noSpeechCount:', noSpeechCountRef.current);
      isActiveRef.current = false;
      setIsListening(false);

      if (shouldRestartRef.current && noSpeechCountRef.current < 3) {
        restartTimerRef.current = setTimeout(() => {
          if (shouldRestartRef.current && noSpeechCountRef.current < 3) {
            try {
              console.log('[STT] auto-restart');
              recognition.start();
            } catch {
              console.log('[STT] auto-restart failed (already started)');
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
      if (startResolveRef.current) {
        startResolveRef.current(false);
        startResolveRef.current = null;
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
    console.log('[STT] startListening called, recognitionRef:', !!recognitionRef.current, 'isActive:', isActiveRef.current);
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
      console.log('[STT] getUserMedia error:', error?.message);
      onErrorRef.current?.(
        error?.message || 'Microphone permission is required to use voice input.'
      );
      return false;
    }

    shouldRestartRef.current = true;
    noSpeechCountRef.current = 0;

    try {
      console.log('[STT] calling recognition.start()');
      recognitionRef.current.start();
    } catch (error) {
      // InvalidStateError happens if it already started — treat as success.
      console.warn('[STT] recognition.start warning:', error?.message);
      return true;
    }

    // Wait for onstart to actually fire (max 3s). If it doesn't, the mic
    // never truly opened — surface a clear error instead of pretending success.
    return await new Promise((resolve) => {
      startResolveRef.current = resolve;
      setTimeout(() => {
        if (startResolveRef.current) {
          console.log('[STT] start timeout — onstart never fired');
          startResolveRef.current = null;
          onErrorRef.current?.('Microphone did not start. Please check permissions and try again.');
          resolve(false);
        }
      }, 3000);
    });
  }, []);

  const stopListening = useCallback(() => {
    console.log('[STT] stopListening');
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