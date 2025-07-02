import { ipcMain, dialog, BrowserWindow, shell } from 'electron';
import { ClaudeManager } from '../utils/claudeManager';
import { SessionStore } from '../utils/sessionStore';
import { SessionDiscovery } from '../utils/sessionDiscovery';
import { SessionData, CompletionData } from '@shared/types';
import { SessionMetadataStore } from '../utils/sessionMetadataStore';

export function setupIpcHandlers(
  mainWindow: BrowserWindow,
  claudeManager: ClaudeManager,
  sessionStore: SessionStore,
  claudeStatus: { connected: boolean; version: string; path: string }
): void {
  console.log('Setting up IPC handlers...');
  const sessionDiscovery = new SessionDiscovery();
  const sessionMetadata = SessionMetadataStore.getInstance();
  // Get Claude status
  ipcMain.handle('get-claude-status', async () => {
    console.log('Getting Claude status:', claudeStatus);
    return claudeStatus;
  });

  // Create new session
  ipcMain.handle('create-session', async (_event, data: SessionData) => {
    console.log('Creating new session:', data);
    try {
      const session = await claudeManager.startNewSession(
        data.name,
        data.projectPath,
        data.prompt,
        data.model,
        mainWindow,
        data.autoMode || false
      );
      console.log('Session created successfully:', session.id);
      
      // Save session on complete
      session.on('complete', (result: CompletionData) => {
        console.log('Session complete:', session.id, result);
        // Save session to disk
        sessionStore.saveSession(session);
      });

      return {
        id: session.id,
        name: session.name,
        projectPath: session.projectPath,
        isActive: session.isActive,
        createdAt: session.createdAt,
        messageCount: session.messages.length,
        autoMode: session.autoMode
      };
    } catch (error) {
      console.error('Failed to create session:', error);
      throw error;
    }
  });

  // Continue session
  ipcMain.handle('continue-session', async (_event, { sessionId, prompt, model }: { sessionId: string; prompt: string; model: string }) => {
    console.log('Continuing session:', sessionId, prompt);
    try {
      const session = await claudeManager.continueSession(sessionId, prompt, model, mainWindow);
      
      // Save session on complete
      session.on('complete', (result: CompletionData) => {
        console.log('Session complete:', session.id, result);
        sessionStore.saveSession(session);
      });
      
      return { success: true };
    } catch (error) {
      console.error('Failed to continue session:', error);
      throw error;
    }
  });

  // Resume a discovered session
  ipcMain.handle('resume-session', async (_event, { projectPath, sessionId, name, prompt, model, autoMode }: { 
    projectPath: string; 
    sessionId: string; 
    name: string;
    prompt: string; 
    model: string;
    autoMode?: boolean;
  }) => {
    console.log('Resuming discovered session:', sessionId, 'in project:', projectPath);
    try {
      // Check if this session is already active
      const existingSession = claudeManager.getSessionByClaudeId(sessionId);
      if (existingSession) {
        // Session already active, just continue it
        // Update autoMode if provided
        if (autoMode !== undefined) {
          existingSession.autoMode = autoMode;
        }
        await claudeManager.continueSession(existingSession.id, prompt, model, mainWindow);
        return {
          id: existingSession.id,
          name: existingSession.name,
          projectPath: existingSession.projectPath,
          isActive: existingSession.isActive,
          createdAt: existingSession.createdAt,
          messageCount: existingSession.messages.length,
          claudeSessionId: existingSession.claudeSessionId,
          autoMode: existingSession.autoMode
        };
      }
      
      // Create a new ClaudeSession for the resumed session
      // Use a better name that doesn't duplicate the session ID
      const sessionName = name?.includes('Session') ? name : (name || `${sessionId.substring(0, 8)}`);
      const session = claudeManager.createSession(sessionName, projectPath, autoMode || false);
      
      // Set the Claude session ID so resume works properly
      session.claudeSessionId = sessionId;
      session.resumedFrom = sessionId; // Track that this was resumed
      
      // Get the Claude path properly
      const claudePath = (claudeManager as any).claudePath;
      if (!claudePath) {
        throw new Error('Claude binary not initialized');
      }
      
      // Resume the session with the provided session ID
      await session.resume(claudePath, prompt, model, mainWindow);
      
      // Add the session to the manager BEFORE returning
      // This ensures it's available when the UI refreshes
      (claudeManager as any).sessions.set(session.id, session);
      
      // Register the Claude session ID mapping
      claudeManager.registerClaudeSessionId(session.id, sessionId);
      
      // Save session on complete
      session.on('complete', (result: CompletionData) => {
        console.log('Resumed session complete:', session.id, result);
        sessionStore.saveSession(session);
      });
      
      console.log('Resumed session registered with internal ID:', session.id, 'Claude ID:', session.claudeSessionId);
      
      return {
        id: session.id,
        name: session.name,
        projectPath: session.projectPath,
        isActive: session.isActive,
        createdAt: session.createdAt,
        messageCount: session.messages.length,
        claudeSessionId: session.claudeSessionId,
        resumedFrom: session.resumedFrom,
        autoMode: session.autoMode
      };
    } catch (error) {
      console.error('Failed to resume session:', error);
      throw error;
    }
  });

  // Get all sessions
  ipcMain.handle('get-sessions', async () => {
    return claudeManager.getAllSessions();
  });

  // Get session messages
  ipcMain.handle('get-session-messages', async (_event, sessionId: string) => {
    const session = claudeManager.getSession(sessionId);
    return session ? session.messages : [];
  });

  // Cancel session
  ipcMain.handle('cancel-session', async (_event, sessionId: string) => {
    const session = claudeManager.getSession(sessionId);
    if (session) {
      session.cancel();
      return { success: true };
    }
    return { success: false, error: 'Session not found' };
  });

  // Select directory
  ipcMain.handle('select-directory', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory']
    });
    return result.canceled ? null : result.filePaths[0];
  });

  // Session discovery
  ipcMain.handle('discover-projects', async () => {
    console.log('Discovering Claude projects...');
    try {
      const projects = await sessionDiscovery.listProjects();
      console.log(`Found ${projects.length} projects`);
      return projects;
    } catch (error) {
      console.error('Failed to discover projects:', error);
      return [];
    }
  });

  ipcMain.handle('get-discovered-sessions', async (_event, projectId: string) => {
    console.log('Getting sessions for project:', projectId);
    try {
      const sessions = await sessionDiscovery.getProjectSessions(projectId);
      console.log(`Found ${sessions.length} sessions`);
      return sessions;
    } catch (error) {
      console.error('Failed to get sessions:', error);
      return [];
    }
  });

  ipcMain.handle('load-session-history', async (_event, { projectId, sessionId }: { projectId: string; sessionId: string }) => {
    console.log('Loading session history:', projectId, sessionId);
    try {
      const history = await sessionDiscovery.loadSessionHistory(projectId, sessionId);
      return history;
    } catch (error) {
      console.error('Failed to load session history:', error);
      throw error;
    }
  });

  // Open external links
  ipcMain.handle('open-external', async (_event, url: string) => {
    console.log('Opening external URL:', url);
    try {
      await shell.openExternal(url);
      return { success: true };
    } catch (error) {
      console.error('Failed to open external URL:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });

  // Update session name
  ipcMain.handle('update-session-name', async (_event, { sessionId, claudeSessionId, newName }: { 
    sessionId: string; 
    claudeSessionId?: string; 
    newName: string 
  }) => {
    console.log('Updating session name:', sessionId, newName);
    try {
      // For active sessions, update both in-memory and persisted state
      const session = claudeManager.getSession(sessionId);
      if (session) {
        session.name = newName;
        await sessionStore.updateSessionName(sessionId, newName);
      }
      
      // For historical sessions or if claudeSessionId is provided, update metadata
      if (claudeSessionId) {
        sessionMetadata.setSessionName(claudeSessionId, newName);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Failed to update session name:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });

  // Soft delete session
  ipcMain.handle('delete-session', async (_event, { sessionId, claudeSessionId }: { 
    sessionId?: string; 
    claudeSessionId: string 
  }) => {
    console.log('Soft deleting session:', sessionId, claudeSessionId);
    try {
      // Mark session as deleted in metadata
      sessionMetadata.deleteSession(claudeSessionId);
      
      // If it's an active session, also remove from memory and delete the file
      if (sessionId) {
        const session = claudeManager.getSession(sessionId);
        if (session) {
          // Cancel the session if it's running
          if (session.isActive) {
            session.cancel();
          }
          // Remove from manager
          claudeManager.removeSession(sessionId);
          // Delete the session file
          await sessionStore.deleteSession(sessionId);
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('Failed to delete session:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });

  // Get session metadata
  ipcMain.handle('get-session-metadata', async (_event, claudeSessionId: string) => {
    return sessionMetadata.getSessionMetadata(claudeSessionId);
  });

  // Get all metadata
  ipcMain.handle('get-all-metadata', async () => {
    return sessionMetadata.getAllMetadata();
  });

  // Restore deleted session
  ipcMain.handle('restore-session', async (_event, claudeSessionId: string) => {
    console.log('Restoring session:', claudeSessionId);
    try {
      sessionMetadata.restoreSession(claudeSessionId);
      return { success: true };
    } catch (error) {
      console.error('Failed to restore session:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });
}