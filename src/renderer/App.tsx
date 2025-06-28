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
          <div className="empty-state">
            <h2>No session selected</h2>
            <button onClick={() => setCurrentView('home')}>Back to Home</button>
          </div>
        );
      
      case 'active-sessions':
        return (
          <div className="active-sessions-view">
            <div className="view-header">
              <button className="back-btn" onClick={() => setCurrentView('home')}>
                ← Back
              </button>
              <h2>Active Sessions</h2>
            </div>
            <div className="sessions-list">
              {sessions.filter(s => s.isActive).map(session => (
                <div 
                  key={session.id}
                  className="session-item"
                  onClick={() => {
                    setActiveSessionId(session.id);
                    setCurrentView('session');
                  }}
                >
                  <div className="session-name">{session.name}</div>
                  <div className="session-path">{session.projectPath}</div>
                </div>
              ))}
              {sessions.filter(s => s.isActive).length === 0 && (
                <div className="empty-state">No active sessions</div>
              )}
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="app">
      {currentView === 'session' ? (
        <>
          <aside className="sidebar compact">
            <div className="sidebar-header">
              <button 
                className="home-btn"
                onClick={() => setCurrentView('home')}
                title="Back to Home"
              >
                ← Home
              </button>
            </div>
            <div className="session-info-sidebar">
              {sessions.find(s => s.id === activeSessionId) && (
                <>
                  <h3>Current Session</h3>
                  <div className="session-name">
                    {sessions.find(s => s.id === activeSessionId)?.name}
                  </div>
                  <div className="session-path">
                    {sessions.find(s => s.id === activeSessionId)?.projectPath}
                  </div>
                </>
              )}
            </div>
          </aside>
          <main className="main-content expanded">
            {renderContent()}
          </main>
        </>
      ) : (
        <main className="main-content full">
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