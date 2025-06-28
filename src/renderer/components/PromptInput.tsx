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
    <form className="border-t border-[#3e3e42] p-5" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-2.5">
        <textarea
          className="w-full p-3 bg-[#3c3c3c] border border-[#464647] text-text-primary rounded-md resize-vertical focus:outline-none focus:border-brand-blue disabled:opacity-60"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your prompt here... (Shift+Enter for new line)"
          disabled={isLoading || disabled}
          rows={3}
        />
        <div className="flex gap-2.5 justify-end">
          <select 
            value={model} 
            onChange={(e) => setModel(e.target.value)}
            disabled={isLoading || disabled}
            className="px-3 py-2 bg-[#3c3c3c] border border-[#464647] text-text-primary rounded-md cursor-pointer focus:outline-none focus:border-brand-blue disabled:opacity-60"
          >
            <option value="opus">Opus</option>
            <option value="sonnet">Sonnet</option>
            <option value="haiku">Haiku</option>
          </select>
          {isLoading ? (
            <button 
              type="button" 
              onClick={onCancel}
              className="px-4 py-2 bg-[#f14c4c] text-white rounded-md hover:bg-[#cd3636]"
            >
              Cancel
            </button>
          ) : (
            <button 
              type="submit" 
              disabled={!prompt.trim() || disabled}
              className="px-4 py-2 bg-brand-blue text-white rounded-md hover:bg-brand-blue-light disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Send
            </button>
          )}
        </div>
      </div>
    </form>
  );
}