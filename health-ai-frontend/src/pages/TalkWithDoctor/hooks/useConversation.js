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
 * Orchestrates the entire voice-first doctor conversation:
 *
 *   user speaks → speech recognition → Groq/OpenAI backend → response → TTS → resume listening
 *
 * Exposes the conversation state (messages, status, controls) to the page so the
 * UI stays purely presentational.
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

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    isMicMutedRef.current = isMicMuted;
  }, [isMicMuted]);

  const addMessage = useCallback((role, text) => {
    const id = `${role}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    setMessages((prev) => [...prev, { id, role, text }]);
  }, []);

  // ------------------------------------------------------------------
  // Speech synthesis (doctor's voice)
  // ------------------------------------------------------------------
  const handleSpeechEnd = useCallback(() => {
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
  // Speech recognition (user's voice)
  // ------------------------------------------------------------------
  // `handleFinalResultRef` indirection avoids a temporal-dead-zone reference
  // between the recognition hook and the handler that uses `stopListening`.
  const {
    isListening,
    isSupported: sttSupported,
    startListening,
    stopListening,
  } = useSpeechRecognition({
    enabled: true,
    onFinalResult: (transcript) => handleFinalResultRef.current?.(transcript),
    onInterimResult: () => {
      // Used by the UI to show live transcription in future; not needed now.
    },
    onError: (message) => {
      setRecognitionError(message);
      setStatus('idle');
    },
  });

  const handleFinalResult = useCallback(
    async (transcript) => {
      // Guards: no processing if call ended, mic muted, or already processing.
      if (isEndedRef.current || isMicMutedRef.current || isProcessingRef.current) return;

      const normalized = transcript.replace(/\s+/g, ' ').trim();
      if (!normalized) return;

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

        addMessage('assistant', aiReply);

        if (ttsSupported) {
          setStatus('speaking');
          speak(aiReply);
        } else {
          resumeListeningRef.current?.();
        }
      } catch (error) {
        const message =
          error?.response?.data?.message ||
          'I could not reach the doctor right now. Please try again.';
        addMessage('assistant', message);
        resumeListeningRef.current?.();
      }
    },
    [addMessage, speak, stopListening, ttsSupported]
  );

  handleFinalResultRef.current = handleFinalResult;

  // Resume listening after the AI finishes speaking (unless muted/ended).
  const resumeListening = useCallback(() => {
    if (isEndedRef.current) return;
    isProcessingRef.current = false;

    if (isMicMutedRef.current) {
      setStatus('muted');
      return;
    }

    if (sttSupported) {
      startListening();
      setStatus('listening');
    } else {
      setStatus('idle');
    }
  }, [sttSupported, startListening]);

  resumeListeningRef.current = resumeListening;

  // ------------------------------------------------------------------
  // Public actions
  // ------------------------------------------------------------------
  const startConversation = useCallback(async () => {
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
      setStatus('listening');
      await startListening();
    }
  }, [isConversationStarted, sttSupported, ttsSupported, speak, startListening]);

  const toggleMic = useCallback(() => {
    if (isEndedRef.current) return;

    if (isMicMutedRef.current) {
      // Unmute
      setIsMicMuted(false);
      if (isSpeakingRef.current) {
        setStatus('speaking');
      } else {
        setStatus('listening');
        startListening();
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
    sttSupported,
    ttsSupported,
    recognitionError,
    startConversation,
    toggleMic,
    toggleChat,
    endCall,
    setStatus,
  };
};
