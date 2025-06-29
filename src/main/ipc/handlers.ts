import { ipcMain, dialog, BrowserWindow } from 'electron';
import { ClaudeManager, ClaudeSession } from '../utils/claudeManager';
import { SessionStore } from '../utils/sessionStore';
import { SessionDiscovery } from '../utils/sessionDiscovery';
import { SessionData, Message, ErrorData, CompletionData } from '@shared/types';

export function setupIpcHandlers(
  mainWindow: BrowserWindow,
  claudeManager: ClaudeManager,
  sessionStore: SessionStore,
  claudeStatus: { connected: boolean; version: string; path: string }
): void {
  console.log('Setting up IPC handlers...');
  const sessionDiscovery = new SessionDiscovery();
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
        mainWindow
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
        messageCount: session.messages.length
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
  ipcMain.handle('resume-session', async (_event, { projectPath, sessionId, name, prompt, model }: { 
    projectPath: string; 
    sessionId: string; 
    name: string;
    prompt: string; 
    model: string 
  }) => {
    console.log('Resuming discovered session:', sessionId, 'in project:', projectPath);
    try {
      // Create a new ClaudeSession for the resumed session
      const session = claudeManager.createSession(name || `Resumed Session ${sessionId.substring(0, 8)}`, projectPath);
      
      // Set the Claude session ID so resume works properly
      session.claudeSessionId = sessionId;
      
      // Get the Claude path properly
      const claudePath = (claudeManager as any).claudePath;
      if (!claudePath) {
        throw new Error('Claude binary not initialized');
      }
      
      // Resume the session with the provided session ID
      await session.resume(claudePath, prompt, model, mainWindow);
      
      // Save session on complete
      session.on('complete', (result: CompletionData) => {
        console.log('Resumed session complete:', session.id, result);
        sessionStore.saveSession(session);
      });
      
      return {
        id: session.id,
        name: session.name,
        projectPath: session.projectPath,
        isActive: session.isActive,
        createdAt: session.createdAt,
        messageCount: session.messages.length,
        claudeSessionId: session.claudeSessionId
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
}