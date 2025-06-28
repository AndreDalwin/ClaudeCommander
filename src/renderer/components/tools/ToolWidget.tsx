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
  GenericToolWidget
} from './index';

interface ToolWidgetProps {
  message: Message;
  result?: Message;
}

export function ToolWidget({ message, result }: ToolWidgetProps) {
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
        return <BashWidget tool={message} result={result} />;
      case 'list_files':
        return <ListFilesWidget tool={message} result={result} />;
      default:
        return <GenericToolWidget tool={message} result={result} />;
    }
  };

  return (
    <div className="tool-widget my-4">
      {getToolComponent()}
    </div>
  );
}