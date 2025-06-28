import React, { useState } from 'react';
import { Message } from '@shared/types';

interface MultiEditWidgetProps {
  tool: Message;
  result?: Message;
}

export function MultiEditWidget({ tool, result }: MultiEditWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const filePath = tool.input?.file_path || 'Unknown file';
  const fileName = filePath.split('/').pop() || filePath;
  const edits = tool.input?.edits || [];
  const isSuccess = !result?.error;
  
  return (
    <div className="border border-dark-border rounded-lg bg-dark-surface overflow-hidden">
      {/* Compact Header */}
      <div 
        className="flex items-center justify-between px-3 py-2 bg-dark-hover cursor-pointer hover:bg-[#2a2a2c] transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-purple-500/20 rounded flex items-center justify-center">
            <svg className="w-3 h-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            </svg>
          </div>
          <div className="text-sm font-medium text-text-primary">MultiEdit</div>
          <div className="text-xs text-text-secondary">{fileName}</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-1.5 py-0.5 bg-purple-500/20 rounded text-xs text-purple-300">
            {edits.length}
          </div>
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

          {/* Edits List */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-text-primary">Edits Applied:</div>
            {edits.map((edit: any, index: number) => (
              <div key={index} className="bg-dark-bg rounded-lg border border-dark-border overflow-hidden">
                <div className="p-2 bg-dark-hover border-b border-dark-border">
                  <div className="text-xs text-text-secondary">Edit #{index + 1}</div>
                </div>
                
                {/* Removed */}
                <div className="bg-red-900/20 border-l-4 border-red-500 p-3">
                  <div className="text-xs text-red-300 mb-1">- Removed</div>
                  <pre className="text-sm text-red-200 font-mono whitespace-pre-wrap">
                    {edit.old_string}
                  </pre>
                </div>
                
                {/* Added */}
                <div className="bg-green-900/20 border-l-4 border-green-500 p-3">
                  <div className="text-xs text-green-300 mb-1">+ Added</div>
                  <pre className="text-sm text-green-200 font-mono whitespace-pre-wrap">
                    {edit.new_string}
                  </pre>
                </div>
              </div>
            ))}
          </div>

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