import React, { useState } from 'react';
import { DiscoveredProject } from '@shared/types';
import { ArrowLeft, Search, Filter, Folder, Calendar, Database } from 'lucide-react';

interface ProjectsViewProps {
  projects: DiscoveredProject[];
  onSelectProject: (project: DiscoveredProject) => void;
  onBack: () => void;
}

export function ProjectsView({ projects, onSelectProject, onBack }: ProjectsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'sessions'>('recent');

  const filteredProjects = projects.filter(project =>
    project.path.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedProjects = [...filteredProjects].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return b.created_at - a.created_at;
      case 'name':
        return a.path.localeCompare(b.path);
      case 'sessions':
        return b.sessions.length - a.sessions.length;
      default:
        return 0;
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#111111] to-[#0f0f0f] overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#1a1a1a]/95 backdrop-blur border-b border-[#2a2a2a] p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-6 mb-6">
            <button 
              className="flex items-center gap-2 px-4 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl text-white text-sm transition-all duration-200 hover:bg-[#333333] hover:border-[#444444]"
              onClick={onBack}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div>
              <h2 className="text-3xl font-bold text-white">All Projects</h2>
              <p className="text-gray-400">Discover and manage your Claude Code projects</p>
            </div>
          </div>
          
          <div className="flex gap-4 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                className="w-full pl-10 pr-4 py-3 bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select 
                className="pl-10 pr-8 py-3 bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl text-white cursor-pointer focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 appearance-none"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
              >
                <option value="recent">Most Recent</option>
                <option value="name">Name</option>
                <option value="sessions">Session Count</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="max-w-7xl mx-auto p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedProjects.map(project => (
            <div 
              key={project.id} 
              className="group bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:shadow-xl hover:border-[#3a3a3a] hover:scale-[1.02] relative overflow-hidden"
              onClick={() => onSelectProject(project)}
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-500 transform scale-y-0 transition-transform duration-300 group-hover:scale-y-100"></div>
              
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                  <Folder className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-white mb-1 truncate">{project.path.split('/').pop() || 'Unnamed'}</h3>
                  <div className="text-sm text-gray-400 truncate">{project.path}</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1 text-purple-400">
                  <Database className="w-4 h-4" />
                  <span>{project.sessions.length} sessions</span>
                </div>
                <div className="flex items-center gap-1 text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(project.created_at * 1000).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {sortedProjects.length === 0 && (
        <div className="max-w-7xl mx-auto p-8">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 bg-gray-500/10 rounded-2xl flex items-center justify-center mb-6">
              <Folder className="w-10 h-10 text-gray-500" />
            </div>
            <h3 className="text-2xl font-semibold text-white mb-2">No projects found</h3>
            <p className="text-gray-400 max-w-md">
              {searchTerm 
                ? `No projects match "${searchTerm}". Try adjusting your search terms.`
                : 'No Claude sessions found in ~/.claude/projects. Create a new session to get started.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}