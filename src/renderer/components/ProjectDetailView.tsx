import React, { useState, useEffect } from 'react';
import { DiscoveredProject, DiscoveredSession } from '@shared/types';

interface ProjectDetailViewProps {
  project: DiscoveredProject;
  onSelectSession: (session: DiscoveredSession) => void;
  onBack: () => void;
  onNewSession: () => void;
}

export function ProjectDetailView({ project, onSelectSession, onBack, onNewSession }: ProjectDetailViewProps) {
  const [sessions, setSessions] = useState<DiscoveredSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, [project.id]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const discoveredSessions = await window.claudeAPI.getDiscoveredSessions(project.id);
      setSessions(discoveredSessions);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  const truncateMessage = (message: string | undefined, maxLength = 100) => {
    if (!message) return 'No message';
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  return (
    <div className="w-full h-screen bg-dark-bg flex flex-col">
      <div className="flex items-center gap-5 px-10 py-5 bg-[#1a1a1a] border-b border-dark-border">
        <button 
          className="flex items-center gap-2 px-5 py-2.5 bg-dark-border border border-[#3e3e42] rounded-md text-text-primary text-sm transition-all duration-200 hover:bg-[#37373d] hover:-translate-x-0.5"
          onClick={onBack}
        >
          ← Back to Projects
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-semibold mb-1">{project.path.split('/').pop() || 'Project'}</h2>
          <div className="text-sm text-text-muted">{project.path}</div>
        </div>
        <button 
          className="flex items-center gap-2 px-6 py-3 bg-brand-blue text-white rounded-md text-sm font-medium transition-all duration-200 hover:bg-brand-blue-light hover:-translate-y-0.5 hover:shadow-lg"
          onClick={onNewSession}
        >
          + New Session Here
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center text-text-muted">
          <div className="w-10 h-10 border-3 border-dark-border border-t-brand-blue rounded-full animate-spin mb-5"></div>
          <p>Loading sessions...</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-5 lg:p-10">
          <div className="mb-5">
            <h3 className="text-xl text-text-secondary">Sessions ({sessions.length})</h3>
          </div>
          
          {sessions.map(session => (
            <div 
              key={session.id}
              className="bg-dark-surface border border-dark-border rounded-lg p-5 mb-4 cursor-pointer transition-all duration-200 flex items-center gap-4 hover:bg-dark-hover hover:border-[#3e3e42] hover:translate-x-1"
              onClick={() => onSelectSession(session)}
            >
              <div className="text-3xl opacity-70">💬</div>
              <div className="flex-1">
                <div className="text-base text-text-primary mb-2 leading-relaxed">
                  {truncateMessage(session.first_message)}
                </div>
                <div className="flex gap-4 text-sm text-text-muted">
                  <span className="font-mono">{session.id.substring(0, 8)}...</span>
                  <span>{formatDate(session.created_at)}</span>
                </div>
              </div>
              <div className="text-xl text-text-muted transition-all duration-200 group-hover:text-brand-blue">→</div>
            </div>
          ))}

          {sessions.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl opacity-30 mb-5">💭</div>
              <h3 className="text-2xl text-text-secondary mb-2">No sessions yet</h3>
              <p className="text-text-muted mb-8">Start a new session in this project</p>
              <button 
                className="px-8 py-3 bg-brand-blue text-white rounded-md text-base cursor-pointer transition-all duration-200 hover:bg-brand-blue-light hover:-translate-y-0.5 hover:shadow-lg"
                onClick={onNewSession}
              >
                Create First Session
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}