export interface ClaudeSession {
  id: string;
  name: string;
  projectPath: string;
  isActive: boolean;
  createdAt: string;
  messageCount: number;
}

export interface Message {
  type: 'user' | 'text' | 'tool_use' | 'tool_result' | 'error' | 'raw';
  timestamp: string;
  // User message
  message?: {
    role: 'user' | 'assistant';
    content: string;
  };
  // Text message from Claude
  text?: string;
  accumulatedText?: string; // For streaming text
  // Tool use message
  name?: string;
  input?: any;
  // Tool result
  output?: any;
  // Error
  error?: string;
}

export interface SessionData {
  id: string;
  name: string;
  projectPath: string;
  prompt: string;
  model: 'opus' | 'sonnet' | 'haiku';
}

export interface ErrorData {
  type: 'parse' | 'stderr' | 'spawn';
  error: string;
}

export interface CompletionData {
  code: number;
  success: boolean;
}

// Session discovery types
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

// IPC API exposed to renderer
export interface ClaudeAPI {
  // Session management
  createSession: (data: SessionData) => Promise<ClaudeSession>;
  continueSession: (data: { sessionId: string; prompt: string; model: string }) => Promise<{ success: boolean }>;
  getSessions: () => Promise<ClaudeSession[]>;
  getSessionMessages: (sessionId: string) => Promise<Message[]>;
  cancelSession: (sessionId: string) => Promise<{ success: boolean; error?: string }>;
  
  // Claude status
  getClaudeStatus: () => Promise<{ connected: boolean; version: string; path: string }>;
  
  // File system
  selectDirectory: () => Promise<string | null>;
  
  // Session discovery
  discoverProjects: () => Promise<DiscoveredProject[]>;
  getDiscoveredSessions: (projectId: string) => Promise<DiscoveredSession[]>;
  loadSessionHistory: (data: { projectId: string; sessionId: string }) => Promise<any>;
  
  // Event listeners
  onSessionMessage: (sessionId: string, callback: (message: Message) => void) => () => void;
  onSessionError: (sessionId: string, callback: (error: ErrorData) => void) => () => void;
  onSessionComplete: (sessionId: string, callback: (result: CompletionData) => void) => () => void;
}

declare global {
  interface Window {
    claudeAPI: ClaudeAPI;
  }
}