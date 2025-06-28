import React, { useState, useEffect } from 'react';
import { DiscoveredProject, DiscoveredSession } from '@shared/types';

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
    <div className="w-full h-screen bg-dark-bg overflow-y-auto">
      <div className="flex items-center gap-5 px-10 py-5 bg-[#1a1a1a] border-b border-dark-border sticky top-0 z-10">
        <button 
          className="flex items-center gap-2 px-5 py-2.5 bg-dark-border border border-[#3e3e42] rounded-md text-text-primary text-sm transition-all duration-200 hover:bg-[#37373d] hover:-translate-x-0.5"
          onClick={onBack}
        >
          ← Back
        </button>
        <h2 className="text-3xl font-semibold flex-1">All Projects</h2>
        <div className="flex gap-4 items-center">
          <input
            type="text"
            className="px-4 py-2.5 bg-dark-border border border-[#3e3e42] rounded-md text-text-primary w-64 text-sm focus:outline-none focus:border-brand-blue"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select 
            className="px-4 py-2.5 bg-dark-border border border-[#3e3e42] rounded-md text-text-primary cursor-pointer text-sm focus:outline-none focus:border-brand-blue"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="recent">Most Recent</option>
            <option value="name">Name</option>
            <option value="sessions">Session Count</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 p-10">
        {sortedProjects.map(project => (
          <div 
            key={project.id} 
            className="bg-dark-surface border border-dark-border rounded-xl p-6 cursor-pointer transition-all duration-300 flex items-center gap-5 relative overflow-hidden hover:-translate-y-1 hover:shadow-2xl hover:border-[#3e3e42] group"
            onClick={() => onSelectProject(project)}
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-brand-blue transform scale-y-0 transition-transform duration-300 group-hover:scale-y-100"></div>
            <div className="text-5xl opacity-80">📁</div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-text-primary mb-2">{project.path.split('/').pop() || 'Unnamed'}</h3>
              <div className="text-sm text-text-muted mb-3 overflow-hidden text-ellipsis whitespace-nowrap">{project.path}</div>
              <div className="flex gap-5 text-sm text-text-secondary">
                <span className="font-medium text-brand-blue">{project.sessions.length} sessions</span>
                <span>
                  {new Date(project.created_at * 1000).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="text-2xl text-text-muted transition-all duration-300 group-hover:translate-x-1 group-hover:text-brand-blue">→</div>
          </div>
        ))}
      </div>

      {sortedProjects.length === 0 && (
        <div className="flex flex-col items-center justify-center p-10 text-center">
          <div className="text-6xl opacity-30 mb-5">📭</div>
          <h3 className="text-2xl text-text-secondary mb-2">No projects found</h3>
          <p className="text-text-muted">
            {searchTerm 
              ? `No projects match "${searchTerm}"`
              : 'No Claude sessions found in ~/.claude/projects'}
          </p>
        </div>
      )}
    </div>
  );
}