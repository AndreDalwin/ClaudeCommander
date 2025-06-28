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
    <div className="projects-view">
      <div className="view-header">
        <button className="back-btn" onClick={onBack}>
          ← Back
        </button>
        <h2>All Projects</h2>
        <div className="header-actions">
          <input
            type="text"
            className="search-input"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select 
            className="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="recent">Most Recent</option>
            <option value="name">Name</option>
            <option value="sessions">Session Count</option>
          </select>
        </div>
      </div>

      <div className="projects-grid">
        {sortedProjects.map(project => (
          <div 
            key={project.id} 
            className="project-card"
            onClick={() => onSelectProject(project)}
          >
            <div className="project-icon">📁</div>
            <div className="project-info">
              <h3 className="project-name">{project.path.split('/').pop() || 'Unnamed'}</h3>
              <div className="project-path">{project.path}</div>
              <div className="project-meta">
                <span className="session-count">{project.sessions.length} sessions</span>
                <span className="project-date">
                  {new Date(project.created_at * 1000).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="project-arrow">→</div>
          </div>
        ))}
      </div>

      {sortedProjects.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>No projects found</h3>
          <p>
            {searchTerm 
              ? `No projects match "${searchTerm}"`
              : 'No Claude sessions found in ~/.claude/projects'}
          </p>
        </div>
      )}
    </div>
  );
}