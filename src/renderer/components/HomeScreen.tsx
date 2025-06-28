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
    <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-[#0d0d0d] to-[#1a1a1a]">
      <div className="text-center max-w-4xl px-10">
        <div className="mb-12 animate-fade-in-up">
          <h1 className="text-5xl font-extrabold tracking-wider mb-2 bg-gradient-to-r from-[#0e639c] to-[#1177bb] bg-clip-text text-transparent">
            COMMANDER IN CHIEF
          </h1>
          <p className="text-lg text-text-secondary">Claude Code Session Manager</p>
        </div>

        <div className="mb-10 animate-fade-in-up animation-delay-200">
          {claudeStatus ? (
            <div className="inline-flex flex-col items-center px-10 py-5 bg-dark-surface rounded-xl border border-dark-border">
              <div className={`flex items-center gap-3 text-base font-medium ${claudeStatus.connected ? 'text-green-500' : 'text-red-500'}`}>
                <span className="text-xl">{claudeStatus.connected ? '✓' : '✗'}</span>
                <span>
                  {claudeStatus.connected ? 'Claude Code Connected' : 'Claude Code Not Found'}
                </span>
              </div>
              {claudeStatus.connected && (
                <div className="mt-2 text-sm text-text-muted">{claudeStatus.version}</div>
              )}
            </div>
          ) : (
            <div className="text-text-muted italic">Checking Claude status...</div>
          )}
        </div>

        <div className="flex gap-5 justify-center mb-10 animate-fade-in-up animation-delay-400">
          <div className="bg-dark-surface px-8 py-7 rounded-xl border border-dark-border min-w-[150px] transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
            <div className="text-4xl font-bold text-brand-blue mb-2">{stats.totalProjects}</div>
            <div className="text-sm text-text-secondary">Projects</div>
          </div>
          <div className="bg-dark-surface px-8 py-7 rounded-xl border border-dark-border min-w-[150px] transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
            <div className="text-4xl font-bold text-brand-blue mb-2">{stats.totalSessions}</div>
            <div className="text-sm text-text-secondary">Total Sessions</div>
          </div>
          <div className="bg-dark-surface px-8 py-7 rounded-xl border border-dark-border min-w-[150px] transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
            <div className="text-4xl font-bold text-brand-blue mb-2">{stats.activeSessions}</div>
            <div className="text-sm text-text-secondary">Active Sessions</div>
          </div>
        </div>

        <div className="flex gap-5 justify-center mb-10 animate-fade-in-up animation-delay-600">
          <button 
            className="flex items-center gap-3 px-8 py-4 bg-brand-blue text-white rounded-lg text-base font-medium transition-all duration-300 hover:bg-brand-blue-light hover:-translate-y-0.5 hover:shadow-lg"
            onClick={() => onNavigate('projects')}
          >
            <span className="text-xl">📁</span>
            <span>Browse Projects</span>
          </button>
          
          <button 
            className="flex items-center gap-3 px-8 py-4 bg-dark-border text-text-primary border border-[#3e3e42] rounded-lg text-base font-medium transition-all duration-300 hover:bg-[#37373d] hover:-translate-y-0.5"
            onClick={() => onNavigate('new-session')}
          >
            <span className="text-xl">+</span>
            <span>New Session</span>
          </button>
        </div>

        <div className="animate-fade-in-up animation-delay-800">
          <h3 className="mb-5 text-text-secondary">Quick Actions</h3>
          <div className="flex gap-4 justify-center">
            <button 
              className="flex flex-col items-center gap-2 px-8 py-5 bg-dark-surface border border-dark-border rounded-lg transition-all duration-300 hover:bg-dark-hover hover:border-dark-hover hover:-translate-y-0.5"
              onClick={() => onNavigate('active-sessions')}
            >
              <span className="text-2xl">🟢</span>
              <span className="text-sm text-text-primary">Active Sessions</span>
            </button>
            <button 
              className="flex flex-col items-center gap-2 px-8 py-5 bg-dark-surface border border-dark-border rounded-lg transition-all duration-300 hover:bg-dark-hover hover:border-dark-hover hover:-translate-y-0.5"
              onClick={() => onNavigate('recent')}
            >
              <span className="text-2xl">🕐</span>
              <span className="text-sm text-text-primary">Recent Sessions</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}