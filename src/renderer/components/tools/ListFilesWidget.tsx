import React, { useState } from 'react';

interface ListFilesWidgetProps {
  input: {
    path?: string;
    recursive?: boolean;
  };
  result?: string | string[];
}

export function ListFilesWidget({ input, result }: ListFilesWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const path = input.path || 'current directory';

  return (
    <div className="rounded-lg bg-dark-surface border border-dark-border overflow-hidden">
      <div 
        className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-dark-hover transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">📁</span>
          <span className="font-medium">Listing files in {path}</span>
          {input.recursive && <span className="text-xs text-text-muted">(recursive)</span>}
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
          <pre className="text-sm font-mono bg-dark-bg p-3 rounded overflow-x-auto max-h-64 overflow-y-auto custom-scrollbar">
            {Array.isArray(result) ? result.join('\n') : result}
          </pre>
        </div>
      )}
    </div>
  );
}