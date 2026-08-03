import { useCallback, useEffect, useRef, useState } from 'react';

// ==========================================
// SpeechRecognition State Machine
// ==========================================
const STT_STATE = {
  IDLE: 'idle',
  STARTING: 'starting',
  LISTENING: 'listening',
  USER_SPEAKING: 'user-speaking',
  PAUSED: 'paused',      // TTS is speaking, recognition stopped
  ENDED: 'ended',
  ERROR: 'error',
};

const STT_ERROR_MESSAGES = {
  'not-allowed': 'Microphone access was denied. Please allow microphone permission in your browser settings and try again.',
  'service-not-allowed': 'Speech service is not allowed in this browser context.',
  'audio-capture': 'No microphone was found. Connect a microphone and try again.',
  'language-not-supported': 'Your browser does not support this speech recognition language.',
  'not-supported': 'Speech recognition is not supported in this browser.',
  'aborted': 'Speech recognition was aborted.',
  'network': 'Network error occurred. Please check your connection.',
  'no-speech': 'No speech detected. Please try speaking closer to the microphone.',
};

function log(...args) {
  console.log('[Speech]', new Date().toISOString(), ...args);
}

function logError(...args) {
  console.error('[Speech]', new Date().toISOString(), ...args);
}

export const useSpeechRecognition = ({
  lang = 'en-US',
  continuous = true,
  interimResults = true,
  onFinalResult,
  onInterimResult,
  onError,
  onStateChange,
} = {}) => {
  const [state, setState] = useState(STT_STATE.IDLE);
  const [isSupported, setIsSupported] = useState(false);
  const [permissionState, setPermissionState] = useState('prompt');

  // Refs for mutable state without re-renders
  const recognitionRef = useRef(null);
  const stateRef = useRef(STT_STATE.IDLE);
  const shouldRestartRef = useRef(false);
  const restartTimerRef = useRef(null);
  const isProcessingRef = useRef(false);
  const lastFinalTranscriptRef = useRef('');
  const finalTranscriptBufferRef = useRef('');
  const permissionCheckedRef = useRef(false);
  const noSpeechCountRef = useRef(0);
  const MAX_NO_SPEECH_ERRORS = 5;

  // Keep callbacks fresh
  const onFinalResultRef = useRef(onFinalResult);
  const onInterimResultRef = useRef(onInterimResult);
  const onErrorRef = useRef(onError);
  const onStateChangeRef = useRef(onStateChange);

  useEffect(() => {
    onFinalResultRef.current = onFinalResult;
    onInterimResultRef.current = onInterimResult;
    onErrorRef.current = onError;
    onStateChangeRef.current = onStateChange;
  }, [onFinalResult, onInterimResult, onError, onStateChange]);

  const setStateSafe = useCallback((newState) => {
    if (stateRef.current === newState) return;
    log('State transition:', stateRef.current, '→', newState);
    stateRef.current = newState;
    setState(newState);
    onStateChangeRef.current?.(newState);
  }, []);

  // ==========================================
  // Browser Support & Permission
  // ==========================================
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const supported = Boolean(SpeechRecognition);
    setIsSupported(supported);

    if (!supported) {
      log('SpeechRecognition not supported in this browser');
      return;
    }

    const checkPermission = async () => {
      if (permissionCheckedRef.current) return;
      permissionCheckedRef.current = true;

      try {
        const status = await navigator.permissions.query({ name: 'microphone' });
        setPermissionState(status.state);
        log('Microphone permission:', status.state);

        status.onchange = () => {
          setPermissionState(status.state);
          log('Microphone permission changed:', status.state);
        };
      } catch {
        log('Permission API not available, will prompt on first use');
      }
    };

    checkPermission();
  }, []);

  // ==========================================
  // Create Single SpeechRecognition Instance
  // ==========================================
  const createRecognition = useCallback(() => {
    if (!isSupported) return null;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = lang;
    recognition.maxAlternatives = 1;

    // ==========================================
    // Lifecycle Event Handlers
    // ==========================================
    recognition.onaudiostart = () => log('Event: onaudiostart');
    recognition.onsoundstart = () => log('Event: onsoundstart');

    recognition.onspeechstart = () => {
      log('Event: onspeechstart — user started speaking');
      noSpeechCountRef.current = 0; // Reset on successful speech detection
      setStateSafe(STT_STATE.USER_SPEAKING);
    };

    recognition.onspeechend = () => {
      log('Event: onspeechend — user stopped speaking');
      if (stateRef.current === STT_STATE.USER_SPEAKING) {
        setStateSafe(STT_STATE.LISTENING);
      }
    };

    recognition.onsoundend = () => log('Event: onsoundend');
    recognition.onaudioend = () => log('Event: onaudioend');

    recognition.onstart = () => {
      log('Event: onstart — recognition active');
      setStateSafe(STT_STATE.LISTENING);
      isProcessingRef.current = false;
    };

    recognition.onend = () => {
      log('Event: onend — recognition ended, shouldRestart:', shouldRestartRef.current, 'state:', stateRef.current);
      setStateSafe(STT_STATE.IDLE);
      isProcessingRef.current = false;

      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
        restartTimerRef.current = null;
      }

      if (
        shouldRestartRef.current &&
        stateRef.current !== STT_STATE.PAUSED &&
        stateRef.current !== STT_STATE.ENDED &&
        stateRef.current !== STT_STATE.ERROR
      ) {
        log('Scheduling auto-restart...');
        restartTimerRef.current = setTimeout(() => {
          if (
            shouldRestartRef.current &&
            stateRef.current !== STT_STATE.PAUSED &&
            stateRef.current !== STT_STATE.ENDED &&
            stateRef.current !== STT_STATE.ERROR
          ) {
            try {
              log('Auto-restarting recognition...');
              recognition.start();
            } catch (e) {
              logError('Auto-restart failed:', e?.message);
            }
          }
        }, 300);
      }
    };

    recognition.onerror = (event) => {
      const code = event?.error;
      logError('Event: onerror:', code);

      if (code === 'no-speech') {
        noSpeechCountRef.current += 1;
        log('No speech detected, continuing... (count:', noSpeechCountRef.current, ')');

        if (noSpeechCountRef.current >= MAX_NO_SPEECH_ERRORS) {
          logError('Too many consecutive no-speech errors — stopping');
          shouldRestartRef.current = false;
          if (restartTimerRef.current) {
            clearTimeout(restartTimerRef.current);
            restartTimerRef.current = null;
          }
          const message = 'Microphone is not detecting speech. Please check: microphone is not muted, correct input device is selected in browser/system settings, and try speaking closer to the mic.';
          logError('Too many no-speech errors:', message);
          setStateSafe(STT_STATE.ERROR);
          onErrorRef.current?.(message);
        }
        return;
      }

      // Reset counter on any other error (including successful speech)
      noSpeechCountRef.current = 0;

      shouldRestartRef.current = false;
      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
        restartTimerRef.current = null;
      }

      const message = STT_ERROR_MESSAGES[code] || `Speech recognition error: ${code}`;
      logError('Hard error, stopping:', message);
      setStateSafe(STT_STATE.ERROR);
      onErrorRef.current?.(message);
    };

    recognition.onresult = (event) => {
      log('Event: onresult', { resultIndex: event.resultIndex, resultsLength: event.results.length });

      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const text = result[0]?.transcript?.trim() || '';
        log('Result segment:', i, { isFinal: result.isFinal, text });

        if (result.isFinal) {
          finalTranscript += `${text} `;
        } else {
          interimTranscript += text;
        }
      }

      const cleanInterim = interimTranscript.replace(/\s+/g, ' ').trim();
      if (cleanInterim) {
        log('Interim transcript:', cleanInterim);
        onInterimResultRef.current?.(cleanInterim);
      }

      const cleanFinal = finalTranscript.replace(/\s+/g, ' ').trim();
      if (!cleanFinal) return;

      // ==========================================
      // EMIT FINAL TRANSCRIPT IMMEDIATELY
      // Do NOT wait for silence timeout — final results
      // are already committed by the browser.
      // ==========================================
      log('Final transcript received, emitting immediately:', cleanFinal);
      lastFinalTranscriptRef.current = cleanFinal;
      onFinalResultRef.current?.(cleanFinal);

      // Also reset no-speech counter since we got valid speech
      noSpeechCountRef.current = 0;
    };

    return recognition;
  }, [isSupported, continuous, interimResults, lang, setStateSafe]);

  // ==========================================
  // Initialize Recognition Instance Once
  // ==========================================
  useEffect(() => {
    if (!isSupported) return;

    recognitionRef.current = createRecognition();
    log('SpeechRecognition instance created');

    return () => {
      log('Cleaning up SpeechRecognition...');
      shouldRestartRef.current = false;
      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
        restartTimerRef.current = null;
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          logError('Cleanup abort error:', e?.message);
        }
        recognitionRef.current = null;
      }
    };
  }, [isSupported, createRecognition]);

  // ==========================================
  // Public API
  // ==========================================

  const requestPermission = useCallback(async () => {
    if (!isSupported) return false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setPermissionState('granted');
      log('Microphone permission granted via getUserMedia');
      return true;
    } catch (error) {
      logError('getUserMedia error:', error?.message);
      setPermissionState('denied');
      const message = error?.message || 'Microphone permission is required to use voice input.';
      onErrorRef.current?.(message);
      return false;
    }
  }, [isSupported]);

  const start = useCallback(async () => {
    if (!recognitionRef.current) {
      logError('Cannot start: no recognition instance');
      return false;
    }

    if (stateRef.current === STT_STATE.LISTENING || stateRef.current === STT_STATE.USER_SPEAKING) {
      log('Already listening, ignoring start');
      return true;
    }

    if (stateRef.current === STT_STATE.PAUSED) {
      log('Resuming from paused state');
      shouldRestartRef.current = true;
      lastFinalTranscriptRef.current = '';
      try {
        recognitionRef.current.start();
        return true;
      } catch (e) {
        logError('Resume start error:', e?.message);
        return false;
      }
    }

    if (stateRef.current === STT_STATE.STARTING) {
      log('Already starting, ignoring');
      return false;
    }

    if (permissionState !== 'granted') {
      log('Requesting microphone permission...');
      const granted = await requestPermission();
      if (!granted) return false;
    }

    log('Starting recognition...');
    setStateSafe(STT_STATE.STARTING);
    shouldRestartRef.current = true;
    lastFinalTranscriptRef.current = '';
    finalTranscriptBufferRef.current = '';
    noSpeechCountRef.current = 0;
    isProcessingRef.current = false;

    try {
      recognitionRef.current.start();
      return true;
    } catch (error) {
      logError('Recognition start error:', error?.message);
      setStateSafe(STT_STATE.ERROR);
      if (error.name === 'InvalidStateError') {
        log('InvalidStateError - already started, treating as success');
        return true;
      }
      onErrorRef.current?.('Failed to start speech recognition. Please try again.');
      return false;
    }
  }, [permissionState, requestPermission, setStateSafe]);

  const stop = useCallback(() => {
    log('Stop requested');
    shouldRestartRef.current = false;
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        logError('Stop error:', e?.message);
      }
    }
    isProcessingRef.current = false;
    setStateSafe(STT_STATE.IDLE);
  }, [setStateSafe]);

  const pause = useCallback(() => {
    log('Pausing recognition (TTS speaking)');
    shouldRestartRef.current = false;
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        logError('Pause stop error:', e?.message);
      }
    }
    isProcessingRef.current = false;
    setStateSafe(STT_STATE.PAUSED);
  }, [setStateSafe]);

  const resume = useCallback(() => {
    log('Resuming recognition (TTS finished)');
    if (stateRef.current === STT_STATE.PAUSED) {
      log('Resuming from paused state');
      shouldRestartRef.current = true;
      lastFinalTranscriptRef.current = '';
      try {
        recognitionRef.current.start();
      } catch (e) {
        logError('Resume error:', e?.message);
      }
      return;
    }
    // If not paused but not listening either, start fresh
    if (stateRef.current === STT_STATE.IDLE || stateRef.current === STT_STATE.ENDED) {
      log('Not paused, starting fresh');
      start();
    } else {
      log('Already active, ignoring resume');
    }
  }, [start]);

  const end = useCallback(() => {
    log('Ending recognition permanently');
    shouldRestartRef.current = false;
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        logError('End abort error:', e?.message);
      }
      recognitionRef.current = null;
    }
    isProcessingRef.current = false;
    lastFinalTranscriptRef.current = '';
    finalTranscriptBufferRef.current = '';
    setStateSafe(STT_STATE.ENDED);
  }, [setStateSafe]);

  const clearError = useCallback(() => {
    if (stateRef.current === STT_STATE.ERROR) {
      setStateSafe(STT_STATE.IDLE);
    }
  }, [setStateSafe]);

  return {
    state,
    isSupported,
    permissionState,
    isListening: state === STT_STATE.LISTENING || state === STT_STATE.USER_SPEAKING,
    isProcessing: isProcessingRef.current,
    start,
    stop,
    pause,
    resume,
    end,
    clearError,
    requestPermission,
  };
};

export { STT_STATE };