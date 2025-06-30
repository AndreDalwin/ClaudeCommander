import React from 'react';
import { Message } from '@shared/types';
import {
  ReadFileWidget,
  EditWidget,
  MultiEditWidget,
  GlobWidget,
  StrReplaceEditorWidget,
  BashWidget,
  ListFilesWidget,
  WriteWidget,
  TodoWriteWidget,
  WebSearchWidget,
  GenericToolWidget
} from './index';

interface ToolWidgetProps {
  message: Message;
  result?: Message;
  allMessages?: Message[];
  messageIndex?: number;
}

export function ToolWidget({ message, result, allMessages, messageIndex }: ToolWidgetProps) {
  const getToolComponent = () => {
    switch (message.name) {
      case 'Read':
        return <ReadFileWidget tool={message} result={result} />;
      case 'Edit':
        return <EditWidget tool={message} result={result} />;
      case 'MultiEdit':
        return <MultiEditWidget tool={message} result={result} />;
      case 'Glob':
        return <GlobWidget tool={message} result={result} />;
      case 'str_replace_editor':
        return <StrReplaceEditorWidget tool={message} result={result} />;
      case 'bash':
      case 'Bash':
        return <BashWidget tool={message} result={result} />;
      case 'list_files':
        return <ListFilesWidget tool={message} result={result} />;
      case 'Write':
        return <WriteWidget tool={message} result={result} />;
      case 'TodoWrite':
        return <TodoWriteWidget tool={message} result={result} />;
      case 'WebSearch': {
        console.log('WebSearch tool message:', message);
        
        // Special handling for WebSearch - the result might be filtered out
        let webSearchResult = result?.output;
        
        if (!webSearchResult && message.tool_use_id) {
          // The tool_result might be filtered out, so we need to look for it in a different way
          // Look through all messages after this one to find a user message with our tool_result
          if (allMessages && messageIndex !== undefined) {
            for (let i = messageIndex + 1; i < allMessages.length && i < messageIndex + 5; i++) {
              const checkMessage = allMessages[i];
              console.log(`Checking message ${i} after WebSearch:`, checkMessage?.type);
              
              if (checkMessage?.type === 'user' && checkMessage.message?.content) {
                const content = checkMessage.message.content;
                if (Array.isArray(content)) {
                  // Find the tool_result that matches our tool_use_id
                  const toolResult = content.find((item: any) => 
                    item.type === 'tool_result' && 
                    item.tool_use_id === message.tool_use_id
                  );
                  if (toolResult) {
                    webSearchResult = toolResult.content;
                    console.log('Found WebSearch result in user message:', webSearchResult);
                    break;
                  }
                }
              }
            }
          }
        }
        
        return <WebSearchWidget input={message.input} result={webSearchResult} isLoading={!webSearchResult} />;
      }
      default:
        return <GenericToolWidget tool={message} result={result} />;
    }
  };

  return (
    <div className="tool-widget my-1">
      {getToolComponent()}
    </div>
  );
}