import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Edit2, Trash2, Check, X } from 'lucide-react';

interface SessionListItemProps {
  id: string;
  claudeSessionId?: string;
  name: string;
  subtitle: string;
  isActive: boolean;
  isSelected: boolean;
  onClick: () => void;
  onRename: (newName: string) => void;
  onDelete: () => void;
}

export default function SessionListItem({
  name,
  subtitle,
  isActive,
  isSelected,
  onClick,
  onRename,
  onDelete
}: SessionListItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(name);
  const [showActions, setShowActions] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(name);
  }, [name]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isSelected) return;
      
      if (e.key === 'F2' && !isEditing) {
        e.preventDefault();
        setIsEditing(true);
      } else if (e.key === 'Delete' && !isEditing && !isDeleting) {
        e.preventDefault();
        if (window.confirm(`Are you sure you want to delete the session "${name}"? This will hide it from the list but won't delete Claude's history.`)) {
          setIsDeleting(true);
          onDelete();
          setTimeout(() => setIsDeleting(false), 500);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSelected, isEditing, isDeleting, name, onDelete]);

  const handleSave = () => {
    if (editValue.trim() && editValue !== name) {
      onRename(editValue.trim());
    }
    setIsEditing(false);
    setEditValue(name);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(name);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleDelete = () => {
    if (isDeleting) return;
    
    if (window.confirm(`Are you sure you want to delete the session "${name}"? This will hide it from the list but won't delete Claude's history.`)) {
      setIsDeleting(true);
      onDelete();
      // Reset after a short delay to show the loading state
      setTimeout(() => setIsDeleting(false), 500);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  if (isEditing) {
    return (
      <div className="p-4 rounded-xl bg-[#2a2a2a] border border-blue-500/50 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-500/20 flex-shrink-0">
            <MessageSquare className="w-4 h-4 text-blue-400" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="space-y-2">
              <input
                ref={inputRef}
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onClick={(e) => e.stopPropagation()}
                className="w-full px-3 py-1.5 text-sm bg-[#1a1a1a] border border-blue-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Session name..."
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSave();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1 text-xs bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-md transition-colors"
                  title="Save (Enter)"
                >
                  <Check className="w-3 h-3" />
                  Save
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCancel();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1 text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-md transition-colors"
                  title="Cancel (Esc)"
                >
                  <X className="w-3 h-3" />
                  Cancel
                </button>
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {subtitle}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group p-4 rounded-xl cursor-pointer transition-all duration-200 border relative ${
        isSelected
          ? 'bg-[#2a2a2a] border-blue-500/50 shadow-lg' 
          : 'bg-[#1a1a1a] border-[#2a2a2a] hover:bg-[#252525] hover:border-[#3a3a3a]'
      }`}
      onClick={onClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-500/20 flex-shrink-0">
          <MessageSquare className="w-4 h-4 text-blue-400" />
        </div>
        
        <div className="flex-1 min-w-0 pr-16">
          <div className="flex items-center gap-2">
            <div className="text-sm text-white truncate flex-1">{name}</div>
            {isActive && (
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse flex-shrink-0" title="Active session" />
            )}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {subtitle}
          </div>
        </div>

        {/* Action buttons - positioned absolutely to avoid layout shifts */}
        <div className={`absolute right-4 top-4 flex items-center gap-1 transition-opacity ${
          (showActions || isSelected) ? 'opacity-100' : 'opacity-0'
        }`}>
          <button
            onClick={handleEdit}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-[#3a3a3a] rounded-lg transition-all"
            title="Rename (F2)"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            disabled={isDeleting}
            className={`p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all ${
              isDeleting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            title="Delete (Del)"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}