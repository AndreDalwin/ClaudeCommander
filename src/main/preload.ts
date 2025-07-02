import { contextBridge, ipcRenderer } from 'electron';
import { ClaudeAPI } from '@shared/types';

const claudeAPI: ClaudeAPI = {
  // Session management
  createSession: (data) => ipcRenderer.invoke('create-session', data),
  continueSession: (data) => ipcRenderer.invoke('continue-session', data),
  resumeSession: (data) => ipcRenderer.invoke('resume-session', data),
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
  
  // Session management
  updateSessionName: (data) => ipcRenderer.invoke('update-session-name', data),
  deleteSession: (data) => ipcRenderer.invoke('delete-session', data),
  getSessionMetadata: (claudeSessionId) => ipcRenderer.invoke('get-session-metadata', claudeSessionId),
  getAllMetadata: () => ipcRenderer.invoke('get-all-metadata'),
  restoreSession: (claudeSessionId) => ipcRenderer.invoke('restore-session', claudeSessionId),
  
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

// Expose additional Electron APIs
contextBridge.exposeInMainWorld('electronAPI', {
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url)
});
