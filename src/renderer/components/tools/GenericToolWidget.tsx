import React, { useState } from 'react';

interface GenericToolWidgetProps {
  name: string;
  input: any;
  result?: any;
}

export function GenericToolWidget({ name, input, result }: GenericToolWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getToolIcon = () => {
    // Add more tool-specific icons as needed
    switch (name) {
      case 'write_file':
        return '💾';
      case 'delete_file':
        return '🗑️';
      case 'grep':
      case 'search':
        return '🔎';
      case 'git':
        return '🌿';
      default:
        return '🔧';
    }
  };

  return (
    <div className="rounded-lg bg-dark-surface border border-dark-border overflow-hidden">
      <div 
        className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-dark-hover transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{getToolIcon()}</span>
          <span className="font-medium">{name}</span>
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
          <div className="p-4">
            <div className="text-xs text-text-muted mb-1">Input:</div>
            <pre className="text-sm font-mono bg-dark-bg p-2 rounded overflow-x-auto max-h-40 overflow-y-auto custom-scrollbar">
              {JSON.stringify(input, null, 2)}
            </pre>
          </div>
          {result && (
            <div className="p-4 border-t border-dark-border">
              <div className="text-xs text-text-muted mb-1">Result:</div>
              <pre className="text-sm font-mono bg-dark-bg p-2 rounded overflow-x-auto max-h-40 overflow-y-auto custom-scrollbar">
                {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}