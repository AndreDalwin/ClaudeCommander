import React, { useState, useRef, useEffect } from 'react';
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isLoading && !disabled) {
      onSubmit(prompt, model);
      setPrompt('');
      // Reset textarea height after submit
      if (textareaRef.current) {
        textareaRef.current.style.height = '46px';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 140) + 'px';
  };

  // Reset height when prompt is cleared
  useEffect(() => {
    if (!prompt && textareaRef.current) {
      textareaRef.current.style.height = '46px';
    }
  }, [prompt]);

  return (
    <form className="border-t border-[#2a2a2a] bg-[#1a1a1a] px-4 py-3" onSubmit={handleSubmit}>
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          className="flex-1 min-h-[46px] max-h-[140px] px-3 py-3 bg-[#2a2a2a] border border-[#3a3a3a] text-white rounded-lg resize-none overflow-y-auto focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-60 placeholder-gray-400 transition-all duration-200 leading-5"
          value={prompt}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={isLoading || disabled}
          rows={1}
          style={{ height: '46px' }}
        />
        
        <div className="relative">
          <select 
            value={model} 
            onChange={(e) => setModel(e.target.value)}
            disabled={isLoading || disabled}
            className="pl-3 pr-8 py-2 h-[46px] bg-[#2a2a2a] border border-[#3a3a3a] text-white text-sm rounded-lg cursor-pointer focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-60 appearance-none"
            title="Select model"
          >
            <option value="opus">Opus</option>
            <option value="sonnet">Sonnet</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
        </div>
        
        {isLoading ? (
          <button 
            type="button" 
            onClick={onCancel}
            className="p-2 h-[46px] w-[46px] flex items-center justify-center bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            title="Cancel"
          >
            <Square className="w-4 h-4" />
          </button>
        ) : (
          <button 
            type="submit" 
            disabled={!prompt.trim() || disabled}
            className={`p-2 h-[46px] w-[46px] flex items-center justify-center rounded-lg transition-all ${
              prompt.trim() 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-[#2a2a2a] text-gray-500 cursor-not-allowed'
            }`}
            title="Send message (Enter)"
          >
            <Send className="w-4 h-4" />
          </button>
        )}
      </div>
    </form>
  );
}