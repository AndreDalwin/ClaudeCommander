import React, { useState, useEffect } from 'react';
import { HomeScreen } from './components/HomeScreen';
import { ProjectsView } from './components/ProjectsView';
import { ProjectDetailView } from './components/ProjectDetailView';
import { UnifiedSessionView } from './components/UnifiedSessionView';
import { NewSessionDialog } from './components/NewSessionDialog';
import SessionListItem from './components/SessionListItem';
import { ClaudeSession, SessionData, DiscoveredProject, DiscoveredSession } from '@shared/types';
import { ArrowLeft, Plus, Home } from 'lucide-react';

type ViewState = 'home' | 'projects' | 'project-detail' | 'session';

function App() {
  const [currentView, setCurrentView] = useState<ViewState>('home');
  const [sessions, setSessions] = useState<ClaudeSession[]>([]);
  const [selectedProject, setSelectedProject] = useState<DiscoveredProject | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedSessionType, setSelectedSessionType] = useState<'active' | 'historical' | null>(null);
  const [showNewSession, setShowNewSession] = useState(false);
  const [claudeStatus, setClaudeStatus] = useState<{ connected: boolean; version: string; path: string } | null>(null);
  const [discoveredProjects, setDiscoveredProjects] = useState<DiscoveredProject[]>([]);
  const [newSessionPath, setNewSessionPath] = useState<string>('');
  const [projectDiscoveredSessions, setProjectDiscoveredSessions] = useState<DiscoveredSession[]>([]);
  const [sessionMetadata, setSessionMetadata] = useState<Record<string, any>>({});

  useEffect(() => {
    loadSessions();
    loadClaudeStatus();
    loadDiscoveredProjects();
    loadMetadata();
  }, []);

  // Load discovered sessions for current project when in session view
  useEffect(() => {
    if (currentView === 'session' && selectedProject) {
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

  const loadMetadata = async () => {
    try {
      const metadata = await window.claudeAPI.getAllMetadata();
      setSessionMetadata(metadata.sessions || {});
    } catch (error) {
      console.error('Failed to load session metadata:', error);
    }
  };

  const handleCreateSession = async (sessionData: SessionData) => {
    try {
      console.log('Creating session with data:', sessionData);
      const newSession = await window.claudeAPI.createSession(sessionData);
      console.log('Session created:', newSession);
      await loadSessions();
      
      // Find or create project for this session
      const projectPath = newSession.projectPath;
      let project = discoveredProjects.find(p => p.path === projectPath);
      if (!project) {
        await loadDiscoveredProjects();
        project = discoveredProjects.find(p => p.path === projectPath);
      }
      
      if (project) {
        setSelectedProject(project);
      }
      
      setSelectedSessionId(newSession.id);
      setSelectedSessionType('active');
      setShowNewSession(false);
      setCurrentView('session');
    } catch (error) {
      console.error('Failed to create session:', error);
      alert(`Failed to create session: ${(error as Error).message}`);
    }
  };

  const handleRenameSession = async (sessionId: string, claudeSessionId: string | undefined, newName: string) => {
    try {
      const result = await window.claudeAPI.updateSessionName({ 
        sessionId, 
        claudeSessionId, 
        newName 
      });
      
      if (result.success) {
        // Update local state for active sessions
        setSessions(prevSessions => 
          prevSessions.map(s => 
            s.id === sessionId ? { ...s, name: newName } : s
          )
        );
        
        // Reload metadata to get the updated custom name
        await loadMetadata();
      } else {
        console.error('Failed to rename session:', result.error);
        alert(`Failed to rename session: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to rename session:', error);
      alert(`Failed to rename session: ${(error as Error).message}`);
    }
  };

  const handleDeleteSession = async (sessionId: string | undefined, claudeSessionId: string) => {
    try {
      const result = await window.claudeAPI.deleteSession({ 
        sessionId, 
        claudeSessionId 
      });
      
      if (result.success) {
        // Remove from active sessions if it exists
        if (sessionId) {
          setSessions(prevSessions => 
            prevSessions.filter(s => s.id !== sessionId)
          );
        }
        
        // Remove from discovered sessions
        setProjectDiscoveredSessions(prevSessions =>
          prevSessions.filter(s => s.id !== claudeSessionId)
        );
        
        // If this was the selected session, clear selection
        if (selectedSessionId === (sessionId || claudeSessionId)) {
          setSelectedSessionId(null);
          setSelectedSessionType(null);
        }
      } else {
        console.error('Failed to delete session:', result.error);
        alert(`Failed to delete session: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
      alert(`Failed to delete session: ${(error as Error).message}`);
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

  const handleSelectProject = async (project: DiscoveredProject) => {
    setSelectedProject(project);
    
    // Load sessions for this project
    try {
      const projectSessions = await window.claudeAPI.getDiscoveredSessions(project.id);
      setProjectDiscoveredSessions(projectSessions);
      
      // Find the latest session (sessions are typically ordered by creation time)
      if (projectSessions.length > 0) {
        // Get the most recent session
        const latestSession = projectSessions.reduce((latest, current) => {
          return current.created_at > latest.created_at ? current : latest;
        }, projectSessions[0]);
        
        setSelectedSessionId(latestSession.id);
        setSelectedSessionType('historical');
        setCurrentView('session');
      } else {
        // If no sessions, still go to project detail view
        setCurrentView('project-detail');
      }
    } catch (error) {
      console.error('Failed to load project sessions:', error);
      setCurrentView('project-detail');
    }
  };

  const handleSelectDiscoveredSession = async (session: DiscoveredSession) => {
    setSelectedSessionId(session.id);
    setSelectedSessionType('historical');
    setCurrentView('session');
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
              setSelectedSessionId(sessionId);
              setSelectedSessionType('active');
              setCurrentView('session');
            }}
            onBack={() => setCurrentView('projects')}
            onNewSession={() => {
              setNewSessionPath(selectedProject.path);
              setShowNewSession(true);
            }}
          />
        ) : null;
      
      case 'session': {
        if (!selectedSessionId || !selectedProject) {
          return (
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
        }
        
        // Find session details
        const activeSession = sessions.find(s => s.id === selectedSessionId);
        const discoveredSession = projectDiscoveredSessions.find(s => s.id === selectedSessionId);
        
        // Get custom name from metadata if available
        const claudeSessionId = activeSession?.claudeSessionId || selectedSessionId;
        const metadata = sessionMetadata[claudeSessionId];
        const customName = metadata?.customName;
        
        const sessionName = customName || 
                           activeSession?.name || 
                           discoveredSession?.first_message || 
                           `Session ${selectedSessionId.substring(0, 8)}`;
        
        return (
          <UnifiedSessionView 
            sessionId={selectedSessionId}
            onRefreshSessions={loadSessions}
            isHistorical={selectedSessionType === 'historical'}
            projectId={selectedProject.id}
            sessionName={sessionName}
            projectPath={selectedProject.path}
          />
        );
      }
      
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
              className="p-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-white transition-all duration-200 hover:bg-[#333333] hover:border-[#444444]"
              onClick={() => setCurrentView('home')}
              title="Home"
            >
              <Home className="w-4 h-4" />
            </button>
            <button 
              className="flex items-center gap-2 px-3 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-white text-sm transition-all duration-200 hover:bg-[#333333] hover:border-[#444444] flex-1"
              onClick={() => setCurrentView('projects')}
            >
              <ArrowLeft className="w-4 h-4" />
              Projects
            </button>
          </div>
          
          {/* New Session Button */}
          <button 
            className="w-full flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium transition-all duration-200 hover:from-blue-600 hover:to-purple-600 shadow-lg"
            onClick={() => {
              if (selectedProject) {
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
          {/* Project Sessions */}
          <div className="p-4 border-b border-[#2a2a2a]">
            <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wide">
              {selectedProject ? `${selectedProject.path.split('/').pop()} Sessions` : 'Project Sessions'}
            </h3>
          </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {/* All Sessions - Active and Historical unified */}
                {(() => {
                  // Get active sessions for this project
                  const activeSessions = sessions.filter(s => s.isActive && selectedProject && s.projectPath === selectedProject.path);
                  
                  // Create a Set of Claude session IDs that are already active
                  const activeClaudeSessionIds = new Set(
                    activeSessions
                      .filter(s => s.claudeSessionId)
                      .map(s => s.claudeSessionId)
                  );
                  
                  // Filter out historical sessions that are already active
                  const filteredHistoricalSessions = projectDiscoveredSessions.filter(
                    session => !activeClaudeSessionIds.has(session.id)
                  );
                  
                  return [
                    // Active sessions first
                    ...activeSessions.map(session => ({
                      id: session.id,
                      claudeSessionId: session.claudeSessionId,
                      name: session.name,
                      subtitle: `${session.messageCount} messages`,
                      isActive: true,
                      type: 'active' as const
                    })),
                    // Then historical sessions (excluding those that are already active)
                    ...filteredHistoricalSessions.map(session => {
                      const metadata = sessionMetadata[session.id];
                      const customName = metadata?.customName;
                      const isDeleted = metadata?.isDeleted || false;
                      
                      // Skip deleted sessions for now (will add toggle later)
                      if (isDeleted) return null;
                      
                      return {
                        id: session.id,
                        claudeSessionId: session.id, // For historical sessions, the ID is the Claude session ID
                        name: customName || session.first_message || `Session ${session.id.substring(0, 8)}`,
                        subtitle: new Date(session.created_at * 1000).toLocaleDateString(),
                        isActive: false,
                        type: 'historical' as const
                      };
                    }).filter((session): session is NonNullable<typeof session> => session !== null)
                  ];
                })().map((session) => (
                  <SessionListItem
                    key={session.id}
                    id={session.id}
                    claudeSessionId={session.claudeSessionId}
                    name={session.name}
                    subtitle={session.subtitle}
                    isActive={session.isActive}
                    isSelected={selectedSessionId === session.id}
                    onClick={() => {
                      setSelectedSessionId(session.id);
                      setSelectedSessionType(session.type);
                    }}
                    onRename={(newName) => handleRenameSession(
                      session.type === 'active' ? session.id : '',
                      session.claudeSessionId,
                      newName
                    )}
                    onDelete={() => handleDeleteSession(
                      session.type === 'active' ? session.id : undefined,
                      session.claudeSessionId || session.id
                    )}
                  />
                ))}
                
                {(() => {
                  const activeSessions = sessions.filter(s => s.isActive && selectedProject && s.projectPath === selectedProject.path);
                  const activeClaudeSessionIds = new Set(
                    activeSessions
                      .filter(s => s.claudeSessionId)
                      .map(s => s.claudeSessionId)
                  );
                  const filteredHistoricalSessions = projectDiscoveredSessions.filter(
                    session => !activeClaudeSessionIds.has(session.id)
                  );
                  
                  return activeSessions.length === 0 && filteredHistoricalSessions.length === 0;
                })() && (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    No sessions found
                  </div>
                )}
              </div>
        </div>
      </aside>
    );
  };

  return (
    <div className="flex h-screen bg-dark-bg text-text-primary custom-scrollbar">
      {(currentView === 'session') ? (
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