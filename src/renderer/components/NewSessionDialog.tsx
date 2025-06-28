import React, { useState } from 'react';
import { SessionData } from '@shared/types';

interface NewSessionDialogProps {
  onClose: () => void;
  onSubmit: (data: SessionData) => void;
  defaultPath?: string;
}

export function NewSessionDialog({ onClose, onSubmit, defaultPath }: NewSessionDialogProps) {
  const [formData, setFormData] = useState<SessionData>({
    id: '',
    name: '',
    projectPath: defaultPath || '',
    prompt: '',
    model: 'opus'
  });

  const handleSelectDirectory = async () => {
    const path = await window.claudeAPI.selectDirectory();
    if (path) {
      setFormData(prev => ({ ...prev, projectPath: path }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.projectPath || !formData.prompt) {
      alert('Please fill in all fields');
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={e => e.stopPropagation()}>
        <h2>New Claude Session</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Session Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="My Project Session"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Project Directory</label>
            <div className="path-input">
              <input
                type="text"
                value={formData.projectPath}
                onChange={e => setFormData(prev => ({ ...prev, projectPath: e.target.value }))}
                placeholder="/path/to/project"
              />
              <button type="button" onClick={handleSelectDirectory}>
                Browse
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Initial Prompt</label>
            <textarea
              value={formData.prompt}
              onChange={e => setFormData(prev => ({ ...prev, prompt: e.target.value }))}
              placeholder="What would you like Claude to help with?"
              rows={4}
            />
          </div>

          <div className="form-group">
            <label>Model</label>
            <select
              value={formData.model}
              onChange={e => setFormData(prev => ({ ...prev, model: e.target.value as 'opus' | 'sonnet' | 'haiku' }))}
            >
              <option value="opus">Opus</option>
              <option value="sonnet">Sonnet</option>
              <option value="haiku">Haiku</option>
            </select>
          </div>

          <div className="dialog-actions">
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit">Create Session</button>
          </div>
        </form>
      </div>
    </div>
  );
}