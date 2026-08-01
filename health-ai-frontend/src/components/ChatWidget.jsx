// components/ui/ChatWidget.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IoSendOutline,
  IoCloseOutline,
  IoFitnessOutline,
  IoSparklesOutline,
} from 'react-icons/io5';
import toast from 'react-hot-toast';
import { chatService } from '../services/chatServices'; 
import Card from './ui/Card';
import Button from './ui/Button';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ChatWidget({ isOpen, onClose, userGoal }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [hasInitialSuggestions, setHasInitialSuggestions] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Load suggestions when chat opens
  useEffect(() => {
    if (isOpen) {
      if (suggestions.length === 0 && !hasInitialSuggestions) {
        fetchSuggestions();
      }
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  const fetchSuggestions = async () => {
    try {
      const response = await chatService.getSuggestions();
      if (response.success && response.data) {
        setSuggestions(response.data);
        setHasInitialSuggestions(true);
      } else {
        setSuggestions([
          "What's the best diet for weight loss?",
          "How much water should I drink daily?",
          "Give me a healthy breakfast recipe",
          "What are the best exercises for beginners?",
        ]);
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
      setSuggestions([
        "What's the best diet for weight loss?",
        "How much water should I drink daily?",
        "Give me a healthy breakfast recipe",
        "What are the best exercises for beginners?",
      ]);
    }
  };

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // ✅ Send message function (used for both input and suggestions)
  const sendMessage = async (messageText) => {
    if (!messageText.trim() || loading || isStreaming) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: messageText.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setIsStreaming(true);
    setStatusMessage('');

    // Build conversation history from previous messages
    const history = messages
      .filter(m => m.role !== 'system')
      .slice(-10)
      .map(m => ({ role: m.role, content: m.content }));

    try {
      let assistantMessageId = null;

      await chatService.sendMessageStream(
        messageText.trim(),
        history,
        (statusData) => {
          const msg = statusData.message || statusData;
          setStatusMessage(msg);
        },
        (chunkData) => {
          const chunk = chunkData.chunk || chunkData;
          
          if (!assistantMessageId) {
            const newMessage = {
              id: Date.now(),
              role: 'assistant',
              content: chunk || '',
              complete: false,
              timestamp: new Date().toISOString(),
              source: chunkData.source || 'openai',
              note: chunkData.note || '',
            };
            setMessages(prev => [...prev, newMessage]);
            assistantMessageId = newMessage.id;
            setIsTyping(true);
          } else {
            setMessages(prev => {
              const lastIndex = prev.length - 1;
              if (lastIndex >= 0 && prev[lastIndex].id === assistantMessageId) {
                const updated = [...prev];
                const currentContent = updated[lastIndex].content || '';
                updated[lastIndex] = {
                  ...updated[lastIndex],
                  content: currentContent + chunk,
                };
                return updated;
              }
              return prev;
            });
          }
        },
        (completeData) => {
          const fullMsg = completeData.message || completeData;
          const responseSource = completeData.source || 'openai';
          const responseNote = completeData.note || '';
          
          setIsTyping(false);

          setMessages(prev => {
            const lastIndex = prev.length - 1;
            if (lastIndex >= 0 && prev[lastIndex].role === 'assistant') {
              const updated = [...prev];
              updated[lastIndex] = {
                ...updated[lastIndex],
                content: fullMsg || updated[lastIndex].content,
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
        (errorData) => {
          const errorMsg = errorData.message || errorData || 'Something went wrong';
          
          setIsTyping(false);

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
      
      setIsTyping(false);

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
      toast.error('Failed to get response. Please try again.');
    }
  };

  // ✅ Handle send from input
  const handleSend = async () => {
    await sendMessage(input);
  };

  // ✅ Handle suggestion click - sends immediately
  const handleSuggestionClick = async (suggestion) => {
    await sendMessage(suggestion);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ✅ Render message with markdown support
  const renderMessage = (msg) => {
    const isUser = msg.role === 'user';
    const isError = msg.isError;
    const isComplete = msg.complete !== false;

    return (
      <motion.div
        key={msg.id || msg.timestamp}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
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
          {isUser ? (
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {msg.content}
            </div>
          ) : !isComplete ? (
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {msg.content}
              {isTyping && <span className="inline-block ml-0.5 animate-pulse">▌</span>}
            </div>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({node, ...props}) => <h1 className="text-lg font-bold mt-2 mb-1" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-base font-bold mt-2 mb-1" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-sm font-bold mt-2 mb-1" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc pl-4 my-1 space-y-0.5" {...props} />,
                  ol: ({node, ...props}) => <ol className="list-decimal pl-4 my-1 space-y-0.5" {...props} />,
                  li: ({node, ...props}) => <li className="text-sm leading-relaxed" {...props} />,
                  p: ({node, ...props}) => <p className="text-sm leading-relaxed my-1" {...props} />,
                  strong: ({node, ...props}) => <strong className="font-semibold" {...props} />,
                  em: ({node, ...props}) => <em className="italic" {...props} />,
                  code: ({node, ...props}) => <code className="bg-white/10 rounded px-1 py-0.5 text-xs" {...props} />,
                  blockquote: ({node, ...props}) => <blockquote className="border-l-2 border-brand/30 pl-3 my-1 text-fg-muted" {...props} />,
                }}
              >
                {msg.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ 
              type: 'spring', 
              damping: 25,
              stiffness: 300,
              duration: 0.2
            }}
            className="w-full max-w-lg"
          >
            <Card className="glass-panel flex h-[600px] flex-col overflow-hidden border-brand/10 shadow-2xl" glow>
              {/* Header */}
              <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3 bg-brand/5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/20 text-brand">
                  <IoSparklesOutline size={22} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-fg">NutriAI Health Assistant</h3>
                  <p className="text-xs text-fg-muted">
                    {userGoal ? '✨ Personalized for your health goal' : '💪 Your health companion'}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-md p-1.5 text-fg-muted hover:bg-surface-muted hover:text-fg transition-colors"
                >
                  <IoCloseOutline size={22} />
                </button>
              </div>

              {/* Status Bar */}
              {statusMessage && (
                <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2 bg-brand/5">
                  <div className="h-2 w-2 rounded-full bg-brand animate-pulse"></div>
                  <span className="text-xs text-fg-muted">{statusMessage}</span>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center p-4">
                    <div className="mb-4 rounded-full bg-brand/10 p-4">
                      <IoFitnessOutline size={40} className="text-brand" />
                    </div>
                    <h4 className="text-lg font-bold text-fg">Hello! 👋</h4>
                    <p className="mt-1 text-sm text-fg-muted max-w-xs">
                      Ask me anything about your health, nutrition, or fitness goals!
                    </p>
                    {suggestions.length > 0 && (
                      <div className="mt-6 w-full space-y-2">
                        <p className="text-xs text-fg-subtle mb-2">💡 Try asking:</p>
                        {suggestions.slice(0, 4).map((suggestion, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="w-full rounded-lg border border-border-default bg-surface-muted/50 px-4 py-2.5 text-sm text-fg-muted text-left transition hover:border-brand/30 hover:bg-surface-muted hover:text-fg"
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
              <div className="border-t border-white/10 p-4 bg-surface-muted/30">
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask about health..."
                    className="flex-1 rounded-xl border border-border-default bg-surface-muted px-4 py-3 text-sm text-fg placeholder-fg-subtle focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/20 disabled:opacity-50 transition-all"
                    disabled={loading || isStreaming}
                  />
                  <Button
                    size="sm"
                    className="aspect-square rounded-xl"
                    onClick={handleSend}
                    disabled={loading || isStreaming || !input.trim()}
                  >
                    {isStreaming || loading ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                    ) : (
                      <IoSendOutline size={18} />
                    )}
                  </Button>
                </div>
                <p className="mt-1.5 text-[10px] text-fg-subtle text-center">
                  Powered by {userGoal ? 'personalized AI' : 'NutriAI'} • Responses are for informational purposes only
                </p>
              </div>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}