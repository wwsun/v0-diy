'use client';

import { generateId } from 'ai';
import { ArrowUp, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const EXAMPLE_PROMPTS = [
  { label: '落地页', prompt: '创建一个现代感的产品落地页，包含 Hero 区块、特性列表和 CTA 按钮' },
  { label: '数据看板', prompt: '设计一个数据分析看板，展示关键指标卡片、折线图和表格' },
  { label: '登录表单', prompt: '制作一个简洁的登录/注册表单，包含社交登录按钮' },
  { label: '电商展示', prompt: '做一个电商产品展示页，包含图片画廊、规格选择和加购按钮' },
  { label: '个人主页', prompt: '创建一个开发者个人主页，包含作品集、技能栈和联系方式' },
  { label: '博客文章', prompt: '设计一个简洁的博客文章页面，支持 Markdown 排版' },
];

export default function NewChatLauncher() {
  const router = useRouter();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState('');
  const [chatId] = useState(() => generateId());
  const canSubmit = text.trim().length > 0;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const textarea = inputRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  }, [text]);

  const submit = () => {
    if (!canSubmit) return;
    sessionStorage.setItem(`pending-${chatId}`, text.trim());
    router.push(`/chat/${chatId}?new=1`);
  };

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-white">
      {/* 背景光晕效果 */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full opacity-[0.15]"
          style={{
            background: 'radial-gradient(ellipse at center, #6366f1 0%, #8b5cf6 30%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
        <div
          className="absolute left-1/3 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] rounded-full opacity-[0.08]"
          style={{
            background: 'radial-gradient(ellipse at center, #3b82f6 0%, transparent 70%)',
            filter: 'blur(50px)',
          }}
        />
        <div
          className="absolute right-1/4 top-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full opacity-[0.08]"
          style={{
            background: 'radial-gradient(ellipse at center, #ec4899 0%, transparent 70%)',
            filter: 'blur(50px)',
          }}
        />
        {/* 细网格 */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='32' height='32' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='g' width='32' height='32' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 32 0 L 0 0 0 32' fill='none' stroke='%23000' stroke-width='0.5'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23g)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center px-6 py-12">
        <motion.div
          className="w-full max-w-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* 标题 */}
          <div className="mb-8 text-center">
            <motion.div
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/80 px-3 py-1.5 text-xs font-medium text-zinc-500 backdrop-blur-sm"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              <Sparkles className="size-3 text-violet-500" />
              由 Claude AI 驱动
            </motion.div>
            <motion.h1
              className="text-4xl font-bold tracking-tight text-zinc-900"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
            >
              你想创建什么？
            </motion.h1>
            <motion.p
              className="mt-2 text-base text-zinc-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.4 }}
            >
              描述你的想法，即刻生成可交互的网页
            </motion.p>
          </div>

          {/* 输入框 */}
          <motion.form
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.08)] ring-1 ring-zinc-950/[0.04] transition-shadow focus-within:shadow-[0_8px_30px_rgb(0,0,0,0.12)] focus-within:ring-zinc-950/[0.08]">
              <textarea
                ref={inputRef}
                rows={3}
                value={text}
                placeholder="例如：创建一个现代感的 SaaS 产品落地页，深色主题..."
                className="max-h-[200px] min-h-[80px] w-full resize-none bg-transparent px-4 pt-4 pb-12 text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    submit();
                  }
                }}
              />

              {/* 底部工具栏 */}
              <div className="absolute bottom-0 inset-x-0 flex items-center justify-between px-3 py-2.5 bg-white/95 backdrop-blur-sm border-t border-zinc-100">
                <span className="text-[11px] text-zinc-400">
                  <kbd className="font-sans">⌘</kbd>
                  <kbd className="font-sans">↩</kbd>
                  {' '}发送
                </span>
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="inline-flex size-8 items-center justify-center rounded-xl bg-zinc-900 text-white transition hover:bg-zinc-700 active:scale-95 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-400"
                >
                  <ArrowUp className="size-4" />
                </button>
              </div>
            </div>
          </motion.form>

          {/* 示例 Prompt */}
          <motion.div
            className="mt-4 flex flex-wrap justify-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.4 }}
          >
            {EXAMPLE_PROMPTS.map(({ label, prompt }) => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  setText(prompt);
                  requestAnimationFrame(() => inputRef.current?.focus());
                }}
                className="rounded-full border border-zinc-200 bg-white/80 px-3 py-1.5 text-xs text-zinc-600 backdrop-blur-sm transition hover:border-zinc-300 hover:bg-white hover:text-zinc-900"
              >
                {label}
              </button>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
