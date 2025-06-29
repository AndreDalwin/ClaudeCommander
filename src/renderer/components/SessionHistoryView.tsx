import React, { useState, useEffect } from 'react';
import { MessageList } from './MessageList';
import { Message } from '@shared/types';
import { filterMessages } from '../utils/messageFiltering';
import { ArrowLeft, MessageSquare, Loader2, AlertCircle, Play } from 'lucide-react';
import { NewSessionDialog } from './NewSessionDialog';

interface SessionHistoryViewProps {
  projectId: string;
  sessionId: string;
  sessionName?: string;
  onBack: () => void;
  projectPath?: string;
  onResumeSession?: (sessionId: string) => void;
}

export function SessionHistoryView({ projectId, sessionId, sessionName, onBack, projectPath, onResumeSession }: SessionHistoryViewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [resuming, setResuming] = useState(false);

  useEffect(() => {
    loadSessionHistory();
  }, [projectId, sessionId]);

  const loadSessionHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const history = await window.claudeAPI.loadSessionHistory({ projectId, sessionId });
      
      // Debug: Log the session object
      console.log('Session history object:', history);
      console.log('Session entries:', history.entries);
      
      // Convert the JSONL entries to Message format
      const convertedMessages: Message[] = [];
      
      for (const entry of history.entries) {
        // Process all entries, filtering will be done later
        
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
        // Handle direct text messages
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
        // Handle thinking messages
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
        // Handle tool use
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
        // Handle tool result
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
        // Handle system messages
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
        // Handle usage messages
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
        // Handle error messages
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
            is_error: true, // Error messages are always errors
            subtype: entry.subtype,
            leafUuid: entry.leafUuid,
            summary: entry.summary
          });
        }
        // Handle result messages (execution summaries)
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
        // Handle raw messages for anything else
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
      setLoading(false);
    }
  };

  const handleResumeSession = async (sessionData: { name: string; projectPath: string; prompt: string; model: string }) => {
    try {
      setResuming(true);
      // Call the resume-session IPC handler
      const resumedSession = await window.claudeAPI.resumeSession({
        projectPath: sessionData.projectPath,
        sessionId: sessionId,
        name: sessionData.name,
        prompt: sessionData.prompt,
        model: sessionData.model
      });
      
      setShowResumeDialog(false);
      // Navigate to the new active session
      if (onResumeSession) {
        onResumeSession(resumedSession.id);
      }
    } catch (error) {
      console.error('Failed to resume session:', error);
      setError(`Failed to resume session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setResuming(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-[#0a0a0a] via-[#111111] to-[#0f0f0f] overflow-hidden">
      {/* Session Info Header */}
      <div className="px-6 py-4 border-b border-[#2a2a2a] bg-[#1a1a1a]/95 backdrop-blur">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Session History</h2>
              {sessionName && <p className="text-sm text-gray-400 truncate">{sessionName}</p>}
            </div>
          </div>
          
          {/* Resume Session Button */}
          {projectPath && (
            <button
              onClick={() => setShowResumeDialog(true)}
              disabled={resuming}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-medium transition-all duration-200 hover:from-blue-600 hover:to-purple-600 disabled:opacity-50"
            >
              <Play className="w-4 h-4" />
              Resume Session
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-96">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin mb-4" />
            <div className="text-gray-400">Loading session history...</div>
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
      </div>

      {/* Resume Session Dialog */}
      {showResumeDialog && projectPath && (
        <NewSessionDialog
          onClose={() => setShowResumeDialog(false)}
          onSubmit={handleResumeSession}
          defaultPath={projectPath}
          title="Resume Session"
          submitText={resuming ? "Resuming..." : "Resume"}
          promptPlaceholder="Continue the conversation..."
        />
      )}
    </div>
  );
}