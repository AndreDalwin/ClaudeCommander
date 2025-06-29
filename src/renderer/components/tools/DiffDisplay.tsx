import React, { useMemo } from 'react';
import { diffLines, diffWords, Change } from 'diff';

interface DiffDisplayProps {
  oldString: string;
  newString: string;
  mode?: 'line' | 'word';
}

export function DiffDisplay({ oldString, newString, mode = 'line' }: DiffDisplayProps) {
  const changes = useMemo(() => {
    if (mode === 'word') {
      return diffWords(oldString, newString);
    }
    return diffLines(oldString, newString);
  }, [oldString, newString, mode]);

  const lineNumbers = useMemo(() => {
    let oldLine = 1;
    let newLine = 1;
    const numbers: Array<{ oldLine: number | null; newLine: number | null }> = [];

    changes.forEach((change) => {
      const lines = change.value.split('\n').filter((_, i, arr) => i < arr.length - 1 || change.value[change.value.length - 1] === '\n');
      
      lines.forEach(() => {
        if (change.removed) {
          numbers.push({ oldLine: oldLine++, newLine: null });
        } else if (change.added) {
          numbers.push({ oldLine: null, newLine: newLine++ });
        } else {
          numbers.push({ oldLine: oldLine++, newLine: newLine++ });
        }
      });
    });

    return numbers;
  }, [changes]);


  return (
    <div className="font-mono text-sm">
      <div className="flex">
        {/* Line numbers column */}
        <div className="flex">
          <div className="text-text-muted bg-[#0a0a0a] px-2 border-r border-dark-border">
            {lineNumbers.map((num, i) => (
              <div key={i} className="text-right min-w-[2rem]">
                {num.oldLine || ''}
              </div>
            ))}
          </div>
          <div className="text-text-muted bg-[#0a0a0a] px-2 border-r border-dark-border">
            {lineNumbers.map((num, i) => (
              <div key={i} className="text-right min-w-[2rem]">
                {num.newLine || ''}
              </div>
            ))}
          </div>
        </div>

        {/* Diff content */}
        <div className="flex-1 overflow-x-auto">
          {changes.map((change: Change, index: number) => {
            const lines = change.value.split('\n').filter((_, i, arr) => i < arr.length - 1 || change.value[change.value.length - 1] === '\n');
            
            if (lines.length === 0 && change.value) {
              lines.push(change.value);
            }

            return lines.map((line, lineIdx) => (
                <div
                  key={`${index}-${lineIdx}`}
                  className={`px-4 whitespace-pre ${
                    change.removed
                      ? 'bg-red-900/20 text-red-200'
                      : change.added
                      ? 'bg-green-900/20 text-green-200'
                      : 'text-text-primary'
                  }`}
                >
                  <span className={`select-none mr-3 ${
                    change.removed ? 'text-red-400' : change.added ? 'text-green-400' : 'text-text-muted'
                  }`}>
                    {change.removed ? '-' : change.added ? '+' : ' '}
                  </span>
                  {line}
                </div>
              ));
          })}
        </div>
      </div>
    </div>
  );
}

// Inline diff display for showing changes within a line
export function InlineDiffDisplay({ oldString, newString }: DiffDisplayProps) {
  const changes = useMemo(() => diffWords(oldString, newString), [oldString, newString]);

  return (
    <div className="font-mono text-sm p-4 bg-dark-bg rounded-lg">
      <div className="mb-2">
        <span className="text-text-muted text-xs">Changed from:</span>
        <div className="mt-1">
          {changes.map((change, index) => (
            <span
              key={index}
              className={change.removed ? 'bg-red-500/30 text-red-200 line-through' : !change.added ? 'text-text-primary' : 'hidden'}
            >
              {change.value}
            </span>
          ))}
        </div>
      </div>
      <div>
        <span className="text-text-muted text-xs">Changed to:</span>
        <div className="mt-1">
          {changes.map((change, index) => (
            <span
              key={index}
              className={change.added ? 'bg-green-500/30 text-green-200' : !change.removed ? 'text-text-primary' : 'hidden'}
            >
              {change.value}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}