import React, { useState, useEffect, useRef } from 'react';
import { MessageList } from './MessageList';
import { PromptInput } from './PromptInput';
import { Message, ClaudeSession } from '@shared/types';
import { filterMessages } from '../utils/messageFiltering';
import { MessageSquare, Loader2, AlertCircle } from 'lucide-react';

interface UnifiedSessionViewProps {
  sessionId: string;
  onRefreshSessions: () => void;
  isHistorical?: boolean;
  projectId?: string;
  sessionName?: string;
  projectPath?: string;
  onResumeSession?: (sessionId: string) => void;
}

export function UnifiedSessionView({ 
  sessionId, 
  onRefreshSessions, 
  isHistorical = false,
  projectId,
  sessionName,
  projectPath
}: UnifiedSessionViewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<ClaudeSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Track if we've switched from historical to active
  const [isNowActive, setIsNowActive] = useState(false);
  // Track the active session ID when resumed
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Reset state when sessionId prop changes
  useEffect(() => {
    setIsNowActive(false);
    setActiveSessionId(null);
    setMessages([]);
    setError(null);
  }, [sessionId]);

  useEffect(() => {
    let unsubscribeMessage: (() => void) | undefined;
    let unsubscribeError: (() => void) | undefined;
    let unsubscribeComplete: (() => void) | undefined;

    if (isHistorical && projectId && !isNowActive) {
      // Load historical messages
      loadHistoricalMessages();
    } else if (!isHistorical) {
      // For active sessions only (not historical), load and subscribe
      loadActiveMessages();
      unsubscribeMessage = subscribeToMessages();
      unsubscribeError = subscribeToErrors();
      unsubscribeComplete = subscribeToComplete();
    } else if (isNowActive) {
      // For resumed sessions, just subscribe (don't reload messages)
      unsubscribeMessage = subscribeToMessages();
      unsubscribeError = subscribeToErrors();
      unsubscribeComplete = subscribeToComplete();
    }

    return () => {
      unsubscribeMessage?.();
      unsubscribeError?.();
      unsubscribeComplete?.();
    };
  }, [sessionId, isHistorical, projectId, isNowActive, activeSessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadHistoricalMessages = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const history = await window.claudeAPI.loadSessionHistory({ projectId: projectId!, sessionId });
      
      // Convert the JSONL entries to Message format
      const convertedMessages: Message[] = [];
      
      for (const entry of history.entries) {
        // Handle user messages
        if (entry.type === 'user' && entry.message) {
          convertedMessages.push({
            type: 'user',
            message: entry.message,
            timestamp: entry.timestamp || new Date().toISOString(),
            isMeta: entry.isMeta,
            is_error: entry.is_error,
            subtype: entry.subtype,
            leafUuid: entry.leafUuid,
            summary: entry.summary
          });
        }
        // Handle assistant messages
        else if (entry.type === 'assistant' && entry.message) {
          // Extract content from assistant messages
          if (entry.message.content && Array.isArray(entry.message.content)) {
            for (const content of entry.message.content) {
              if (content.type === 'text' && content.text) {
                convertedMessages.push({
                  type: 'text',
                  text: content.text,
                  accumulatedText: content.text,
                  timestamp: entry.timestamp || new Date().toISOString(),
                  isMeta: entry.isMeta,
                  is_error: entry.is_error,
                  subtype: entry.subtype,
                  leafUuid: entry.leafUuid,
                  summary: entry.summary,
                  message: entry.message
                });
              } else if (content.type === 'tool_use') {
                convertedMessages.push({
                  type: 'tool_use',
                  name: content.name,
                  input: content.input,
                  tool_use_id: content.id,
                  timestamp: entry.timestamp || new Date().toISOString(),
                  isMeta: entry.isMeta,
                  is_error: entry.is_error,
                  subtype: entry.subtype,
                  leafUuid: entry.leafUuid,
                  summary: entry.summary
                });
              }
            }
          }
        }
        // Handle other message types (same as SessionHistoryView)
        else if (entry.type === 'text' && entry.text) {
          convertedMessages.push({
            type: 'text',
            text: entry.text,
            accumulatedText: entry.text,
            timestamp: entry.timestamp || new Date().toISOString(),
            isMeta: entry.isMeta,
            is_error: entry.is_error,
            subtype: entry.subtype,
            leafUuid: entry.leafUuid,
            summary: entry.summary
          });
        }
        else if (entry.type === 'thinking' && entry.thinking) {
          convertedMessages.push({
            type: 'thinking',
            thinking: entry.thinking,
            accumulatedThinking: entry.thinking,
            timestamp: entry.timestamp || new Date().toISOString(),
            isMeta: entry.isMeta,
            is_error: entry.is_error,
            subtype: entry.subtype,
            leafUuid: entry.leafUuid,
            summary: entry.summary
          });
        }
        else if (entry.type === 'tool_use') {
          convertedMessages.push({
            type: 'tool_use',
            name: entry.name,
            input: entry.input,
            tool_use_id: entry.id || entry.tool_use_id,
            timestamp: entry.timestamp || new Date().toISOString(),
            isMeta: entry.isMeta,
            is_error: entry.is_error,
            subtype: entry.subtype,
            leafUuid: entry.leafUuid,
            summary: entry.summary
          });
        }
        else if (entry.type === 'tool_result') {
          convertedMessages.push({
            type: 'tool_result',
            output: entry.output,
            tool_use_id_result: entry.tool_use_id || entry.id,
            timestamp: entry.timestamp || new Date().toISOString(),
            isMeta: entry.isMeta,
            is_error: entry.is_error || entry.error,
            subtype: entry.subtype,
            leafUuid: entry.leafUuid,
            summary: entry.summary
          });
        }
        else if (entry.type === 'system' && entry.system) {
          convertedMessages.push({
            type: 'system',
            system: entry.system,
            reminder: entry.reminder || false,
            timestamp: entry.timestamp || new Date().toISOString(),
            isMeta: entry.isMeta,
            is_error: entry.is_error,
            subtype: entry.subtype,
            leafUuid: entry.leafUuid,
            summary: entry.summary
          });
        }
        else if (entry.type === 'usage' && entry.usage) {
          convertedMessages.push({
            type: 'usage',
            usage: entry.usage,
            timestamp: entry.timestamp || new Date().toISOString(),
            isMeta: entry.isMeta,
            is_error: entry.is_error,
            subtype: entry.subtype,
            leafUuid: entry.leafUuid,
            summary: entry.summary
          });
        }
        else if (entry.type === 'error' || entry.isApiErrorMessage) {
          const errorText = entry.error || 
                          (entry.message?.content?.[0]?.text) || 
                          entry.message || 
                          'Unknown error';
          convertedMessages.push({
            type: 'error',
            error: typeof errorText === 'string' ? errorText : JSON.stringify(errorText),
            timestamp: entry.timestamp || new Date().toISOString(),
            isMeta: entry.isMeta,
            is_error: true,
            subtype: entry.subtype,
            leafUuid: entry.leafUuid,
            summary: entry.summary
          });
        }
        else if (entry.type === 'result') {
          convertedMessages.push({
            type: 'result',
            text: entry.text || entry.summary || 'Task completed',
            timestamp: entry.timestamp || new Date().toISOString(),
            isMeta: entry.isMeta,
            is_error: entry.is_error,
            subtype: entry.subtype,
            leafUuid: entry.leafUuid,
            summary: entry.summary
          });
        }
        else if (entry.type && !['user', 'assistant'].includes(entry.type)) {
          convertedMessages.push({
            type: 'raw',
            ...entry,
            timestamp: entry.timestamp || new Date().toISOString(),
            isMeta: entry.isMeta,
            is_error: entry.is_error,
            subtype: entry.subtype,
            leafUuid: entry.leafUuid,
            summary: entry.summary
          });
        }
      }
      
      // Apply comprehensive filtering to the converted messages
      const filteredMessages = filterMessages(convertedMessages);
      setMessages(filteredMessages);
    } catch (err) {
      console.error('Failed to load session history:', err);
      setError(err instanceof Error ? err.message : 'Failed to load session history');
    } finally {
      setIsLoading(false);
    }
  };

  const loadActiveMessages = async () => {
    const currentSessionId = activeSessionId || sessionId;
    const sessionMessages = await window.claudeAPI.getSessionMessages(currentSessionId);
    setMessages(sessionMessages);
    
    // Get session info from the sessions list
    const sessions = await window.claudeAPI.getSessions();
    const info = sessions.find(s => s.id === currentSessionId);
    setSessionInfo(info || null);
  };

  const subscribeToMessages = () => {
    const currentSessionId = activeSessionId || sessionId;
    console.log('Subscribing to messages for session:', currentSessionId);
    let currentTextMessageIndex: number | null = null;
    let currentThinkingMessageIndex: number | null = null;
    
    return window.claudeAPI.onSessionMessage(currentSessionId, (message) => {
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
    const currentSessionId = activeSessionId || sessionId;
    console.log('Subscribing to errors for session:', currentSessionId);
    return window.claudeAPI.onSessionError(currentSessionId, (error) => {
      console.error('Session error:', error);
      setIsLoading(false);
    });
  };

  const subscribeToComplete = () => {
    const currentSessionId = activeSessionId || sessionId;
    console.log('Subscribing to complete for session:', currentSessionId);
    return window.claudeAPI.onSessionComplete(currentSessionId, (result) => {
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
    
    try {
      // If this is a historical session that hasn't been resumed yet, resume it
      if (isHistorical && !isNowActive && projectPath) {
        const resumedSession = await window.claudeAPI.resumeSession({
          projectPath: projectPath,
          sessionId: sessionId,
          name: sessionName || `Resumed Session ${sessionId.substring(0, 8)}`,
          prompt: prompt,
          model: model
        });
        
        setIsNowActive(true);
        setActiveSessionId(resumedSession.id);
        
        // Subscribe to messages for the new session
        const unsubscribeMessage = subscribeToMessages();
        const unsubscribeError = subscribeToErrors();
        const unsubscribeComplete = subscribeToComplete();
        
        // Store cleanup functions for later
        // They will be cleaned up by the effect when component unmounts or sessionId changes
        
        // Don't navigate - stay in the same view
        // Just refresh sessions to update the sidebar
        onRefreshSessions();
      } else {
        // Continue existing active session
        const currentSessionId = activeSessionId || sessionId;
        await window.claudeAPI.continueSession({
          sessionId: currentSessionId,
          prompt,
          model
        });
      }
    } catch (error) {
      console.error('Failed to send prompt:', error);
      setIsLoading(false);
      alert(`Failed to send prompt: ${(error as Error).message}`);
    }
  };

  const handleCancel = async () => {
    const currentSessionId = activeSessionId || sessionId;
    await window.claudeAPI.cancelSession(currentSessionId);
    setIsLoading(false);
  };


  return (
    <div className="h-full w-full flex flex-col bg-gradient-to-br from-[#0a0a0a] via-[#111111] to-[#0f0f0f] overflow-hidden">
      {/* Session Info Header (only for historical sessions) */}
      {isHistorical && (
        <div className="px-6 py-4 border-b border-[#2a2a2a] bg-[#1a1a1a]/95 backdrop-blur">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {isNowActive ? 'Active Session' : 'Session History'}
                </h2>
                {sessionName && <p className="text-sm text-gray-400 truncate">{sessionName}</p>}
              </div>
            </div>
            
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-6">
        {isLoading && messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin mb-4" />
            <div className="text-gray-400">Loading session...</div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-96">
            <AlertCircle className="w-8 h-8 text-red-400 mb-4" />
            <div className="text-red-400">Error: {error}</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96">
            <MessageSquare className="w-8 h-8 text-gray-500 mb-4" />
            <div className="text-gray-400">No messages in this session</div>
          </div>
        ) : (
          <MessageList messages={messages} />
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Prompt Input (always shown) */}
      <PromptInput
        onSubmit={handleSendPrompt}
        onCancel={handleCancel}
        isLoading={isLoading}
        disabled={false}
      />
    </div>
  );
}