import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { ClaudeSession } from './claudeManager';

interface StoredSession {
  id: string;
  name: string;
  projectPath: string;
  createdAt: string;
  messages: any[];
  claudeSessionId?: string;
  claudeProjectId?: string;
  resumedFrom?: string;
  autoMode?: boolean;
}

export class SessionStore {
  private storageDir: string;

  constructor() {
    this.storageDir = path.join(os.homedir(), '.claudecommander', 'sessions');
    this.ensureStorageDir();
  }

  private async ensureStorageDir(): Promise<void> {
    try {
      await fs.mkdir(this.storageDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create storage directory:', error);
    }
  }

  async saveSession(session: ClaudeSession): Promise<void> {
    const sessionData: StoredSession = {
      id: session.id,
      name: session.name,
      projectPath: session.projectPath,
      createdAt: session.createdAt,
      messages: session.messages,
      claudeSessionId: session.claudeSessionId || undefined,
      claudeProjectId: session.claudeProjectId || undefined,
      resumedFrom: session.resumedFrom || undefined,
      autoMode: session.autoMode
    };

    const filePath = path.join(this.storageDir, `${session.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(sessionData, null, 2));
  }

  async loadSession(sessionId: string): Promise<StoredSession | null> {
    const filePath = path.join(this.storageDir, `${sessionId}.json`);
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }

  async getAllSessions(): Promise<StoredSession[]> {
    try {
      const files = await fs.readdir(this.storageDir);
      const sessions: StoredSession[] = [];
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const sessionId = file.replace('.json', '');
          const session = await this.loadSession(sessionId);
          if (session) {
            sessions.push(session);
          }
        }
      }
      
      return sessions;
    } catch (error) {
      return [];
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    const filePath = path.join(this.storageDir, `${sessionId}.json`);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  }

  async updateSessionName(sessionId: string, newName: string): Promise<void> {
    const session = await this.loadSession(sessionId);
    if (session) {
      session.name = newName;
      const filePath = path.join(this.storageDir, `${sessionId}.json`);
      await fs.writeFile(filePath, JSON.stringify(session, null, 2));
    }
  }
}