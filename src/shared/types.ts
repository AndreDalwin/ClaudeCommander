export interface ClaudeSession {
  id: string;
  name: string;
  projectPath: string;
  isActive: boolean;
  createdAt: string;
  messageCount: number;
  claudeSessionId?: string; // The actual Claude session ID
  claudeProjectId?: string; // The Claude project ID
  resumedFrom?: string; // If resumed, stores the original Claude session ID
  autoMode?: boolean; // Whether auto mode is enabled (--dangerously-skip-permissions)
}

// Unified session interface that represents both active and discovered sessions
export interface UnifiedSession {
  id: string; // Internal ID (for active) or Claude session ID (for discovered)
  claudeSessionId: string; // The actual Claude session ID
  name: string;
  projectPath: string;
  isActive: boolean;
  createdAt: string;
  messageCount: number;
  source: 'active' | 'discovered'; // Where this session came from
  firstMessage?: string; // For discovered sessions
  canResume: boolean; // Whether this session can be resumed
  autoMode?: boolean; // Whether auto mode is enabled
}

export interface Message {
  type: 'user' | 'text' | 'tool_use' | 'tool_result' | 'thinking' | 'system' | 'usage' | 'error' | 'raw' | 'result' | 'assistant';
  timestamp: string;
  // Meta message indicators
  isMeta?: boolean;
  is_error?: boolean;
  subtype?: string; // For system init messages, etc.
  leafUuid?: string; // Reference point indicators
  summary?: string; // Summary content for meta messages
  // User message
  message?: {
    role: 'user' | 'assistant';
    content: string | Array<{type: string; text?: string; [key: string]: any}>;
  };
  // Text message from Claude
  text?: string;
  accumulatedText?: string; // For streaming text
  // Tool use message
  name?: string;
  input?: any;
  tool_use_id?: string;
  // Tool result
  output?: any;
  tool_use_id_result?: string;
  parent_tool_use_id?: string; // For user messages containing tool results
  // Thinking message
  thinking?: string;
  accumulatedThinking?: string; // For streaming thinking
  // System message
  system?: string;
  reminder?: boolean;
  // Usage info
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
  };
  // Error
  error?: string;
  // Streaming indicator
  isStreaming?: boolean;
}

export interface SessionData {
  id: string;
  name: string;
  projectPath: string;
  prompt: string;
  model: 'opus' | 'sonnet' | 'haiku';
  autoMode?: boolean;
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
  resumeSession: (data: { 
    projectPath: string; 
    sessionId: string; 
    name: string;
    prompt: string; 
    model: string;
    autoMode?: boolean;
  }) => Promise<ClaudeSession>;
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
    electronAPI: {
      openExternal: (url: string) => Promise<{ success: boolean; error?: string }>;
    };
  }
}