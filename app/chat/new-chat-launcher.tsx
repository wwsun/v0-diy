'use client';

import { generateId } from 'ai';
import { SendHorizonal, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const EXAMPLE_PROMPTS = [
  { label: '落地页', prompt: '创建一个现代感的产品落地页，包含 Hero 区块、特性列表和 CTA 按钮' },
  { label: '数据看板', prompt: '设计一个数据分析看板，展示关键指标卡片、折线图和表格' },
  { label: '登录表单', prompt: '制作一个简洁的登录/注册表单，包含社交登录按钮' },
  { label: '产品展示', prompt: '做一个电商产品展示页，包含图片画廊、规格选择和加购按钮' },
];

export default function NewChatLauncher() {
  const router = useRouter();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [chatId] = useState(() => generateId());
  const [firstMessageId] = useState(() => generateId());
  const canSubmit = !isSubmitting && text.trim().length > 0;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const textarea = inputRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 140)}px`;
  }, [text]);

  const consumeResponseStream = async (response: Response) => {
    if (!response.body) {
      await response.text();
      return;
    }

    const reader = response.body.getReader();

    try {
      while (true) {
        const { done } = await reader.read();
        if (done) {
          break;
        }
      }
    } finally {
      reader.releaseLock();
    }
  };

  const submit = async () => {
    if (!canSubmit) {
      return;
    }

    const userText = text;
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/agent/${chatId}/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trigger: 'submit-message',
          id: chatId,
          message: {
            id: firstMessageId,
            role: 'user',
            parts: [{ type: 'text', text: userText }],
            metadata: { createdAt: Date.now() },
          },
          messageId: undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start a new chat');
      }

      await consumeResponseStream(response);

      router.push(`/chat/${chatId}?new=1`);
    } catch (error) {
      console.error(error);
      window.alert('Failed to start a new chat. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-white bg-grid-pattern">
      {/* 渐变遮罩，让网格纹理向中心淡出 */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/60 via-transparent to-white/60" />

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-6">
        <motion.div
          className="w-full max-w-2xl space-y-8"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          {/* 标题区 */}
          <div className="space-y-3 text-center">
            <div className="mx-auto inline-flex size-12 items-center justify-center rounded-2xl bg-zinc-900 shadow-soft-md">
              <Sparkles className="size-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
              你想创建什么？
            </h1>
            <p className="text-sm text-zinc-500">
              描述你的需求，AI 将即刻为你生成可预览的网页
            </p>
          </div>

          {/* 输入卡片 */}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void submit();
            }}
          >
            <div className="rounded-3xl border border-zinc-200 bg-white shadow-soft-2xl ring-1 ring-zinc-950/5">
              <textarea
                ref={inputRef}
                rows={3}
                value={text}
                disabled={isSubmitting}
                placeholder="例如：创建一个简洁的产品落地页..."
                className="max-h-[140px] min-h-[80px] w-full resize-none rounded-t-3xl bg-transparent px-5 pt-4 pb-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 disabled:cursor-not-allowed disabled:opacity-60"
                onChange={(event) => setText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                    event.preventDefault();
                    void submit();
                  }
                }}
              />

              {/* 底部工具栏 */}
              <div className="flex items-center justify-between border-t border-zinc-100 px-4 py-3">
                <span className="text-xs text-zinc-400">
                  {isSubmitting ? '正在启动...' : '⌘↩ 发送'}
                </span>
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 active:scale-95 disabled:cursor-not-allowed disabled:bg-zinc-300"
                >
                  <SendHorizonal className="size-3.5" />
                  {isSubmitting ? '生成中...' : '生成'}
                </button>
              </div>
            </div>
          </form>

          {/* 示例 Prompt */}
          <div className="flex flex-wrap justify-center gap-2">
            {EXAMPLE_PROMPTS.map(({ label, prompt }) => (
              <button
                key={label}
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  setText(prompt);
                  requestAnimationFrame(() => inputRef.current?.focus());
                }}
                className="rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-medium text-zinc-600 shadow-soft-sm transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900 disabled:opacity-50"
              >
                {label}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
