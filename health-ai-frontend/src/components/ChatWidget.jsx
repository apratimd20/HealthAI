// components/ui/ChatWidget.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';


import {
  IoChatbubbleEllipsesOutline,
  IoSendOutline,
  IoCloseOutline,
  IoFitnessOutline,
  IoSparklesOutline,
  IoInformationCircleOutline,
  IoAlertCircleOutline,
} from 'react-icons/io5';
import toast from 'react-hot-toast';
import { chatService } from '../services/chatServices';
import Card from './ui/Card';
import Button from './ui/Button';

export default function ChatWidget({ isOpen, onClose, userGoal }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef(null);

  // Load suggestions when chat opens
  useEffect(() => {
    if (isOpen && suggestions.length === 0) {
      fetchSuggestions();
    }
  }, [isOpen]);

  const fetchSuggestions = async () => {
    try {
      const response = await chatService.getSuggestions();
      if (response.success) {
        setSuggestions(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setIsStreaming(true);
    setStatusMessage('');

    try {
      let fullResponse = '';
      let assistantMessageId = null;
      let responseSource = 'openai';
      let responseNote = '';

      await chatService.sendMessageStream(
        input,
        // ✅ On status update
        (statusData) => {
          setStatusMessage(statusData.message);
        },
        // ✅ On chunk received
        (chunkData) => {
          if (!assistantMessageId) {
            // Create new assistant message
            const newMessage = {
              id: Date.now(),
              role: 'assistant',
              content: chunkData.chunk || chunkData,
              complete: false,
              timestamp: new Date().toISOString(),
              source: chunkData.source || 'openai',
              note: chunkData.note || '',
            };
            setMessages(prev => [...prev, newMessage]);
            assistantMessageId = newMessage.id;
          } else {
            // Update existing message
            setMessages(prev => {
              const lastIndex = prev.length - 1;
              if (lastIndex >= 0 && prev[lastIndex].id === assistantMessageId) {
                const updated = [...prev];
                updated[lastIndex] = {
                  ...updated[lastIndex],
                  content: updated[lastIndex].content + (chunkData.chunk || chunkData),
                };
                return updated;
              }
              return prev;
            });
          }
        },
        // ✅ On complete
        (completeData) => {
          fullResponse = completeData.message || completeData;
          responseSource = completeData.source || 'openai';
          responseNote = completeData.note || '';

          setMessages(prev => {
            const lastIndex = prev.length - 1;
            if (lastIndex >= 0 && prev[lastIndex].role === 'assistant') {
              const updated = [...prev];
              updated[lastIndex] = {
                ...updated[lastIndex],
                content: fullResponse,
                complete: true,
                source: responseSource,
                note: responseNote,
              };
              return updated;
            }
            return prev;
          });

          setIsStreaming(false);
          setLoading(false);
          setStatusMessage('');
        },
        // ✅ On error
        (errorData) => {
          const errorMsg = errorData.message || errorData || 'Something went wrong';
          setMessages(prev => [...prev, {
            id: Date.now(),
            role: 'assistant',
            content: `❌ ${errorMsg}`,
            complete: true,
            timestamp: new Date().toISOString(),
            isError: true,
          }]);
          setIsStreaming(false);
          setLoading(false);
          setStatusMessage('');
          toast.error(errorMsg);
        }
      );
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        id: Date.now(),
        role: 'assistant',
        content: '❌ Sorry, I encountered an error. Please try again.',
        complete: true,
        timestamp: new Date().toISOString(),
        isError: true,
      }]);
      setLoading(false);
      setIsStreaming(false);
      setStatusMessage('');
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
    setTimeout(handleSend, 100);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ✅ Render message with source indicator
  const renderMessage = (msg) => {
    const isUser = msg.role === 'user';
    const isError = msg.isError;
    const isFallback = msg.source === 'fallback';
    const isComplete = msg.complete !== false;

    return (
      <div
        key={msg.id || msg.timestamp}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
      >
        <div
          className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
            isUser
              ? 'bg-brand text-white'
              : isError
              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
              : 'bg-surface-muted text-fg'
          }`}
        >
          {/* ✅ Source indicator for fallback responses */}
          {!isUser && !isError && isFallback && (
            <div className="flex items-center gap-1 mb-1 text-xs text-amber-400">
              <IoAlertCircleOutline size={14} />
              <span>Offline Mode</span>
            </div>
          )}

          {/* ✅ Note for fallback responses */}
          {!isUser && !isError && msg.note && (
            <div className="flex items-center gap-1 mb-1 text-xs text-fg-subtle">
              <IoInformationCircleOutline size={14} />
              <span>{msg.note}</span>
            </div>
          )}

          <div className="whitespace-pre-wrap text-sm">{msg.content}</div>

          {/* ✅ Streaming indicator */}
          {!isUser && !isComplete && (
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-brand/50 ml-1"></span>
          )}
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-lg"
          >
            <Card className="glass-panel flex h-[600px] flex-col overflow-hidden" glow>
              {/* Header */}
              <div className="flex items-center gap-3 border-b border-white/10 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/20 text-brand">
                  <IoSparklesOutline size={22} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-fg">NutriAI Health Assistant</h3>
                  <p className="text-xs text-fg-muted">
                    {userGoal ? 'Personalized for your health goal' : 'Ask me anything about health'}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-md p-1 text-fg-muted hover:bg-surface-muted hover:text-fg"
                >
                  <IoCloseOutline size={24} />
                </button>
              </div>

              {/* ✅ Status Bar */}
              {statusMessage && (
                <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2 bg-brand/5">
                  <div className="h-2 w-2 rounded-full bg-brand animate-pulse"></div>
                  <span className="text-xs text-fg-muted">{statusMessage}</span>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <IoFitnessOutline size={48} className="text-brand/30" />
                    <p className="mt-4 text-sm text-fg-muted max-w-xs">
                      Ask me anything about your health, nutrition, or fitness goals!
                    </p>
                    {suggestions.length > 0 && (
                      <div className="mt-6 w-full space-y-2">
                        <p className="text-xs text-fg-subtle">Try asking:</p>
                        {suggestions.slice(0, 4).map((suggestion, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="w-full rounded-lg border border-border-default bg-surface-muted/50 px-4 py-2 text-sm text-fg-muted text-left transition hover:border-brand/30 hover:bg-surface-muted hover:text-fg"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  messages.map((msg) => renderMessage(msg))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-white/10 p-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask about health..."
                    className="flex-1 rounded-lg border border-border-default bg-surface-muted px-4 py-2.5 text-sm text-fg placeholder-fg-subtle focus:border-brand focus:outline-none disabled:opacity-50"
                    disabled={loading || isStreaming}
                  />
                  <Button
                    size="sm"
                    className="aspect-square"
                    onClick={handleSend}
                    disabled={loading || isStreaming || !input.trim()}
                  >
                    {isStreaming ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                    ) : (
                      <IoSendOutline size={18} />
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}