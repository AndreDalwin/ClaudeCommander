import React, { useState, useEffect } from 'react';
import { HomeScreen } from './components/HomeScreen';
import { ProjectsView } from './components/ProjectsView';
import { ProjectDetailView } from './components/ProjectDetailView';
import { SessionView } from './components/SessionView';
import { NewSessionDialog } from './components/NewSessionDialog';
import { ClaudeSession, SessionData, DiscoveredProject, DiscoveredSession } from '@shared/types';

type ViewState = 'home' | 'projects' | 'project-detail' | 'session' | 'active-sessions';

function App() {
  const [currentView, setCurrentView] = useState<ViewState>('home');
  const [sessions, setSessions] = useState<ClaudeSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<DiscoveredProject | null>(null);
  const [showNewSession, setShowNewSession] = useState(false);
  const [claudeStatus, setClaudeStatus] = useState<{ connected: boolean; version: string; path: string } | null>(null);
  const [discoveredProjects, setDiscoveredProjects] = useState<DiscoveredProject[]>([]);
  const [newSessionPath, setNewSessionPath] = useState<string>('');

  useEffect(() => {
    loadSessions();
    loadClaudeStatus();
    loadDiscoveredProjects();
  }, []);

  const loadSessions = async () => {
    try {
      console.log('Loading sessions...');
      const sessionList = await window.claudeAPI.getSessions();
      console.log('Sessions loaded:', sessionList);
      setSessions(sessionList);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  };

  const loadClaudeStatus = async () => {
    try {
      const status = await window.claudeAPI.getClaudeStatus();
      console.log('Claude status:', status);
      setClaudeStatus(status);
    } catch (error) {
      console.error('Failed to load Claude status:', error);
    }
  };

  const loadDiscoveredProjects = async () => {
    try {
      console.log('Loading discovered projects...');
      const projects = await window.claudeAPI.discoverProjects();
      console.log('Discovered projects:', projects);
      setDiscoveredProjects(projects);
    } catch (error) {
      console.error('Failed to load discovered projects:', error);
    }
  };

  const handleCreateSession = async (sessionData: SessionData) => {
    try {
      console.log('Creating session with data:', sessionData);
      const newSession = await window.claudeAPI.createSession(sessionData);
      console.log('Session created:', newSession);
      await loadSessions();
      setActiveSessionId(newSession.id);
      setShowNewSession(false);
      setCurrentView('session');
    } catch (error) {
      console.error('Failed to create session:', error);
      alert(`Failed to create session: ${(error as Error).message}`);
    }
  };

  const handleNavigate = (view: string) => {
    switch (view) {
      case 'home':
        setCurrentView('home');
        break;
      case 'projects':
        setCurrentView('projects');
        break;
      case 'new-session':
        setShowNewSession(true);
        break;
      case 'active-sessions':
        setCurrentView('active-sessions');
        break;
      default:
        setCurrentView('home');
    }
  };

  const handleSelectProject = (project: DiscoveredProject) => {
    setSelectedProject(project);
    setCurrentView('project-detail');
  };

  const handleSelectDiscoveredSession = async (session: DiscoveredSession) => {
    // For now, we'll show an alert. In the future, we can load the session history
    alert(`Loading session: ${session.id}\nFrom: ${session.project_path}\nCreated: ${new Date(session.created_at * 1000).toLocaleString()}`);
  };

  const stats = {
    totalProjects: discoveredProjects.length,
    totalSessions: discoveredProjects.reduce((acc, proj) => acc + proj.sessions.length, 0),
    activeSessions: sessions.filter(s => s.isActive).length
  };

  const renderContent = () => {
    switch (currentView) {
      case 'home':
        return (
          <HomeScreen 
            onNavigate={handleNavigate}
            claudeStatus={claudeStatus}
            stats={stats}
          />
        );
      
      case 'projects':
        return (
          <ProjectsView
            projects={discoveredProjects}
            onSelectProject={handleSelectProject}
            onBack={() => setCurrentView('home')}
          />
        );
      
      case 'project-detail':
        return selectedProject ? (
          <ProjectDetailView
            project={selectedProject}
            onSelectSession={handleSelectDiscoveredSession}
            onBack={() => setCurrentView('projects')}
            onNewSession={() => {
              setNewSessionPath(selectedProject.path);
              setShowNewSession(true);
            }}
          />
        ) : null;
      
      case 'session':
        return activeSessionId ? (
          <SessionView 
            sessionId={activeSessionId}
            onRefreshSessions={loadSessions}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-text-muted">
            <h2 className="text-2xl font-normal mb-4">No session selected</h2>
            <button 
              className="px-6 py-3 bg-brand-blue text-white rounded-md hover:bg-brand-blue-light"
              onClick={() => setCurrentView('home')}
            >
              Back to Home
            </button>
          </div>
        );
      
      case 'active-sessions':
        return (
          <div className="w-full h-screen bg-dark-bg overflow-y-auto">
            <div className="flex items-center gap-5 px-10 py-5 bg-[#1a1a1a] border-b border-dark-border">
              <button 
                className="flex items-center gap-2 px-5 py-2.5 bg-dark-border border border-[#3e3e42] rounded-md text-text-primary text-sm transition-all duration-200 hover:bg-[#37373d] hover:-translate-x-0.5"
                onClick={() => setCurrentView('home')}
              >
                ← Back
              </button>
              <h2 className="text-3xl font-semibold flex-1">Active Sessions</h2>
            </div>
            <div className="p-5 lg:p-10">
              {sessions.filter(s => s.isActive).map(session => (
                <div 
                  key={session.id}
                  className="bg-dark-surface border border-dark-border rounded-lg p-5 mb-4 cursor-pointer transition-all duration-200 hover:bg-dark-hover hover:border-[#3e3e42] hover:translate-x-1"
                  onClick={() => {
                    setActiveSessionId(session.id);
                    setCurrentView('session');
                  }}
                >
                  <div className="text-lg font-semibold text-text-primary mb-2">{session.name}</div>
                  <div className="text-sm text-text-muted">{session.projectPath}</div>
                </div>
              ))}
              {sessions.filter(s => s.isActive).length === 0 && (
                <div className="text-center py-16 text-text-muted">No active sessions</div>
              )}
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-dark-bg text-text-primary custom-scrollbar">
      {currentView === 'session' ? (
        <>
          <aside className="w-52 bg-dark-hover border-r border-[#3e3e42] flex flex-col">
            <div className="p-5 border-b border-[#3e3e42]">
              <button 
                className="w-full py-2.5 px-4 bg-dark-border border border-[#3e3e42] rounded text-text-primary text-sm transition-all duration-300 hover:bg-[#37373d] hover:border-brand-blue"
                onClick={() => setCurrentView('home')}
                title="Back to Home"
              >
                ← Home
              </button>
            </div>
            <div className="p-5">
              {sessions.find(s => s.id === activeSessionId) && (
                <>
                  <h3 className="mb-4 text-sm text-text-secondary uppercase tracking-wider">Current Session</h3>
                  <div className="text-base font-medium mb-2">
                    {sessions.find(s => s.id === activeSessionId)?.name}
                  </div>
                  <div className="text-xs text-text-muted break-all">
                    {sessions.find(s => s.id === activeSessionId)?.projectPath}
                  </div>
                </>
              )}
            </div>
          </aside>
          <main className="flex-1">
            {renderContent()}
          </main>
        </>
      ) : (
        <main className="w-full">
          {renderContent()}
        </main>
      )}

      {showNewSession && (
        <NewSessionDialog
          onClose={() => {
            setShowNewSession(false);
            setNewSessionPath('');
          }}
          onSubmit={handleCreateSession}
          defaultPath={newSessionPath}
        />
      )}
    </div>
  );
}

export default App;