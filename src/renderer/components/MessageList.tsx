import React, { useState, useEffect, useRef } from 'react';
import { Message } from '@shared/types';
import { ToolWidget } from './tools/ToolWidget';

interface MessageListProps {
  messages: Message[];
}


export function MessageList({ messages }: MessageListProps) {
  const [expandedThinking, setExpandedThinking] = useState<Set<number>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const accumulatedTexts = useRef<Map<number, string>>(new Map());
  const accumulatedThinkings = useRef<Map<number, string>>(new Map());

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Messages are already filtered by SessionHistoryView, so use them directly
  const filteredMessages = messages;

  const toggleThinking = (index: number) => {
    const newExpanded = new Set(expandedThinking);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedThinking(newExpanded);
  };

  const renderToolWidget = (message: Message, result?: Message) => {
    return <ToolWidget message={message} result={result} />;
  };

  const renderMessage = (message: Message, index: number) => {
    // Handle user messages
    if (message.type === 'user') {
      let content = '';
      if (typeof message.message?.content === 'string') {
        content = message.message.content;
      } else if (Array.isArray(message.message?.content)) {
        content = message.message.content
          .map((item: any) => {
            if (typeof item === 'string') return item;
            if (item?.text) return item.text;
            return '';
          })
          .join('');
      }
      
      return (
        <div key={index} className="flex justify-end mb-4 animate-fade-in-up">
          <div className="max-w-[80%] p-4 rounded-lg bg-brand-blue">
            <div className="text-xs font-semibold mb-2 opacity-80">You</div>
            <div className="leading-relaxed whitespace-pre-wrap">{content}</div>
          </div>
        </div>
      );
    }

    // Handle assistant text messages
    if (message.type === 'text') {
      // Update accumulated text for streaming
      if (message.isStreaming && message.text) {
        const currentAccumulated = accumulatedTexts.current.get(index) || '';
        accumulatedTexts.current.set(index, currentAccumulated + message.text);
      }

      const textContent = message.accumulatedText || 
                         accumulatedTexts.current.get(index) || 
                         message.text || '';
      
      if (!textContent) return null;
      
      return (
        <div key={index} className="flex justify-start mb-4 animate-fade-in-up">
          <div className="max-w-[80%] p-4 rounded-lg bg-dark-surface">
            <div className="text-xs font-semibold mb-2 opacity-80 flex items-center gap-2">
              Claude
              {message.isStreaming && (
                <span className="inline-block w-2 h-2 bg-brand-blue rounded-full animate-pulse" />
              )}
            </div>
            <div className="leading-relaxed whitespace-pre-wrap">
              {textContent}
            </div>
          </div>
        </div>
      );
    }

    // Handle thinking messages
    if (message.type === 'thinking') {
      // Update accumulated thinking for streaming
      if (message.isStreaming && message.thinking) {
        const currentAccumulated = accumulatedThinkings.current.get(index) || '';
        accumulatedThinkings.current.set(index, currentAccumulated + message.thinking);
      }

      const thinkingContent = message.accumulatedThinking || 
                             accumulatedThinkings.current.get(index) || 
                             message.thinking || '';
      
      if (!thinkingContent) return null;
      
      const isExpanded = expandedThinking.has(index);
      
      return (
        <div key={index} className="mb-4 animate-fade-in-up">
          <div className="p-3 rounded-lg bg-dark-surface border border-dark-border">
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => toggleThinking(index)}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm text-text-muted">💭 Claude is thinking...</span>
                {message.isStreaming && (
                  <span className="inline-block w-2 h-2 bg-brand-blue rounded-full animate-pulse" />
                )}
              </div>
              <svg 
                className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            {isExpanded && (
              <div className="mt-3 pt-3 border-t border-dark-border">
                <div className="text-sm text-text-secondary whitespace-pre-wrap">
                  {thinkingContent}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Handle tool use messages
    if (message.type === 'tool_use') {
      // Find corresponding tool result
      const resultIndex = filteredMessages.findIndex((msg, i) => 
        i > index && 
        msg.type === 'tool_result' && 
        msg.tool_use_id_result === message.tool_use_id
      );
      const result = resultIndex !== -1 ? filteredMessages[resultIndex] : undefined;

      return (
        <div key={index} className="mb-4 animate-fade-in-up">
          {renderToolWidget(message, result)}
        </div>
      );
    }

    // Handle result messages (execution summaries)
    if (message.type === 'result') {
      return (
        <div key={index} className="mb-4 animate-fade-in-up">
          <div className="p-3 rounded-lg bg-green-900/20 border border-green-700/30">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-green-400">✅ Task Complete</span>
            </div>
            <div className="text-sm text-text-secondary whitespace-pre-wrap">
              {message.text || message.summary || 'Task completed successfully'}
            </div>
          </div>
        </div>
      );
    }

    // Handle tool_result messages (only shown if they have errors or no custom widget)
    if (message.type === 'tool_result') {
      const isError = message.is_error;
      
      return (
        <div key={index} className="mb-4 animate-fade-in-up">
          <div className={`p-3 rounded-lg ${isError ? 'bg-red-900/20 border border-red-700/30' : 'bg-dark-surface border border-dark-border'}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-sm font-semibold ${isError ? 'text-red-400' : 'text-text-primary'}`}>
                {isError ? '❌ Tool Error' : '🔧 Tool Result'}
              </span>
            </div>
            <div className="text-sm text-text-secondary whitespace-pre-wrap font-mono">
              {typeof message.output === 'string' ? message.output : JSON.stringify(message.output, null, 2)}
            </div>
          </div>
        </div>
      );
    }

    // Handle system messages
    if (message.type === 'system') {
      const isReminder = message.reminder || message.system?.includes('reminder');
      const isInit = message.subtype === 'init';
      
      return (
        <div key={index} className="mb-4 animate-fade-in-up">
          <div className={`p-3 rounded-lg ${isReminder ? 'bg-yellow-900/20 border border-yellow-700/30' : isInit ? 'bg-blue-900/20 border border-blue-700/30' : 'bg-gray-900/20 border border-gray-700/30'}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold">
                {isReminder ? '⚠️ System Reminder' : isInit ? '🚀 Session Started' : 'ℹ️ System Message'}
              </span>
            </div>
            <div className="text-sm text-text-secondary whitespace-pre-wrap">
              {message.system}
            </div>
          </div>
        </div>
      );
    }

    // Handle usage messages
    if (message.type === 'usage' && message.usage) {
      return (
        <div key={index} className="mb-4 animate-fade-in-up">
          <div className="p-3 rounded-lg bg-dark-surface border border-dark-border">
            <div className="text-xs text-text-muted">
              📊 Token Usage: 
              {message.usage.input_tokens && ` Input: ${message.usage.input_tokens}`}
              {message.usage.output_tokens && ` | Output: ${message.usage.output_tokens}`}
              {message.usage.cache_read_input_tokens && ` | Cache Read: ${message.usage.cache_read_input_tokens}`}
              {message.usage.cache_creation_input_tokens && ` | Cache Creation: ${message.usage.cache_creation_input_tokens}`}
            </div>
          </div>
        </div>
      );
    }

    // Handle errors
    if (message.type === 'error') {
      return (
        <div key={index} className="mb-4 animate-fade-in-up">
          <div className="p-4 rounded-lg bg-red-900/20 border border-red-700/30">
            <div className="font-semibold mb-2 text-red-400">❌ Error</div>
            <div className="text-sm whitespace-pre-wrap">{message.error}</div>
          </div>
        </div>
      );
    }

    // Handle raw/unknown messages
    return (
      <div key={index} className="mb-4 animate-fade-in-up">
        <div className="p-3 rounded-lg bg-dark-surface border border-dark-border">
          <div className="text-xs text-text-muted mb-1">Raw Message ({message.type})</div>
          <pre className="text-xs font-mono overflow-x-auto">{JSON.stringify(message, null, 2)}</pre>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col py-5 px-6">
      {filteredMessages.map((message, index) => renderMessage(message, index))}
      <div ref={messagesEndRef} />
    </div>
  );
}