import { spawn, ChildProcess } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';
import { BrowserWindow } from 'electron';
import { ClaudeBinaryFinder } from './claudeBinary';
import { ClaudeStreamParser } from './claudeStreamParser';
import { Message, ErrorData, CompletionData } from '@shared/types';

export class ClaudeSession extends EventEmitter {
  id: string;
  name: string;
  projectPath: string;
  process: ChildProcess | null = null;
  messages: Message[] = [];
  isActive = false;
  createdAt: string;
  claudeSessionId: string | null = null; // The actual session ID from Claude
  claudeProjectId: string | null = null; // The project ID from Claude
  private streamParser?: ClaudeStreamParser;

  constructor(id: string, name: string, projectPath: string) {
    super();
    this.id = id;
    this.name = name;
    this.projectPath = projectPath;
    this.createdAt = new Date().toISOString();
  }

  async start(claudePath: string, prompt: string, model = 'opus', mainWindow: BrowserWindow): Promise<void> {
    if (this.isActive) {
      throw new Error('Session already active');
    }

    const args = [
      '-p', prompt,
      '--model', model,
      '--output-format', 'stream-json',
      '--verbose'
    ];

    // Add continue flag if this isn't the first message
    if (this.messages.length > 0) {
      args.unshift('-c'); // Continue conversation
    }

    console.log('Spawning Claude process:', claudePath, args);
    console.log('Working directory:', this.projectPath);

    this.process = spawn(claudePath, args, {
      cwd: this.projectPath,
      env: { ...process.env },
      // Ensure we get stdout/stderr as streams
      stdio: ['ignore', 'pipe', 'pipe']
    });

    this.isActive = true;

    // Set up stream parser
    this.streamParser = new ClaudeStreamParser(this.id, mainWindow);

    // First, add the user message to our history and send to frontend
    const userMessage: Message = {
      type: 'user',
      message: { role: 'user', content: prompt },
      timestamp: new Date().toISOString()
    };
    
    this.messages.push(userMessage);
    mainWindow.webContents.send(`session-message:${this.id}`, userMessage);

    // Handle stdout stream
    this.process.stdout?.on('data', (chunk: Buffer) => {
      this.streamParser?.handleData(chunk);
    });

    // Handle stderr
    this.process.stderr?.on('data', (chunk: Buffer) => {
      const error = chunk.toString();
      console.error('Claude stderr:', error);
      mainWindow.webContents.send(`session-error:${this.id}`, {
        type: 'stderr',
        error,
        timestamp: new Date().toISOString()
      });
    });

    // Handle process exit
    this.process.on('close', (code: number | null) => {
      this.isActive = false;
      this.streamParser?.handleComplete(code || 0);
      
      // Save messages from parser and extract session info
      if (this.streamParser) {
        this.messages.push(...this.streamParser.getAllMessages());
        
        // Extract Claude session ID
        const sessionInfo = this.streamParser.getExtractedSessionInfo();
        if (sessionInfo.sessionId) {
          this.claudeSessionId = sessionInfo.sessionId;
          this.claudeProjectId = sessionInfo.projectId;
          console.log('Stored Claude session ID:', this.claudeSessionId);
        }
      }
      
      mainWindow.webContents.send(`session-complete:${this.id}`, {
        code: code || -1,
        success: code === 0,
        timestamp: new Date().toISOString()
      });
      
      this.emit('complete', { code: code || -1, success: code === 0 });
    });

    // Handle process errors
    this.process.on('error', (error: Error) => {
      console.error('Process spawn error:', error);
      this.isActive = false;
      mainWindow.webContents.send(`session-error:${this.id}`, {
        type: 'spawn',
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      this.emit('error', { type: 'spawn', error: error.message });
    });

    // Log if process starts successfully
    this.process.on('spawn', () => {
      console.log('Claude process spawned successfully');
    });
  }


  async continue(claudePath: string, prompt: string, model = 'opus', mainWindow: BrowserWindow): Promise<void> {
    // The start method already handles continuation with the -c flag
    // So we can just call start
    await this.start(claudePath, prompt, model, mainWindow);
  }

  async resume(claudePath: string, prompt: string, model = 'opus', mainWindow: BrowserWindow): Promise<void> {
    if (this.isActive) {
      throw new Error('Session already active');
    }

    // Use the Claude session ID if available, otherwise fail
    if (!this.claudeSessionId) {
      throw new Error('No Claude session ID available for resuming');
    }

    const args = [
      '--resume', this.claudeSessionId,
      '-p', prompt,
      '--model', model,
      '--output-format', 'stream-json',
      '--verbose'
    ];

    console.log('Resuming Claude session:', this.claudeSessionId, args);

    this.process = spawn(claudePath, args, {
      cwd: this.projectPath,
      env: { ...process.env },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    this.isActive = true;

    // Set up stream parser
    this.streamParser = new ClaudeStreamParser(this.id, mainWindow);

    // Add user message for resume
    const userMessage: Message = {
      type: 'user',
      message: { role: 'user', content: prompt },
      timestamp: new Date().toISOString()
    };
    
    this.messages.push(userMessage);
    mainWindow.webContents.send(`session-message:${this.id}`, userMessage);

    // Handle stdout stream
    this.process.stdout?.on('data', (chunk: Buffer) => {
      this.streamParser?.handleData(chunk);
    });

    // Handle stderr
    this.process.stderr?.on('data', (chunk: Buffer) => {
      const error = chunk.toString();
      console.error('Claude stderr:', error);
      mainWindow.webContents.send(`session-error:${this.id}`, {
        type: 'stderr',
        error,
        timestamp: new Date().toISOString()
      });
    });

    // Handle process exit
    this.process.on('close', (code: number | null) => {
      this.isActive = false;
      this.streamParser?.handleComplete(code || 0);
      
      if (this.streamParser) {
        this.messages.push(...this.streamParser.getAllMessages());
        
        // Extract Claude session ID if we're resuming
        const sessionInfo = this.streamParser.getExtractedSessionInfo();
        if (sessionInfo.sessionId) {
          this.claudeSessionId = sessionInfo.sessionId;
          this.claudeProjectId = sessionInfo.projectId;
          console.log('Stored Claude session ID (resume):', this.claudeSessionId);
        }
      }
      
      mainWindow.webContents.send(`session-complete:${this.id}`, {
        code: code || -1,
        success: code === 0,
        timestamp: new Date().toISOString()
      });
      
      this.emit('complete', { code: code || -1, success: code === 0 });
    });

    // Handle process errors
    this.process.on('error', (error: Error) => {
      console.error('Process spawn error:', error);
      this.isActive = false;
      mainWindow.webContents.send(`session-error:${this.id}`, {
        type: 'spawn',
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      this.emit('error', { type: 'spawn', error: error.message });
    });
  }

  cancel(): void {
    if (this.process && this.isActive) {
      this.process.kill();
      this.isActive = false;
      this.emit('cancelled');
    }
  }
}

export class ClaudeManager {
  private sessions: Map<string, ClaudeSession> = new Map();
  private binaryFinder: ClaudeBinaryFinder = new ClaudeBinaryFinder();
  private claudePath: string | null = null;

  async initialize(): Promise<{ path: string; version: string }> {
    this.claudePath = await this.binaryFinder.findClaudeBinary();
    const version = await this.binaryFinder.getVersion(this.claudePath);
    return { path: this.claudePath, version };
  }

  createSession(name: string, projectPath: string): ClaudeSession {
    const id = uuidv4();
    const session = new ClaudeSession(id, name, projectPath);
    this.sessions.set(id, session);
    return session;
  }

  getSession(id: string): ClaudeSession | undefined {
    return this.sessions.get(id);
  }

  getSessionByClaudeId(claudeSessionId: string): ClaudeSession | undefined {
    for (const session of this.sessions.values()) {
      if (session.claudeSessionId === claudeSessionId) {
        return session;
      }
    }
    return undefined;
  }

  getAllSessions(): Array<{
    id: string;
    name: string;
    projectPath: string;
    isActive: boolean;
    createdAt: string;
    messageCount: number;
    claudeSessionId?: string;
  }> {
    return Array.from(this.sessions.values()).map(session => ({
      id: session.id,
      name: session.name,
      projectPath: session.projectPath,
      isActive: session.isActive,
      createdAt: session.createdAt,
      messageCount: session.messages.length,
      claudeSessionId: session.claudeSessionId || undefined
    }));
  }

  async startNewSession(name: string, projectPath: string, prompt: string, model: string, mainWindow: BrowserWindow): Promise<ClaudeSession> {
    if (!this.claudePath) {
      throw new Error('Claude binary not initialized');
    }
    const session = this.createSession(name, projectPath);
    await session.start(this.claudePath, prompt, model, mainWindow);
    return session;
  }

  async continueSession(sessionId: string, prompt: string, model: string, mainWindow: BrowserWindow): Promise<ClaudeSession> {
    if (!this.claudePath) {
      throw new Error('Claude binary not initialized');
    }
    const session = this.getSession(sessionId);
    if (!session) throw new Error('Session not found');
    await session.continue(this.claudePath, prompt, model, mainWindow);
    return session;
  }

  async resumeSession(sessionId: string, prompt: string, model: string, mainWindow: BrowserWindow): Promise<ClaudeSession> {
    if (!this.claudePath) {
      throw new Error('Claude binary not initialized');
    }
    const session = this.getSession(sessionId);
    if (!session) throw new Error('Session not found');
    await session.resume(this.claudePath, prompt, model, mainWindow);
    return session;
  }
}