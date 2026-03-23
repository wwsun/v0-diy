'use client';

import { Minus, Plus } from 'lucide-react';
import { CollapsibleToolCard } from './collapsible-tool-card';

interface FileChangeCardProps {
  toolName: string;
  input: Record<string, unknown>;
  output?: unknown;
  state: string;
  errorText?: string;
}

function getFileName(filePath: string): string {
  const parts = filePath.split('/');
  return parts[parts.length - 1] || filePath;
}

// 截去 .workspaces/{chatId}/ 前缀，只展示相对路径
function shortenPath(filePath: string): string {
  const match = filePath.match(/\.workspaces\/[^/]+\/(.+)/);
  return match ? match[1] : filePath;
}

function DiffLine({ line, type }: { line: string; type: 'add' | 'remove' }) {
  const isAdd = type === 'add';
  return (
    <div
      className={`flex items-start gap-1 font-mono text-[11px] leading-5 ${
        isAdd ? 'bg-green-50' : 'bg-red-50'
      }`}
    >
      <span
        className={`flex-shrink-0 w-5 flex items-center justify-center ${
          isAdd ? 'text-green-600' : 'text-red-600'
        }`}
      >
        {isAdd ? <Plus className="size-3" /> : <Minus className="size-3" />}
      </span>
      <span className={`flex-1 px-1 ${isAdd ? 'text-green-800' : 'text-red-800'}`}>
        {line || ' '}
      </span>
    </div>
  );
}

const TOOL_LABELS: Record<string, string> = {
  Write: '写入文件',
  Edit: '编辑文件',
  MultiEdit: '批量编辑',
};

export function FileChangeCard({
  toolName,
  input,
  output,
  state,
  errorText,
}: FileChangeCardProps) {
  const label = TOOL_LABELS[toolName] ?? toolName;
  const isDone = state === 'output-available' || state === 'output-denied';
  const isError = state === 'output-error';

  const filePath = (input?.file_path as string) ?? '';
  const shortPath = shortenPath(filePath);
  const fileName = getFileName(filePath);

  const isWrite = toolName === 'Write';
  const content = (input?.content as string) ?? '';
  const oldString = (input?.old_string as string) ?? '';
  const newString = (input?.new_string as string) ?? '';
  const replaceAll = (input?.replace_all as boolean) ?? false;

  const oldLines = oldString.split('\n');
  const newLines = newString.split('\n');

  return (
    <CollapsibleToolCard
      state={state}
      headerContent={(expanded) => (
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <span className="font-medium text-zinc-700 flex-shrink-0">{label}</span>
          <span className="text-zinc-400 truncate" title={shortPath}>
            {fileName}
          </span>
          {!isWrite && !expanded && (
            <span className="flex items-center gap-1 text-[10px] ml-1">
              <span className="text-green-600">+{newLines.length}</span>
              <span className="text-red-600">-{oldLines.length}</span>
            </span>
          )}
          {replaceAll && (
            <span className="px-1 py-0.5 text-[10px] bg-blue-50 text-blue-600 rounded border border-blue-200 flex-shrink-0">
              全部替换
            </span>
          )}
        </div>
      )}
    >
      <div className="text-[11px] text-zinc-400 break-all">
        <span className="font-medium text-zinc-600">路径：</span>
        <span className="font-mono">{shortPath}</span>
      </div>

      {isWrite ? (
        <pre className="bg-zinc-50 rounded p-2 overflow-auto border border-zinc-100 max-h-[300px] text-[11px] leading-4 font-mono">
          <code>{content}</code>
        </pre>
      ) : (
        <div className="border border-zinc-200 rounded overflow-hidden">
          {oldString && (
            <div className="border-b border-red-100">
              {oldLines.map((line, i) => (
                <DiffLine key={`old-${i}`} line={line} type="remove" />
              ))}
            </div>
          )}
          {newString && (
            <div>
              {newLines.map((line, i) => (
                <DiffLine key={`new-${i}`} line={line} type="add" />
              ))}
            </div>
          )}
        </div>
      )}

      {isDone && output != null && (
        <div>
          <div className="text-zinc-400 mb-0.5">输出</div>
          <pre className="bg-zinc-50 rounded p-2 overflow-x-auto border border-zinc-100 max-h-24 text-[11px] leading-4">
            <code>
              {typeof output === 'string' ? output : JSON.stringify(output, null, 2)}
            </code>
          </pre>
        </div>
      )}

      {isError && errorText && (
        <div className="text-red-500 bg-red-50 rounded px-2 py-1 border border-red-100">
          {errorText}
        </div>
      )}
      {isError && output != null && (
        <pre className="bg-red-50 rounded p-2 overflow-x-auto border border-red-200 max-h-40 text-[11px] leading-4 text-red-700">
          <code>
            {typeof output === 'string' ? output : JSON.stringify(output, null, 2)}
          </code>
        </pre>
      )}
    </CollapsibleToolCard>
  );
}
