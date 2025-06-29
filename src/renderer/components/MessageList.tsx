import React, { useState, useEffect, useRef } from 'react';
import { Message } from '@shared/types';
import { ToolWidget } from './tools/ToolWidget';
import { ChevronDown, User, Bot, Brain, CheckCircle, XCircle, Info, AlertTriangle, BarChart3, Zap } from 'lucide-react';

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
      } else if (message.message && Array.isArray(message.message.content)) {
        content = message.message.content
          .map((item: any) => {
            if (typeof item === 'string') return item;
            if (item?.text) return item.text;
            return '';
          })
          .join('');
      }
      
      return (
        <div key={index} className="flex justify-end mb-6 animate-fade-in-up">
          <div className="max-w-[80%] p-4 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg overflow-hidden">
            <div className="flex items-center gap-2 text-xs font-semibold mb-2 opacity-90">
              <User className="w-3 h-3" />
              You
            </div>
            <div className="leading-relaxed whitespace-pre-wrap break-words">{content}</div>
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
      
      // Check if previous message is from user for spacing
      const prevMessage = index > 0 ? filteredMessages[index - 1] : null;
      const isAfterUser = prevMessage?.type === 'user';
      
      return (
        <div key={index} className={`flex justify-start animate-fade-in-up ${isAfterUser ? 'mb-6' : 'mb-2'}`}>
          <div className="max-w-[80%] p-4 rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a] shadow-lg overflow-hidden">
            <div className="flex items-center gap-2 text-xs font-semibold mb-2 text-gray-300">
              <Bot className="w-3 h-3 text-blue-400" />
              Claude
              {message.isStreaming && (
                <span className="inline-block w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              )}
            </div>
            <div className="leading-relaxed whitespace-pre-wrap break-words text-white">
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
      
      // Check if previous message is from user for spacing
      const prevMessage = index > 0 ? filteredMessages[index - 1] : null;
      const isAfterUser = prevMessage?.type === 'user';
      
      return (
        <div key={index} className={`animate-fade-in-up ${isAfterUser ? 'mb-6' : 'mb-2'}`}>
          <div className="p-4 rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a] shadow-lg">
            <div 
              className="flex items-center justify-between cursor-pointer hover:bg-[#2a2a2a] p-2 rounded-lg transition-colors"
              onClick={() => toggleThinking(index)}
            >
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-gray-300">Claude is thinking...</span>
                {message.isStreaming && (
                  <span className="inline-block w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                )}
              </div>
              <ChevronDown 
                className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              />
            </div>
            {isExpanded && (
              <div className="mt-3 pt-3 border-t border-[#2a2a2a]">
                <div className="text-sm text-gray-300 whitespace-pre-wrap break-words bg-[#0f0f0f] p-3 rounded-lg font-mono overflow-x-auto">
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

      // Check if previous message is from user for spacing
      const prevMessage = index > 0 ? filteredMessages[index - 1] : null;
      const isAfterUser = prevMessage?.type === 'user';

      return (
        <div key={index} className={`animate-fade-in-up ${isAfterUser ? 'mb-6' : 'mb-2'}`}>
          {renderToolWidget(message, result)}
        </div>
      );
    }

    // Handle result messages (execution summaries)
    if (message.type === 'result') {
      // Check if previous message is from user for spacing
      const prevMessage = index > 0 ? filteredMessages[index - 1] : null;
      const isAfterUser = prevMessage?.type === 'user';
      
      return (
        <div key={index} className={`animate-fade-in-up ${isAfterUser ? 'mb-6' : 'mb-2'}`}>
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-semibold text-emerald-400">Task Complete</span>
            </div>
            <div className="text-sm text-gray-300 whitespace-pre-wrap break-words">
              {message.text || message.summary || 'Task completed successfully'}
            </div>
          </div>
        </div>
      );
    }

    // Handle tool_result messages (only shown if they have errors or no custom widget)
    if (message.type === 'tool_result') {
      const isError = message.is_error;
      
      // Check if previous message is from user for spacing
      const prevMessage = index > 0 ? filteredMessages[index - 1] : null;
      const isAfterUser = prevMessage?.type === 'user';
      
      return (
        <div key={index} className={`animate-fade-in-up ${isAfterUser ? 'mb-6' : 'mb-2'}`}>
          <div className={`p-4 rounded-2xl shadow-lg ${isError ? 'bg-red-500/10 border border-red-500/30' : 'bg-[#1a1a1a] border border-[#2a2a2a]'}`}>
            <div className="flex items-center gap-2 mb-2">
              {isError ? (
                <XCircle className="w-4 h-4 text-red-400" />
              ) : (
                <Zap className="w-4 h-4 text-blue-400" />
              )}
              <span className={`text-sm font-semibold ${isError ? 'text-red-400' : 'text-blue-400'}`}>
                {isError ? 'Tool Error' : 'Tool Result'}
              </span>
            </div>
            <div className="text-sm text-gray-300 whitespace-pre-wrap break-words font-mono bg-[#0f0f0f] p-3 rounded-lg overflow-x-auto">
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
      
      // Check if previous message is from user for spacing
      const prevMessage = index > 0 ? filteredMessages[index - 1] : null;
      const isAfterUser = prevMessage?.type === 'user';
      
      return (
        <div key={index} className={`animate-fade-in-up ${isAfterUser ? 'mb-6' : 'mb-2'}`}>
          <div className={`p-4 rounded-2xl shadow-lg ${
            isReminder ? 'bg-yellow-500/10 border border-yellow-500/30' : 
            isInit ? 'bg-blue-500/10 border border-blue-500/30' : 
            'bg-gray-500/10 border border-gray-500/30'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {isReminder ? (
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
              ) : isInit ? (
                <Zap className="w-4 h-4 text-blue-400" />
              ) : (
                <Info className="w-4 h-4 text-gray-400" />
              )}
              <span className={`text-sm font-semibold ${
                isReminder ? 'text-yellow-400' : 
                isInit ? 'text-blue-400' : 
                'text-gray-400'
              }`}>
                {isReminder ? 'System Reminder' : isInit ? 'Session Started' : 'System Message'}
              </span>
            </div>
            <div className="text-sm text-gray-300 whitespace-pre-wrap break-words">
              {message.system}
            </div>
          </div>
        </div>
      );
    }

    // Handle usage messages
    if (message.type === 'usage' && message.usage) {
      // Check if previous message is from user for spacing
      const prevMessage = index > 0 ? filteredMessages[index - 1] : null;
      const isAfterUser = prevMessage?.type === 'user';
      
      return (
        <div key={index} className={`animate-fade-in-up ${isAfterUser ? 'mb-6' : 'mb-2'}`}>
          <div className="p-3 rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a] shadow-lg">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <BarChart3 className="w-3 h-3" />
              <span>Token Usage:</span>
              {message.usage.input_tokens && <span className="text-blue-400">Input: {message.usage.input_tokens}</span>}
              {message.usage.output_tokens && <span className="text-purple-400">Output: {message.usage.output_tokens}</span>}
              {message.usage.cache_read_input_tokens && <span className="text-green-400">Cache Read: {message.usage.cache_read_input_tokens}</span>}
              {message.usage.cache_creation_input_tokens && <span className="text-yellow-400">Cache Creation: {message.usage.cache_creation_input_tokens}</span>}
            </div>
          </div>
        </div>
      );
    }

    // Handle errors
    if (message.type === 'error') {
      // Check if previous message is from user for spacing
      const prevMessage = index > 0 ? filteredMessages[index - 1] : null;
      const isAfterUser = prevMessage?.type === 'user';
      
      return (
        <div key={index} className={`animate-fade-in-up ${isAfterUser ? 'mb-6' : 'mb-2'}`}>
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 shadow-lg">
            <div className="flex items-center gap-2 font-semibold mb-2 text-red-400">
              <XCircle className="w-4 h-4" />
              Error
            </div>
            <div className="text-sm whitespace-pre-wrap break-words text-gray-300 bg-[#0f0f0f] p-3 rounded-lg font-mono overflow-x-auto">{message.error}</div>
          </div>
        </div>
      );
    }

    // Handle assistant messages (raw format from streaming)
    if (message.type === 'assistant' && message.message) {
      // Extract content from assistant messages that weren't parsed by the stream parser
      const assistantContent: JSX.Element[] = [];
      
      if (message.message.content && Array.isArray(message.message.content)) {
        message.message.content.forEach((content: any, contentIndex: number) => {
          if (content.type === 'text' && content.text) {
            assistantContent.push(
              <div key={`text-${contentIndex}`} className="leading-relaxed whitespace-pre-wrap break-words text-white">
                {content.text}
              </div>
            );
          } else if (content.type === 'tool_use') {
            // Create a proper tool use message
            const toolMessage: Message = {
              type: 'tool_use',
              name: content.name,
              input: content.input,
              tool_use_id: content.id,
              timestamp: message.timestamp
            };
            assistantContent.push(
              <div key={`tool-${contentIndex}`} className="my-2">
                {renderToolWidget(toolMessage)}
              </div>
            );
          } else if (content.type === 'thinking' && content.thinking) {
            const isExpanded = expandedThinking.has(index);
            assistantContent.push(
              <div key={`thinking-${contentIndex}`} className="my-2 p-4 rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a]">
                <div 
                  className="flex items-center justify-between cursor-pointer hover:bg-[#2a2a2a] p-2 rounded-lg transition-colors"
                  onClick={() => toggleThinking(index)}
                >
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-gray-300">Claude is thinking...</span>
                  </div>
                  <ChevronDown 
                    className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </div>
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-[#2a2a2a]">
                    <div className="text-sm text-gray-300 whitespace-pre-wrap break-words bg-[#0f0f0f] p-3 rounded-lg font-mono overflow-x-auto">
                      {content.thinking}
                    </div>
                  </div>
                )}
              </div>
            );
          }
        });
      }
      
      if (assistantContent.length > 0) {
        // Check if previous message is from user for spacing
        const prevMessage = index > 0 ? filteredMessages[index - 1] : null;
        const isAfterUser = prevMessage?.type === 'user';
        
        return (
          <div key={index} className={`flex justify-start animate-fade-in-up ${isAfterUser ? 'mb-6' : 'mb-2'}`}>
            <div className="max-w-[80%] p-4 rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a] shadow-lg">
              <div className="flex items-center gap-2 text-xs font-semibold mb-2 text-gray-300">
                <Bot className="w-3 h-3 text-blue-400" />
                Claude
              </div>
              {assistantContent}
            </div>
          </div>
        );
      }
    }
    
    // Handle raw/unknown messages
    // Check if previous message is from user for spacing
    const prevMessage = index > 0 ? filteredMessages[index - 1] : null;
    const isAfterUser = prevMessage?.type === 'user';
    
    return (
      <div key={index} className={`animate-fade-in-up ${isAfterUser ? 'mb-6' : 'mb-2'}`}>
        <div className="p-4 rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a] shadow-lg">
          <div className="text-xs text-gray-400 mb-2 flex items-center gap-2">
            <Info className="w-3 h-3" />
            Raw Message ({message.type})
          </div>
          <pre className="text-xs font-mono overflow-x-auto text-gray-300 bg-[#0f0f0f] p-3 rounded-lg">{JSON.stringify(message, null, 2)}</pre>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col py-6 px-6 space-y-2 max-w-full">
      {filteredMessages.map((message, index) => renderMessage(message, index))}
      <div ref={messagesEndRef} />
    </div>
  );
}