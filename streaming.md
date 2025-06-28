# Complete Claude Code Streaming Flow: Step-by-Step Implementation

## Overview
This guide shows the complete flow from user input to streaming output in an Electron + React + TypeScript app.

## Step 1: User Enters Prompt (React Component)

```typescript
// src/renderer/components/PromptInput.tsx
import React, { useState } from 'react';

interface PromptInputProps {
  sessionId: string;
  onMessageSent: () => void;
}

export const PromptInput: React.FC<PromptInputProps> = ({ sessionId, onMessageSent }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    
    try {
      // Step 2: Send to main process via IPC
      await window.electronAPI.sendPrompt({
        sessionId,
        prompt: prompt.trim(),
        model: 'opus'
      });
      
      setPrompt('');
      onMessageSent();
    } catch (error) {
      console.error('Failed to send prompt:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="prompt-input">
      <input
        type="text"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Ask Claude anything..."
        disabled={isLoading}
      />
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Sending...' : 'Send'}
      </button>
    </form>
  );
};
```

## Step 2: IPC Bridge (Preload Script)

```typescript
// src/main/preload.ts
import { contextBridge, ipcRenderer } from 'electron';

// Define types
export interface PromptData {
  sessionId: string;
  prompt: string;
  model: string;
}

export interface StreamMessage {
  type: 'text' | 'tool_use' | 'tool_result' | 'usage' | 'system' | 'error';
  sessionId: string;
  timestamp: string;
  // Type-specific fields
  text?: string;
  accumulatedText?: string;
  name?: string;
  input?: any;
  output?: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

// Expose APIs to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Step 3: Send prompt to main process
  sendPrompt: (data: PromptData) => ipcRenderer.invoke('send-prompt', data),
  
  // Step 10: Listen for streamed messages
  onStreamMessage: (callback: (message: StreamMessage) => void) => {
    const listener = (_event: any, message: StreamMessage) => callback(message);
    ipcRenderer.on('claude-stream', listener);
    
    // Return cleanup function
    return () => {
      ipcRenderer.removeListener('claude-stream', listener);
    };
  },
  
  onStreamError: (callback: (error: any) => void) => {
    const listener = (_event: any, error: any) => callback(error);
    ipcRenderer.on('claude-error', listener);
    return () => ipcRenderer.removeListener('claude-error', listener);
  },
  
  onStreamComplete: (callback: (data: any) => void) => {
    const listener = (_event: any, data: any) => callback(data);
    ipcRenderer.on('claude-complete', listener);
    return () => ipcRenderer.removeListener('claude-complete', listener);
  }
});
```

## Step 3: Main Process Receives IPC Call

```typescript
// src/main/ipcHandlers.ts
import { ipcMain, BrowserWindow } from 'electron';
import { ClaudeSessionManager } from './claudeSessionManager';
import type { PromptData } from './preload';

export function setupIpcHandlers(
  mainWindow: BrowserWindow, 
  sessionManager: ClaudeSessionManager
) {
  // Step 4: Handle incoming prompt
  ipcMain.handle('send-prompt', async (event, data: PromptData) => {
    const { sessionId, prompt, model } = data;
    
    try {
      // Get or create session
      let session = sessionManager.getSession(sessionId);
      
      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }
      
      // Check if session is already active
      if (session.isActive) {
        throw new Error('Session is already processing a request');
      }
      
      // Step 5: Execute Claude command
      await session.sendPrompt(prompt, model, mainWindow);
      
      return { success: true };
    } catch (error) {
      console.error('Error handling prompt:', error);
      throw error;
    }
  });
}
```

## Step 4: Session Manager Spawns Claude Process

```typescript
// src/main/claudeSessionManager.ts
import { spawn, ChildProcess } from 'child_process';
import { BrowserWindow } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import { ClaudeStreamParser } from './claudeStreamParser';

export interface Session {
  id: string;
  name: string;
  projectPath: string;
  isActive: boolean;
  process?: ChildProcess;
  messages: any[];
  createdAt: string;
}

export class ClaudeSession {
  public id: string;
  public name: string;
  public projectPath: string;
  public isActive: boolean = false;
  public messages: any[] = [];
  public createdAt: string;
  private process?: ChildProcess;
  private claudePath: string;
  private streamParser?: ClaudeStreamParser;

  constructor(id: string, name: string, projectPath: string, claudePath: string) {
    this.id = id;
    this.name = name;
    this.projectPath = projectPath;
    this.claudePath = claudePath;
    this.createdAt = new Date().toISOString();
  }

  async sendPrompt(prompt: string, model: string, mainWindow: BrowserWindow) {
    if (this.isActive) {
      throw new Error('Session is already active');
    }

    // Step 6: Spawn Claude process
    const args = [
      '-p', prompt,
      '--model', model,
      '--output-format', 'stream-json',
      '--verbose',
      '--dangerously-skip-permissions'
    ];

    // Add continue flag if this isn't the first message
    if (this.messages.length > 0) {
      args.unshift('-c'); // Continue conversation
    }

    this.process = spawn(this.claudePath, args, {
      cwd: this.projectPath,
      env: { ...process.env },
      // Ensure we get stdout/stderr as streams
      stdio: ['ignore', 'pipe', 'pipe']
    });

    this.isActive = true;

    // Step 7: Set up stream parser
    this.streamParser = new ClaudeStreamParser(this.id, mainWindow);

    // First, add the user message to our history and send to frontend
    const userMessage = {
      type: 'user',
      message: { role: 'user', content: prompt },
      timestamp: new Date().toISOString(),
      sessionId: this.id
    };
    
    this.messages.push(userMessage);
    mainWindow.webContents.send('claude-stream', userMessage);

    // Step 8: Handle stdout stream
    this.process.stdout?.on('data', (chunk: Buffer) => {
      this.streamParser?.handleData(chunk);
    });

    // Handle stderr
    this.process.stderr?.on('data', (chunk: Buffer) => {
      const error = chunk.toString();
      console.error('Claude stderr:', error);
      mainWindow.webContents.send('claude-error', {
        sessionId: this.id,
        error,
        timestamp: new Date().toISOString()
      });
    });

    // Handle process exit
    this.process.on('close', (code: number | null) => {
      this.isActive = false;
      this.streamParser?.handleComplete(code || 0);
      
      // Save messages from parser
      if (this.streamParser) {
        this.messages.push(...this.streamParser.getAllMessages());
      }
      
      mainWindow.webContents.send('claude-complete', {
        sessionId: this.id,
        success: code === 0,
        code,
        timestamp: new Date().toISOString()
      });
    });

    // Handle process errors
    this.process.on('error', (error: Error) => {
      this.isActive = false;
      console.error('Process error:', error);
      mainWindow.webContents.send('claude-error', {
        sessionId: this.id,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    });
  }

  cancel() {
    if (this.process && this.isActive) {
      this.process.kill('SIGTERM');
      this.isActive = false;
    }
  }
}

export class ClaudeSessionManager {
  private sessions: Map<string, ClaudeSession> = new Map();
  private claudePath: string;

  constructor(claudePath: string) {
    this.claudePath = claudePath;
  }

  createSession(name: string, projectPath: string): ClaudeSession {
    const id = uuidv4();
    const session = new ClaudeSession(id, name, projectPath, this.claudePath);
    this.sessions.set(id, session);
    return session;
  }

  getSession(id: string): ClaudeSession | undefined {
    return this.sessions.get(id);
  }
}
```

## Step 5: Stream Parser Processes Claude Output

```typescript
// src/main/claudeStreamParser.ts
import { BrowserWindow } from 'electron';

export class ClaudeStreamParser {
  private sessionId: string;
  private mainWindow: BrowserWindow;
  private buffer: string = '';
  private currentTextMessage: string = '';
  private messages: any[] = [];

  constructor(sessionId: string, mainWindow: BrowserWindow) {
    this.sessionId = sessionId;
    this.mainWindow = mainWindow;
  }

  // Step 9: Parse streaming data
  handleData(chunk: Buffer) {
    // Add chunk to buffer
    this.buffer += chunk.toString();
    
    // Split by newlines
    const lines = this.buffer.split('\n');
    
    // Keep the last incomplete line in buffer
    this.buffer = lines.pop() || '';
    
    // Process each complete line
    lines.forEach(line => {
      if (!line.trim()) return;
      
      try {
        // Parse JSON
        const message = JSON.parse(line);
        this.processMessage(message);
      } catch (error) {
        console.error('Failed to parse Claude output:', error);
        console.error('Line was:', line);
      }
    });
  }

  private processMessage(message: any) {
    // Add metadata
    message.sessionId = this.sessionId;
    message.timestamp = new Date().toISOString();

    // Handle different message types
    switch (message.type) {
      case 'text':
        // Accumulate text messages
        this.currentTextMessage += message.text;
        
        // Step 10: Send to frontend with accumulated text
        this.mainWindow.webContents.send('claude-stream', {
          ...message,
          accumulatedText: this.currentTextMessage
        });
        break;

      case 'tool_use':
        // Finalize any pending text
        this.finalizeText();
        
        // Send tool use message
        this.mainWindow.webContents.send('claude-stream', message);
        this.messages.push(message);
        break;

      case 'tool_result':
        // Send tool result
        this.mainWindow.webContents.send('claude-stream', message);
        this.messages.push(message);
        break;

      case 'usage':
        // Send usage info
        this.mainWindow.webContents.send('claude-stream', message);
        break;

      case 'system':
        // Handle system messages
        this.mainWindow.webContents.send('claude-stream', message);
        break;

      default:
        // Send any other message types
        this.mainWindow.webContents.send('claude-stream', message);
        this.messages.push(message);
    }
  }

  private finalizeText() {
    if (this.currentTextMessage) {
      // Send complete text message
      const textMessage = {
        type: 'text-complete',
        text: this.currentTextMessage,
        sessionId: this.sessionId,
        timestamp: new Date().toISOString()
      };
      
      this.mainWindow.webContents.send('claude-stream', textMessage);
      this.messages.push(textMessage);
      
      // Reset accumulator
      this.currentTextMessage = '';
    }
  }

  handleComplete(code: number) {
    // Finalize any pending text
    this.finalizeText();
  }

  getAllMessages() {
    return this.messages;
  }
}
```

## Step 6: React Component Receives and Displays Stream

```typescript
// src/renderer/components/SessionView.tsx
import React, { useState, useEffect, useRef } from 'react';
import type { StreamMessage } from '../../main/preload';

interface SessionViewProps {
  sessionId: string;
}

interface DisplayMessage {
  id: string;
  type: string;
  content: any;
  timestamp: string;
}

export const SessionView: React.FC<SessionViewProps> = ({ sessionId }) => {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentAssistantMessage = useRef<string>('');

  useEffect(() => {
    // Step 11: Set up stream listeners
    const unsubscribeMessage = window.electronAPI.onStreamMessage((message: StreamMessage) => {
      // Only handle messages for this session
      if (message.sessionId !== sessionId) return;

      handleStreamMessage(message);
    });

    const unsubscribeError = window.electronAPI.onStreamError((error: any) => {
      if (error.sessionId !== sessionId) return;
      
      console.error('Stream error:', error);
      setIsStreaming(false);
    });

    const unsubscribeComplete = window.electronAPI.onStreamComplete((data: any) => {
      if (data.sessionId !== sessionId) return;
      
      setIsStreaming(false);
    });

    // Cleanup
    return () => {
      unsubscribeMessage();
      unsubscribeError();
      unsubscribeComplete();
    };
  }, [sessionId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleStreamMessage = (message: StreamMessage) => {
    switch (message.type) {
      case 'user':
        // Add user message
        setMessages(prev => [...prev, {
          id: `${Date.now()}-user`,
          type: 'user',
          content: message.message?.content || '',
          timestamp: message.timestamp
        }]);
        setIsStreaming(true);
        break;

      case 'text':
        // Update streaming assistant message
        if (message.accumulatedText) {
          currentAssistantMessage.current = message.accumulatedText;
          
          setMessages(prev => {
            const lastMessage = prev[prev.length - 1];
            
            // If last message is assistant text, update it
            if (lastMessage && lastMessage.type === 'assistant-text') {
              return [
                ...prev.slice(0, -1),
                {
                  ...lastMessage,
                  content: message.accumulatedText
                }
              ];
            } else {
              // Create new assistant message
              return [...prev, {
                id: `${Date.now()}-assistant`,
                type: 'assistant-text',
                content: message.accumulatedText,
                timestamp: message.timestamp
              }];
            }
          });
        }
        break;

      case 'text-complete':
        // Finalize assistant text
        currentAssistantMessage.current = '';
        break;

      case 'tool_use':
        // Add tool use message
        setMessages(prev => [...prev, {
          id: `${Date.now()}-tool-use`,
          type: 'tool-use',
          content: {
            name: message.name,
            input: message.input
          },
          timestamp: message.timestamp
        }]);
        break;

      case 'tool_result':
        // Add tool result
        setMessages(prev => [...prev, {
          id: `${Date.now()}-tool-result`,
          type: 'tool-result',
          content: message.output,
          timestamp: message.timestamp
        }]);
        break;
    }
  };

  return (
    <div className="session-view">
      <div className="messages">
        {messages.map(message => (
          <MessageDisplay key={message.id} message={message} />
        ))}
        {isStreaming && (
          <div className="streaming-indicator">
            Claude is thinking...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <PromptInput 
        sessionId={sessionId} 
        onMessageSent={() => {}} 
      />
    </div>
  );
};

// Component to display different message types
const MessageDisplay: React.FC<{ message: DisplayMessage }> = ({ message }) => {
  switch (message.type) {
    case 'user':
      return (
        <div className="message user-message">
          <div className="message-header">You</div>
          <div className="message-content">{message.content}</div>
        </div>
      );

    case 'assistant-text':
      return (
        <div className="message assistant-message">
          <div className="message-header">Claude</div>
          <div className="message-content">{message.content}</div>
        </div>
      );

    case 'tool-use':
      return (
        <div className="message tool-message">
          <div className="tool-header">
            🔧 Using tool: {message.content.name}
          </div>
          <pre className="tool-input">
            {JSON.stringify(message.content.input, null, 2)}
          </pre>
        </div>
      );

    case 'tool-result':
      return (
        <div className="message tool-result-message">
          <div className="tool-result-header">✅ Result</div>
          <pre className="tool-result-content">{message.content}</pre>
        </div>
      );

    default:
      return null;
  }
};
```

## Complete Flow Summary

1. **User types prompt** → React component captures input
2. **Form submission** → IPC call to main process via `window.electronAPI.sendPrompt`
3. **Main process receives** → IPC handler validates session
4. **Session manager** → Spawns Claude process with arguments
5. **Claude process starts** → Outputs JSONL to stdout
6. **Stream parser** → Buffers and parses each JSON line
7. **Message processing** → Handles text accumulation, tool use, etc.
8. **IPC emission** → Sends parsed messages to renderer via `webContents.send`
9. **React receives** → Updates state with new messages
10. **UI updates** → Displays messages in real-time
11. **Process completes** → Final cleanup and status update

## Key Implementation Details

### Buffer Management
```typescript
// Critical: Handle partial JSON lines
let buffer = '';
stdout.on('data', (chunk) => {
  buffer += chunk.toString();
  const lines = buffer.split('\n');
  buffer = lines.pop() || ''; // Keep incomplete line
  lines.forEach(line => { /* process */ });
});
```

### Text Accumulation
```typescript
// Claude sends text in chunks, must accumulate
let accumulated = '';
if (message.type === 'text') {
  accumulated += message.text;
  // Send accumulated version to UI
}
```

### Error Handling
```typescript
// Always handle process errors
process.on('error', (err) => {
  // Process failed to start
});
process.stderr.on('data', (data) => {
  // Runtime errors from Claude
});
```

### Session State
```typescript
// Track active state to prevent double execution
if (session.isActive) {
  throw new Error('Session already processing');
}
```

This complete implementation gives you a robust, type-safe streaming system that handles all edge cases and provides a smooth user experience.
