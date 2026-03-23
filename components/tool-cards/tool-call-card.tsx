'use client';

import { Eye, FileText, Pencil, Search } from 'lucide-react';
import type { ReactNode } from 'react';
import { CollapsibleToolCard } from './collapsible-tool-card';

interface ToolCallCardProps {
  toolName: string;
  input: Record<string, unknown>;
  output?: unknown;
  state: string;
  errorText?: string;
}

const TOOL_META: Record<string, { label: string; icon: ReactNode; summary?: (input: Record<string, unknown>) => string }> = {
  Read: {
    label: '读取文件',
    icon: <FileText className="w-3 h-3 text-zinc-400" />,
    summary: (input) => (input.file_path as string) ?? '',
  },
  Glob: {
    label: '搜索文件',
    icon: <Search className="w-3 h-3 text-zinc-400" />,
    summary: (input) => (input.pattern as string) ?? '',
  },
  Grep: {
    label: '内容搜索',
    icon: <Search className="w-3 h-3 text-zinc-400" />,
    summary: (input) => (input.pattern as string) ?? '',
  },
  mcp__agent__notify_preview: {
    label: '更新预览',
    icon: <Eye className="w-3 h-3 text-zinc-400" />,
    summary: () => '页面预览已更新',
  },
};

function getLastSegment(path: string): string {
  return path.split('/').filter(Boolean).pop() ?? path;
}

export function ToolCallCard({ toolName, input, output, state, errorText }: ToolCallCardProps) {
  const meta = TOOL_META[toolName];
  const label = meta?.label ?? toolName;
  const icon = meta?.icon ?? <Pencil className="w-3 h-3 text-zinc-400" />;
  const summary = meta?.summary?.(input) ?? '';
  const isError = state === 'output-error';
  const isDone = state === 'output-available' || state === 'output-denied';

  // 对于 notify_preview，只显示简单的徽章，不需要展开内容
  if (toolName === 'mcp__agent__notify_preview') {
    return (
      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-violet-50 border border-violet-100 text-xs text-violet-600 my-1">
        <Eye className="w-3 h-3" />
        预览已更新
      </div>
    );
  }

  const summaryDisplay = summary ? getLastSegment(summary) : '';

  return (
    <CollapsibleToolCard
      state={state}
      headerContent={(expanded) => (
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {icon}
          <span className="font-medium text-zinc-700 flex-shrink-0">{label}</span>
          {!expanded && summaryDisplay && (
            <span className="text-zinc-400 truncate">{summaryDisplay}</span>
          )}
        </div>
      )}
    >
      {Object.entries(input).map(([key, value]) => (
        <div key={key}>
          <div className="text-zinc-400 mb-0.5 text-[10px]">{key}</div>
          {typeof value === 'string' && value.length > 60 ? (
            <pre className="bg-zinc-50 rounded p-2 overflow-x-auto border border-zinc-100 max-h-32 text-[11px] leading-4">
              <code>{value}</code>
            </pre>
          ) : (
            <code className="bg-zinc-50 rounded px-2 py-0.5 border border-zinc-100 break-all text-[11px]">
              {typeof value === 'string' ? value : JSON.stringify(value)}
            </code>
          )}
        </div>
      ))}

      {isDone && output != null && (
        <div>
          <div className="text-zinc-400 mb-0.5">输出</div>
          <pre className="bg-zinc-50 rounded p-2 overflow-x-auto border border-zinc-100 max-h-40 text-[11px] leading-4">
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
