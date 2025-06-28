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
    let currentAssistantId: string | null = null;
    
    return window.claudeAPI.onSessionMessage(sessionId, (message) => {
      console.log('Received message:', message);
      
      switch (message.type) {
        case 'user':
          // Add user message
          setMessages(prev => [...prev, message]);
          setIsLoading(true);
          break;
          
        case 'text':
          // Handle streaming text with accumulation
          if (message.accumulatedText) {
            setMessages(prev => {
              const lastMessage = prev[prev.length - 1];
              
              // If last message is assistant text, update it
              if (lastMessage && lastMessage.type === 'text' && !lastMessage.message) {
                return [
                  ...prev.slice(0, -1),
                  {
                    ...lastMessage,
                    text: message.accumulatedText,
                    timestamp: message.timestamp
                  }
                ];
              } else {
                // Create new assistant message
                if (!currentAssistantId) {
                  currentAssistantId = `${Date.now()}-assistant`;
                }
                return [...prev, {
                  type: 'text',
                  text: message.accumulatedText,
                  timestamp: message.timestamp
                }];
              }
            });
          }
          break;
          
        case 'tool_use':
        case 'tool_result':
          // Reset assistant ID for new messages
          currentAssistantId = null;
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
    <div className="h-full flex flex-col">
      <div className="px-5 py-5 border-b border-[#3e3e42]">
        <h2 className="text-lg font-medium mb-1">{sessionInfo?.name || 'Loading...'}</h2>
        <span className="text-sm text-text-muted">{sessionInfo?.projectPath}</span>
      </div>

      <div className="flex-1 overflow-y-auto px-5">
        <MessageList messages={messages} />
        <div ref={messagesEndRef} />
      </div>

      <PromptInput
        onSubmit={handleSendPrompt}
        onCancel={handleCancel}
        isLoading={isLoading}
        disabled={sessionInfo?.isActive}
      />
    </div>
  );
}