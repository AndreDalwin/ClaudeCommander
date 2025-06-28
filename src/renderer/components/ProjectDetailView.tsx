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

  const truncateMessage = (message: string | undefined, maxLength: number = 100) => {
    if (!message) return 'No message';
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  return (
    <div className="project-detail-view">
      <div className="view-header">
        <button className="back-btn" onClick={onBack}>
          ← Back to Projects
        </button>
        <div className="project-header-info">
          <h2>{project.path.split('/').pop() || 'Project'}</h2>
          <div className="project-full-path">{project.path}</div>
        </div>
        <button className="new-session-btn" onClick={onNewSession}>
          + New Session Here
        </button>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading sessions...</p>
        </div>
      ) : (
        <div className="sessions-list">
          <div className="sessions-header">
            <h3>Sessions ({sessions.length})</h3>
          </div>
          
          {sessions.map(session => (
            <div 
              key={session.id}
              className="session-card"
              onClick={() => onSelectSession(session)}
            >
              <div className="session-icon">💬</div>
              <div className="session-content">
                <div className="session-preview">
                  {truncateMessage(session.first_message)}
                </div>
                <div className="session-meta">
                  <span className="session-id">{session.id.substring(0, 8)}...</span>
                  <span className="session-date">{formatDate(session.created_at)}</span>
                </div>
              </div>
              <div className="session-arrow">→</div>
            </div>
          ))}

          {sessions.length === 0 && (
            <div className="empty-sessions">
              <div className="empty-icon">💭</div>
              <h3>No sessions yet</h3>
              <p>Start a new session in this project</p>
              <button className="empty-cta-btn" onClick={onNewSession}>
                Create First Session
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}