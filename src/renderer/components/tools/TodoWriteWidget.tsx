import React from 'react';
import { Message } from '@shared/types';

interface TodoWriteWidgetProps {
  tool: Message;
  result?: Message;
}

export function TodoWriteWidget({ tool, result }: TodoWriteWidgetProps) {
  // Always expanded but compact design
  const todos = tool.input?.todos || [];
  const isSuccess = !result?.error;
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'in_progress': return 'text-yellow-400';
      case 'pending': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'in_progress':
        return (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'pending':
        return (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-300';
      case 'medium': return 'bg-yellow-500/20 text-yellow-300';
      case 'low': return 'bg-blue-500/20 text-blue-300';
      default: return 'bg-gray-500/20 text-gray-300';
    }
  };
  
  return (
    <div className="border border-dark-border rounded-lg bg-dark-surface overflow-hidden">
      {/* Compact Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-dark-hover border-b border-dark-border">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-purple-500/20 rounded flex items-center justify-center">
            <svg className="w-3 h-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <div className="text-sm font-medium text-text-primary">Update Todos</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-1.5 py-0.5 bg-purple-500/20 rounded text-xs text-purple-300">
            {todos.filter((t: any) => t.status === 'completed').length}/{todos.length}
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
        </div>
      </div>

      {/* Compact Content */}
      <div className="px-3 py-2">
        {todos.length > 0 ? (
          <div className="space-y-1">
            {todos.map((todo: any, index: number) => (
              <div key={todo.id || index} className="flex items-center gap-2 py-1">
                <div className={`${getStatusColor(todo.status)}`}>
                  {getStatusIcon(todo.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm truncate ${todo.status === 'completed' ? 'line-through text-text-muted' : 'text-text-primary'}`}>
                    {todo.content}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`px-1 py-0.5 rounded text-xs ${getPriorityColor(todo.priority)}`}>
                    {todo.priority.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-text-muted py-1">No tasks</div>
        )}

        {result?.error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded p-2 mt-2">
            <div className="text-red-400 text-xs">{result.error}</div>
          </div>
        )}
      </div>
    </div>
  );
}