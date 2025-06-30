import { Message } from '@shared/types';

// Tools that have custom widgets for integrated display
const TOOLS_WITH_WIDGETS = [
  'edit',
  'bash',
  'Bash', // Handle both cases
  'websearch',
  'read',
  'Read', // Handle both cases
  'write',
  'Write',
  'ls',
  'LS',
  'grep',
  'Grep',
  'glob',
  'Glob',
  'todowrite',
  'TodoWrite',
  'task',
  'Task',
  'multiedit',
  'MultiEdit',
  // Add more tools as widgets are created
] as const;

/**
 * Determines if a tool has a custom widget for display
 */
export function hasCustomWidget(toolName: string): boolean {
  // MCP tools (starting with mcp__) always get widget treatment
  if (toolName.startsWith('mcp__')) {
    return true;
  }
  
  return TOOLS_WITH_WIDGETS.includes(toolName.toLowerCase() as any);
}

/**
 * Checks if a message is empty (no meaningful content)
 */
export function isEmptyMessage(message: Message): boolean {
  // Check text content
  if (message.text && message.text.trim()) return false;
  if (message.accumulatedText && message.accumulatedText.trim()) return false;
  
  // Check message content
  if (message.message?.content) {
    if (typeof message.message.content === 'string') {
      return !message.message.content.trim();
    }
    if (Array.isArray(message.message.content)) {
      return !message.message.content.some((item: any) => {
        if (typeof item === 'string') return item.trim();
        if (item?.text) return item.text.trim();
        return false;
      });
    }
  }
  
  // Check other content types
  if (message.thinking && message.thinking.trim()) return false;
  if (message.system && message.system.trim()) return false;
  if (message.error && message.error.trim()) return false;
  if (message.summary && message.summary.trim()) return false;
  
  return true;
}

/**
 * Checks if a message contains system reminders
 */
export function isSystemReminder(message: Message): boolean {
  if (message.reminder) return true;
  
  const content = message.system || message.text || '';
  return content.includes('system-reminder') || 
         content.includes('reminder:') ||
         content.includes('⚠️') ||
         content.includes('warning');
}

/**
 * Checks if a user message contains only tool results that will be handled by widgets
 */
export function isUserMessageWithOnlyWidgetToolResults(message: Message & { parent_tool_use_id?: string }, allMessages: Message[]): boolean {
  if (message.type !== 'user' || !message.message?.content) return false;
  
  if (!Array.isArray(message.message.content)) return false;
  
  // Check if all content items are tool_result that will be handled by widgets
  const nonWidgetContent = message.message.content.filter(item => {
    if (item.type === 'tool_result') {
      // Find the corresponding tool_use to check if it has a widget
      const toolUse = allMessages.find(msg => 
        msg.type === 'tool_use' && msg.tool_use_id === item.tool_use_id
      );
      
      // Also check if this message has a parent_tool_use_id that matches a tool with a widget
      if (!toolUse && message.parent_tool_use_id) {
        const parentToolUse = allMessages.find(msg =>
          msg.type === 'tool_use' && msg.tool_use_id === message.parent_tool_use_id
        );
        if (parentToolUse && hasCustomWidget(parentToolUse.name || '')) {
          return false; // This tool result will be handled by a widget
        }
      }
      
      if (toolUse && hasCustomWidget(toolUse.name || '')) {
        return false; // This tool result will be handled by a widget
      }
      
      // Special case: Task tool results often have text content that should still be hidden
      // Check if this is a Task tool result by looking at the parent
      if (message.parent_tool_use_id) {
        const parentTool = allMessages.find(msg =>
          msg.type === 'tool_use' && msg.tool_use_id === message.parent_tool_use_id
        );
        if (parentTool && (parentTool.name === 'task' || parentTool.name === 'Task')) {
          return false; // Hide Task tool results even if they have text content
        }
      }
    }
    
    // If it's not a widget-handled tool result, or if it has text content, keep it
    return item.text?.trim() || item.type !== 'tool_result';
  });
  
  return nonWidgetContent.length === 0;
}

/**
 * Main filtering function that determines if a message should be shown
 */
export function shouldShowMessage(message: Message, _index: number, allMessages: Message[]): boolean {
  // ✅ ALWAYS SHOWN
  
  // Assistant Text Responses
  if (message.type === 'text' || (message.message?.role === 'assistant' && message.text)) {
    return !isEmptyMessage(message);
  }
  
  // Regular User Input (non-meta, non-empty)
  if (message.type === 'user' && !message.isMeta && !isEmptyMessage(message)) {
    // Hide user messages where the first content item is tool_result (including errors)
    if (message.message?.content && Array.isArray(message.message.content)) {
      if (message.message.content.length > 0 && message.message.content[0].type === 'tool_result') {
        return false;
      }
    }
    return true;
  }
  
  // System Initialization Messages
  if (message.type === 'system' && message.subtype === 'init') {
    return true;
  }
  
  // Result Messages (Execution Summaries)
  if (message.type === 'result') {
    return true;
  }
  
  // Tool Errors (always shown regardless of widget status)
  if (message.type === 'tool_result' && message.is_error) {
    return true;
  }
  
  // System Reminders (always shown for safety)
  if (isSystemReminder(message)) {
    return true;
  }
  
  // ❌ ALWAYS HIDDEN
  
  // Meta User Messages
  if (message.isMeta && message.message?.role === 'user') {
    return false;
  }
  
  // Empty User Messages
  if (message.type === 'user' && isEmptyMessage(message)) {
    return false;
  }
  
  // Meta Assistant Messages Without Summaries
  if (message.isMeta && message.message?.role === 'assistant' && !message.summary && !message.leafUuid) {
    return false;
  }
  
  // Tool Results for Tools with Custom Widgets (unless error)
  if (message.type === 'tool_result' && !message.is_error) {
    const toolUse = allMessages.find(msg => 
      msg.type === 'tool_use' && msg.tool_use_id === message.tool_use_id_result
    );
    if (toolUse && hasCustomWidget(toolUse.name || '')) {
      return false;
    }
  }
  
  // ⚖️ CONDITIONALLY SHOWN
  
  // Tool Use Messages - always show (widgets handle both input and result)
  if (message.type === 'tool_use') {
    return true;
  }
  
  // Tool Results for tools without widgets
  if (message.type === 'tool_result') {
    const toolUse = allMessages.find(msg => 
      msg.type === 'tool_use' && msg.tool_use_id === message.tool_use_id_result
    );
    return !toolUse || !hasCustomWidget(toolUse.name || '');
  }
  
  // Meta Messages with meaningful content
  if (message.isMeta && (message.summary || message.leafUuid)) {
    return true;
  }
  
  // System messages (non-reminder)
  if (message.type === 'system' && !message.reminder) {
    return true;
  }
  
  // Usage messages
  if (message.type === 'usage') {
    return true;
  }
  
  // Error messages
  if (message.type === 'error') {
    return true;
  }
  
  // Thinking messages
  if (message.type === 'thinking') {
    return !isEmptyMessage(message);
  }
  
  // Default: show unknown message types for debugging
  return true;
}

/**
 * Filters an array of messages according to the display rules
 */
export function filterMessages(messages: Message[]): Message[] {
  return messages.filter((message, index) => shouldShowMessage(message, index, messages));
}