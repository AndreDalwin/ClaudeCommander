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
    <div 
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-dark-border rounded-lg p-8 w-[500px] max-w-[90%] shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-2xl font-semibold mb-6">New Claude Session</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="block mb-2 font-medium">Session Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="My Project Session"
              className="w-full px-4 py-2.5 bg-[#3c3c3c] border border-[#464647] text-text-primary rounded-md focus:outline-none focus:border-brand-blue"
              autoFocus
            />
          </div>

          <div className="mb-5">
            <label className="block mb-2 font-medium">Project Directory</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.projectPath}
                onChange={e => setFormData(prev => ({ ...prev, projectPath: e.target.value }))}
                placeholder="/path/to/project"
                className="flex-1 px-4 py-2.5 bg-[#3c3c3c] border border-[#464647] text-text-primary rounded-md focus:outline-none focus:border-brand-blue"
              />
              <button 
                type="button" 
                onClick={handleSelectDirectory}
                className="px-4 py-2.5 bg-[#3c3c3c] border border-[#464647] text-text-primary rounded-md cursor-pointer hover:bg-[#464647]"
              >
                Browse
              </button>
            </div>
          </div>

          <div className="mb-5">
            <label className="block mb-2 font-medium">Initial Prompt</label>
            <textarea
              value={formData.prompt}
              onChange={e => setFormData(prev => ({ ...prev, prompt: e.target.value }))}
              placeholder="What would you like Claude to help with?"
              rows={4}
              className="w-full px-4 py-2.5 bg-[#3c3c3c] border border-[#464647] text-text-primary rounded-md resize-vertical focus:outline-none focus:border-brand-blue"
            />
          </div>

          <div className="mb-8">
            <label className="block mb-2 font-medium">Model</label>
            <select
              value={formData.model}
              onChange={e => setFormData(prev => ({ ...prev, model: e.target.value as 'opus' | 'sonnet' | 'haiku' }))}
              className="w-full px-4 py-2.5 bg-[#3c3c3c] border border-[#464647] text-text-primary rounded-md cursor-pointer focus:outline-none focus:border-brand-blue"
            >
              <option value="opus">Opus</option>
              <option value="sonnet">Sonnet</option>
              <option value="haiku">Haiku</option>
            </select>
          </div>

          <div className="flex gap-2 justify-end">
            <button 
              type="button" 
              onClick={onClose}
              className="px-5 py-2.5 bg-[#3c3c3c] text-text-primary rounded-md hover:bg-[#464647]"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-5 py-2.5 bg-brand-blue text-white rounded-md hover:bg-brand-blue-light"
            >
              Create Session
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}