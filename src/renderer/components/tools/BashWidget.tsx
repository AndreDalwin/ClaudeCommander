import React, { useState } from 'react';

interface BashWidgetProps {
  input: {
    command: string;
  };
  result?: string;
}

export function BashWidget({ input, result }: BashWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="rounded-lg bg-dark-surface border border-dark-border overflow-hidden">
      <div 
        className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-dark-hover transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">💻</span>
          <span className="font-medium">Running command</span>
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
        <div className="border-t border-dark-border">
          <div className="p-4 bg-dark-bg">
            <code className="text-sm font-mono text-green-400">$ {input.command}</code>
          </div>
          {result && (
            <div className="p-4 border-t border-dark-border">
              <pre className="text-sm font-mono bg-dark-bg p-3 rounded overflow-x-auto max-h-96 overflow-y-auto custom-scrollbar whitespace-pre-wrap">
                {result}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}