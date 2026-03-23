'use client';

import { ThinkingBlock } from '@/components/thinking-block';
import { FileChangeCard } from '@/components/tool-cards/file-change-card';
import { ToolCallCard } from '@/components/tool-cards/tool-call-card';
import type { MyUIMessage } from '@/util/chat-schema';
import type { DynamicToolUIPart, ReasoningUIPart } from 'ai';
import { ChatStatus } from 'ai';
import { motion } from 'framer-motion';
import { RefreshCcw } from 'lucide-react';
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
  const isUser = message.role === 'user';

  const userText = isUser
    ? message.parts.map((p) => (p.type === 'text' ? p.text : '')).join('')
    : '';

  return (
    <motion.article
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {isUser ? (
        /* 用户消息：气泡样式 */
        <div className="max-w-[88%] space-y-1.5">
          <div className="rounded-2xl rounded-tr-sm bg-zinc-900 px-3.5 py-2.5 text-sm text-white">
            <div className="whitespace-pre-wrap break-words leading-6">{userText}</div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => regenerate({ messageId: message.id })}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600 disabled:opacity-40"
              disabled={status !== 'ready'}
            >
              <RefreshCcw className="size-3" />
              重新生成
            </button>
          </div>
        </div>
      ) : (
        /* AI 消息：无气泡，直接渲染内容 */
        <div className="max-w-full min-w-0 space-y-1.5 text-sm">
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
                <div key={`text-${index}`} className="prose prose-sm max-w-none break-words leading-6 text-zinc-700">
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
    </motion.article>
  );
}
