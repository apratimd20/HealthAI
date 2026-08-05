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
 * Talk with AI Doctor — full-screen, video-call style consultation.
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
    isThinking,
    sttSupported,
    recognitionError,
    startConversation,
    sendTextMessage,
    toggleMic,
    toggleChat,
    endCall,
  } = useConversation();

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
    <div className="relative flex h-dvh flex-col overflow-hidden bg-slate-950 pb-[env(safe-area-inset-bottom)]">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-emerald-500/15 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-sky-500/10 blur-[100px]" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-teal-500/10 blur-[100px]" />
      </div>

      {/* Top bar */}
      <DoctorHeader onEndCall={handleEndCall} />

      {/* Main stage — moved up */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center overflow-hidden px-4 pt-2">
        {/* Avatar stage — centered higher */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative w-full max-w-[400px] sm:max-w-[460px] lg:max-w-[520px] flex-1 flex flex-col justify-center"
        >
          {/* Avatar */}
          <div className="relative h-[50dvh] min-h-[340px] max-h-[520px] w-full lg:max-h-[600px]">
            <DoctorAvatar status={status} isSpeaking={isSpeaking && !isMicMuted} />
          </div>

          {/* Start button OVER the avatar (z-20) */}
          {!isConversationStarted && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className="absolute bottom-0 left-1/2 -translate-x-1/2 z-20 mb-4"
            >
              <Button
                onClick={startConversation}
                size="lg"
                className="px-8 shadow-[0_0_40px_rgba(16,185,129,0.45),0_10px_30px_rgba(0,0,0,0.5)]"
              >
                Start Call
              </Button>
            </motion.div>
          )}

          {/* Voice/listening status + equalizer — only when active */}
          {isConversationStarted && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex flex-col items-center gap-2"
            >
              <ConversationStatus status={status} />
              {(isSpeaking || isListening) && !isMicMuted && (
                <SpeechPlayer isSpeaking={isSpeaking} isMuted={isMicMuted} />
              )}
            </motion.div>
          )}
        </motion.div>
      </main>

      {/* Bottom floating controls — moved up */}
      {isConversationStarted && (
        <div className="mb-4">
          <CallControls
            isMicMuted={isMicMuted}
            isListening={isListening}
            isChatOpen={isChatOpen}
            onToggleMic={toggleMic}
            onToggleChat={toggleChat}
            onEndCall={handleEndCall}
          />
        </div>
      )}

      {/* Right chat drawer */}
      <ChatDrawer
        isOpen={isChatOpen}
        onClose={toggleChat}
        messages={messages}
        onSendMessage={sendTextMessage}
        isThinking={isThinking}
      />
    </div>
  );
};

export default TalkWithDoctorPage;