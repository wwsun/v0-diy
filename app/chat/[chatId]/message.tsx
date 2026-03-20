'use client';

import type { MyUIMessage } from '@/util/chat-schema';
import { ChatStatus } from 'ai';
import { motion } from 'framer-motion';
import { Bot, RefreshCcw, Sparkles, UserRound } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

type MessageSegment = {
  type: 'status' | 'body';
  text: string;
};

function isStatusLine(line: string): boolean {
  return /^\[(codex|reasoning|command(?::|\])|file_change(?::|\])|tool(?::|\])|web_search|todo|error)/i.test(
    line.trim(),
  );
}

function splitMessageSegments(text: string): MessageSegment[] {
  const segments: MessageSegment[] = [];
  const lines = text.split('\n');
  const bodyBuffer: string[] = [];

  const flushBody = () => {
    if (bodyBuffer.length === 0) {
      return;
    }

    segments.push({
      type: 'body',
      text: bodyBuffer.join('\n'),
    });
    bodyBuffer.length = 0;
  };

  for (const line of lines) {
    if (isStatusLine(line)) {
      flushBody();
      segments.push({
        type: 'status',
        text: line.trim(),
      });
      continue;
    }

    bodyBuffer.push(line);
  }

  flushBody();

  return segments;
}

export default function Message({
  message,
  status,
  regenerate,
  sendMessage,
}: {
  status: ChatStatus;
  message: MyUIMessage;
  regenerate: ({ messageId }: { messageId: string }) => void;
  sendMessage: ({
    text,
    messageId,
  }: {
    text: string;
    messageId?: string;
  }) => void;
}) {
  const date = message.metadata?.createdAt
    ? new Date(message.metadata.createdAt).toLocaleString()
    : '';
  const isUser = message.role === 'user';
  const messageText = message.parts
    .map(part => (part.type === 'text' ? part.text : ''))
    .join('');
  const isArtifactNotice =
    !isUser &&
    (messageText.includes('已创建新版本：') ||
      messageText.includes('已识别为页面生成任务'));
  const segments = isUser ? [] : splitMessageSegments(messageText);

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
            {isUser ? (
              <UserRound className="size-3.5" />
            ) : (
              <Bot className="size-3.5" />
            )}
            {isUser ? 'You' : 'Assistant'}
          </span>
          {date ? (
            <>
              {' · '}
              <time suppressHydrationWarning>{date}</time>
            </>
          ) : (
            ''
          )}
        </div>
        {isUser ? (
          <div className="whitespace-pre-wrap break-words leading-6">
            {messageText}
          </div>
        ) : (
          <div className={`space-y-2 ${isArtifactNotice ? 'text-violet-900' : ''}`}>
            {segments.map((segment, index) =>
              segment.type === 'status' ? (
                <div
                  key={`segment-${index}`}
                  className={`rounded-lg border px-2.5 py-1.5 text-xs ${
                    isArtifactNotice
                      ? 'border-violet-200 bg-violet-50 text-violet-700'
                      : 'border-zinc-100 bg-zinc-50 text-zinc-500'
                  }`}
                >
                  {segment.text}
                </div>
              ) : (
                <div key={`segment-${index}`} className="prose prose-sm max-w-none break-words leading-6">
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
                      strong: ({ children }) => <strong className="font-semibold text-zinc-900">{children}</strong>,
                    }}
                  >
                    {segment.text}
                  </ReactMarkdown>
                </div>
              ),
            )}
          </div>
        )}

        {message.role === 'user' && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <button
              onClick={() => regenerate({ messageId: message.id })}
              className="inline-flex items-center gap-1 rounded-lg border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-medium text-white/80 transition hover:bg-white/20 disabled:opacity-40"
              disabled={status !== 'ready'}
            >
              <RefreshCcw className="size-3.5" />
              重新生成
            </button>
            <button
              onClick={() =>
                sendMessage({ text: 'Hello', messageId: message.id })
              }
              className="inline-flex items-center gap-1 rounded-lg border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-medium text-white/80 transition hover:bg-white/20 disabled:opacity-40"
              disabled={status !== 'ready'}
            >
              <Sparkles className="size-3.5" />
              替换为 Hello
            </button>
          </div>
        )}
      </div>
    </motion.article>
  );
}
