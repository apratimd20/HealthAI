import React, { useEffect, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useConversation } from './hooks/useConversation';
import { useMicTest } from './hooks/useMicTest';
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
  const [showMicTest, setShowMicTest] = useState(false);

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

  const { isTesting, audioLevel, error: micTestError, startTest, stopTest } = useMicTest();

  useEffect(() => {
    if (recognitionError) {
      toast.error(recognitionError);
    }
  }, [recognitionError]);

  const handleEndCall = useCallback(() => {
    endCall();
    navigate('/dashboard');
  }, [endCall, navigate]);

  // Render mic test panel
  const renderMicTest = () => {
    if (isConversationStarted) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
        className="absolute bottom-0 left-1/2 -translate-x-1/2 z-20 mb-20 w-full max-w-md px-4"
      >
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 shadow-xl">
          <h3 className="text-center text-lg font-semibold text-slate-100 mb-4">Microphone Test</h3>
          <p className="text-center text-sm text-slate-400 mb-4">
            Verify your microphone is working before starting the call
          </p>

          {isTesting ? (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-emerald-400 mb-2">{audioLevel}</div>
                <div className="text-sm text-slate-400">Input Level</div>
              </div>
              <div className="h-4 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full"
                  animate={{ width: `${audioLevel}%` }}
                  transition={{ duration: 0.1, ease: 'easeOut' }}
                />
              </div>
              <p className="text-center text-xs text-slate-500">
                Speak into your microphone — the bar should move
              </p>
              <Button onClick={stopTest} variant="secondary" className="w-full">
                Stop Test
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <Button onClick={startTest} size="lg" className="w-full" disabled={!sttSupported}>
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                Test Microphone
              </Button>
              {!sttSupported && (
                <p className="text-center text-xs text-red-400">
                  Speech recognition not supported in this browser
                </p>
              )}
            </div>
          )}

          {micTestError && (
            <div className="text-center text-sm text-red-400 bg-red-900/20 border border-red-500/30 rounded-lg p-3">
              Error: {micTestError}
            </div>
          )}
        </div>
      </motion.div>
    );
  };

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

          <div>
           {/* Mic Test Panel */}
          {/* {renderMicTest()} */}

          </div>

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