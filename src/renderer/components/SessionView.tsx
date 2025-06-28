import React, { useState, useEffect, useRef } from 'react';
import { MessageList } from './MessageList';
import { PromptInput } from './PromptInput';
import { Message, ClaudeSession } from '@shared/types';

interface SessionViewProps {
  sessionId: string;
  onRefreshSessions: () => void;
}

export function SessionView({ sessionId, onRefreshSessions }: SessionViewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<ClaudeSession | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
    const unsubscribeMessage = subscribeToMessages();
    const unsubscribeError = subscribeToErrors();
    const unsubscribeComplete = subscribeToComplete();

    return () => {
      unsubscribeMessage();
      unsubscribeError();
      unsubscribeComplete();
    };
  }, [sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    const sessionMessages = await window.claudeAPI.getSessionMessages(sessionId);
    setMessages(sessionMessages);
    
    // Get session info from the sessions list
    const sessions = await window.claudeAPI.getSessions();
    const info = sessions.find(s => s.id === sessionId);
    setSessionInfo(info || null);
  };

  const subscribeToMessages = () => {
    console.log('Subscribing to messages for session:', sessionId);
    let currentTextMessageIndex: number | null = null;
    let currentThinkingMessageIndex: number | null = null;
    
    return window.claudeAPI.onSessionMessage(sessionId, (message) => {
      console.log('Received message:', message);
      
      switch (message.type) {
        case 'user':
          // Add user message
          setMessages(prev => [...prev, message]);
          setIsLoading(true);
          currentTextMessageIndex = null;
          currentThinkingMessageIndex = null;
          break;
          
        case 'text':
          // Handle streaming text with accumulation
          setMessages(prev => {
            const newMessages = [...prev];
            
            // Check if we're continuing a stream or starting a new one
            if (currentTextMessageIndex !== null && 
                currentTextMessageIndex < newMessages.length && 
                newMessages[currentTextMessageIndex].type === 'text' &&
                newMessages[currentTextMessageIndex].isStreaming) {
              // Update existing streaming message
              const existingMessage = newMessages[currentTextMessageIndex];
              newMessages[currentTextMessageIndex] = {
                ...existingMessage,
                accumulatedText: (existingMessage.accumulatedText || '') + (message.text || ''),
                timestamp: message.timestamp,
                isStreaming: message.isStreaming !== false
              };
            } else {
              // Start new text message
              currentTextMessageIndex = newMessages.length;
              newMessages.push({
                ...message,
                accumulatedText: message.text || '',
                isStreaming: message.isStreaming !== false
              });
            }
            
            return newMessages;
          });
          break;
          
        case 'thinking':
          // Handle streaming thinking with accumulation
          setMessages(prev => {
            const newMessages = [...prev];
            
            // Check if we're continuing a stream or starting a new one
            if (currentThinkingMessageIndex !== null && 
                currentThinkingMessageIndex < newMessages.length && 
                newMessages[currentThinkingMessageIndex].type === 'thinking' &&
                newMessages[currentThinkingMessageIndex].isStreaming) {
              // Update existing streaming message
              const existingMessage = newMessages[currentThinkingMessageIndex];
              newMessages[currentThinkingMessageIndex] = {
                ...existingMessage,
                accumulatedThinking: (existingMessage.accumulatedThinking || '') + (message.thinking || ''),
                timestamp: message.timestamp,
                isStreaming: message.isStreaming !== false
              };
            } else {
              // Start new thinking message
              currentThinkingMessageIndex = newMessages.length;
              newMessages.push({
                ...message,
                accumulatedThinking: message.thinking || '',
                isStreaming: message.isStreaming !== false
              });
            }
            
            return newMessages;
          });
          break;
          
        case 'tool_use':
        case 'tool_result':
        case 'system':
        case 'usage':
        case 'error':
          // Reset streaming indices for new messages
          if (message.type === 'tool_use' || message.type === 'system') {
            currentTextMessageIndex = null;
            currentThinkingMessageIndex = null;
          }
          setMessages(prev => [...prev, message]);
          break;
          
        default:
          setMessages(prev => [...prev, message]);
      }
    });
  };

  const subscribeToErrors = () => {
    console.log('Subscribing to errors for session:', sessionId);
    return window.claudeAPI.onSessionError(sessionId, (error) => {
      console.error('Session error:', error);
      setIsLoading(false);
    });
  };

  const subscribeToComplete = () => {
    console.log('Subscribing to complete for session:', sessionId);
    return window.claudeAPI.onSessionComplete(sessionId, (result) => {
      console.log('Session complete:', result);
      setIsLoading(false);
      onRefreshSessions();
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendPrompt = async (prompt: string, model: string) => {
    setIsLoading(true);
    
    // Don't add user message here - it will come from the backend
    
    try {
      await window.claudeAPI.continueSession({
        sessionId,
        prompt,
        model
      });
    } catch (error) {
      console.error('Failed to send prompt:', error);
      setIsLoading(false);
      alert(`Failed to send prompt: ${(error as Error).message}`);
    }
  };

  const handleCancel = async () => {
    await window.claudeAPI.cancelSession(sessionId);
    setIsLoading(false);
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-[#0a0a0a] via-[#111111] to-[#0f0f0f]">
      {/* Session Header */}
      <div className="px-6 py-4 bg-[#1a1a1a]/95 backdrop-blur border-b border-[#2a2a2a]">
        <h2 className="text-xl font-semibold text-white mb-1">{sessionInfo?.name || 'Loading...'}</h2>
        <span className="text-sm text-gray-400">{sessionInfo?.projectPath}</span>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6">
        <MessageList messages={messages} />
        <div ref={messagesEndRef} />
      </div>

      {/* Prompt Input */}
      <PromptInput
        onSubmit={handleSendPrompt}
        onCancel={handleCancel}
        isLoading={isLoading}
        disabled={sessionInfo?.isActive}
      />
    </div>
  );
}