import React, { useState } from 'react';

interface PromptInputProps {
  onSubmit: (prompt: string, model: string) => void;
  onCancel: () => void;
  isLoading: boolean;
  disabled?: boolean;
}

export function PromptInput({ onSubmit, onCancel, isLoading, disabled }: PromptInputProps) {
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('opus');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isLoading && !disabled) {
      onSubmit(prompt, model);
      setPrompt('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form className="prompt-input-form" onSubmit={handleSubmit}>
      <div className="prompt-input-container">
        <textarea
          className="prompt-input"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your prompt here... (Shift+Enter for new line)"
          disabled={isLoading || disabled}
          rows={3}
        />
        <div className="prompt-controls">
          <select 
            value={model} 
            onChange={(e) => setModel(e.target.value)}
            disabled={isLoading || disabled}
            className="model-select"
          >
            <option value="opus">Opus</option>
            <option value="sonnet">Sonnet</option>
            <option value="haiku">Haiku</option>
          </select>
          {isLoading ? (
            <button 
              type="button" 
              onClick={onCancel}
              className="cancel-btn"
            >
              Cancel
            </button>
          ) : (
            <button 
              type="submit" 
              disabled={!prompt.trim() || disabled}
              className="submit-btn"
            >
              Send
            </button>
          )}
        </div>
      </div>
    </form>
  );
}