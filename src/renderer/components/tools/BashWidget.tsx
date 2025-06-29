import React, { useState } from 'react';
import { Message } from '@shared/types';

interface BashWidgetProps {
  tool: Message;
  result?: Message;
}

export function BashWidget({ tool, result }: BashWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isSuccess = !result?.error;
  
  return (
    <div className="border border-dark-border rounded-lg bg-dark-surface overflow-hidden">
      {/* Compact Header */}
      <div 
        className="flex items-center justify-between px-3 py-2 bg-dark-hover cursor-pointer hover:bg-[#2a2a2c] transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-gray-500/20 rounded flex items-center justify-center">
            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="text-sm font-medium text-text-primary">Bash</div>
          <div className="text-xs text-text-secondary font-mono truncate max-w-xs">{tool.input?.command || 'Unknown command'}</div>
        </div>
        <div className="flex items-center gap-2">
          {isSuccess ? (
            <div className="w-3 h-3 text-green-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : (
            <div className="w-3 h-3 text-red-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}
          <svg className={`w-3 h-3 transition-transform text-text-secondary ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="border-t border-dark-border p-3 space-y-3">
          <div className="bg-dark-bg rounded-lg p-3 border border-dark-border">
            <div className="text-xs text-text-muted mb-2">Command:</div>
            <code className="text-sm font-mono text-green-400">$ {tool.input?.command}</code>
          </div>

          {tool.input?.description && (
            <div className="text-xs text-text-muted">
              <strong>Description:</strong> {tool.input.description}
            </div>
          )}

          {result && !result.error && (
            <div className="bg-dark-bg rounded-lg p-3 border border-dark-border">
              <div className="text-xs text-text-muted mb-2">Output:</div>
              <pre className="text-sm text-text-primary whitespace-pre-wrap overflow-x-auto font-mono">
                {typeof result.output === 'string' ? result.output : JSON.stringify(result.output, null, 2)}
              </pre>
            </div>
          )}

          {result?.error && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
              <div className="text-red-400 text-sm">{result.error}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}