import React, { useState } from 'react';

interface StrReplaceEditorWidgetProps {
  input: {
    command: string;
    path: string;
    old_str?: string;
    new_str?: string;
    view_range?: [number, number];
  };
  result?: any;
}

export function StrReplaceEditorWidget({ input, result }: StrReplaceEditorWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const renderIcon = () => {
    switch (input.command) {
      case 'view':
        return '👁️';
      case 'str_replace':
      case 'str_replace_based_edit_tool':
        return '✏️';
      case 'create':
        return '📄';
      default:
        return '📝';
    }
  };

  const renderTitle = () => {
    const fileName = input.path.split('/').pop() || input.path;
    switch (input.command) {
      case 'view':
        return `Viewing ${fileName}`;
      case 'str_replace':
      case 'str_replace_based_edit_tool':
        return `Editing ${fileName}`;
      case 'create':
        return `Creating ${fileName}`;
      default:
        return `${input.command} ${fileName}`;
    }
  };

  return (
    <div className="rounded-lg bg-dark-surface border border-dark-border overflow-hidden">
      <div 
        className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-dark-hover transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{renderIcon()}</span>
          <span className="font-medium">{renderTitle()}</span>
          {input.view_range && (
            <span className="text-xs text-text-muted">
              Lines {input.view_range[0]}-{input.view_range[1]}
            </span>
          )}
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
          {input.command === 'str_replace' && input.old_str && (
            <div className="p-4 space-y-3">
              <div>
                <div className="text-xs text-text-muted mb-1">Replacing:</div>
                <pre className="text-sm font-mono bg-dark-bg p-2 rounded overflow-x-auto">
                  {input.old_str}
                </pre>
              </div>
              <div>
                <div className="text-xs text-text-muted mb-1">With:</div>
                <pre className="text-sm font-mono bg-dark-bg p-2 rounded overflow-x-auto">
                  {input.new_str}
                </pre>
              </div>
            </div>
          )}

          {result && (
            <div className="p-4 border-t border-dark-border">
              <div className="text-xs text-text-muted mb-1">Result:</div>
              <pre className="text-sm font-mono bg-dark-bg p-2 rounded overflow-x-auto max-h-64 overflow-y-auto custom-scrollbar">
                {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}