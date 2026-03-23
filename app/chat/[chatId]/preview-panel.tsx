'use client';

import { useState, useEffect, useRef } from 'react';
import { Monitor, Smartphone, RefreshCw, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Viewport = 'desktop' | 'mobile';

type Props = {
  chatId: string;
  snapshotId: string | null;
  status: 'ready' | 'submitted' | 'streaming' | 'error';
};

export default function PreviewPanel({ chatId, snapshotId: initialSnapshotId, status }: Props) {
  const [viewport, setViewport] = useState<Viewport>('desktop');
  const [snapshotId, setSnapshotId] = useState<string | null>(initialSnapshotId);
  const [refreshKey, setRefreshKey] = useState(0);
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

  const baseIframeSrc = snapshotId
    ? `/api/workspace/${chatId}?t=${snapshotId}`
    : `/api/workspace/${chatId}`;

  const iframeSrc = refreshKey > 0 ? `${baseIframeSrc}&r=${refreshKey}` : baseIframeSrc;
  const hasContent = snapshotId !== null;
  const isGenerating = status === 'streaming' || status === 'submitted';
  const previewUrl = hasContent ? `localhost:4001/api/workspace/${chatId}` : '';

  return (
    <div className="flex h-full w-full flex-col bg-[#fafafa]">
      {/* 顶部工具栏 */}
      <div className="flex flex-col shrink-0 border-b border-zinc-200 bg-white">
        {/* 第一行：viewport 切换 + 操作按钮 */}
        <div className="flex items-center justify-between gap-2 px-3 py-2">
          <div className="relative inline-flex items-center rounded-lg border border-zinc-200 bg-zinc-50 p-0.5">
            <motion.div
              className="absolute inset-0.5 rounded-md bg-white shadow-sm"
              style={{
                width: 'calc(50% - 2px)',
                left: viewport === 'mobile' ? 'calc(50%)' : '2px',
              }}
              layout
              transition={{ type: 'spring', bounce: 0.2, duration: 0.3 }}
            />
            <button
              type="button"
              onClick={() => setViewport('desktop')}
              className={`relative z-10 flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                viewport === 'desktop' ? 'text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              <Monitor className="size-3" />
              桌面
            </button>
            <button
              type="button"
              onClick={() => setViewport('mobile')}
              className={`relative z-10 flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                viewport === 'mobile' ? 'text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              <Smartphone className="size-3" />
              手机
            </button>
          </div>

          <div className="flex items-center gap-1">
            <AnimatePresence>
              {isGenerating && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700"
                >
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  生成中
                </motion.span>
              )}
            </AnimatePresence>

            {hasContent && (
              <>
                <button
                  type="button"
                  title="刷新预览"
                  onClick={() => setRefreshKey(k => k + 1)}
                  className="inline-flex size-7 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
                >
                  <RefreshCw className="size-3.5" />
                </button>
                <a
                  href={`/api/workspace/${chatId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="在新标签页打开"
                  className="inline-flex size-7 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
                >
                  <ExternalLink className="size-3.5" />
                </a>
              </>
            )}
          </div>
        </div>

        {/* URL 地址栏 */}
        <div className="px-3 pb-2">
          <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5">
            <div className={`size-2 shrink-0 rounded-full ${hasContent ? 'bg-emerald-500' : 'bg-zinc-300'}`} />
            <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-zinc-500">
              {hasContent ? previewUrl : '暂无预览内容'}
            </span>
          </div>
        </div>
      </div>

      {/* 预览内容区 */}
      <div className="min-h-0 flex-1 overflow-hidden">
        {!hasContent ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-center px-6">
              {isGenerating ? (
                <>
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <div
                        key={i}
                        className="size-2 rounded-full bg-zinc-300 animate-bounce-dot"
                        style={{ animationDelay: `${i * 160}ms` }}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-zinc-400">正在生成页面...</p>
                </>
              ) : (
                <>
                  <div className="rounded-xl border border-dashed border-zinc-200 bg-white p-6">
                    <Monitor className="size-8 text-zinc-300" />
                  </div>
                  <p className="text-sm text-zinc-400">在左侧输入需求，让 AI 生成页面</p>
                </>
              )}
            </div>
          </div>
        ) : viewport === 'desktop' ? (
          <iframe
            key={iframeSrc}
            title="Desktop preview"
            src={iframeSrc}
            sandbox="allow-scripts allow-same-origin"
            className="h-full w-full border-0 bg-white"
          />
        ) : (
          <div className="flex h-full items-center justify-center overflow-auto bg-zinc-100 p-6">
            <div
              className="relative overflow-hidden rounded-[2.5rem] border-[7px] border-zinc-800 bg-white shadow-2xl"
              style={{ width: 390, height: 'min(720px, calc(100% - 2rem))' }}
            >
              <div className="absolute inset-x-0 top-0 z-10 flex justify-center pt-2.5">
                <div className="h-1.5 w-24 rounded-full bg-zinc-800" />
              </div>
              <div className="absolute -left-[9px] top-24 h-10 w-1.5 rounded-l-full bg-zinc-700" />
              <div className="absolute -left-[9px] top-40 h-8 w-1.5 rounded-l-full bg-zinc-700" />
              <div className="absolute -right-[9px] top-32 h-12 w-1.5 rounded-r-full bg-zinc-700" />
              <iframe
                key={iframeSrc + '-mobile'}
                title="Mobile preview"
                src={iframeSrc}
                sandbox="allow-scripts allow-same-origin"
                className="h-full w-full border-0 pt-5"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
