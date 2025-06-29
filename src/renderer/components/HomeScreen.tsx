import React from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Folder, 
  Plus, 
  Activity, 
  Clock, 
  BarChart3,
  Layers,
  Play,
  Terminal
} from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#111111] to-[#0f0f0f] p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-16 text-left">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-[#0e639c] to-[#1177bb] rounded-xl flex items-center justify-center">
              <Terminal className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Commander
              </h1>
              <p className="text-gray-400 text-lg">Claude Code Session Management</p>
            </div>
          </div>

          {/* Status Card */}
          <div className="inline-flex items-center gap-3 px-6 py-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl shadow-lg">
            {claudeStatus ? (
              <>
                {claudeStatus.connected ? (
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                <div>
                  <div className={`font-medium ${claudeStatus.connected ? 'text-emerald-400' : 'text-red-400'}`}>
                    {claudeStatus.connected ? 'Claude Code Connected' : 'Claude Code Not Found'}
                  </div>
                  {claudeStatus.connected && (
                    <div className="text-sm text-gray-500">{claudeStatus.version}</div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-gray-400">Checking Claude status...</div>
            )}
          </div>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-12 gap-8">
          {/* Stats Cards */}
          <div className="col-span-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-[#3a3a3a]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                    <Folder className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-white">{stats.totalProjects}</div>
                    <div className="text-gray-400 text-sm">Total Projects</div>
                  </div>
                </div>
              </div>

              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-[#3a3a3a]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                    <Layers className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-white">{stats.totalSessions}</div>
                    <div className="text-gray-400 text-sm">Total Sessions</div>
                  </div>
                </div>
              </div>

              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-[#3a3a3a]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                    <Activity className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-white">{stats.activeSessions}</div>
                    <div className="text-gray-400 text-sm">Active Sessions</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Primary Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button 
                className="group bg-gradient-to-r from-[#0e639c] to-[#1177bb] p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] text-left"
                onClick={() => onNavigate('projects')}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-colors">
                    <Folder className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">Browse Projects</h3>
                    <p className="text-blue-100">Explore and manage your projects</p>
                  </div>
                </div>
              </button>
              
              <button 
                className="group bg-[#1a1a1a] border border-[#2a2a2a] p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:border-[#3a3a3a] text-left"
                onClick={() => onNavigate('new-session')}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-white/5 rounded-xl flex items-center justify-center group-hover:bg-white/10 transition-colors">
                    <Plus className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">New Session</h3>
                    <p className="text-gray-400">Start a fresh Claude session</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}