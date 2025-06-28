import React from 'react';

interface HomeScreenProps {
  onNavigate: (view: string) => void;
  claudeStatus: { connected: boolean; version: string; path: string } | null;
  stats: {
    totalProjects: number;
    totalSessions: number;
    activeSessions: number;
  };
}

export function HomeScreen({ onNavigate, claudeStatus, stats }: HomeScreenProps) {
  return (
    <div className="home-screen">
      <div className="home-content">
        <div className="brand-section">
          <h1 className="app-title">COMMANDER IN CHIEF</h1>
          <p className="app-subtitle">Claude Code Session Manager</p>
        </div>

        <div className="status-section">
          {claudeStatus ? (
            <div className="claude-connection">
              <div className={`connection-status ${claudeStatus.connected ? 'connected' : 'disconnected'}`}>
                <span className="status-icon">{claudeStatus.connected ? '✓' : '✗'}</span>
                <span className="status-text">
                  {claudeStatus.connected ? 'Claude Code Connected' : 'Claude Code Not Found'}
                </span>
              </div>
              {claudeStatus.connected && (
                <div className="version-info">{claudeStatus.version}</div>
              )}
            </div>
          ) : (
            <div className="loading-status">Checking Claude status...</div>
          )}
        </div>

        <div className="stats-section">
          <div className="stat-card">
            <div className="stat-value">{stats.totalProjects}</div>
            <div className="stat-label">Projects</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.totalSessions}</div>
            <div className="stat-label">Total Sessions</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.activeSessions}</div>
            <div className="stat-label">Active Sessions</div>
          </div>
        </div>

        <div className="action-buttons">
          <button 
            className="primary-action-btn"
            onClick={() => onNavigate('projects')}
          >
            <span className="btn-icon">📁</span>
            <span className="btn-text">Browse Projects</span>
          </button>
          
          <button 
            className="secondary-action-btn"
            onClick={() => onNavigate('new-session')}
          >
            <span className="btn-icon">+</span>
            <span className="btn-text">New Session</span>
          </button>
        </div>

        <div className="quick-actions">
          <h3>Quick Actions</h3>
          <div className="quick-action-grid">
            <button 
              className="quick-action-btn"
              onClick={() => onNavigate('active-sessions')}
            >
              <span className="action-icon">🟢</span>
              <span className="action-label">Active Sessions</span>
            </button>
            <button 
              className="quick-action-btn"
              onClick={() => onNavigate('recent')}
            >
              <span className="action-icon">🕐</span>
              <span className="action-label">Recent Sessions</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}