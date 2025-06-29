import React from 'react';
import { ClaudeSession } from '@shared/types';
import { MessageSquare, Folder, Play } from 'lucide-react';

interface SessionListProps {
  sessions: ClaudeSession[];
  activeSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
}

export function SessionList({ sessions, activeSessionId, onSelectSession }: SessionListProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-2">
      {sessions.map((session) => (
        <div
          key={session.id}
          className={`group p-4 rounded-xl cursor-pointer transition-all duration-200 border ${
            session.id === activeSessionId 
              ? 'bg-[#2a2a2a] border-blue-500/50 shadow-lg' 
              : 'bg-[#1a1a1a] border-[#2a2a2a] hover:bg-[#2a2a2a] hover:border-[#3a3a3a]'
          }`}
          onClick={() => onSelectSession(session.id)}
        >
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              session.isActive ? 'bg-emerald-500/20' : 'bg-blue-500/20'
            }`}>
              {session.isActive ? (
                <Play className="w-5 h-5 text-emerald-400" />
              ) : (
                <MessageSquare className="w-5 h-5 text-blue-400" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-white truncate">{session.name}</h3>
                {session.isActive && (
                  <span className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-lg text-xs font-medium">
                    Active
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-1 text-xs text-gray-400 mb-2">
                <Folder className="w-3 h-3" />
                <span className="truncate">{session.projectPath.split('/').pop()}</span>
              </div>
              
              <div className="text-xs text-gray-500">
                {session.messageCount} messages
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}