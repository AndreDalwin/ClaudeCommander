import React, { useState, useEffect } from 'react';
import { MessageList } from './MessageList';
import { Message } from '@shared/types';

interface SessionHistoryViewProps {
  projectId: string;
  sessionId: string;
  sessionName?: string;
  onBack: () => void;
}

export function SessionHistoryView({ projectId, sessionId, sessionName, onBack }: SessionHistoryViewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSessionHistory();
  }, [projectId, sessionId]);

  const loadSessionHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const history = await window.claudeAPI.loadSessionHistory({ projectId, sessionId });
      
      // Convert the JSONL entries to Message format
      const convertedMessages: Message[] = [];
      
      for (const entry of history.entries) {
        // Handle user messages
        if (entry.type === 'user' && entry.message) {
          convertedMessages.push({
            type: 'user',
            message: entry.message,
            timestamp: entry.timestamp || new Date().toISOString()
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
                  timestamp: entry.timestamp || new Date().toISOString()
                });
              } else if (content.type === 'tool_use') {
                convertedMessages.push({
                  type: 'tool_use',
                  name: content.name,
                  input: content.input,
                  tool_use_id: content.id,
                  timestamp: entry.timestamp || new Date().toISOString()
                });
              }
            }
          }
        }
        // Handle direct text messages
        else if (entry.type === 'text' && entry.text) {
          convertedMessages.push({
            type: 'text',
            text: entry.text,
            accumulatedText: entry.text,
            timestamp: entry.timestamp || new Date().toISOString()
          });
        }
        // Handle thinking messages
        else if (entry.type === 'thinking' && entry.thinking) {
          convertedMessages.push({
            type: 'thinking',
            thinking: entry.thinking,
            accumulatedThinking: entry.thinking,
            timestamp: entry.timestamp || new Date().toISOString()
          });
        }
        // Handle tool use
        else if (entry.type === 'tool_use') {
          convertedMessages.push({
            type: 'tool_use',
            name: entry.name,
            input: entry.input,
            tool_use_id: entry.id || entry.tool_use_id,
            timestamp: entry.timestamp || new Date().toISOString()
          });
        }
        // Handle tool result
        else if (entry.type === 'tool_result') {
          convertedMessages.push({
            type: 'tool_result',
            output: entry.output,
            tool_use_id_result: entry.tool_use_id || entry.id,
            timestamp: entry.timestamp || new Date().toISOString()
          });
        }
        // Handle system messages
        else if (entry.type === 'system' && entry.system) {
          convertedMessages.push({
            type: 'system',
            system: entry.system,
            reminder: entry.reminder || false,
            timestamp: entry.timestamp || new Date().toISOString()
          });
        }
        // Handle usage messages
        else if (entry.type === 'usage' && entry.usage) {
          convertedMessages.push({
            type: 'usage',
            usage: entry.usage,
            timestamp: entry.timestamp || new Date().toISOString()
          });
        }
        // Handle error messages
        else if (entry.type === 'error' || entry.isApiErrorMessage) {
          const errorText = entry.error || 
                          (entry.message?.content?.[0]?.text) || 
                          entry.message || 
                          'Unknown error';
          convertedMessages.push({
            type: 'error',
            error: typeof errorText === 'string' ? errorText : JSON.stringify(errorText),
            timestamp: entry.timestamp || new Date().toISOString()
          });
        }
        // Handle raw messages for anything else
        else if (entry.type && !['user', 'assistant'].includes(entry.type)) {
          convertedMessages.push({
            type: 'raw',
            ...entry,
            timestamp: entry.timestamp || new Date().toISOString()
          });
        }
      }
      
      setMessages(convertedMessages);
    } catch (err) {
      console.error('Failed to load session history:', err);
      setError(err instanceof Error ? err.message : 'Failed to load session history');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-screen bg-dark-bg overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-5 px-10 py-5 bg-[#1a1a1a] border-b border-dark-border">
        <button 
          className="flex items-center gap-2 px-5 py-2.5 bg-dark-border border border-[#3e3e42] rounded-md text-text-primary text-sm transition-all duration-200 hover:bg-[#37373d] hover:-translate-x-0.5"
          onClick={onBack}
        >
          ← Back
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-semibold">Session History</h2>
          {sessionName && <p className="text-sm text-text-secondary mt-1">{sessionName}</p>}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-10">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-text-secondary">Loading session history...</div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-red-500">Error: {error}</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-text-secondary">No messages in this session</div>
          </div>
        ) : (
          <MessageList messages={messages} />
        )}
      </div>
    </div>
  );
}