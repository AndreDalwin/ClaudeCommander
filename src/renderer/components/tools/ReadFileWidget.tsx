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
    <div className="border border-dark-border rounded-xl bg-dark-surface overflow-hidden">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 bg-dark-hover border-b border-dark-border cursor-pointer hover:bg-[#2a2a2c] transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <div className="font-medium text-text-primary">Read File</div>
            <div className="text-sm text-text-secondary">{fileName}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isSuccess ? (
            <div className="flex items-center gap-1 text-green-400 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Success
            </div>
          ) : (
            <div className="flex items-center gap-1 text-red-400 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Failed
            </div>
          )}
          <svg className={`w-4 h-4 transition-transform text-text-secondary ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 space-y-3">
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