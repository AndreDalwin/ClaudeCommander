# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Commander in Chief is an Electron-based GUI application that provides a React frontend for interacting with Claude Code CLI sessions. It manages Claude sessions, displays conversation history, and provides tool output visualization.

## Development Commands

```bash
# Start development server
npm start

# Lint code
npm run lint
npm run lint:fix

# Type checking
npm run typecheck

# Combined code quality check
npm run check

# Package the application
npm run package

# Build distributables
npm run make

# Publish application
npm run publish
```

## Architecture

### Core Components

- **Main Process** (`src/main/`): Electron backend that manages Claude CLI processes
- **Renderer Process** (`src/renderer/`): React frontend for the UI
- **Preload Script** (`src/main/preload.ts`): Secure bridge between main and renderer
- **Shared Types** (`src/shared/types.ts`): TypeScript interfaces used across processes

### Key Classes

- `ClaudeManager` (`src/main/utils/claudeManager.ts`): Manages Claude CLI sessions and processes
- `ClaudeSession`: Individual session wrapper around spawned Claude processes
- `ClaudeStreamParser` (`src/main/utils/claudeStreamParser.ts`): Parses streaming JSON output from Claude CLI
- `SessionStore` (`src/main/utils/sessionStore.ts`): Persistent session storage
- `SessionDiscovery` (`src/main/utils/sessionDiscovery.ts`): Discovers existing Claude sessions in projects

### Session Management

The app operates by spawning Claude Code CLI processes with specific arguments:
- New sessions: `claude -p "prompt" --model opus --output-format stream-json --verbose`
- Continue sessions: `claude -c -p "prompt" --model opus --output-format stream-json --verbose`
- Resume sessions: `claude --resume session-id -p "prompt" --model opus --output-format stream-json --verbose`

### Message Flow

1. User input from React frontend → IPC → Main process
2. Main process spawns Claude CLI with appropriate arguments
3. Claude CLI stdout is parsed as streaming JSON
4. Parsed messages are forwarded to renderer via IPC events
5. React components update UI with new messages

### IPC Communication

The main process exposes a `claudeAPI` interface to the renderer via `contextBridge`:

- `createSession()`: Start new Claude session
- `continueSession()`: Continue existing session with new prompt
- `getSessions()`: Get all active sessions
- `getSessionMessages()`: Get message history for session
- `onSessionMessage()`: Listen for real-time messages
- `discoverProjects()`: Find existing Claude projects
- `loadSessionHistory()`: Load session from Claude's history

## UI Components

### Tool Widgets (`src/renderer/components/tools/`)

Specialized React components for visualizing Claude Code tool outputs:
- `BashWidget`: Command execution results
- `EditWidget`: File edit operations
- `ReadFileWidget`: File contents display
- `WriteWidget`: File write operations
- `TodoWriteWidget`: Todo list management
- `WebSearchWidget`: Web search results

### Session Views

- `SessionView`: Main conversation interface
- `SessionList`: List of active sessions
- `SessionHistoryView`: Browse historical sessions
- `ProjectsView`: Project discovery and selection

## Path Configuration

TypeScript path aliases are configured in `tsconfig.json`:
- `@/*`: `src/*`
- `@main/*`: `src/main/*` 
- `@renderer/*`: `src/renderer/*`
- `@shared/*`: `src/shared/*`

## Build System

- Uses Electron Forge with Webpack plugin
- TailwindCSS v4 for styling with PostCSS
- TypeScript with strict mode enabled
- ESLint for code quality

## Security

Follows Electron security best practices:
- Context isolation enabled
- Node integration disabled in renderer
- Preload script for secure IPC
- Fuses configured for production security

## Tool Output Parsing

The app parses Claude Code's `--output-format stream-json` format, handling:
- User messages
- Assistant text responses (streamed)
- Tool use requests
- Tool results
- Thinking content (streamed)
- System messages
- Usage statistics
- Error messages

Message types are defined in `src/shared/types.ts` as the `Message` interface.