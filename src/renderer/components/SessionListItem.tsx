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
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

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

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete the session "${name}"? This will hide it from the list but won't delete Claude's history.`)) {
      onDelete();
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  return (
    <div
      className={`group p-4 rounded-xl cursor-pointer transition-all duration-200 border ${
        isSelected
          ? 'bg-[#2a2a2a] border-blue-500/50 shadow-lg' 
          : 'bg-[#1a1a1a] border-[#2a2a2a] hover:bg-[#2a2a2a] hover:border-[#3a3a3a]'
      }`}
      onClick={!isEditing ? onClick : undefined}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-500/20 flex-shrink-0">
          <MessageSquare className="w-4 h-4 text-blue-400" />
        </div>
        
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onClick={(e) => e.stopPropagation()}
                className="flex-1 px-2 py-1 text-sm bg-[#333333] border border-blue-500 rounded text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSave();
                }}
                className="p-1.5 text-green-400 hover:text-green-300 transition-colors flex-shrink-0"
                title="Save"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCancel();
                }}
                className="p-1.5 text-red-400 hover:text-red-300 transition-colors flex-shrink-0"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <div className="text-sm text-white truncate flex-1">{name}</div>
                {isActive && (
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse flex-shrink-0" title="Active session" />
                )}
                {(showActions || isSelected) && !isEditing && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button
                      onClick={handleEdit}
                      className="p-1.5 text-gray-400 hover:text-white transition-colors rounded"
                      title="Rename session"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleDelete}
                      className="p-1.5 text-gray-400 hover:text-red-400 transition-colors rounded"
                      title="Delete session"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {subtitle}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}