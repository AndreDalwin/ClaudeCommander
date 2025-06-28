import React from 'react';
import { ClaudeSession } from '@shared/types';

interface SessionListProps {
  sessions: ClaudeSession[];
  activeSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
}

export function SessionList({ sessions, activeSessionId, onSelectSession }: SessionListProps) {
  return (
    <div className="flex-1 overflow-y-auto p-2.5">
      {sessions.map((session) => (
        <div
          key={session.id}
          className={`p-3 mb-2 bg-dark-border rounded cursor-pointer transition-all duration-200 ${
            session.id === activeSessionId 
              ? 'bg-[#37373d] border-l-[3px] border-brand-blue' 
              : 'hover:bg-[#37373d]'
          }`}
          onClick={() => onSelectSession(session.id)}
        >
          <div className="font-medium mb-1">{session.name}</div>
          <div className="text-xs text-text-secondary mb-1">
            <span>{session.projectPath.split('/').pop()}</span>
            {session.isActive && <span className="bg-[#16825d] text-white px-1.5 py-0.5 rounded text-[10px] ml-2">Active</span>}
          </div>
          <div className="text-[11px] text-text-muted">
            {session.messageCount} messages
          </div>
        </div>
      ))}
    </div>
  );
}