import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { createReadStream } from 'fs';
import * as readline from 'readline';

export interface DiscoveredProject {
  id: string;
  path: string;
  sessions: string[];
  created_at: number;
}

export interface DiscoveredSession {
  id: string;
  project_id: string;
  project_path: string;
  created_at: number;
  first_message?: string;
  message_timestamp?: string;
}

export class SessionDiscovery {
  private claudeDir: string;
  private projectsDir: string;

  constructor() {
    this.claudeDir = path.join(os.homedir(), '.claude');
    this.projectsDir = path.join(this.claudeDir, 'projects');
  }

  async listProjects(): Promise<DiscoveredProject[]> {
    try {
      // Check if the projects directory exists
      try {
        await fs.access(this.projectsDir);
      } catch {
        console.log('No .claude/projects directory found');
        return [];
      }

      const entries = await fs.readdir(this.projectsDir, { withFileTypes: true });
      const projects: DiscoveredProject[] = [];

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const projectDir = path.join(this.projectsDir, entry.name);
          const projectPath = await this.getProjectPath(projectDir);
          const sessions = await this.getSessionIds(projectDir);
          const stats = await fs.stat(projectDir);

          projects.push({
            id: entry.name,
            path: projectPath,
            sessions,
            created_at: Math.floor(stats.birthtimeMs / 1000)
          });
        }
      }

      return projects.sort((a, b) => b.created_at - a.created_at);
    } catch (error) {
      console.error('Failed to list projects:', error);
      return [];
    }
  }

  private async getProjectPath(projectDir: string): Promise<string> {
    try {
      const files = await fs.readdir(projectDir);
      const jsonlFile = files.find(f => f.endsWith('.jsonl'));
      
      if (jsonlFile) {
        const filePath = path.join(projectDir, jsonlFile);
        const cwd = await this.findCwdInFile(filePath);
        if (cwd) {
          return cwd;
        } else {
          console.warn(`No cwd found in JSONL file: ${filePath}`);
        }
      }
    } catch (error) {
      console.error('Failed to get project path:', error);
    }

    // Fallback: Try simple decoding by adding leading slash and replacing hyphens
    // This will work for most cases but may fail for projects with hyphens in their names
    const encodedName = path.basename(projectDir);
    console.warn(`No cwd field found in ${projectDir}, using simple decode fallback`);
    
    // Basic decode: add leading slash and replace remaining hyphens with slashes
    if (encodedName.startsWith('-')) {
      return '/' + encodedName.substring(1).replace(/-/g, '/');
    }
    return encodedName;
  }

  private async getSessionIds(projectDir: string): Promise<string[]> {
    try {
      const files = await fs.readdir(projectDir);
      return files
        .filter(f => f.endsWith('.jsonl'))
        .map(f => f.replace('.jsonl', ''));
    } catch {
      return [];
    }
  }

  private readFirstLine(filePath: string): Promise<string | null> {
    return new Promise((resolve) => {
      const stream = createReadStream(filePath);
      const rl = readline.createInterface({ input: stream });
      
      rl.on('line', (line) => {
        rl.close();
        stream.close();
        resolve(line);
      });
      
      rl.on('error', () => {
        resolve(null);
      });
    });
  }

  private findCwdInFile(filePath: string): Promise<string | null> {
    return new Promise((resolve) => {
      const stream = createReadStream(filePath);
      const rl = readline.createInterface({ input: stream });
      let resolved = false;
      
      rl.on('line', (line) => {
        if (resolved) return;
        try {
          const data = JSON.parse(line);
          if (data.cwd) {
            resolved = true;
            rl.close();
            stream.close();
            resolve(data.cwd);
          }
        } catch {
          // Continue to next line
        }
      });
      
      rl.on('close', () => {
        if (!resolved) {
          resolved = true;
          resolve(null);
        }
      });
      
      rl.on('error', () => {
        if (!resolved) {
          resolved = true;
          resolve(null);
        }
      });
    });
  }

  async getProjectSessions(projectId: string): Promise<DiscoveredSession[]> {
    const projectDir = path.join(this.projectsDir, projectId);
    
    try {
      const files = await fs.readdir(projectDir);
      const sessions: DiscoveredSession[] = [];

      for (const file of files) {
        if (file.endsWith('.jsonl')) {
          const sessionId = file.replace('.jsonl', '');
          const filePath = path.join(projectDir, file);
          const stats = await fs.stat(filePath);
          const firstMessage = await this.extractFirstUserMessage(filePath);

          sessions.push({
            id: sessionId,
            project_id: projectId,
            project_path: await this.getProjectPath(projectDir),
            created_at: Math.floor(stats.birthtimeMs / 1000),
            first_message: firstMessage?.content,
            message_timestamp: firstMessage?.timestamp
          });
        }
      }

      return sessions.sort((a, b) => b.created_at - a.created_at);
    } catch (error) {
      console.error('Failed to get project sessions:', error);
      return [];
    }
  }

  private extractFirstUserMessage(filePath: string): Promise<{ content: string; timestamp: string } | null> {
    return new Promise((resolve) => {
      const stream = createReadStream(filePath);
      const rl = readline.createInterface({ input: stream });
      
      rl.on('line', (line) => {
        try {
          const data = JSON.parse(line);
          if (data.message?.role === 'user' && 
              data.message.content &&
              !data.message.content.includes('Caveat:')) {
            rl.close();
            stream.close();
            resolve({
              content: data.message.content,
              timestamp: data.timestamp
            });
          }
        } catch {
          // Continue to next line
        }
      });
      
      rl.on('close', () => resolve(null));
      rl.on('error', () => resolve(null));
    });
  }

  async loadSessionHistory(projectId: string, sessionId: string): Promise<any> {
    const filePath = path.join(this.projectsDir, projectId, `${sessionId}.jsonl`);
    const entries: any[] = [];

    return new Promise((resolve, reject) => {
      const stream = createReadStream(filePath);
      const rl = readline.createInterface({ input: stream });
      
      rl.on('line', (line) => {
        try {
          const data = JSON.parse(line);
          entries.push(data);
        } catch (error) {
          console.error('Failed to parse line:', error);
        }
      });
      
      rl.on('close', () => {
        resolve({
          project_id: projectId,
          session_id: sessionId,
          entries
        });
      });
      
      rl.on('error', reject);
    });
  }
}