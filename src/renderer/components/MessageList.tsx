import React from 'react';
import { Message } from '@shared/types';

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  const renderMessage = (message: Message, index: number) => {
    if (message.type === 'user') {
      // Extract text content from user message
      let content = '';
      if (typeof message.message?.content === 'string') {
        content = message.message.content;
      } else if (Array.isArray(message.message?.content)) {
        // Handle array of content objects
        content = message.message.content
          .map((item: any) => {
            if (typeof item === 'string') return item;
            if (item?.text) return item.text;
            return '';
          })
          .join('');
      }
      
      return (
        <div key={index} className="p-4 rounded-lg bg-brand-blue ml-12 my-4">
          <div className="text-xs font-semibold mb-2 opacity-80">You</div>
          <div className="leading-relaxed whitespace-pre-wrap">{content}</div>
        </div>
      );
    }

    // Handle different message types from Claude
    switch (message.type) {
      case 'text':
        const textContent = typeof message.text === 'string' 
          ? message.text 
          : typeof message.text === 'object' && message.text !== null
            ? (message.text as any).text || JSON.stringify(message.text)
            : String(message.text || '');
            
        return (
          <div key={index} className="p-4 rounded-lg bg-dark-border mr-12 my-4">
            <div className="text-xs font-semibold mb-2 opacity-80">Claude</div>
            <div className="leading-relaxed whitespace-pre-wrap">
              {textContent}
            </div>
          </div>
        );

      case 'tool_use':
        return (
          <div key={index} className="p-4 rounded-lg bg-[#3c3c3c] border-l-[3px] border-[#f48771] my-4">
            <div className="font-semibold mb-2">
              🔧 {message.name}
            </div>
            <pre className="text-xs font-mono overflow-x-auto">
              {JSON.stringify(message.input, null, 2)}
            </pre>
          </div>
        );

      case 'tool_result':
        return (
          <div key={index} className="p-4 rounded-lg bg-[#3c3c3c] border-l-[3px] border-[#89d185] my-4">
            <div className="font-semibold mb-2">
              ✓ Tool Result
            </div>
            <pre className="text-xs font-mono overflow-x-auto">
              {typeof message.output === 'string' 
                ? message.output 
                : JSON.stringify(message.output, null, 2)}
            </pre>
          </div>
        );

      case 'error':
        return (
          <div key={index} className="p-4 rounded-lg bg-[#5a1d1d] border-l-[3px] border-[#f14c4c] my-4">
            <div className="font-semibold mb-2">Error</div>
            <div className="whitespace-pre-wrap">{message.error}</div>
          </div>
        );

      default:
        return (
          <div key={index} className="p-4 rounded-lg bg-dark-surface my-4">
            <pre className="text-xs font-mono overflow-x-auto">{JSON.stringify(message, null, 2)}</pre>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col py-5">
      {messages.map((message, index) => renderMessage(message, index))}
    </div>
  );
}