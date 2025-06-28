# Building a Claude Code Session Manager with Electron + React

This guide explains how to build a Claude Code session management desktop app using Electron and React, based on the implementation patterns from the Claudia project.

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Project Setup](#project-setup)
4. [Binary Discovery](#binary-discovery)
5. [Session Management](#session-management)
6. [Streaming Output](#streaming-output)
7. [UI Implementation](#ui-implementation)
8. [Session Storage](#session-storage)
9. [Complete Example](#complete-example)
10. [Future Enhancements](#future-enhancements)

## Overview

This guide will help you build a desktop application that:
- Discovers and executes Claude Code binary
- Creates named sessions with real-time streaming output
- Manages session history and storage
- Provides a foundation for future agentic features

## Architecture

```
electron-claude-manager/
├── src/
│   ├── main/              # Electron main process
│   │   ├── index.js       # Main entry point
│   │   ├── claudeManager.js   # Claude process management
│   │   ├── sessionStore.js    # Session persistence
│   │   └── preload.js     # Bridge between main and renderer
│   ├── renderer/          # React app
│   │   ├── App.jsx
│   │   ├── components/
│   │   └── hooks/
│   └── shared/            # Shared types and utilities
├── package.json
└── electron-builder.json
```

## Project Setup

```bash
# Create new Electron app with React
npm create electron-app claude-manager --template=webpack-typescript

# Or use electron-vite (recommended)
npm create @quick-start/electron claude-manager --template react

cd claude-manager

# Install additional dependencies
npm install uuid
npm install @emotion/react @emotion/styled  # For styling
npm install react-router-dom  # For navigation
```

## Binary Discovery

### Main Process Implementation

```javascript
// src/main/claudeBinary.js
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

const execAsync = promisify(exec);

class ClaudeBinaryFinder {
  constructor() {
    this.cachedPath = null;
  }

  async findClaudeBinary() {
    // Return cached path if available
    if (this.cachedPath && await this.verifyPath(this.cachedPath)) {
      return this.cachedPath;
    }

    // Try 'which' command first
    try {
      const { stdout } = await execAsync('which claude');
      const claudePath = stdout.trim();
      if (await this.verifyPath(claudePath)) {
        this.cachedPath = claudePath;
        return claudePath;
      }
    } catch (error) {
      console.log('which command failed:', error.message);
    }

    // Check common installation paths
    const paths = this.getSearchPaths();
    
    for (const searchPath of paths) {
      if (await this.verifyPath(searchPath)) {
        this.cachedPath = searchPath;
        return searchPath;
      }
    }

    throw new Error('Claude Code not found. Please ensure it\'s installed.');
  }

  getSearchPaths() {
    const home = os.homedir();
    const platform = os.platform();
    
    const basePaths = [
      '/usr/local/bin/claude',
      '/usr/bin/claude',
      path.join(home, '.local/bin/claude'),
      path.join(home, '.npm-global/bin/claude'),
      path.join(home, '.yarn/bin/claude'),
      path.join(home, '.bun/bin/claude'),
    ];

    // Platform-specific paths
    if (platform === 'darwin') {
      basePaths.push('/opt/homebrew/bin/claude');
    }

    // Check NVM installations
    const nvmDir = path.join(home, '.nvm/versions/node');
    try {
      const nodeDirs = fs.readdirSync(nvmDir);
      nodeDirs.forEach(dir => {
        basePaths.push(path.join(nvmDir, dir, 'bin/claude'));
      });
    } catch {}

    return basePaths;
  }

  async verifyPath(claudePath) {
    try {
      await fs.access(claudePath, fs.constants.X_OK);
      return true;
    } catch {
      return false;
    }
  }

  async getVersion(claudePath) {
    try {
      const { stdout } = await execAsync(`"${claudePath}" --version`);
      return stdout.trim();
    } catch {
      return 'unknown';
    }
  }
}

module.exports = { ClaudeBinaryFinder };
```

## Session Management

### Main Process Session Manager

```javascript
// src/main/claudeManager.js
const { spawn } = require('child_process');
const { v4: uuidv4 } = require('uuid');
const EventEmitter = require('events');

class ClaudeSession extends EventEmitter {
  constructor(id, name, projectPath) {
    super();
    this.id = id;
    this.name = name;
    this.projectPath = projectPath;
    this.process = null;
    this.messages = [];
    this.isActive = false;
    this.createdAt = new Date().toISOString();
  }

  async start(claudePath, prompt, model = 'opus') {
    if (this.isActive) {
      throw new Error('Session already active');
    }

    const args = [
      '-p', prompt,
      '--model', model,
      '--output-format', 'stream-json',
      '--verbose',
      '--dangerously-skip-permissions'
    ];

    this.process = spawn(claudePath, args, {
      cwd: this.projectPath,
      env: { ...process.env }
    });

    this.isActive = true;
    this.setupEventHandlers();
    
    // Add user message to history
    this.messages.push({
      type: 'user',
      message: { role: 'user', content: prompt },
      timestamp: new Date().toISOString()
    });
  }

  setupEventHandlers() {
    let buffer = '';

    this.process.stdout.on('data', (data) => {
      buffer += data.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      lines.forEach(line => {
        if (line.trim()) {
          try {
            const message = JSON.parse(line);
            this.messages.push(message);
            this.emit('message', message);
          } catch (error) {
            console.error('Failed to parse message:', error);
            this.emit('error', { type: 'parse', error: error.message });
          }
        }
      });
    });

    this.process.stderr.on('data', (data) => {
      console.error('Claude stderr:', data.toString());
      this.emit('error', { type: 'stderr', error: data.toString() });
    });

    this.process.on('close', (code) => {
      this.isActive = false;
      this.emit('complete', { code, success: code === 0 });
    });

    this.process.on('error', (error) => {
      this.isActive = false;
      this.emit('error', { type: 'spawn', error: error.message });
    });
  }

  async continue(claudePath, prompt, model = 'opus') {
    if (this.isActive) {
      throw new Error('Session already active');
    }

    const args = [
      '-c',  // Continue flag
      '-p', prompt,
      '--model', model,
      '--output-format', 'stream-json',
      '--verbose',
      '--dangerously-skip-permissions'
    ];

    this.process = spawn(claudePath, args, {
      cwd: this.projectPath,
      env: { ...process.env }
    });

    this.isActive = true;
    this.setupEventHandlers();
    
    // Add user message
    this.messages.push({
      type: 'user',
      message: { role: 'user', content: prompt },
      timestamp: new Date().toISOString()
    });
  }

  async resume(claudePath, prompt, model = 'opus') {
    if (this.isActive) {
      throw new Error('Session already active');
    }

    const args = [
      '--resume', this.id,
      '-p', prompt,
      '--model', model,
      '--output-format', 'stream-json',
      '--verbose',
      '--dangerously-skip-permissions'
    ];

    this.process = spawn(claudePath, args, {
      cwd: this.projectPath,
      env: { ...process.env }
    });

    this.isActive = true;
    this.setupEventHandlers();
  }

  cancel() {
    if (this.process && this.isActive) {
      this.process.kill();
      this.isActive = false;
      this.emit('cancelled');
    }
  }
}

class ClaudeManager {
  constructor() {
    this.sessions = new Map();
    this.binaryFinder = new ClaudeBinaryFinder();
    this.claudePath = null;
  }

  async initialize() {
    this.claudePath = await this.binaryFinder.findClaudeBinary();
    const version = await this.binaryFinder.getVersion(this.claudePath);
    return { path: this.claudePath, version };
  }

  createSession(name, projectPath) {
    const id = uuidv4();
    const session = new ClaudeSession(id, name, projectPath);
    this.sessions.set(id, session);
    return session;
  }

  getSession(id) {
    return this.sessions.get(id);
  }

  getAllSessions() {
    return Array.from(this.sessions.values()).map(session => ({
      id: session.id,
      name: session.name,
      projectPath: session.projectPath,
      isActive: session.isActive,
      createdAt: session.createdAt,
      messageCount: session.messages.length
    }));
  }

  async startNewSession(name, projectPath, prompt, model) {
    const session = this.createSession(name, projectPath);
    await session.start(this.claudePath, prompt, model);
    return session;
  }

  async continueSession(sessionId, prompt, model) {
    const session = this.getSession(sessionId);
    if (!session) throw new Error('Session not found');
    await session.continue(this.claudePath, prompt, model);
    return session;
  }

  async resumeSession(sessionId, prompt, model) {
    const session = this.getSession(sessionId);
    if (!session) throw new Error('Session not found');
    await session.resume(this.claudePath, prompt, model);
    return session;
  }
}

module.exports = { ClaudeManager, ClaudeSession };
```

## Streaming Output

### IPC Communication Setup

```javascript
// src/main/index.js
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { ClaudeManager } = require('./claudeManager');
const { SessionStore } = require('./sessionStore');

let mainWindow;
const claudeManager = new ClaudeManager();
const sessionStore = new SessionStore();

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
}

app.whenReady().then(async () => {
  // Initialize Claude binary
  try {
    const info = await claudeManager.initialize();
    console.log('Claude initialized:', info);
  } catch (error) {
    dialog.showErrorBox('Claude Code Not Found', error.message);
    app.quit();
    return;
  }

  createWindow();
  setupIpcHandlers();
});

function setupIpcHandlers() {
  // Create new session
  ipcMain.handle('create-session', async (event, { name, projectPath, prompt, model }) => {
    try {
      const session = await claudeManager.startNewSession(name, projectPath, prompt, model);
      
      // Set up event forwarding
      session.on('message', (message) => {
        mainWindow.webContents.send(`session-message:${session.id}`, message);
      });
      
      session.on('error', (error) => {
        mainWindow.webContents.send(`session-error:${session.id}`, error);
      });
      
      session.on('complete', (result) => {
        mainWindow.webContents.send(`session-complete:${session.id}`, result);
        // Save session to disk
        sessionStore.saveSession(session);
      });

      return {
        id: session.id,
        name: session.name,
        projectPath: session.projectPath,
        createdAt: session.createdAt
      };
    } catch (error) {
      throw error;
    }
  });

  // Continue session
  ipcMain.handle('continue-session', async (event, { sessionId, prompt, model }) => {
    const session = await claudeManager.continueSession(sessionId, prompt, model);
    return { success: true };
  });

  // Get all sessions
  ipcMain.handle('get-sessions', async () => {
    return claudeManager.getAllSessions();
  });

  // Get session messages
  ipcMain.handle('get-session-messages', async (event, sessionId) => {
    const session = claudeManager.getSession(sessionId);
    return session ? session.messages : [];
  });

  // Cancel session
  ipcMain.handle('cancel-session', async (event, sessionId) => {
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
}

// Preload script bridge
// src/main/preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('claudeAPI', {
  // Session management
  createSession: (data) => ipcRenderer.invoke('create-session', data),
  continueSession: (data) => ipcRenderer.invoke('continue-session', data),
  getSessions: () => ipcRenderer.invoke('get-sessions'),
  getSessionMessages: (sessionId) => ipcRenderer.invoke('get-session-messages', sessionId),
  cancelSession: (sessionId) => ipcRenderer.invoke('cancel-session', sessionId),
  
  // File system
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  
  // Event listeners
  onSessionMessage: (sessionId, callback) => {
    const channel = `session-message:${sessionId}`;
    const listener = (event, data) => callback(data);
    ipcRenderer.on(channel, listener);
    return () => ipcRenderer.removeListener(channel, listener);
  },
  
  onSessionError: (sessionId, callback) => {
    const channel = `session-error:${sessionId}`;
    const listener = (event, data) => callback(data);
    ipcRenderer.on(channel, listener);
    return () => ipcRenderer.removeListener(channel, listener);
  },
  
  onSessionComplete: (sessionId, callback) => {
    const channel = `session-complete:${sessionId}`;
    const listener = (event, data) => callback(data);
    ipcRenderer.on(channel, listener);
    return () => ipcRenderer.removeListener(channel, listener);
  }
});
```

## UI Implementation

### React App Structure

```jsx
// src/renderer/App.jsx
import React, { useState, useEffect } from 'react';
import { SessionList } from './components/SessionList';
import { SessionView } from './components/SessionView';
import { NewSessionDialog } from './components/NewSessionDialog';
import './App.css';

function App() {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [showNewSession, setShowNewSession] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    const sessionList = await window.claudeAPI.getSessions();
    setSessions(sessionList);
  };

  const handleCreateSession = async (sessionData) => {
    try {
      const newSession = await window.claudeAPI.createSession(sessionData);
      await loadSessions();
      setActiveSessionId(newSession.id);
      setShowNewSession(false);
    } catch (error) {
      console.error('Failed to create session:', error);
      alert(`Failed to create session: ${error.message}`);
    }
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>Claude Sessions</h1>
          <button 
            className="new-session-btn"
            onClick={() => setShowNewSession(true)}
          >
            + New Session
          </button>
        </div>
        <SessionList
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={setActiveSessionId}
        />
      </aside>

      <main className="main-content">
        {activeSessionId ? (
          <SessionView 
            sessionId={activeSessionId}
            onRefreshSessions={loadSessions}
          />
        ) : (
          <div className="empty-state">
            <h2>No session selected</h2>
            <p>Create a new session or select an existing one</p>
          </div>
        )}
      </main>

      {showNewSession && (
        <NewSessionDialog
          onClose={() => setShowNewSession(false)}
          onSubmit={handleCreateSession}
        />
      )}
    </div>
  );
}

export default App;
```

### Session View Component

```jsx
// src/renderer/components/SessionView.jsx
import React, { useState, useEffect, useRef } from 'react';
import { MessageList } from './MessageList';
import { PromptInput } from './PromptInput';
import './SessionView.css';

export function SessionView({ sessionId, onRefreshSessions }) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionInfo, setSessionInfo] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadMessages();
    const unsubscribeMessage = subscribeToMessages();
    const unsubscribeError = subscribeToErrors();
    const unsubscribeComplete = subscribeToComplete();

    return () => {
      unsubscribeMessage();
      unsubscribeError();
      unsubscribeComplete();
    };
  }, [sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    const sessionMessages = await window.claudeAPI.getSessionMessages(sessionId);
    setMessages(sessionMessages);
    
    // Get session info from the sessions list
    const sessions = await window.claudeAPI.getSessions();
    const info = sessions.find(s => s.id === sessionId);
    setSessionInfo(info);
  };

  const subscribeToMessages = () => {
    return window.claudeAPI.onSessionMessage(sessionId, (message) => {
      setMessages(prev => [...prev, message]);
    });
  };

  const subscribeToErrors = () => {
    return window.claudeAPI.onSessionError(sessionId, (error) => {
      console.error('Session error:', error);
      setIsLoading(false);
    });
  };

  const subscribeToComplete = () => {
    return window.claudeAPI.onSessionComplete(sessionId, (result) => {
      setIsLoading(false);
      onRefreshSessions();
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendPrompt = async (prompt, model) => {
    setIsLoading(true);
    
    // Add user message immediately
    const userMessage = {
      type: 'user',
      message: { role: 'user', content: prompt },
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      await window.claudeAPI.continueSession({
        sessionId,
        prompt,
        model
      });
    } catch (error) {
      console.error('Failed to send prompt:', error);
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    await window.claudeAPI.cancelSession(sessionId);
    setIsLoading(false);
  };

  return (
    <div className="session-view">
      <div className="session-header">
        <h2>{sessionInfo?.name || 'Loading...'}</h2>
        <span className="session-path">{sessionInfo?.projectPath}</span>
      </div>

      <div className="messages-container">
        <MessageList messages={messages} />
        <div ref={messagesEndRef} />
      </div>

      <PromptInput
        onSubmit={handleSendPrompt}
        onCancel={handleCancel}
        isLoading={isLoading}
        disabled={sessionInfo?.isActive}
      />
    </div>
  );
}
```

### Message Display Component

```jsx
// src/renderer/components/MessageList.jsx
import React from 'react';
import './MessageList.css';

export function MessageList({ messages }) {
  const renderMessage = (message, index) => {
    if (message.type === 'user') {
      return (
        <div key={index} className="message user-message">
          <div className="message-role">You</div>
          <div className="message-content">{message.message.content}</div>
        </div>
      );
    }

    // Handle different message types from Claude
    switch (message.type) {
      case 'text':
        return (
          <div key={index} className="message assistant-message">
            <div className="message-role">Claude</div>
            <div className="message-content">{message.text}</div>
          </div>
        );

      case 'tool_use':
        return (
          <div key={index} className="message tool-message">
            <div className="tool-header">
              🔧 {message.name}
            </div>
            <pre className="tool-input">
              {JSON.stringify(message.input, null, 2)}
            </pre>
          </div>
        );

      case 'tool_result':
        return (
          <div key={index} className="message tool-result">
            <div className="tool-result-header">
              ✓ Tool Result
            </div>
            <pre className="tool-output">
              {typeof message.output === 'string' 
                ? message.output 
                : JSON.stringify(message.output, null, 2)}
            </pre>
          </div>
        );

      default:
        return (
          <div key={index} className="message raw-message">
            <pre>{JSON.stringify(message, null, 2)}</pre>
          </div>
        );
    }
  };

  return (
    <div className="message-list">
      {messages.map((message, index) => renderMessage(message, index))}
    </div>
  );
}
```

### New Session Dialog

```jsx
// src/renderer/components/NewSessionDialog.jsx
import React, { useState } from 'react';
import './NewSessionDialog.css';

export function NewSessionDialog({ onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    projectPath: '',
    prompt: '',
    model: 'opus'
  });

  const handleSelectDirectory = async () => {
    const path = await window.claudeAPI.selectDirectory();
    if (path) {
      setFormData(prev => ({ ...prev, projectPath: path }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.projectPath || !formData.prompt) {
      alert('Please fill in all fields');
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={e => e.stopPropagation()}>
        <h2>New Claude Session</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Session Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="My Project Session"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Project Directory</label>
            <div className="path-input">
              <input
                type="text"
                value={formData.projectPath}
                onChange={e => setFormData(prev => ({ ...prev, projectPath: e.target.value }))}
                placeholder="/path/to/project"
              />
              <button type="button" onClick={handleSelectDirectory}>
                Browse
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Initial Prompt</label>
            <textarea
              value={formData.prompt}
              onChange={e => setFormData(prev => ({ ...prev, prompt: e.target.value }))}
              placeholder="What would you like Claude to help with?"
              rows={4}
            />
          </div>

          <div className="form-group">
            <label>Model</label>
            <select
              value={formData.model}
              onChange={e => setFormData(prev => ({ ...prev, model: e.target.value }))}
            >
              <option value="opus">Opus</option>
              <option value="sonnet">Sonnet</option>
              <option value="haiku">Haiku</option>
            </select>
          </div>

          <div className="dialog-actions">
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit">Create Session</button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

## Session Storage

### Persistent Storage Implementation

```javascript
// src/main/sessionStore.js
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

class SessionStore {
  constructor() {
    this.storageDir = path.join(os.homedir(), '.claude-manager', 'sessions');
    this.ensureStorageDir();
  }

  async ensureStorageDir() {
    try {
      await fs.mkdir(this.storageDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create storage directory:', error);
    }
  }

  async saveSession(session) {
    const sessionData = {
      id: session.id,
      name: session.name,
      projectPath: session.projectPath,
      createdAt: session.createdAt,
      messages: session.messages
    };

    const filePath = path.join(this.storageDir, `${session.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(sessionData, null, 2));
  }

  async loadSession(sessionId) {
    const filePath = path.join(this.storageDir, `${sessionId}.json`);
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }

  async getAllSessions() {
    try {
      const files = await fs.readdir(this.storageDir);
      const sessions = [];
      
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
}

module.exports = { SessionStore };
```

## Complete Example

### Package.json

```json
{
  "name": "claude-manager",
  "version": "1.0.0",
  "description": "Claude Code Session Manager",
  "main": "src/main/index.js",
  "scripts": {
    "start": "electron .",
    "dev": "electron . --dev",
    "build": "electron-builder",
    "dist": "electron-builder --publish=never"
  },
  "devDependencies": {
    "electron": "^27.0.0",
    "electron-builder": "^24.0.0"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "uuid": "^9.0.0"
  },
  "build": {
    "appId": "com.yourcompany.claude-manager",
    "productName": "Claude Manager",
    "directories": {
      "output": "dist"
    },
    "files": [
      "src/**/*",
      "!src/**/*.{ts,tsx}",
      "!src/**/*.map"
    ],
    "mac": {
      "category": "public.app-category.developer-tools"
    },
    "win": {
      "target": "nsis"
    },
    "linux": {
      "target": "AppImage"
    }
  }
}
```

### CSS Styling

```css
/* src/renderer/App.css */
.app {
  display: flex;
  height: 100vh;
  background: #1e1e1e;
  color: #d4d4d4;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.sidebar {
  width: 300px;
  background: #252526;
  border-right: 1px solid #3e3e42;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid #3e3e42;
}

.sidebar-header h1 {
  margin: 0 0 15px 0;
  font-size: 20px;
  font-weight: 500;
}

.new-session-btn {
  width: 100%;
  padding: 10px;
  background: #0e639c;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.new-session-btn:hover {
  background: #1177bb;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #6e6e6e;
}

.empty-state h2 {
  margin: 0 0 10px 0;
  font-weight: 400;
}

/* Session View Styles */
.session-view {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.session-header {
  padding: 20px;
  border-bottom: 1px solid #3e3e42;
}

.session-header h2 {
  margin: 0 0 5px 0;
  font-size: 18px;
  font-weight: 500;
}

.session-path {
  color: #6e6e6e;
  font-size: 13px;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

/* Message Styles */
.message {
  margin-bottom: 20px;
  padding: 15px;
  border-radius: 8px;
  background: #2d2d30;
}

.user-message {
  background: #0e639c;
  margin-left: 50px;
}

.assistant-message {
  background: #2d2d30;
  margin-right: 50px;
}

.message-role {
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 8px;
  opacity: 0.8;
}

.message-content {
  line-height: 1.5;
}

.tool-message {
  background: #3c3c3c;
  border-left: 3px solid #f48771;
}

.tool-result {
  background: #3c3c3c;
  border-left: 3px solid #89d185;
}

pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 12px;
}
```

## Future Enhancements

### Agent Orchestration Foundation

```javascript
// src/main/agentOrchestrator.js
class AgentOrchestrator {
  constructor(claudeManager) {
    this.claudeManager = claudeManager;
    this.agents = new Map();
  }

  async createAgentNetwork(task, projectPath) {
    // Analyze task and create agent plan
    const agentPlan = this.planAgents(task);
    
    // Create sessions for each agent
    const agents = [];
    for (const agentSpec of agentPlan) {
      const session = await this.claudeManager.startNewSession(
        `Agent: ${agentSpec.name}`,
        projectPath,
        agentSpec.prompt,
        agentSpec.model || 'opus'
      );
      
      agents.push({
        id: session.id,
        role: agentSpec.role,
        session: session
      });
    }
    
    this.agents.set(task.id, agents);
    return agents;
  }

  planAgents(task) {
    // Simple planning for now, expand this later
    return [
      {
        name: 'Coordinator',
        role: 'coordinator',
        prompt: `You are coordinating the task: ${task.description}. Break it down into subtasks.`,
        model: 'opus'
      },
      {
        name: 'Executor',
        role: 'executor',
        prompt: `You will execute specific subtasks as directed by the coordinator.`,
        model: 'sonnet'
      }
    ];
  }

  async coordinateAgents(taskId) {
    const agents = this.agents.get(taskId);
    if (!agents) return;

    // Implement inter-agent communication
    // This is where you'd add logic for agents to communicate
  }
}
```

### Deployment Configuration

```javascript
// electron-builder.json
{
  "appId": "com.yourcompany.claude-manager",
  "productName": "Claude Manager",
  "directories": {
    "output": "dist"
  },
  "files": [
    "src/**/*",
    "package.json"
  ],
  "extraResources": [
    {
      "from": "assets",
      "to": "assets"
    }
  ],
  "mac": {
    "category": "public.app-category.developer-tools",
    "icon": "assets/icon.icns"
  },
  "win": {
    "target": "nsis",
    "icon": "assets/icon.ico"
  },
  "linux": {
    "target": "AppImage",
    "icon": "assets/icon.png"
  },
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true
  }
}
```

## Quick Start Commands

```bash
# Clone and setup
git clone <your-repo>
cd claude-manager
npm install

# Development
npm start

# Build for distribution
npm run build

# Package for current platform
npm run dist
```

## Summary

This Electron + React implementation provides:

1. **Native Integration**: Direct access to file system and process spawning
2. **Real-time Streaming**: Using IPC instead of HTTP/SSE
3. **Better Performance**: No HTTP overhead, direct process communication
4. **Desktop Features**: File dialogs, system notifications, tray icons
5. **Easy Distribution**: Package as native app for all platforms

The architecture is designed to be extensible for your future agentic features while providing a solid foundation for session management today.
