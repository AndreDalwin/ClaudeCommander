# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Commander is an Electron-based GUI application that provides a React frontend for interacting with Claude Code CLI sessions. It manages Claude sessions, displays conversation history, and provides tool output visualization.

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

## UI/UX Design System

### Branding Guidelines

**Brand Identity:**
- **Name**: Commander
- **Tagline**: Claude Code Session Management
- **Logo**: Terminal icon in blue gradient container
- **Personality**: Professional, modern, developer-focused

**Color Palette:**
- **Primary Brand**: `#0e639c` to `#1177bb` (blue gradient)
- **Secondary**: Purple accents (`#8b5cf6`, `#a855f7`)
- **Background**: Dark gradient (`#0a0a0a` → `#111111` → `#0f0f0f`)
- **Surface**: `#1a1a1a` (cards/panels)
- **Border**: `#2a2a2a` (default), `#3a3a3a` (hover)
- **Text**: White primary, `#9ca3af` secondary, `#6b7280` muted
- **Status Colors**:
  - Success: `#10b981` (emerald)
  - Error: `#ef4444` (red)  
  - Warning: `#f59e0b` (amber)
  - Info: `#3b82f6` (blue)

**Typography:**
- **Headers**: Bold, tracking-tight, white/gradient text
- **Body**: Regular weight, good line-height, readable contrast
- **Code**: Mono font families for technical content
- **Hierarchy**: Clear size progression (text-3xl, text-2xl, text-xl, text-lg)

**Visual Design Principles:**
- **Depth**: Subtle shadows, layered surfaces, gradient backgrounds
- **Rounded Corners**: `rounded-xl` (12px) for cards, `rounded-2xl` (16px) for prominent elements
- **Spacing**: Generous padding/margins, consistent gap systems
- **Icons**: Lucide React icons, 4px/5px/6px sizes, colored contextually
- **Animations**: Smooth transitions (300ms), subtle hover effects (scale, translate)

**Component Patterns:**
- **Cards**: `bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 shadow-lg`
- **Buttons Primary**: Gradient blue-to-purple, rounded-xl, with hover effects
- **Buttons Secondary**: `bg-[#2a2a2a]` with border, hover state
- **Form Inputs**: `bg-[#2a2a2a] border border-[#3a3a3a]` with focus states
- **Status Indicators**: Icon + text combinations with semantic colors

**Interaction Guidelines:**
- **Hover States**: Subtle scale (1.02x), color shifts, border changes
- **Focus States**: Blue ring, border color change
- **Loading States**: Animated icons, skeleton states where appropriate
- **Feedback**: Clear success/error messaging with appropriate colors/icons