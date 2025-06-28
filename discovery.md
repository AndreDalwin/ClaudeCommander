# How Claude Code Session Discovery Works: Detailed Analysis

## Overview
Claude Code stores all sessions as JSONL files in `~/.claude/projects/`. This guide explains how to discover, read, and parse these sessions.

## Directory Structure

```
~/.claude/
└── projects/
    ├── -Users-john-projects-my-app/          # Encoded project path
    │   ├── 550e8400-e29b-41d4-a716.jsonl   # Session 1
    │   ├── 7c9e6679-7425-40de-824b.jsonl   # Session 2
    │   └── .timelines/                      # Checkpoint data
    │       └── 550e8400-e29b-41d4-a716/
    │           └── checkpoints/
    └── -Users-john-work-backend/
        └── a87ff679-a2f9-4cb9-87f0.jsonl
```

## Step 1: Project Discovery

### Finding All Projects

```rust
// From src-tauri/src/commands/claude.rs (lines 268-347)

#[tauri::command]
pub async fn list_projects() -> Result<Vec<Project>, String> {
    // 1. Get the ~/.claude directory
    let claude_dir = get_claude_dir()?;
    let projects_dir = claude_dir.join("projects");
    
    // 2. Read all directories in ~/.claude/projects
    let entries = fs::read_dir(&projects_dir)
        .map_err(|e| format!("Failed to read projects directory: {}", e))?;
    
    let mut projects = Vec::new();
    
    for entry in entries {
        if let Ok(entry) = entry {
            let path = entry.path();
            
            // 3. Only process directories (each is a project)
            if path.is_dir() {
                let dir_name = entry.file_name().to_string_lossy().to_string();
                
                // 4. Get the actual project path from session files
                let project_path = get_project_path_from_sessions(&path)
                    .unwrap_or_else(|_| decode_project_path(&dir_name));
                
                // 5. Get all session files in this project
                let session_files = get_session_files(&path)?;
                
                // 6. Get creation time from directory metadata
                let metadata = fs::metadata(&path).ok();
                let created_at = metadata
                    .and_then(|m| m.created().ok())
                    .and_then(|t| t.duration_since(SystemTime::UNIX_EPOCH).ok())
                    .map(|d| d.as_secs())
                    .unwrap_or(0);
                
                projects.push(Project {
                    id: dir_name,
                    path: project_path,
                    sessions: session_files,
                    created_at,
                });
            }
        }
    }
    
    // Sort by creation time (newest first)
    projects.sort_by(|a, b| b.created_at.cmp(&a.created_at));
    
    Ok(projects)
}
```

### Decoding Project Paths

The directory names are encoded versions of the actual project paths:

```rust
// From claude.rs (lines 146-183)

/// Gets the actual project path by reading the cwd from the first JSONL entry
fn get_project_path_from_sessions(project_dir: &PathBuf) -> Result<String, String> {
    // Try to read any JSONL file in the directory
    let entries = fs::read_dir(project_dir)?;
    
    for entry in entries {
        if let Ok(entry) = entry {
            let path = entry.path();
            if path.is_file() && path.extension() == Some("jsonl") {
                // Read the first line of the JSONL file
                if let Ok(file) = fs::File::open(&path) {
                    let reader = BufReader::new(file);
                    if let Some(Ok(first_line)) = reader.lines().next() {
                        // Parse the JSON and extract cwd
                        if let Ok(json) = serde_json::from_str::<Value>(&first_line) {
                            if let Some(cwd) = json.get("cwd").and_then(|v| v.as_str()) {
                                return Ok(cwd.to_string());
                            }
                        }
                    }
                }
            }
        }
    }
    
    Err("Could not determine project path from session files".to_string())
}

/// DEPRECATED: Fallback method - not accurate when paths contain hyphens
fn decode_project_path(encoded: &str) -> String {
    encoded.replace('-', "/")
}
```

## Step 2: Session Discovery

### Getting Sessions for a Project

```rust
// From claude.rs (lines 350-434)

#[tauri::command]
pub async fn get_project_sessions(project_id: String) -> Result<Vec<Session>, String> {
    let claude_dir = get_claude_dir()?;
    let project_dir = claude_dir.join("projects").join(&project_id);
    
    if !project_dir.exists() {
        return Err(format!("Project directory not found: {}", project_id));
    }
    
    // Get the actual project path
    let project_path = get_project_path_from_sessions(&project_dir)
        .unwrap_or_else(|_| decode_project_path(&project_id));
    
    let entries = fs::read_dir(&project_dir)?;
    let mut sessions = Vec::new();
    
    for entry in entries {
        if let Ok(entry) = entry {
            let path = entry.path();
            
            // Only process JSONL files
            if path.is_file() && path.extension() == Some("jsonl") {
                let session_id = path.file_stem()
                    .and_then(|s| s.to_str())
                    .unwrap_or("")
                    .to_string();
                
                // Get file metadata for creation time
                let metadata = fs::metadata(&path).ok();
                let created_at = metadata
                    .and_then(|m| m.created().ok())
                    .and_then(|t| t.duration_since(SystemTime::UNIX_EPOCH).ok())
                    .map(|d| d.as_secs())
                    .unwrap_or(0);
                
                // Extract first user message and timestamp
                let (first_message, message_timestamp) = extract_first_user_message(&path);
                
                sessions.push(Session {
                    id: session_id,
                    project_id: project_id.clone(),
                    project_path: project_path.clone(),
                    todo_data: None,
                    created_at,
                    first_message,
                    message_timestamp,
                });
            }
        }
    }
    
    // Sort sessions by creation time (newest first)
    sessions.sort_by(|a, b| b.created_at.cmp(&a.created_at));
    
    Ok(sessions)
}
```

### Extracting First User Message

```rust
// From claude.rs (lines 186-218)

/// Extracts the first valid user message from a JSONL file
fn extract_first_user_message(jsonl_path: &PathBuf) -> (Option<String>, Option<String>) {
    let file = match fs::File::open(jsonl_path) {
        Ok(file) => file,
        Err(_) => return (None, None),
    };
    
    let reader = BufReader::new(file);
    
    for line in reader.lines() {
        if let Ok(line) = line {
            if let Ok(entry) = serde_json::from_str::<JsonlEntry>(&line) {
                if let Some(message) = entry.message {
                    if message.role.as_deref() == Some("user") {
                        if let Some(content) = message.content {
                            // Skip caveat messages
                            if content.contains("Caveat: The messages below were generated") {
                                continue;
                            }
                            
                            return (Some(content), entry.timestamp);
                        }
                    }
                }
            }
        }
    }
    
    (None, None)
}
```

## Step 3: Loading Full Session History

### Reading Complete Session

```rust
// From claude.rs (lines 749-786)

#[tauri::command]
pub async fn load_session_history(
    project_id: String,
    session_id: String,
) -> Result<serde_json::Value, String> {
    let claude_dir = get_claude_dir()?;
    let session_path = claude_dir
        .join("projects")
        .join(&project_id)
        .join(format!("{}.jsonl", session_id));
    
    if !session_path.exists() {
        return Err(format!("Session file not found: {}", session_id));
    }
    
    // Read the entire JSONL file
    let file = fs::File::open(&session_path)?;
    let reader = BufReader::new(file);
    let mut entries = Vec::new();
    
    // Parse each line as JSON
    for (line_num, line) in reader.lines().enumerate() {
        match line {
            Ok(line_content) => {
                match serde_json::from_str::<serde_json::Value>(&line_content) {
                    Ok(json) => entries.push(json),
                    Err(e) => {
                        eprintln!("Failed to parse line {}: {}", line_num + 1, e);
                        eprintln!("Line content: {}", line_content);
                    }
                }
            }
            Err(e) => {
                eprintln!("Failed to read line {}: {}", line_num + 1, e);
            }
        }
    }
    
    Ok(serde_json::json!({
        "project_id": project_id,
        "session_id": session_id,
        "entries": entries
    }))
}
```

## Step 4: Frontend Implementation

### React Hook for Session Management

```typescript
// Example implementation for Electron + React

// src/renderer/hooks/useClaudeHistory.ts
import { useState, useEffect } from 'react';

interface Project {
  id: string;
  path: string;
  sessions: string[];
  created_at: number;
}

interface Session {
  id: string;
  project_id: string;
  project_path: string;
  created_at: number;
  first_message?: string;
  message_timestamp?: string;
}

interface SessionEntry {
  type?: string;
  message?: {
    role: string;
    content: string;
  };
  timestamp?: string;
  [key: string]: any;
}

export function useClaudeHistory() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [sessionHistory, setSessionHistory] = useState<SessionEntry[]>([]);

  // Load all projects
  const loadProjects = async () => {
    try {
      const projectList = await window.electronAPI.listProjects();
      setProjects(projectList);
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  // Load sessions for a project
  const loadProjectSessions = async (projectId: string) => {
    try {
      const sessionList = await window.electronAPI.getProjectSessions(projectId);
      setSessions(sessionList);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  };

  // Load full session history
  const loadSessionHistory = async (projectId: string, sessionId: string) => {
    try {
      const history = await window.electronAPI.loadSessionHistory(projectId, sessionId);
      setSessionHistory(history.entries);
    } catch (error) {
      console.error('Failed to load session history:', error);
    }
  };

  // Initial load
  useEffect(() => {
    loadProjects();
  }, []);

  // Load sessions when project changes
  useEffect(() => {
    if (selectedProject) {
      loadProjectSessions(selectedProject.id);
    }
  }, [selectedProject]);

  // Load history when session changes
  useEffect(() => {
    if (selectedSession && selectedProject) {
      loadSessionHistory(selectedProject.id, selectedSession.id);
    }
  }, [selectedSession, selectedProject]);

  return {
    projects,
    sessions,
    sessionHistory,
    selectedProject,
    selectedSession,
    setSelectedProject,
    setSelectedSession,
    refreshProjects: loadProjects,
    refreshSessions: () => selectedProject && loadProjectSessions(selectedProject.id),
  };
}
```

### Session Browser Component

```typescript
// src/renderer/components/SessionBrowser.tsx
import React from 'react';
import { useClaudeHistory } from '../hooks/useClaudeHistory';

export const SessionBrowser: React.FC = () => {
  const {
    projects,
    sessions,
    sessionHistory,
    selectedProject,
    selectedSession,
    setSelectedProject,
    setSelectedSession,
  } = useClaudeHistory();

  return (
    <div className="session-browser">
      {/* Project List */}
      <div className="project-list">
        <h3>Projects</h3>
        {projects.map(project => (
          <div
            key={project.id}
            className={`project-item ${selectedProject?.id === project.id ? 'selected' : ''}`}
            onClick={() => setSelectedProject(project)}
          >
            <div className="project-path">{project.path}</div>
            <div className="session-count">{project.sessions.length} sessions</div>
          </div>
        ))}
      </div>

      {/* Session List */}
      {selectedProject && (
        <div className="session-list">
          <h3>Sessions in {selectedProject.path}</h3>
          {sessions.map(session => (
            <div
              key={session.id}
              className={`session-item ${selectedSession?.id === session.id ? 'selected' : ''}`}
              onClick={() => setSelectedSession(session)}
            >
              <div className="session-preview">
                {session.first_message || 'Empty session'}
              </div>
              <div className="session-time">
                {new Date(session.created_at * 1000).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Session History */}
      {selectedSession && (
        <div className="session-history">
          <h3>Session History</h3>
          {sessionHistory.map((entry, index) => (
            <div key={index} className={`history-entry ${entry.type}`}>
              {entry.message ? (
                <div className={`message ${entry.message.role}`}>
                  <div className="role">{entry.message.role}</div>
                  <div className="content">{entry.message.content}</div>
                </div>
              ) : (
                <pre>{JSON.stringify(entry, null, 2)}</pre>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

## JSONL Structure Details

### Session File Format

Each line in a session JSONL file can contain different types of entries:

```jsonl
// First line often contains session metadata
{"type":"system","subtype":"init","cwd":"/Users/john/projects/my-app","session_id":"550e8400-e29b-41d4-a716","timestamp":"2024-01-01T10:00:00Z"}

// User messages
{"type":"message","message":{"role":"user","content":"Create a React component"},"timestamp":"2024-01-01T10:00:01Z"}

// Assistant responses (may be split across multiple entries)
{"type":"message","message":{"role":"assistant","content":"I'll create a React component for you..."},"timestamp":"2024-01-01T10:00:02Z"}

// Tool use
{"type":"tool_use","name":"str_replace_editor","input":{"command":"create","path":"Button.jsx"},"timestamp":"2024-01-01T10:00:03Z"}

// Tool results
{"type":"tool_result","output":"File created successfully","timestamp":"2024-01-01T10:00:04Z"}

// Usage data
{"type":"usage","usage":{"input_tokens":150,"output_tokens":200},"costUSD":0.0045}
```

## Implementation for Electron

### Main Process API

```typescript
// src/main/sessionDiscovery.ts
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import readline from 'readline';
import { createReadStream } from 'fs';

export class SessionDiscovery {
  private claudeDir: string;
  private projectsDir: string;

  constructor() {
    this.claudeDir = path.join(os.homedir(), '.claude');
    this.projectsDir = path.join(this.claudeDir, 'projects');
  }

  async listProjects(): Promise<Project[]> {
    try {
      const entries = await fs.readdir(this.projectsDir, { withFileTypes: true });
      const projects: Project[] = [];

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
        const firstLine = await this.readFirstLine(filePath);
        
        if (firstLine) {
          const data = JSON.parse(firstLine);
          if (data.cwd) return data.cwd;
        }
      }
    } catch (error) {
      console.error('Failed to get project path:', error);
    }

    // Fallback: decode directory name
    return path.basename(projectDir).replace(/-/g, '/');
  }

  private async readFirstLine(filePath: string): Promise<string | null> {
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

  async getProjectSessions(projectId: string): Promise<Session[]> {
    const projectDir = path.join(this.projectsDir, projectId);
    const files = await fs.readdir(projectDir);
    const sessions: Session[] = [];

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
  }

  private async extractFirstUserMessage(filePath: string): Promise<any> {
    return new Promise((resolve) => {
      const stream = createReadStream(filePath);
      const rl = readline.createInterface({ input: stream });
      
      rl.on('line', (line) => {
        try {
          const data = JSON.parse(line);
          if (data.message?.role === 'user' && 
              !data.message.content?.includes('Caveat:')) {
            rl.close();
            stream.close();
            resolve({
              content: data.message.content,
              timestamp: data.timestamp
            });
          }
        } catch {}
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
```

## Key Insights

1. **Project Encoding**: Directory names are encoded paths (slashes → hyphens)
2. **Project Path Recovery**: First JSONL line contains `cwd` field with actual path
3. **Session IDs**: UUID format, used as filename without extension
4. **First Message**: Extracted for preview, skips system "Caveat" messages
5. **Sorting**: Both projects and sessions sorted by creation time (newest first)
6. **Error Handling**: Graceful fallbacks when files are missing or corrupted

This discovery system allows you to build a complete session browser that shows all previous conversations organized by project.
