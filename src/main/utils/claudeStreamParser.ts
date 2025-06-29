import { BrowserWindow } from 'electron';
import { Message } from '@shared/types';

export class ClaudeStreamParser {
  private sessionId: string;
  private mainWindow: BrowserWindow;
  private buffer = '';
  private currentTextMessage = '';
  private messages: Message[] = [];
  private extractedSessionId: string | null = null;
  private extractedProjectId: string | null = null;

  constructor(sessionId: string, mainWindow: BrowserWindow) {
    this.sessionId = sessionId;
    this.mainWindow = mainWindow;
  }

  // Parse streaming data from Claude
  handleData(chunk: Buffer): void {
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

  private processMessage(message: any): void {
    // Add metadata
    const timestampedMessage: Message = {
      ...message,
      timestamp: new Date().toISOString()
    };

    // Handle different message types
    switch (message.type) {
      case 'text':
        // Accumulate text messages
        this.currentTextMessage += message.text || '';
        
        // Send to frontend with accumulated text
        this.mainWindow.webContents.send(`session-message:${this.sessionId}`, {
          ...timestampedMessage,
          type: 'text',
          text: message.text,
          accumulatedText: this.currentTextMessage
        });
        break;

      case 'tool_use':
        // Finalize any pending text
        this.finalizeText();
        
        // Send tool use message
        this.mainWindow.webContents.send(`session-message:${this.sessionId}`, timestampedMessage);
        this.messages.push(timestampedMessage);
        break;

      case 'tool_result':
        // Send tool result
        this.mainWindow.webContents.send(`session-message:${this.sessionId}`, timestampedMessage);
        this.messages.push(timestampedMessage);
        break;

      case 'usage':
        // Send usage info
        this.mainWindow.webContents.send(`session-message:${this.sessionId}`, timestampedMessage);
        break;

      case 'system':
        // Handle system messages
        console.log('System message:', message);
        
        // Extract session ID from init messages
        if (message.subtype === 'init' && message.session_id) {
          this.extractedSessionId = message.session_id;
          if (message.project_id) {
            this.extractedProjectId = message.project_id;
          }
          console.log('Extracted session ID:', this.extractedSessionId, 'Project ID:', this.extractedProjectId);
        }
        
        this.mainWindow.webContents.send(`session-message:${this.sessionId}`, timestampedMessage);
        break;

      case 'error':
        // Handle error messages
        console.error('Claude error:', message);
        this.mainWindow.webContents.send(`session-error:${this.sessionId}`, {
          type: 'error',
          error: message.error || 'Unknown error',
          timestamp: timestampedMessage.timestamp
        });
        break;

      case 'user':
        // Send user messages directly
        this.mainWindow.webContents.send(`session-message:${this.sessionId}`, timestampedMessage);
        this.messages.push(timestampedMessage);
        break;

      case 'assistant':
        // Parse assistant messages and extract content
        if (message.message && message.message.content && Array.isArray(message.message.content)) {
          for (const content of message.message.content) {
            if (content.type === 'text' && content.text) {
              const textMessage: Message = {
                type: 'text',
                text: content.text,
                accumulatedText: content.text,
                timestamp: timestampedMessage.timestamp,
                isStreaming: false
              };
              this.mainWindow.webContents.send(`session-message:${this.sessionId}`, textMessage);
              this.messages.push(textMessage);
            } else if (content.type === 'tool_use') {
              const toolUseMessage: Message = {
                type: 'tool_use',
                name: content.name,
                input: content.input,
                tool_use_id: content.id,
                timestamp: timestampedMessage.timestamp
              };
              this.mainWindow.webContents.send(`session-message:${this.sessionId}`, toolUseMessage);
              this.messages.push(toolUseMessage);
            } else if (content.type === 'thinking' && content.thinking) {
              const thinkingMessage: Message = {
                type: 'thinking',
                thinking: content.thinking,
                accumulatedThinking: content.thinking,
                timestamp: timestampedMessage.timestamp,
                isStreaming: false
              };
              this.mainWindow.webContents.send(`session-message:${this.sessionId}`, thinkingMessage);
              this.messages.push(thinkingMessage);
            }
          }
        } else {
          // If we receive a raw assistant message without proper parsing, send it as-is
          // This ensures the UI can still display something rather than showing raw JSON
          console.warn('Received unparsed assistant message:', message);
          this.mainWindow.webContents.send(`session-message:${this.sessionId}`, timestampedMessage);
          this.messages.push(timestampedMessage);
        }
        break;

      case 'thinking':
        // Handle thinking messages
        this.mainWindow.webContents.send(`session-message:${this.sessionId}`, timestampedMessage);
        this.messages.push(timestampedMessage);
        break;

      default:
        // Send any other message types
        console.log('Unknown message type:', message.type, message);
        this.mainWindow.webContents.send(`session-message:${this.sessionId}`, timestampedMessage);
        this.messages.push(timestampedMessage);
    }
  }

  private finalizeText(): void {
    if (this.currentTextMessage) {
      // Send complete text message
      const textMessage: Message = {
        type: 'text',
        text: this.currentTextMessage,
        timestamp: new Date().toISOString()
      };
      
      this.messages.push(textMessage);
      
      // Reset accumulator
      this.currentTextMessage = '';
    }
  }

  handleComplete(code: number): void {
    // Finalize any pending text
    this.finalizeText();
    
    // Process any remaining buffer
    if (this.buffer.trim()) {
      try {
        const message = JSON.parse(this.buffer);
        this.processMessage(message);
      } catch (error) {
        console.error('Failed to parse final buffer:', error);
      }
    }
  }

  getAllMessages(): Message[] {
    return this.messages;
  }

  getExtractedSessionInfo(): { sessionId: string | null; projectId: string | null } {
    return {
      sessionId: this.extractedSessionId,
      projectId: this.extractedProjectId
    };
  }
}