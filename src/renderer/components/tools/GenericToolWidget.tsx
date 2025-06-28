import React, { useState } from 'react';
import { Message } from '@shared/types';

interface GenericToolWidgetProps {
  tool: Message;
  result?: Message;
}

export function GenericToolWidget({ tool, result }: GenericToolWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isSuccess = !result?.error;
  
  return (
    <div className="border border-dark-border rounded-xl bg-dark-surface overflow-hidden">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 bg-dark-hover border-b border-dark-border cursor-pointer hover:bg-[#2a2a2c] transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-500/20 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <div className="font-medium text-text-primary">{tool.name || 'Tool'}</div>
            <div className="text-sm text-text-secondary">Generic tool execution</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isSuccess ? (
            <div className="flex items-center gap-1 text-green-400 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Complete
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
          {tool.input && (
            <div className="bg-dark-bg rounded-lg p-3 border border-dark-border">
              <div className="text-sm font-medium text-text-primary mb-2">Input:</div>
              <pre className="text-sm text-text-secondary font-mono whitespace-pre-wrap overflow-x-auto">
                {JSON.stringify(tool.input, null, 2)}
              </pre>
            </div>
          )}

          {result && !result.error && (
            <div className="bg-dark-bg rounded-lg p-3 border border-dark-border">
              <div className="text-sm font-medium text-text-primary mb-2">Output:</div>
              <pre className="text-sm text-text-secondary font-mono whitespace-pre-wrap overflow-x-auto">
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