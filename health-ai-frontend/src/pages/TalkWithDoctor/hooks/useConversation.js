import { useCallback, useEffect, useRef, useState } from 'react';
import { doctorApi } from '../services/doctorApi';
import { useSpeechRecognition } from './useSpeechRecognition';
import { useSpeechSynthesis } from './useSpeechSynthesis';

const INITIAL_MESSAGE = {
  id: 'doctor-welcome',
  role: 'assistant',
  text: "Hello! I'm your AI Health Assistant. How are you feeling today?",
};

/**
 * Orchestrates the full AI Doctor conversation in BOTH modes:
 *
 *   Voice:  user speaks → speech recognition → backend → response → TTS → resume listening
 *   Text:   user types  → backend (same endpoint) → response shown & optionally spoken
 *
 * Both input modes share the same message history so the doctor stays
 * context-aware across the entire consultation.
 */
export const useConversation = () => {
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [status, setStatus] = useState('idle'); // idle | listening | thinking | speaking | muted | ended
  const [isConversationStarted, setIsConversationStarted] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [recognitionError, setRecognitionError] = useState(null);

  // Refs to read fresh values inside async callbacks.
  const isEndedRef = useRef(false);
  const isMicMutedRef = useRef(false);
  const isProcessingRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const greetingSpokenRef = useRef(false);
  const messagesRef = useRef(messages);
  const resumeListeningRef = useRef(null);
  const handleFinalResultRef = useRef(null);
  const handleUserMessageRef = useRef(null);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    isMicMutedRef.current = isMicMuted;
  }, [isMicMuted]);

  const addMessage = useCallback((role, text) => {
    const id = `${role}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    setMessages((prev) => [
      ...prev,
      { id, role, text, timestamp: new Date().toISOString() },
    ]);
  }, []);

  // ------------------------------------------------------------------
  // Speech synthesis (doctor's voice)
  // ------------------------------------------------------------------
  const handleSpeechEnd = useCallback(() => {
    console.log('[CONV] handleSpeechEnd → resumeListening');
    isSpeakingRef.current = false;
    resumeListeningRef.current?.();
  }, []);

  const {
    isSpeaking,
    speak,
    stop: stopSpeaking,
    isSupported: ttsSupported,
  } = useSpeechSynthesis({ onEnd: handleSpeechEnd });

  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  // ------------------------------------------------------------------
  // Speech recognition (user's voice) — FIRST so sttSupported is available
  // ------------------------------------------------------------------
  const {
    isListening,
    isSupported: sttSupported,
    startListening,
    stopListening,
  } = useSpeechRecognition({
    enabled: true,
    onFinalResult: (transcript) => {
      console.log('[CONV] onFinalResult:', transcript);
      handleFinalResultRef.current?.(transcript);
    },
    onInterimResult: () => {},
    onError: (message) => {
      console.log('[CONV] STT error:', message);
      setRecognitionError(message);
      setStatus('idle');
    },
  });

  // ------------------------------------------------------------------
  // Shared message pipeline (voice + text)
  // ------------------------------------------------------------------
  const handleUserMessage = useCallback(
    async (input, { isVoice = false } = {}) => {
      console.log('[CONV] handleUserMessage', { input, isVoice });
      if (isEndedRef.current) return;
      if (isProcessingRef.current) return;
      if (isVoice && isMicMutedRef.current) return;

      const normalized = input.replace(/\s+/g, ' ').trim();
      if (!normalized) return;

      setIsConversationStarted(true);
      isProcessingRef.current = true;
      stopListening();
      setStatus('thinking');
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

        console.log('[CONV] AI reply:', aiReply);
        addMessage('assistant', aiReply);

        if (ttsSupported && !isMicMutedRef.current) {
          setStatus('speaking');
          speak(aiReply);
        } else {
          resumeListeningRef.current?.();
        }
      } catch (error) {
        const message =
          error?.response?.data?.message ||
          'I could not reach the doctor right now. Please try again.';
        console.log('[CONV] API error:', error?.message);
        addMessage('assistant', message);
        resumeListeningRef.current?.();
      }
    },
    [addMessage, speak, stopListening, ttsSupported]
  );

  handleUserMessageRef.current = handleUserMessage;

  const handleFinalResult = useCallback(
    (transcript) => {
      handleUserMessageRef.current?.(transcript, { isVoice: true });
    },
    []
  );

  handleFinalResultRef.current = handleFinalResult;

  // Resume listening after the AI finishes speaking (unless muted/ended).
  const resumeListening = useCallback(async () => {
    console.log('[CONV] resumeListening');
    if (isEndedRef.current) return;
    isProcessingRef.current = false;

    if (isMicMutedRef.current) {
      setStatus('muted');
      return;
    }

    if (sttSupported) {
      const started = await startListening();
      console.log('[CONV] resumeListening started:', started);
      if (started) setStatus('listening');
      else setStatus('idle');
    } else {
      setStatus('idle');
    }
  }, [sttSupported, startListening]);

  resumeListeningRef.current = resumeListening;

  // ------------------------------------------------------------------
  // Public actions
  // ------------------------------------------------------------------
  const startConversation = useCallback(async () => {
    console.log('[CONV] startConversation');
    if (isConversationStarted) return;
    setIsConversationStarted(true);

    if (!sttSupported) {
      setRecognitionError('Speech recognition is not supported in this browser.');
      setStatus('idle');
      return;
    }

    // Greet the user aloud first, then begin listening when the greeting ends.
    if (!greetingSpokenRef.current && ttsSupported) {
      greetingSpokenRef.current = true;
      setStatus('speaking');
      speak(INITIAL_MESSAGE.text);
    } else {
      const started = await startListening();
      console.log('[CONV] startConversation direct startListening:', started);
      if (started) setStatus('listening');
      else setStatus('idle');
    }
  }, [isConversationStarted, sttSupported, ttsSupported, speak, startListening]);

  const sendTextMessage = useCallback(
    (text) => {
      console.log('[CONV] sendTextMessage:', text);
      if (isEndedRef.current || isProcessingRef.current) return;
      handleUserMessageRef.current?.(text, { isVoice: false });
    },
    []
  );

  const toggleMic = useCallback(async () => {
    console.log('[CONV] toggleMic, isMicMuted:', isMicMuted);
    if (isEndedRef.current) return;

    if (isMicMutedRef.current) {
      // Unmute
      setIsMicMuted(false);
      if (isSpeakingRef.current) {
        setStatus('speaking');
      } else {
        const started = await startListening();
        console.log('[CONV] unmute startListening:', started);
        if (started) setStatus('listening');
        else setStatus('idle');
      }
    } else {
      // Mute
      setIsMicMuted(true);
      stopListening();
      stopSpeaking();
      setStatus('muted');
    }
  }, [startListening, stopListening, stopSpeaking]);

  const toggleChat = useCallback(() => {
    setIsChatOpen((prev) => !prev);
  }, []);

  const endCall = useCallback(() => {
    console.log('[CONV] endCall');
    isEndedRef.current = true;
    isProcessingRef.current = false;
    greetingSpokenRef.current = false;
    stopListening();
    stopSpeaking();
    setIsMicMuted(false);
    setIsConversationStarted(false);
    setIsChatOpen(false);
    setStatus('ended');
    setMessages([INITIAL_MESSAGE]);
  }, [stopListening, stopSpeaking]);

  return {
    messages,
    status,
    isConversationStarted,
    isMicMuted,
    isChatOpen,
    isListening,
    isSpeaking,
    isThinking: status === 'thinking',
    sttSupported,
    ttsSupported,
    recognitionError,
    startConversation,
    sendTextMessage,
    toggleMic,
    toggleChat,
    endCall,
    setStatus,
  };
};