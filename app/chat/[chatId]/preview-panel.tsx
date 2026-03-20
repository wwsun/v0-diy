'use client';

import { useState, useEffect, useRef } from 'react';
import { Monitor, Smartphone } from 'lucide-react';

type Viewport = 'desktop' | 'mobile';

type Props = {
  chatId: string;
  snapshotId: string | null;
  status: 'ready' | 'submitted' | 'streaming' | 'error';
};

export default function PreviewPanel({ chatId, snapshotId: initialSnapshotId, status }: Props) {
  const [viewport, setViewport] = useState<Viewport>('desktop');
  const [snapshotId, setSnapshotId] = useState<string | null>(initialSnapshotId);
  const prevSnapshotIdRef = useRef<string | null>(initialSnapshotId);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 当 prop 变化时同步（e.g. 页面刷新）
  useEffect(() => {
    setSnapshotId(initialSnapshotId);
    prevSnapshotIdRef.current = initialSnapshotId;
  }, [initialSnapshotId]);

  // 流式期间轮询 snapshotId 变化
  useEffect(() => {
    if (status !== 'streaming' && status !== 'submitted') {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    const poll = async () => {
      try {
        const res = await fetch(`/api/agent/${chatId}`);
        if (!res.ok) return;
        const data = await res.json() as {
          ok: boolean;
          chat: { workspacePages: { activeSnapshotId: string | null } };
        };
        const newId = data.chat?.workspacePages?.activeSnapshotId ?? null;
        if (newId && newId !== prevSnapshotIdRef.current) {
          prevSnapshotIdRef.current = newId;
          setSnapshotId(newId);
        }
      } catch {
        // 忽略轮询错误
      }
      timerRef.current = setTimeout(poll, 2000);
    };

    poll();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [status, chatId]);

  const iframeSrc = snapshotId
    ? `/api/workspace/${chatId}?t=${snapshotId}`
    : `/api/workspace/${chatId}`;

  const hasContent = snapshotId !== null;

  return (
    <aside className="flex h-full min-h-0 w-[480px] flex-col border-l border-slate-200 bg-slate-50">
      {/* 顶部工具栏 */}
      <div className="border-b border-slate-200 px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-semibold text-slate-700">Preview</h3>
            <p className="text-[11px] text-slate-500">
              {hasContent ? 'Live preview' : 'No page generated yet.'}
            </p>
          </div>

          <div className="inline-flex rounded-md border border-slate-300 bg-white p-0.5">
            <button
              type="button"
              onClick={() => setViewport('desktop')}
              title="Desktop view"
              className={`flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition ${
                viewport === 'desktop'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Monitor className="size-3" />
              Desktop
            </button>
            <button
              type="button"
              onClick={() => setViewport('mobile')}
              title="Mobile view"
              className={`flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition ${
                viewport === 'mobile'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Smartphone className="size-3" />
              Mobile
            </button>
          </div>
        </div>
      </div>

      {/* 预览区域 */}
      <div className="min-h-0 flex-1 overflow-hidden">
        {!hasContent ? (
          <div className="flex h-full items-center justify-center">
            <p className="rounded-md border border-dashed border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
              {status === 'streaming' || status === 'submitted'
                ? '正在生成页面...'
                : '输入需求，让 AI 帮你创建页面'}
            </p>
          </div>
        ) : viewport === 'desktop' ? (
          <iframe
            key={iframeSrc}
            title="Desktop preview"
            src={iframeSrc}
            sandbox="allow-scripts allow-same-origin"
            className="h-full w-full border-0"
          />
        ) : (
          <div className="flex h-full items-center justify-center overflow-auto p-4">
            <div
              className="relative overflow-hidden rounded-[2rem] border-[6px] border-slate-700 bg-white shadow-lg"
              style={{ width: 390, height: 'min(700px, calc(100% - 2rem))' }}
            >
              {/* 手机顶部刘海装饰 */}
              <div className="absolute inset-x-0 top-0 flex justify-center pt-2 z-10">
                <div className="h-1.5 w-20 rounded-full bg-slate-700" />
              </div>
              <iframe
                key={iframeSrc + '-mobile'}
                title="Mobile preview"
                src={iframeSrc}
                sandbox="allow-scripts allow-same-origin"
                className="h-full w-full border-0 pt-4"
              />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
