'use client';

import { useState, useEffect, useRef } from 'react';
import { Monitor, Smartphone } from 'lucide-react';
import { motion } from 'framer-motion';

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

  useEffect(() => {
    setSnapshotId(initialSnapshotId);
    prevSnapshotIdRef.current = initialSnapshotId;
  }, [initialSnapshotId]);

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
    <aside className="flex h-full min-h-0 w-[480px] flex-col border-l border-zinc-100 bg-zinc-50/50">
      {/* 顶部工具栏 */}
      <div className="border-b border-zinc-100 px-4 py-2.5 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-semibold text-zinc-700">预览</h3>
            <p className="text-[11px] text-zinc-400">
              {hasContent ? '实时预览' : '暂无预览内容'}
            </p>
          </div>

          {/* 滑动切换按钮 */}
          <div className="relative inline-flex items-center rounded-xl border border-zinc-200 bg-white p-1 shadow-soft-sm">
            {viewport === 'desktop' && (
              <motion.div
                layoutId="viewport-pill"
                className="absolute inset-1 rounded-lg bg-zinc-900"
                style={{ width: 'calc(50% - 4px)' }}
                transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
              />
            )}
            {viewport === 'mobile' && (
              <motion.div
                layoutId="viewport-pill"
                className="absolute inset-1 right-1 left-[calc(50%+4px)] rounded-lg bg-zinc-900"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
              />
            )}
            <button
              type="button"
              onClick={() => setViewport('desktop')}
              title="Desktop view"
              className={`relative flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors z-10 ${
                viewport === 'desktop' ? 'text-white' : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              <Monitor className="size-3" />
              桌面
            </button>
            <button
              type="button"
              onClick={() => setViewport('mobile')}
              title="Mobile view"
              className={`relative flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors z-10 ${
                viewport === 'mobile' ? 'text-white' : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              <Smartphone className="size-3" />
              手机
            </button>
          </div>
        </div>
      </div>

      {/* 预览区域 */}
      <div className="min-h-0 flex-1 overflow-hidden">
        {!hasContent ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-center">
              <p className="text-sm text-zinc-400">
                {status === 'streaming' || status === 'submitted'
                  ? '正在生成页面...'
                  : '输入需求，让 AI 帮你创建页面'}
              </p>
            </div>
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
              className="relative overflow-hidden rounded-[2rem] border-[6px] border-zinc-800 bg-white shadow-soft-lg"
              style={{ width: 390, height: 'min(700px, calc(100% - 2rem))' }}
            >
              {/* 手机顶部刘海装饰 */}
              <div className="absolute inset-x-0 top-0 flex justify-center pt-2 z-10">
                <div className="h-1.5 w-20 rounded-full bg-zinc-800" />
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
