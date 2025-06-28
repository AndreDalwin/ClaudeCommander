import React, { useState } from 'react';

interface ReadFileWidgetProps {
  input: {
    command: string;
    path: string;
    view_range?: [number, number];
  };
  result?: string;
}

export function ReadFileWidget({ input, result }: ReadFileWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const fileName = input.path.split('/').pop() || input.path;

  return (
    <div className="rounded-lg bg-dark-surface border border-dark-border overflow-hidden">
      <div 
        className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-dark-hover transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">📖</span>
          <span className="font-medium">Reading {fileName}</span>
          {input.view_range && (
            <span className="text-xs text-text-muted">
              Lines {input.view_range[0]}-{input.view_range[1]}
            </span>
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

      {isExpanded && result && (
        <div className="p-4 border-t border-dark-border">
          <pre className="text-sm font-mono bg-dark-bg p-3 rounded overflow-x-auto max-h-96 overflow-y-auto custom-scrollbar">
            {result}
          </pre>
        </div>
      )}
    </div>
  );
}