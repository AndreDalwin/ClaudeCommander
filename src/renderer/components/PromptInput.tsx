import React, { useState } from 'react';
import { Send, Square, ChevronDown } from 'lucide-react';

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
    <form className="border-t border-[#2a2a2a] bg-[#1a1a1a] p-6" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-4">
        <div className="relative">
          <textarea
            className="w-full p-4 bg-[#2a2a2a] border border-[#3a3a3a] text-white rounded-xl resize-vertical focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-60 placeholder-gray-400 pr-16"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your prompt here... (Shift+Enter for new line)"
            disabled={isLoading || disabled}
            rows={3}
          />
          <div className="absolute right-3 bottom-3 text-xs text-gray-500">
            ⏎ Send • ⇧⏎ New line
          </div>
        </div>
        
        <div className="flex gap-3 justify-between items-center">
          <div className="relative">
            <select 
              value={model} 
              onChange={(e) => setModel(e.target.value)}
              disabled={isLoading || disabled}
              className="pl-4 pr-10 py-2 bg-[#2a2a2a] border border-[#3a3a3a] text-white rounded-lg cursor-pointer focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-60 appearance-none"
            >
              <option value="opus">Claude Opus 4</option>
              <option value="sonnet">Claude Sonnet 4</option>
              <option value="haiku">Claude 3.5 Haiku </option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          
          <div className="flex gap-3">
            {isLoading ? (
              <button 
                type="button" 
                onClick={onCancel}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Square className="w-4 h-4" />
                Cancel
              </button>
            ) : (
              <button 
                type="submit" 
                disabled={!prompt.trim() || disabled}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg"
              >
                <Send className="w-4 h-4" />
                Send
              </button>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}