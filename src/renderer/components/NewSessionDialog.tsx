import React, { useState } from 'react';
import { SessionData } from '@shared/types';
import { X, FolderOpen, Terminal } from 'lucide-react';

interface NewSessionDialogProps {
  onClose: () => void;
  onSubmit: (data: SessionData) => void;
  defaultPath?: string;
  title?: string;
  submitText?: string;
  promptPlaceholder?: string;
}

export function NewSessionDialog({ 
  onClose, 
  onSubmit, 
  defaultPath, 
  title = "New Claude Session",
  submitText = "Create Session",
  promptPlaceholder = "What would you like Claude to help with?"
}: NewSessionDialogProps) {
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
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-8 w-[500px] max-w-full shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
              <Terminal className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-semibold text-white">{title}</h2>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 bg-[#2a2a2a] hover:bg-[#333333] rounded-lg flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium text-gray-300">Session Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="My Project Session"
              className="w-full px-4 py-3 bg-[#2a2a2a] border border-[#3a3a3a] text-white rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-gray-400"
              autoFocus
            />
          </div>

          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium text-gray-300">Project Directory</label>
            <div className="flex gap-3">
              <input
                type="text"
                value={formData.projectPath}
                onChange={e => setFormData(prev => ({ ...prev, projectPath: e.target.value }))}
                placeholder="/path/to/project"
                className="flex-1 px-4 py-3 bg-[#2a2a2a] border border-[#3a3a3a] text-white rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-gray-400"
              />
              <button 
                type="button" 
                onClick={handleSelectDirectory}
                className="px-4 py-3 bg-[#2a2a2a] border border-[#3a3a3a] text-white rounded-xl hover:bg-[#333333] hover:border-[#444444] transition-colors flex items-center gap-2"
              >
                <FolderOpen className="w-4 h-4" />
                Browse
              </button>
            </div>
          </div>

          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium text-gray-300">Initial Prompt</label>
            <textarea
              value={formData.prompt}
              onChange={e => setFormData(prev => ({ ...prev, prompt: e.target.value }))}
              placeholder={promptPlaceholder}
              rows={4}
              className="w-full px-4 py-3 bg-[#2a2a2a] border border-[#3a3a3a] text-white rounded-xl resize-vertical focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-gray-400"
            />
          </div>

          <div className="mb-8">
            <label className="block mb-2 text-sm font-medium text-gray-300">Model</label>
            <select
              value={formData.model}
              onChange={e => setFormData(prev => ({ ...prev, model: e.target.value as 'opus' | 'sonnet' | 'haiku' }))}
              className="w-full px-4 py-3 bg-[#2a2a2a] border border-[#3a3a3a] text-white rounded-xl cursor-pointer focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="opus">Claude Opus 4</option>
              <option value="sonnet">Claude Sonnet 4</option>
              <option value="haiku">Claude 3.5 Haiku</option>
            </select>
          </div>

          <div className="flex gap-3 justify-end">
            <button 
              type="button" 
              onClick={onClose}
              className="px-6 py-3 bg-[#2a2a2a] text-white rounded-xl hover:bg-[#333333] transition-colors border border-[#3a3a3a]"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all shadow-lg"
            >
              {submitText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}