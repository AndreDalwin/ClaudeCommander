import React, { useState } from 'react';
import { Message } from '@shared/types';

interface GlobWidgetProps {
  tool: Message;
  result?: Message;
}

export function GlobWidget({ tool, result }: GlobWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const pattern = tool.input?.pattern || '';
  const path = tool.input?.path || 'Current directory';
  const isSuccess = !result?.error;
  const files = result?.output ? (typeof result.output === 'string' ? result.output.split('\n').filter(Boolean) : []) : [];
  
  return (
    <div className="border border-dark-border rounded-xl bg-dark-surface overflow-hidden">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 bg-dark-hover border-b border-dark-border cursor-pointer hover:bg-[#2a2a2c] transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div>
            <div className="font-medium text-text-primary">File Search</div>
            <div className="text-sm text-text-secondary font-mono">{pattern}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isSuccess && (
            <div className="px-2 py-1 bg-cyan-500/20 rounded text-xs text-cyan-300">
              {files.length} files
            </div>
          )}
          {isSuccess ? (
            <div className="flex items-center gap-1 text-green-400 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Found
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="text-text-muted">
              <strong>Pattern:</strong> <span className="font-mono">{pattern}</span>
            </div>
            <div className="text-text-muted">
              <strong>Path:</strong> {path}
            </div>
          </div>

          {isSuccess && files.length > 0 && (
            <div className="bg-dark-bg rounded-lg border border-dark-border">
              <div className="p-3 border-b border-dark-border">
                <div className="text-sm font-medium text-text-primary">Found Files:</div>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 hover:bg-dark-hover border-b border-dark-border last:border-b-0">
                    <svg className="w-4 h-4 text-text-muted flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-sm font-mono text-text-primary truncate">{file}</span>
                  </div>
                ))}
              </div>
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