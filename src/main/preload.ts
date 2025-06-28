import { contextBridge, ipcRenderer } from 'electron';
import { ClaudeAPI } from '@shared/types';

const claudeAPI: ClaudeAPI = {
  // Session management
  createSession: (data) => ipcRenderer.invoke('create-session', data),
  continueSession: (data) => ipcRenderer.invoke('continue-session', data),
  getSessions: () => ipcRenderer.invoke('get-sessions'),
  getSessionMessages: (sessionId) => ipcRenderer.invoke('get-session-messages', sessionId),
  cancelSession: (sessionId) => ipcRenderer.invoke('cancel-session', sessionId),
  
  // Claude status
  getClaudeStatus: () => ipcRenderer.invoke('get-claude-status'),
  
  // File system
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  
  // Session discovery
  discoverProjects: () => ipcRenderer.invoke('discover-projects'),
  getDiscoveredSessions: (projectId) => ipcRenderer.invoke('get-discovered-sessions', projectId),
  loadSessionHistory: (data) => ipcRenderer.invoke('load-session-history', data),
  
  // Event listeners
  onSessionMessage: (sessionId, callback) => {
    const channel = `session-message:${sessionId}`;
    const listener = (_event: Electron.IpcRendererEvent, data: any) => callback(data);
    ipcRenderer.on(channel, listener);
    return () => ipcRenderer.removeListener(channel, listener);
  },
  
  onSessionError: (sessionId, callback) => {
    const channel = `session-error:${sessionId}`;
    const listener = (_event: Electron.IpcRendererEvent, data: any) => callback(data);
    ipcRenderer.on(channel, listener);
    return () => ipcRenderer.removeListener(channel, listener);
  },
  
  onSessionComplete: (sessionId, callback) => {
    const channel = `session-complete:${sessionId}`;
    const listener = (_event: Electron.IpcRendererEvent, data: any) => callback(data);
    ipcRenderer.on(channel, listener);
    return () => ipcRenderer.removeListener(channel, listener);
  }
};

contextBridge.exposeInMainWorld('claudeAPI', claudeAPI);
