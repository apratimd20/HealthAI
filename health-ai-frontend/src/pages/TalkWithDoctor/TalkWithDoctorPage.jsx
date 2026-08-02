import React, { useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useConversation } from './hooks/useConversation';
import DoctorHeader from './components/DoctorHeader';
import DoctorAvatar from './components/DoctorAvatar';
import ConversationStatus from './components/ConversationStatus';
import SpeechPlayer from './components/SpeechPlayer';
import CallControls from './components/CallControls';
import ChatDrawer from './components/ChatDrawer';
import Button from '../../components/ui/Button';

/**
 * Talk with AI Doctor — Phase 2.
 * A full-screen, video-call style voice consultation with an animated AI doctor.
 *
 * This page is deliberately rendered without DashboardLayout so it feels like a
 * real call. Ending the call returns the user to the dashboard.
 */
const TalkWithDoctorPage = () => {
  const navigate = useNavigate();

  const {
    messages,
    status,
    isConversationStarted,
    isMicMuted,
    isChatOpen,
    isListening,
    isSpeaking,
    sttSupported,
    recognitionError,
    startConversation,
    toggleMic,
    toggleChat,
    endCall,
  } = useConversation();

  // Surface recognition errors (permission, unsupported, network) as toasts.
  useEffect(() => {
    if (recognitionError) {
      toast.error(recognitionError);
    }
  }, [recognitionError]);

  const handleEndCall = useCallback(() => {
    endCall();
    navigate('/dashboard');
  }, [endCall, navigate]);

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-slate-950">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-emerald-500/15 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-sky-500/10 blur-[100px]" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-teal-500/10 blur-[100px]" />
      </div>

      {/* Top bar */}
      <DoctorHeader onEndCall={handleEndCall} />

      {/* Main stage */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pb-28 pt-2">
        {/* Avatar stage */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative w-full max-w-[460px]"
        >
          {/* Avatar */}
          <div className="relative h-[46vh] min-h-[320px] max-h-[520px] w-full">
            <DoctorAvatar status={status} isSpeaking={isSpeaking && !isMicMuted} />
          </div>

          {/* Doctor name + speech equalizer */}
          <div className="mt-4 flex flex-col items-center gap-2">
            <h2 className="text-2xl font-extrabold tracking-tight text-white">AI Doctor</h2>
            <p className="text-sm text-slate-400">Your virtual health assistant</p>
            <div className="mt-1 flex items-center gap-2">
              <SpeechPlayer isSpeaking={isSpeaking} isMuted={isMicMuted} />
            </div>
          </div>
        </motion.div>

        {/* Status indicator */}
        <div className="mt-5">
          <ConversationStatus status={status} />
        </div>

        {/* Start overlay */}
        {!isConversationStarted && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 flex flex-col items-center gap-4"
          >
            <p className="text-sm text-slate-400">
              {sttSupported
                ? 'Start a private, hands-free voice consultation with the AI doctor.'
                : 'Voice is not supported in this browser. Enable microphone access in Chrome/Edge.'}
            </p>
            <Button
              onClick={startConversation}
              size="lg"
              className="px-8 shadow-[0_0_40px_rgba(16,185,129,0.35)]"
            >
              Start Call
            </Button>
          </motion.div>
        )}
      </main>

      {/* Bottom floating controls */}
      <CallControls
        isMicMuted={isMicMuted}
        isListening={isListening}
        isChatOpen={isChatOpen}
        onToggleMic={toggleMic}
        onToggleChat={toggleChat}
        onEndCall={handleEndCall}
      />

      {/* Right chat drawer */}
      <ChatDrawer
        isOpen={isChatOpen}
        onClose={toggleChat}
        messages={messages}
      />
    </div>
  );
};

export default TalkWithDoctorPage;
