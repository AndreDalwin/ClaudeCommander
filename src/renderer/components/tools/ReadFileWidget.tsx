import React, { useState } from 'react';
import { Message } from '@shared/types';

interface ReadFileWidgetProps {
  tool: Message;
  result?: Message;
}

export function ReadFileWidget({ tool, result }: ReadFileWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const filePath = tool.input?.file_path || 'Unknown file';
  const fileName = filePath.split('/').pop() || filePath;
  const isSuccess = !result?.error;
  
  return (
    <div className="border border-dark-border rounded-lg bg-dark-surface overflow-hidden">
      {/* Compact Header */}
      <div 
        className="flex items-center justify-between px-3 py-2 bg-dark-hover cursor-pointer hover:bg-[#2a2a2c] transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-blue-500/20 rounded flex items-center justify-center">
            <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="text-sm font-medium text-text-primary">Read File</div>
          <div className="text-xs text-text-secondary">{fileName}</div>
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
          <div className="text-xs text-text-muted">
            <strong>File Path:</strong> {filePath}
          </div>
          
          {tool.input?.limit && (
            <div className="text-xs text-text-muted">
              <strong>Lines:</strong> {tool.input.offset || 0} - {(tool.input.offset || 0) + tool.input.limit}
            </div>
          )}

          {result && !result.error && (
            <div className="bg-dark-bg rounded-lg p-3 border border-dark-border">
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