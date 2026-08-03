import { useCallback, useEffect, useRef, useState } from 'react';
import { doctorApi } from '../services/doctorApi';
import { useSpeechRecognition, STT_STATE } from './useSpeechRecognition';
import { useSpeechSynthesis } from './useSpeechSynthesis';

// ==========================================
// Conversation State Machine
// ==========================================
const CONV_STATE = {
  IDLE: 'idle',
  STARTING: 'starting',
  AI_GREETING: 'ai-greeting',
  LISTENING: 'listening',
  USER_SPEAKING: 'user-speaking',
  THINKING: 'thinking',
  AI_SPEAKING: 'ai-speaking',
  MUTED: 'muted',
  ENDED: 'ended',
  ERROR: 'error',
};

const INITIAL_MESSAGE = {
  id: 'doctor-welcome',
  role: 'assistant',
  text: "Hello! I'm your AI Health Assistant. How are you feeling today?",
  timestamp: new Date().toISOString(),
};

function log(...args) {
  console.log('[Conv]', new Date().toISOString(), ...args);
}

function logError(...args) {
  console.error('[Conv]', new Date().toISOString(), ...args);
}

export const useConversation = () => {
  // ==========================================
  // State
  // ==========================================
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [state, setState] = useState(CONV_STATE.IDLE);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [recognitionError, setRecognitionError] = useState(null);

// Refs for mutable state
  const stateRef = useRef(CONV_STATE.IDLE);
  const isEndedRef = useRef(false);
  const isProcessingRef = useRef(false);
  const greetingPlayedRef = useRef(false);
  const messagesRef = useRef(messages);

  // Keep messages ref fresh
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const setStateSafe = useCallback((newState) => {
    if (stateRef.current === newState) return;
    log('State transition:', stateRef.current, '→', newState);
    stateRef.current = newState;
    setState(newState);
  }, []);

  // ==========================================
  // Speech Recognition (STT) — FIRST so resumeListening is available
  // ==========================================
  const handleFinalResult = useCallback((transcript) => {
    log('Final transcript received:', transcript);
    if (!isEndedRef.current && !isProcessingRef.current) {
      processUserMessage(transcript, true);
    }
  }, []);

  const handleRecognitionError = useCallback((message) => {
    logError('Recognition error:', message);
    setRecognitionError(message);
    if (stateRef.current !== CONV_STATE.ENDED) {
      setStateSafe(CONV_STATE.ERROR);
    }
  }, [setStateSafe]);

  const handleSttStateChange = useCallback((sttState) => {
    log('STT state change:', sttState);
    if (sttState === STT_STATE.USER_SPEAKING && stateRef.current === CONV_STATE.LISTENING) {
      setStateSafe(CONV_STATE.USER_SPEAKING);
    } else if (sttState === STT_STATE.LISTENING && stateRef.current === CONV_STATE.USER_SPEAKING) {
      setStateSafe(CONV_STATE.LISTENING);
    } else if (sttState === STT_STATE.ERROR) {
      setStateSafe(CONV_STATE.ERROR);
    }
    // NOTE: Ignore STT IDLE during active conversation — those are brief auto-restarts
    // after no-speech. Conversation stays in LISTENING/USER_SPEAKING visually.
  }, [setStateSafe]);

  const {
    state: sttState,
    isSupported: sttSupported,
    permissionState,
    start: startListening,
    stop: stopListening,
    pause: pauseListening,
    resume: resumeListening,
    end: endListening,
    clearError: clearSttError,
  } = useSpeechRecognition({
    enabled: true,
    onFinalResult: handleFinalResult,
    onInterimResult: () => {},
    onError: handleRecognitionError,
    onStateChange: handleSttStateChange,
  });

  // ==========================================
  // Speech Synthesis (TTS) — SECOND, uses resumeListening from STT
  // ==========================================
  const handleSpeechEnd = useCallback(() => {
    log('TTS finished → resuming recognition');
    if (!isEndedRef.current && !isMicMuted) {
      setStateSafe(CONV_STATE.LISTENING);
      resumeListening();
    }
  }, [isEndedRef, isMicMuted, setStateSafe, resumeListening]);

  const {
    isSpeaking: isTtsSpeaking,
    speak,
    stop: stopSpeaking,
    isSupported: ttsSupported,
  } = useSpeechSynthesis({ onEnd: handleSpeechEnd });

  // ==========================================
  // Shared Message Pipeline (Voice + Text)
  // ==========================================
  const addMessage = useCallback((role, text) => {
    const id = `${role}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const message = { id, role, text, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, message]);
    return message;
  }, []);

  const processUserMessage = useCallback(async (input, isVoice) => {
    if (isEndedRef.current) return;
    if (isProcessingRef.current) return;
    if (isVoice && isMicMuted) return;

    const normalized = input.replace(/\s+/g, ' ').trim();
    if (!normalized) return;

    log('Processing user message:', { input: normalized, isVoice });

    isProcessingRef.current = true;
    setStateSafe(CONV_STATE.THINKING);
    addMessage('user', normalized);

    try {
      const history = messagesRef.current
        .filter((m) => m.text)
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.text }));

      const result = await doctorApi.sendDoctorMessage(normalized, history);
      const aiReply =
        result?.data?.message ||
        result?.message ||
        'I am here to help. Tell me more about what you are experiencing.';

      log('AI reply:', aiReply);
      addMessage('assistant', aiReply);

      if (ttsSupported && !isMicMuted) {
        pauseListening();
        setStateSafe(CONV_STATE.AI_SPEAKING);
        speak(aiReply);
      } else {
        setStateSafe(CONV_STATE.LISTENING);
      }
    } catch (error) {
      logError('API error:', error?.message);
      const message =
        error?.response?.data?.message ||
        'I could not reach the doctor right now. Please try again.';
      addMessage('assistant', message);
      if (!isEndedRef.current) {
        setStateSafe(CONV_STATE.LISTENING);
      }
    } finally {
      isProcessingRef.current = false;
    }
  }, [isMicMuted, pauseListening, ttsSupported, speak, addMessage, setStateSafe]);

  // ==========================================
  // Public Actions
  // ==========================================

  const startConversation = useCallback(async () => {
    log('startConversation');
    if (stateRef.current !== CONV_STATE.IDLE && stateRef.current !== CONV_STATE.ENDED) return;

    isEndedRef.current = false;
    isProcessingRef.current = false;
    greetingPlayedRef.current = false;
    setIsMicMuted(false);
    setIsChatOpen(false);
    setRecognitionError(null);
    clearSttError();

    if (!sttSupported) {
      setRecognitionError('Speech recognition is not supported in this browser.');
      setStateSafe(CONV_STATE.ERROR);
      return;
    }

    setStateSafe(CONV_STATE.STARTING);

    if (!greetingPlayedRef.current && ttsSupported) {
      greetingPlayedRef.current = true;
      setStateSafe(CONV_STATE.AI_GREETING);
      // DON'T pauseListening() here — STT hasn't started yet.
      // The pause/resume logic in useSpeechRecognition handles TTS coordination.
      speak(INITIAL_MESSAGE.text);
      // TTS onEnd will call handleSpeechEnd → resumeListening() → startListening()
    } else {
      setStateSafe(CONV_STATE.LISTENING);
      await startListening();
    }
  }, [sttSupported, ttsSupported, speak, startListening, clearSttError, setStateSafe]);

  const sendTextMessage = useCallback((text) => {
    log('sendTextMessage:', text);
    if (isEndedRef.current || isProcessingRef.current) return;
    processUserMessage(text, false);
  }, [processUserMessage]);

  const toggleMic = useCallback(async () => {
    log('toggleMic, current mute:', isMicMuted);
    if (isEndedRef.current) return;

    if (isMicMuted) {
      setIsMicMuted(false);
      if (isTtsSpeaking) {
        setStateSafe(CONV_STATE.AI_SPEAKING);
      } else if (!isEndedRef.current) {
        setStateSafe(CONV_STATE.LISTENING);
        await startListening();
      }
    } else {
      setIsMicMuted(true);
      stopListening();
      stopSpeaking();
      setStateSafe(CONV_STATE.MUTED);
    }
  }, [isMicMuted, isTtsSpeaking, startListening, stopListening, stopSpeaking, setStateSafe]);

  const toggleChat = useCallback(() => {
    setIsChatOpen((prev) => !prev);
  }, []);

  const endCall = useCallback(() => {
    log('endCall');
    isEndedRef.current = true;
    isProcessingRef.current = false;
    greetingPlayedRef.current = false;
    stopListening();
    stopSpeaking();
    endListening();
    setIsMicMuted(false);
    setIsChatOpen(false);
    setRecognitionError(null);
    setMessages([INITIAL_MESSAGE]);
    setStateSafe(CONV_STATE.ENDED);
  }, [stopListening, stopSpeaking, endListening, setStateSafe]);

  // ==========================================
  // Derived State
  // ==========================================
  const isListening = state === CONV_STATE.LISTENING || state === CONV_STATE.USER_SPEAKING;
  const isThinking = state === CONV_STATE.THINKING;
  const isSpeaking = state === CONV_STATE.AI_SPEAKING || state === CONV_STATE.AI_GREETING;

  return {
    messages,
    state,
    isConversationStarted: state !== CONV_STATE.IDLE && state !== CONV_STATE.ENDED,
    isMicMuted,
    isChatOpen,
    isListening,
    isSpeaking,
    isThinking,
    sttSupported,
    ttsSupported,
    sttPermissionState: permissionState,
    sttState,
    recognitionError,
    startConversation,
    sendTextMessage,
    toggleMic,
    toggleChat,
    endCall,
    setState: setStateSafe,
  };
};

export { CONV_STATE, INITIAL_MESSAGE };