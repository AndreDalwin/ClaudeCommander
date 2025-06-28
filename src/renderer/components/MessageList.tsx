import React from 'react';
import { Message } from '@shared/types';

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  const renderMessage = (message: Message, index: number) => {
    if (message.type === 'user') {
      return (
        <div key={index} className="message user-message">
          <div className="message-role">You</div>
          <div className="message-content">{message.message?.content}</div>
        </div>
      );
    }

    // Handle different message types from Claude
    switch (message.type) {
      case 'text':
        return (
          <div key={index} className="message assistant-message">
            <div className="message-role">Claude</div>
            <div className="message-content">{message.text || ''}</div>
          </div>
        );

      case 'tool_use':
        return (
          <div key={index} className="message tool-message">
            <div className="tool-header">
              🔧 {message.name}
            </div>
            <pre className="tool-input">
              {JSON.stringify(message.input, null, 2)}
            </pre>
          </div>
        );

      case 'tool_result':
        return (
          <div key={index} className="message tool-result">
            <div className="tool-result-header">
              ✓ Tool Result
            </div>
            <pre className="tool-output">
              {typeof message.output === 'string' 
                ? message.output 
                : JSON.stringify(message.output, null, 2)}
            </pre>
          </div>
        );

      case 'error':
        return (
          <div key={index} className="message error-message">
            <div className="error-header">Error</div>
            <div className="error-content">{message.error}</div>
          </div>
        );

      default:
        return (
          <div key={index} className="message raw-message">
            <pre>{JSON.stringify(message, null, 2)}</pre>
          </div>
        );
    }
  };

  return (
    <div className="message-list">
      {messages.map((message, index) => renderMessage(message, index))}
    </div>
  );
}