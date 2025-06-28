import React, { useState } from 'react';
import { Message } from '@shared/types';

interface ToolWidgetProps {
  message: Message;
  result?: Message;
}

export function ToolWidget({ message, result }: ToolWidgetProps) {
  const getToolComponent = () => {
    switch (message.name) {
      case 'Read':
        return <ReadWidget tool={message} result={result} />;
      case 'Edit':
        return <EditWidget tool={message} result={result} />;
      case 'MultiEdit':
        return <MultiEditWidget tool={message} result={result} />;
      case 'Glob':
        return <GlobWidget tool={message} result={result} />;
      case 'str_replace_editor':
        return <StrReplaceEditorWidget tool={message} result={result} />;
      case 'bash':
        return <BashWidget tool={message} result={result} />;
      case 'list_files':
        return <ListFilesWidget tool={message} result={result} />;
      default:
        return <GenericToolWidget tool={message} result={result} />;
    }
  };

  return (
    <div className="tool-widget my-4">
      {getToolComponent()}
    </div>
  );
}

// Read Tool Widget
function ReadWidget({ tool, result }: { tool: Message; result?: Message }) {
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

// Edit Tool Widget
function EditWidget({ tool, result }: { tool: Message; result?: Message }) {
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
          <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div>
            <div className="font-medium text-text-primary">Edit File</div>
            <div className="text-sm text-text-secondary">{fileName}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isSuccess ? (
            <div className="flex items-center gap-1 text-green-400 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Applied
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
        <div className="p-4 space-y-4">
          <div className="text-xs text-text-muted">
            <strong>File Path:</strong> {filePath}
          </div>

          {/* Diff Display */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-text-primary">Changes:</div>
            <div className="bg-dark-bg rounded-lg border border-dark-border overflow-hidden">
              {/* Removed Lines */}
              {tool.input?.old_string && (
                <div className="bg-red-900/20 border-l-4 border-red-500 p-3">
                  <div className="text-xs text-red-300 mb-1">- Removed</div>
                  <pre className="text-sm text-red-200 font-mono whitespace-pre-wrap">
                    {tool.input.old_string}
                  </pre>
                </div>
              )}
              
              {/* Added Lines */}
              {tool.input?.new_string && (
                <div className="bg-green-900/20 border-l-4 border-green-500 p-3">
                  <div className="text-xs text-green-300 mb-1">+ Added</div>
                  <pre className="text-sm text-green-200 font-mono whitespace-pre-wrap">
                    {tool.input.new_string}
                  </pre>
                </div>
              )}
            </div>
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

// MultiEdit Tool Widget
function MultiEditWidget({ tool, result }: { tool: Message; result?: Message }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const filePath = tool.input?.file_path || 'Unknown file';
  const fileName = filePath.split('/').pop() || filePath;
  const edits = tool.input?.edits || [];
  const isSuccess = !result?.error;
  
  return (
    <div className="border border-dark-border rounded-xl bg-dark-surface overflow-hidden">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 bg-dark-hover border-b border-dark-border cursor-pointer hover:bg-[#2a2a2c] transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            </svg>
          </div>
          <div>
            <div className="font-medium text-text-primary">Multiple Edits</div>
            <div className="text-sm text-text-secondary">{fileName}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-2 py-1 bg-purple-500/20 rounded text-xs text-purple-300">
            {edits.length} edits
          </div>
          {isSuccess ? (
            <div className="flex items-center gap-1 text-green-400 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Applied
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
        <div className="p-4 space-y-4">
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

// Glob Tool Widget
function GlobWidget({ tool, result }: { tool: Message; result?: Message }) {
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

// Generic Tool Widget for other tools
function GenericToolWidget({ tool, result }: { tool: Message; result?: Message }) {
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

// Placeholder widgets for other common tools
function StrReplaceEditorWidget({ tool, result }: { tool: Message; result?: Message }) {
  return <EditWidget tool={tool} result={result} />;
}

function BashWidget({ tool, result }: { tool: Message; result?: Message }) {
  return <GenericToolWidget tool={tool} result={result} />;
}

function ListFilesWidget({ tool, result }: { tool: Message; result?: Message }) {
  return <GlobWidget tool={tool} result={result} />;
}