import React, { useState, useEffect } from 'react';
import { DiscoveredProject, DiscoveredSession } from '@shared/types';
import { ArrowLeft, Plus, MessageSquare, Loader2, Calendar } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#111111] to-[#0f0f0f] flex flex-col">
      <div className="bg-[#1a1a1a]/95 backdrop-blur border-b border-[#2a2a2a] p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button 
                className="flex items-center gap-2 px-4 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl text-white text-sm transition-all duration-200 hover:bg-[#333333] hover:border-[#444444]"
                onClick={onBack}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Projects
              </button>
              <div>
                <h2 className="text-3xl font-bold text-white mb-1">{project.path.split('/').pop() || 'Project'}</h2>
                <div className="text-gray-400">{project.path}</div>
              </div>
            </div>
            <button 
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium transition-all duration-200 hover:from-blue-600 hover:to-purple-600 shadow-lg"
              onClick={onNewSession}
            >
              <Plus className="w-4 h-4" />
              New Session Here
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin mb-4" />
          <p className="text-gray-400">Loading sessions...</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-8">
            <div className="mb-8">
              <h3 className="text-2xl font-semibold text-white">Sessions ({sessions.length})</h3>
              <p className="text-gray-400">Browse session history for this project</p>
            </div>
            
            {sessions.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-gray-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <MessageSquare className="w-10 h-10 text-gray-500" />
                </div>
                <h3 className="text-2xl font-semibold text-white mb-2">No sessions yet</h3>
                <p className="text-gray-400 mb-8 max-w-md mx-auto">Start a new session in this project to begin collaborating with Claude Code.</p>
                <button 
                  className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium transition-all duration-200 hover:from-blue-600 hover:to-purple-600 shadow-lg mx-auto"
                  onClick={onNewSession}
                >
                  <Plus className="w-4 h-4" />
                  Create First Session
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {sessions.map(session => (
                  <div 
                    key={session.id}
                    className="group bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 cursor-pointer transition-all duration-200 hover:bg-[#202020] hover:border-[#3a3a3a] hover:scale-[1.01]"
                    onClick={() => onSelectSession(session)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                        <MessageSquare className="w-6 h-6 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white mb-2 leading-relaxed">
                          {truncateMessage(session.first_message)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span className="font-mono bg-[#2a2a2a] px-2 py-1 rounded">{session.id.substring(0, 8)}...</span>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(session.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}