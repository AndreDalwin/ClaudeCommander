import React, { useState, useEffect } from 'react';
import { HomeScreen } from './components/HomeScreen';
import { ProjectsView } from './components/ProjectsView';
import { ProjectDetailView } from './components/ProjectDetailView';
import { UnifiedSessionView } from './components/UnifiedSessionView';
import { SessionList } from './components/SessionList';
import { NewSessionDialog } from './components/NewSessionDialog';
import { ClaudeSession, SessionData, DiscoveredProject, DiscoveredSession } from '@shared/types';
import { ArrowLeft, Plus, FolderOpen } from 'lucide-react';

type ViewState = 'home' | 'projects' | 'project-detail' | 'session' | 'session-history';

function App() {
  const [currentView, setCurrentView] = useState<ViewState>('home');
  const [sessions, setSessions] = useState<ClaudeSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<DiscoveredProject | null>(null);
  const [selectedDiscoveredSession, setSelectedDiscoveredSession] = useState<DiscoveredSession | null>(null);
  const [showNewSession, setShowNewSession] = useState(false);
  const [claudeStatus, setClaudeStatus] = useState<{ connected: boolean; version: string; path: string } | null>(null);
  const [discoveredProjects, setDiscoveredProjects] = useState<DiscoveredProject[]>([]);
  const [newSessionPath, setNewSessionPath] = useState<string>('');
  const [projectDiscoveredSessions, setProjectDiscoveredSessions] = useState<DiscoveredSession[]>([]);

  useEffect(() => {
    loadSessions();
    loadClaudeStatus();
    loadDiscoveredProjects();
  }, []);

  // Load discovered sessions for current project when in session-history view
  useEffect(() => {
    if (currentView === 'session-history' && selectedProject) {
      const loadProjectSessions = async () => {
        try {
          const sessions = await window.claudeAPI.getDiscoveredSessions(selectedProject.id);
          setProjectDiscoveredSessions(sessions);
        } catch (error) {
          console.error('Failed to load project sessions:', error);
        }
      };
      loadProjectSessions();
    }
  }, [currentView, selectedProject]);

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
      default:
        setCurrentView('home');
    }
  };

  const handleSelectProject = (project: DiscoveredProject) => {
    setSelectedProject(project);
    setCurrentView('project-detail');
  };

  const handleSelectDiscoveredSession = async (session: DiscoveredSession) => {
    setSelectedDiscoveredSession(session);
    setCurrentView('session-history');
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
            onSelectActiveSession={(sessionId) => {
              setActiveSessionId(sessionId);
              setCurrentView('session');
            }}
            onBack={() => setCurrentView('projects')}
            onNewSession={() => {
              setNewSessionPath(selectedProject.path);
              setShowNewSession(true);
            }}
          />
        ) : null;
      
      case 'session':
        return activeSessionId ? (
          <UnifiedSessionView 
            sessionId={activeSessionId}
            onRefreshSessions={loadSessions}
            isHistorical={false}
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
      
      case 'session-history':
        return selectedDiscoveredSession && selectedProject ? (
          <UnifiedSessionView
            sessionId={selectedDiscoveredSession.id}
            onRefreshSessions={loadSessions}
            isHistorical={true}
            projectId={selectedProject.id}
            sessionName={selectedDiscoveredSession.first_message || `Session ${selectedDiscoveredSession.id.substring(0, 8)}`}
            projectPath={selectedProject.path}
          />
        ) : null;
      
      default:
        return null;
    }
  };

  const renderSidebar = () => {
    return (
      <aside className="w-80 bg-gradient-to-b from-[#1a1a1a] to-[#111111] border-r border-[#2a2a2a] flex flex-col shadow-xl">
        {/* Header with Navigation */}
        <div className="p-6 border-b border-[#2a2a2a] bg-[#1a1a1a]/95 backdrop-blur">
          <div className="flex gap-3 mb-4">
            <button 
              className="flex items-center gap-2 px-3 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-white text-sm transition-all duration-200 hover:bg-[#333333] hover:border-[#444444] flex-1"
              onClick={() => setCurrentView('projects')}
            >
              <FolderOpen className="w-4 h-4" />
              Projects
            </button>
            <button 
              className="flex items-center gap-2 px-3 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-white text-sm transition-all duration-200 hover:bg-[#333333] hover:border-[#444444] flex-1"
              onClick={() => setCurrentView('home')}
            >
              <ArrowLeft className="w-4 h-4" />
              Home
            </button>
          </div>
          
          {/* New Session Button */}
          <button 
            className="w-full flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium transition-all duration-200 hover:from-blue-600 hover:to-purple-600 shadow-lg"
            onClick={() => {
              if (currentView === 'session-history' && selectedProject) {
                setNewSessionPath(selectedProject.path);
              }
              setShowNewSession(true);
            }}
          >
            <Plus className="w-4 h-4" />
            New Session
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {currentView === 'session-history' ? (
            <>
              {/* Project Sessions */}
              <div className="p-4 border-b border-[#2a2a2a]">
                <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wide">
                  {selectedProject ? `${selectedProject.path.split('/').pop()} Sessions` : 'Project Sessions'}
                </h3>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {/* Active Sessions for this project */}
                {sessions.filter(s => s.isActive && selectedProject && s.projectPath === selectedProject.path).map((session) => (
                  <div
                    key={session.id}
                    className={`group p-4 rounded-xl cursor-pointer transition-all duration-200 border ${
                      activeSessionId === session.id
                        ? 'bg-[#2a2a2a] border-emerald-500/50 shadow-lg' 
                        : 'bg-[#1a1a1a] border-emerald-500/30 hover:bg-[#2a2a2a] hover:border-emerald-500/50'
                    }`}
                    onClick={() => {
                      setActiveSessionId(session.id);
                      setCurrentView('session');
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-500/20">
                        <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="text-sm text-white truncate">{session.name}</div>
                          <span className="bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded text-xs font-medium">
                            Active
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {session.messageCount} messages
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Historical Sessions */}
                {projectDiscoveredSessions.map((session) => (
                  <div
                    key={session.id}
                    className={`group p-4 rounded-xl cursor-pointer transition-all duration-200 border ${
                      selectedDiscoveredSession?.id === session.id
                        ? 'bg-[#2a2a2a] border-blue-500/50 shadow-lg' 
                        : 'bg-[#1a1a1a] border-[#2a2a2a] hover:bg-[#2a2a2a] hover:border-[#3a3a3a]'
                    }`}
                    onClick={() => {
                      setSelectedDiscoveredSession(session);
                      setCurrentView('session-history');
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-500/20">
                        <div className="w-3 h-3 text-blue-400">📜</div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-white mb-1 truncate">
                          {session.first_message || `Session ${session.id.substring(0, 8)}`}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(session.created_at * 1000).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {projectDiscoveredSessions.length === 0 && (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    No sessions found
                  </div>
                )}
              </div>
              
            </>
          ) : (
            <>
              <div className="p-4 border-b border-[#2a2a2a]">
                <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wide">All Sessions</h3>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                <SessionList 
                  sessions={sessions}
                  activeSessionId={activeSessionId}
                  onSelectSession={(sessionId) => {
                    setActiveSessionId(sessionId);
                    setCurrentView('session');
                  }}
                />
              </div>
            </>
          )}
        </div>
      </aside>
    );
  };

  return (
    <div className="flex h-screen bg-dark-bg text-text-primary custom-scrollbar">
      {(currentView === 'session' || currentView === 'session-history') ? (
        <>
          {renderSidebar()}
          {/* Main Content Area */}
          <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
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