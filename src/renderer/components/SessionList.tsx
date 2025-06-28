import React from 'react';
import { ClaudeSession } from '@shared/types';

interface SessionListProps {
  sessions: ClaudeSession[];
  activeSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
}

export function SessionList({ sessions, activeSessionId, onSelectSession }: SessionListProps) {
  return (
    <div className="session-list">
      {sessions.map((session) => (
        <div
          key={session.id}
          className={`session-item ${session.id === activeSessionId ? 'active' : ''}`}
          onClick={() => onSelectSession(session.id)}
        >
          <div className="session-name">{session.name}</div>
          <div className="session-meta">
            <span className="session-path">{session.projectPath.split('/').pop()}</span>
            {session.isActive && <span className="session-status">Active</span>}
          </div>
          <div className="session-info">
            {session.messageCount} messages
          </div>
        </div>
      ))}
    </div>
  );
}