# Comprehensive Guide: Claude Code Message Display and Session Management

## Table of Contents
1. [Message Type Identification](#message-type-identification)
2. [Message Display Components](#message-display-components)
3. [Tool Display Widgets](#tool-display-widgets)
4. [Special Cases and Edge Handling](#special-cases-and-edge-handling)
5. [Session Continuation Logic](#session-continuation-logic)
6. [Implementation Guide for Electron + React + TypeScript](#implementation-guide)
7. [Tailwind CSS Styling](#tailwind-css-styling)

## Message Type Identification

### How Messages Are Classified

Claude Code outputs different message types in its streaming JSON format. Here's how to identify each:

#### 1. **User Messages**
```json
{
  "type": "user",
  "message": {
    "role": "user",
    "content": "Create a React component"
  }
}
```
- **Identifier**: `type === "user"` OR `message.role === "user"`
- **Source**: Added locally when user submits a prompt
- **Display**: Right-aligned, gray background, "You" label

#### 2. **Assistant Messages (Text)**
```json
{
  "type": "text",
  "text": "I'll help you create a React component..."
}
```
- **Identifier**: `type === "text"`
- **Note**: These come in chunks and must be accumulated
- **Display**: Left-aligned, blue background, "Claude" label
- **Special**: Text streams in real-time, so you need to update the same message

#### 3. **System Messages**
```json
{
  "type": "system",
  "subtype": "init",
  "session_id": "550e8400-e29b-41d4-a716",
  "cwd": "/Users/john/project"
}
```
- **Identifier**: `type === "system"`
- **Subtypes**:
  - `init`: Session initialization (contains session_id, cwd)
  - `reminder`: System reminders (info, warning, error)
- **Display**: Usually hidden or shown as subtle info cards

#### 4. **Tool Use Messages**
```json
{
  "type": "tool_use",
  "id": "tool_12345",
  "name": "str_replace_editor",
  "input": {
    "command": "create",
    "path": "App.jsx",
    "file_text": "..."
  }
}
```
- **Identifier**: `type === "tool_use"`
- **Common tools**: `str_replace_editor`, `read_file`, `list_files`, `bash`, `web_search`, etc.
- **Display**: Custom widget per tool type

#### 5. **Tool Result Messages**
```json
{
  "type": "tool_result",
  "tool_use_id": "tool_12345",
  "output": "File created successfully",
  "is_error": false
}
```
- **Identifier**: `type === "tool_result"`
- **Display**: Often integrated into the tool widget, not shown separately

#### 6. **Thinking Messages**
```json
{
  "type": "thinking",
  "thinking": "I need to analyze the user's request..."
}
```
- **Identifier**: `type === "thinking"`
- **Display**: Collapsible accordion, hidden by default
- **Purpose**: Shows Claude's reasoning process

#### 7. **Usage/Cost Messages**
```json
{
  "type": "usage",
  "usage": {
    "input_tokens": 1234,
    "output_tokens": 567,
    "cache_creation_input_tokens": 0,
    "cache_read_input_tokens": 0
  }
}
```
- **Identifier**: `type === "usage"`
- **Display**: Token counter in UI, not in message stream

## Message Display Components

### Base Message Structure

```typescript
interface ClaudeMessage {
  id: string;
  type: 'user' | 'assistant' | 'tool' | 'system' | 'thinking';
  content: any;
  timestamp: string;
  metadata?: any;
}
```

### Display Rules by Type

#### User Messages
- **Container**: Right-aligned flex container
- **Styling**: 
  - Background: `bg-gray-100 dark:bg-gray-800`
  - Text: `text-gray-900 dark:text-gray-100`
  - Padding: `p-4`
  - Border radius: `rounded-lg`
  - Max width: `max-w-[80%]`
- **Icon**: User avatar or initials
- **Label**: "You"

#### Assistant Messages
- **Container**: Left-aligned flex container
- **Styling**:
  - Background: `bg-blue-100 dark:bg-blue-900`
  - Text: `text-gray-900 dark:text-gray-100`
  - Padding: `p-4`
  - Border radius: `rounded-lg`
  - Max width: `max-w-[80%]`
- **Icon**: Bot/AI icon
- **Label**: "Claude"
- **Special Features**:
  - Markdown rendering support
  - Code block syntax highlighting
  - Real-time text streaming animation

## Tool Display Widgets

### 1. **File Editor Widget** (`str_replace_editor`)

**Triggers on**: `tool.name === "str_replace_editor"`

**Commands**:
- `create`: New file creation
- `str_replace`: Text replacement
- `view`: File viewing

**Display Elements**:
- File path with icon
- Diff view for replacements (before/after)
- Syntax-highlighted code
- Success/error status
- Copy button for code

**Styling**:
```css
/* Container */
.tool-editor {
  @apply border border-gray-200 dark:border-gray-700 rounded-lg p-4 my-2;
}

/* File header */
.tool-editor-header {
  @apply flex items-center justify-between mb-3 text-sm;
  @apply text-gray-600 dark:text-gray-400;
}

/* Code diff */
.tool-editor-diff {
  @apply bg-gray-50 dark:bg-gray-900 rounded p-3 font-mono text-sm;
}

.diff-removed {
  @apply bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200;
}

.diff-added {
  @apply bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200;
}
```

### 2. **File Reader Widget** (`read_file`)

**Display Elements**:
- File path with appropriate icon
- Line numbers
- Syntax-highlighted content
- Collapsible for long files
- Copy button

**Special Cases**:
- Binary files: Show "Binary file" message
- Large files: Truncate with "Show more" button
- Missing files: Show error state

### 3. **Bash Command Widget** (`bash`)

**Display Elements**:
- Command in terminal-style block
- Working directory indicator
- Output in monospace font
- Error output in red
- Exit code indicator

**Styling**:
```css
.tool-bash {
  @apply bg-gray-900 text-gray-100 rounded-lg p-4 my-2;
  @apply font-mono text-sm;
}

.tool-bash-command {
  @apply text-green-400 mb-2;
}

.tool-bash-output {
  @apply text-gray-300 whitespace-pre-wrap;
}

.tool-bash-error {
  @apply text-red-400;
}
```

### 4. **Web Search Widget** (`web_search`)

**Display Elements**:
- Search query highlight
- Result cards with:
  - Title (clickable link)
  - URL
  - Snippet
  - Source favicon
- "View all results" if truncated

### 5. **Directory Listing Widget** (`list_files`)

**Display Elements**:
- Interactive file tree
- File/folder icons
- File sizes
- Expand/collapse folders
- Click to copy path

### 6. **Todo Widget** (`todo_list`)

**Display Elements**:
- Card-based todo items
- Checkboxes (visual only)
- Priority indicators
- Status badges
- Timestamps

### 7. **Agent Execution Widget**

**Display Elements**:
- Agent name and status
- Nested message stream
- Progress indicators
- Collapsible sections

## Special Cases and Edge Handling

### 1. **System Reminders**

System reminders have different severity levels:

```typescript
type ReminderType = 'info' | 'warning' | 'error';
```

**Display Rules**:
- `info`: Blue background, info icon
- `warning`: Yellow background, warning icon
- `error`: Red background, error icon
- All are dismissible or auto-hide after 5 seconds

### 2. **Thinking Mode**

**Detection**: `message.type === "thinking"`

**Display**:
- Collapsed by default
- "Show thinking" toggle button
- Indented gray text when expanded
- Brain icon indicator

### 3. **Caveat Messages**

**Detection**: Message contains "Caveat: The messages below were generated"

**Handling**:
- These are filtered out during display
- Not shown in session history
- Skipped when extracting first user message

### 4. **Text Accumulation**

Assistant text messages stream in chunks:

```typescript
// Accumulation logic
let currentAssistantText = '';
messages.forEach(msg => {
  if (msg.type === 'text') {
    currentAssistantText += msg.text;
    // Update the last assistant message
  } else {
    // Different type, finalize current text
    if (currentAssistantText) {
      finalizeAssistantMessage(currentAssistantText);
      currentAssistantText = '';
    }
  }
});
```

### 5. **Error States**

**Process Errors**: 
- Show in red banner at top
- Include error message and timestamp
- Offer retry button

**Tool Errors** (`is_error: true`):
- Red background for tool widget
- Error icon
- Full error message displayed

### 6. **Empty Sessions**

- Show placeholder: "No messages yet"
- Prompt input remains active
- Show session info card

### 7. **Large Output Handling**

**For tool outputs > 1000 lines**:
- Truncate to first 500 lines
- Show "... X more lines"
- Expandable on click

**For streaming text > 10KB**:
- Virtualize rendering
- Lazy load on scroll

## Session Continuation Logic

### How Claude Code Maintains Context

Claude Code supports three modes of conversation continuation:

#### 1. **New Session** (No context)
```bash
claude -p "Your prompt" --model opus
```
- Starts fresh conversation
- No previous context
- Creates new session ID

#### 2. **Continue Session** (`-c` flag)
```bash
claude -c -p "Your prompt" --model opus
```
- Continues the current conversation
- Maintains context from same working directory
- Adds to existing session file

#### 3. **Resume Session** (`--resume` flag)
```bash
claude --resume {session-id} -p "Your prompt" --model opus
```
- Resumes specific session by ID
- Loads full conversation history
- Can resume from any project directory

### Implementation in Your App

#### Step 1: Track Session State

```typescript
interface SessionState {
  id: string;
  projectPath: string;
  isFirstMessage: boolean;
  hasHistory: boolean;
}
```

#### Step 2: Determine Command Mode

```typescript
function getClaudeCommand(session: SessionState, prompt: string, model: string) {
  const baseArgs = [
    '-p', prompt,
    '--model', model,
    '--output-format', 'stream-json'
  ];

  if (session.isFirstMessage) {
    // New session - no special flags
    return baseArgs;
  } else if (session.hasHistory && session.id) {
    // Resume historical session
    return ['--resume', session.id, ...baseArgs];
  } else {
    // Continue current session
    return ['-c', ...baseArgs];
  }
}
```

#### Step 3: Handle Session Loading

When user selects a historical session:

1. **Load session history** from `~/.claude/projects/{project-id}/{session-id}.jsonl`
2. **Parse and display** all messages
3. **Set session state** with ID and project path
4. **Enable continuation** - next prompt will use `--resume`

#### Step 4: Session Forking

For checkpoint/branching support:

```typescript
async function forkSession(originalSessionId: string, checkpointId: string) {
  // 1. Create new session ID
  const newSessionId = generateUUID();
  
  // 2. Copy messages up to checkpoint
  const history = await loadSessionHistory(originalSessionId);
  const messagesUntilCheckpoint = history.filter(msg => 
    msg.timestamp <= checkpointTimestamp
  );
  
  // 3. Save as new session
  await saveSession(newSessionId, messagesUntilCheckpoint);
  
  // 4. Continue with new session ID
  return newSessionId;
}
```

## Implementation Guide for Electron + React + TypeScript

### Core Message Component

```typescript
// types/messages.ts
export interface ClaudeStreamMessage {
  type: 'user' | 'text' | 'tool_use' | 'tool_result' | 
        'system' | 'thinking' | 'usage' | 'error';
  id?: string;
  text?: string;
  message?: {
    role: string;
    content: string;
  };
  name?: string;
  input?: any;
  output?: any;
  thinking?: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
  timestamp: string;
  sessionId: string;
}

// components/MessageDisplay.tsx
interface MessageDisplayProps {
  message: ClaudeStreamMessage;
  isStreaming?: boolean;
}

export const MessageDisplay: React.FC<MessageDisplayProps> = ({ 
  message, 
  isStreaming 
}) => {
  // Component implementation based on message type
  switch (message.type) {
    case 'user':
      return <UserMessage message={message} />;
    case 'text':
      return <AssistantMessage message={message} isStreaming={isStreaming} />;
    case 'tool_use':
      return <ToolWidget tool={message} />;
    case 'thinking':
      return <ThinkingWidget message={message} />;
    case 'system':
      return <SystemMessage message={message} />;
    default:
      return <RawMessage message={message} />;
  }
};
```

### Session Management Hook

```typescript
// hooks/useClaudeSession.ts
export function useClaudeSession(sessionId: string) {
  const [messages, setMessages] = useState<ClaudeStreamMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const currentTextRef = useRef('');

  // Load historical session if resuming
  useEffect(() => {
    if (sessionId) {
      loadSessionHistory(sessionId);
    }
  }, [sessionId]);

  // Handle streaming messages
  const handleStreamMessage = (message: ClaudeStreamMessage) => {
    if (message.type === 'text') {
      // Accumulate text
      currentTextRef.current += message.text || '';
      updateLastAssistantMessage(currentTextRef.current);
    } else {
      // Finalize any pending text
      if (currentTextRef.current) {
        finalizeAssistantMessage();
        currentTextRef.current = '';
      }
      // Add new message
      addMessage(message);
    }
  };

  const sendPrompt = async (prompt: string, model: string = 'opus') => {
    setIsStreaming(true);
    
    // Add user message immediately
    addMessage({
      type: 'user',
      message: { role: 'user', content: prompt },
      timestamp: new Date().toISOString(),
      sessionId
    });

    // Determine command mode
    const isFirstMessage = messages.length === 0;
    const command = isFirstMessage ? 'create' : 'continue';
    
    await window.electronAPI.sendClaudePrompt({
      sessionId,
      projectPath: sessionInfo?.projectPath || process.cwd(),
      prompt,
      model,
      command
    });
  };

  return {
    messages,
    isStreaming,
    sessionInfo,
    sendPrompt,
    handleStreamMessage
  };
}
```

### Tool Widget System

```typescript
// components/tools/ToolWidget.tsx
interface ToolWidgetProps {
  tool: ClaudeStreamMessage;
}

export const ToolWidget: React.FC<ToolWidgetProps> = ({ tool }) => {
  const getToolComponent = () => {
    switch (tool.name) {
      case 'str_replace_editor':
        return <EditorWidget tool={tool} />;
      case 'read_file':
        return <FileReaderWidget tool={tool} />;
      case 'bash':
        return <BashWidget tool={tool} />;
      case 'web_search':
        return <WebSearchWidget tool={tool} />;
      case 'list_files':
        return <DirectoryWidget tool={tool} />;
      default:
        return <GenericToolWidget tool={tool} />;
    }
  };

  return (
    <div className="tool-widget my-4">
      {getToolComponent()}
    </div>
  );
};
```

## Tailwind CSS Styling

### Complete Style System

```css
/* Message Containers */
.message-container {
  @apply flex mb-4 animate-fadeIn;
}

.message-user {
  @apply justify-end;
}

.message-assistant {
  @apply justify-start;
}

/* Message Bubbles */
.message-bubble {
  @apply max-w-[80%] rounded-lg p-4 shadow-sm;
}

.bubble-user {
  @apply bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100;
  @apply ml-12;
}

.bubble-assistant {
  @apply bg-blue-50 dark:bg-blue-900/50 text-gray-900 dark:text-gray-100;
  @apply mr-12;
}

/* Tool Widgets */
.tool-widget {
  @apply border border-gray-200 dark:border-gray-700 rounded-lg p-4;
  @apply bg-white dark:bg-gray-800 shadow-sm;
}

.tool-header {
  @apply flex items-center gap-2 mb-3 text-sm font-medium;
  @apply text-gray-700 dark:text-gray-300;
}

.tool-content {
  @apply space-y-2;
}

/* Code Blocks */
.code-block {
  @apply bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto;
  @apply font-mono text-sm leading-relaxed;
}

.code-line-number {
  @apply text-gray-500 select-none pr-4 text-right;
}

/* Status Indicators */
.status-success {
  @apply text-green-600 dark:text-green-400 flex items-center gap-1;
}

.status-error {
  @apply text-red-600 dark:text-red-400 flex items-center gap-1;
}

.status-pending {
  @apply text-yellow-600 dark:text-yellow-400 flex items-center gap-1;
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-out;
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Streaming Indicator */
.streaming-indicator {
  @apply flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400;
  @apply ml-16 mb-4;
}

.streaming-dots {
  @apply flex gap-1;
}

.streaming-dot {
  @apply w-2 h-2 bg-blue-500 rounded-full animate-bounce;
}

.streaming-dot:nth-child(2) {
  animation-delay: 0.1s;
}

.streaming-dot:nth-child(3) {
  animation-delay: 0.2s;
}

/* Thinking Widget */
.thinking-widget {
  @apply bg-purple-50 dark:bg-purple-900/20 border border-purple-200;
  @apply dark:border-purple-800 rounded-lg p-3 my-2;
}

.thinking-toggle {
  @apply text-sm text-purple-700 dark:text-purple-300 cursor-pointer;
  @apply flex items-center gap-2 hover:text-purple-800;
}

.thinking-content {
  @apply mt-3 text-sm text-gray-700 dark:text-gray-300;
  @apply pl-6 border-l-2 border-purple-300 dark:border-purple-700;
}

/* Session Info Card */
.session-info {
  @apply bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4;
  @apply border border-gray-200 dark:border-gray-700;
}

.session-info-item {
  @apply flex items-center justify-between text-sm;
  @apply text-gray-600 dark:text-gray-400 mb-2 last:mb-0;
}

/* Error States */
.error-banner {
  @apply bg-red-50 dark:bg-red-900/50 border border-red-200;
  @apply dark:border-red-800 rounded-lg p-4 mb-4;
  @apply flex items-center justify-between;
}

.error-message {
  @apply text-red-700 dark:text-red-300 text-sm;
}

/* File Tree */
.file-tree {
  @apply font-mono text-sm;
}

.file-tree-item {
  @apply flex items-center gap-2 py-1 px-2 hover:bg-gray-100;
  @apply dark:hover:bg-gray-700 cursor-pointer rounded;
}

.file-tree-folder {
  @apply font-medium text-blue-600 dark:text-blue-400;
}

.file-tree-file {
  @apply text-gray-700 dark:text-gray-300;
}

/* Markdown Rendering */
.markdown-content {
  @apply prose prose-sm dark:prose-invert max-w-none;
}

.markdown-content pre {
  @apply bg-gray-900 text-gray-100 rounded-lg p-4;
}

.markdown-content code {
  @apply bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm;
}

/* Diff Display */
.diff-container {
  @apply bg-gray-50 dark:bg-gray-900 rounded-lg p-4 font-mono text-sm;
}

.diff-line {
  @apply leading-relaxed;
}

.diff-line-added {
  @apply bg-green-100 dark:bg-green-900/30 text-green-800;
  @apply dark:text-green-200 pl-2;
}

.diff-line-removed {
  @apply bg-red-100 dark:bg-red-900/30 text-red-800;
  @apply dark:text-red-200 pl-2;
}

.diff-line-context {
  @apply text-gray-600 dark:text-gray-400 pl-2;
}
```

## Session Storage and Recovery

### Reading Session History

```typescript
// main/sessionReader.ts
import { createReadStream } from 'fs';
import { createInterface } from 'readline';

export async function readSessionHistory(
  projectId: string, 
  sessionId: string
): Promise<ClaudeStreamMessage[]> {
  const sessionPath = path.join(
    os.homedir(), 
    '.claude', 
    'projects', 
    projectId, 
    `${sessionId}.jsonl`
  );

  const messages: ClaudeStreamMessage[] = [];
  const fileStream = createReadStream(sessionPath);
  const rl = createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    try {
      const entry = JSON.parse(line);
      
      // Skip caveat messages
      if (entry.message?.content?.includes('Caveat:')) {
        continue;
      }

      // Convert to display format
      messages.push(normalizeMessage(entry));
    } catch (error) {
      console.error('Failed to parse line:', error);
    }
  }

  return messages;
}

function normalizeMessage(entry: any): ClaudeStreamMessage {
  // Handle different formats from session history
  if (entry.type === 'message' && entry.message) {
    return {
      type: entry.message.role === 'user' ? 'user' : 'text',
      message: entry.message,
      timestamp: entry.timestamp || new Date().toISOString(),
      sessionId: entry.sessionId || ''
    };
  }
  
  return {
    ...entry,
    timestamp: entry.timestamp || new Date().toISOString(),
    sessionId: entry.sessionId || ''
  };
}
```

## Complete Session Flow

### 1. New Session
```typescript
// User starts fresh
const session = await createSession(name, projectPath);
await executeClaudeCode(session.id, prompt, model);
```

### 2. Continue Current Session
```typescript
// User sends another message in same session
await continueClaudeCode(session.id, prompt, model);
// Uses -c flag internally
```

### 3. Resume Historical Session
```typescript
// User clicks on old session
const history = await loadSessionHistory(projectId, sessionId);
displayMessages(history);

// User sends new message
await resumeClaudeCode(sessionId, prompt, model);
// Uses --resume flag internally
```

### 4. Fork from Checkpoint
```typescript
// User clicks "Fork from here"
const newSessionId = await forkSession(originalId, checkpointId);
await resumeClaudeCode(newSessionId, prompt, model);
```

This comprehensive guide should give you everything needed to implement a fully-featured Claude Code session viewer with proper message display, tool rendering, and session continuation support in your Electron + React + TypeScript + Tailwind project.
