'use client';

import { ThinkingBlock } from '@/components/thinking-block';
import { FileChangeCard } from '@/components/tool-cards/file-change-card';
import { ToolCallCard } from '@/components/tool-cards/tool-call-card';
import type { MyUIMessage } from '@/util/chat-schema';
import type { DynamicToolUIPart, ReasoningUIPart } from 'ai';
import { ChatStatus } from 'ai';
import { motion } from 'framer-motion';
import { Bot, RefreshCcw, UserRound } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

function renderToolCard(part: DynamicToolUIPart) {
  const { toolName, toolCallId, state, input, output, errorText } = part;
  const inputRecord = (input ?? {}) as Record<string, unknown>;

  if (toolName === 'Write' || toolName === 'Edit' || toolName === 'MultiEdit') {
    return (
      <FileChangeCard
        key={toolCallId}
        toolName={toolName}
        input={inputRecord}
        output={output}
        state={state}
        errorText={errorText}
      />
    );
  }

  return (
    <ToolCallCard
      key={toolCallId}
      toolName={toolName}
      input={inputRecord}
      output={output}
      state={state}
      errorText={errorText}
    />
  );
}

export default function Message({
  message,
  status,
  regenerate,
}: {
  status: ChatStatus;
  message: MyUIMessage;
  regenerate: ({ messageId }: { messageId: string }) => void;
}) {
  const date = message.metadata?.createdAt
    ? new Date(message.metadata.createdAt).toLocaleString()
    : '';
  const isUser = message.role === 'user';

  // 用户消息只取文本
  const userText = isUser
    ? message.parts.map((p) => (p.type === 'text' ? p.text : '')).join('')
    : '';

  return (
    <motion.article
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
      initial={{ opacity: 0, x: isUser ? 12 : -12, y: 4 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      <div
        className={`max-w-[85%] text-sm ${
          isUser
            ? 'rounded-2xl rounded-tr-sm bg-zinc-900 px-4 py-3 text-white'
            : 'rounded-2xl rounded-tl-sm border border-zinc-100 bg-white px-4 py-3 text-zinc-800 shadow-soft-sm'
        }`}
      >
        <div className={`mb-1.5 flex items-center gap-1.5 text-xs ${isUser ? 'text-zinc-400' : 'text-zinc-400'}`}>
          <span className="inline-flex items-center gap-1">
            {isUser ? <UserRound className="size-3.5" /> : <Bot className="size-3.5" />}
            {isUser ? 'You' : 'Assistant'}
          </span>
          {date && (
            <>
              {' · '}
              <time suppressHydrationWarning>{date}</time>
            </>
          )}
        </div>

        {isUser ? (
          <div className="whitespace-pre-wrap break-words leading-6">{userText}</div>
        ) : (
          <div className="space-y-1">
            {message.parts.map((part, index) => {
              if (part.type === 'reasoning') {
                const r = part as ReasoningUIPart;
                return (
                  <ThinkingBlock
                    key={`reasoning-${index}`}
                    content={r.text}
                    isStreaming={r.state === 'streaming'}
                  />
                );
              }

              if (part.type === 'dynamic-tool') {
                return renderToolCard(part as DynamicToolUIPart);
              }

              if (part.type === 'text' && part.text) {
                return (
                  <div key={`text-${index}`} className="prose prose-sm max-w-none break-words leading-6">
                    <ReactMarkdown
                      components={{
                        code: ({ children, className }) => {
                          const isInline = !className;
                          return isInline ? (
                            <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs text-zinc-700">
                              {children}
                            </code>
                          ) : (
                            <code className={`${className} font-mono text-sm`}>{children}</code>
                          );
                        },
                        pre: ({ children }) => (
                          <pre className="overflow-x-auto rounded-xl bg-zinc-900 p-4 text-zinc-100">{children}</pre>
                        ),
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        ul: ({ children }) => <ul className="mb-2 list-disc pl-4">{children}</ul>,
                        ol: ({ children }) => <ol className="mb-2 list-decimal pl-4">{children}</ol>,
                        li: ({ children }) => <li className="mb-1">{children}</li>,
                        strong: ({ children }) => (
                          <strong className="font-semibold text-zinc-900">{children}</strong>
                        ),
                      }}
                    >
                      {part.text}
                    </ReactMarkdown>
                  </div>
                );
              }

              return null;
            })}
          </div>
        )}

        {isUser && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <button
              onClick={() => regenerate({ messageId: message.id })}
              className="inline-flex items-center gap-1 rounded-lg border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-medium text-white/80 transition hover:bg-white/20 disabled:opacity-40"
              disabled={status !== 'ready'}
            >
              <RefreshCcw className="size-3.5" />
              重新生成
            </button>
          </div>
        )}
      </div>
    </motion.article>
  );
}
