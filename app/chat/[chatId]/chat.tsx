'use client';

import { invalidateRouterCache } from '@/app/actions';
import type { MyUIMessage } from '@/util/chat-schema';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Bot, Sparkles } from 'lucide-react';
import { useEffect, useRef } from 'react';
import ChatInput from './chat-input';
import Message from './message';
import PreviewPanel from './preview-panel';

export default function ChatComponent({
  chatData,
  isNewChat = false,
  resume = false,
}: {
  chatData: {
    id: string;
    messages: MyUIMessage[];
    workspacePages: { activeSnapshotId: string | null };
  };
  isNewChat?: boolean;
  resume?: boolean;
}) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { status, sendMessage, messages, regenerate } = useChat({
    id: chatData.id,
    messages: chatData.messages,
    resume,
    transport: new DefaultChatTransport({
      api: `/api/agent/${chatData.id}/stream`,
      prepareSendMessagesRequest: ({ id, messages, trigger, messageId }) => {
        if (trigger === 'regenerate-message') {
          return { body: { trigger, id, messageId } };
        }
        return {
          body: {
            trigger,
            id,
            message: messages[messages.length - 1],
            messageId,
          },
        };
      },
    }),
    onFinish(options) {
      console.log('onFinish', options);

      if (isNewChat) {
        invalidateRouterCache();
      }

      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    },
  });

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // 新对话：从 sessionStorage 读取待发送的消息文本并自动提交
  useEffect(() => {
    if (!isNewChat) return;
    const pending = sessionStorage.getItem(`pending-${chatData.id}`);
    if (!pending) return;
    sessionStorage.removeItem(`pending-${chatData.id}`);
    sendMessage({ text: pending, metadata: { createdAt: Date.now() } });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, status]);

  const isGenerating = status === 'streaming' || status === 'submitted';

  return (
    <div className="flex h-full min-h-0 bg-white">
      <div className="flex min-h-0 flex-1 flex-col">
        {/* Header */}
        <div className="glass flex items-center justify-between border-b border-zinc-100 px-4 py-3 sticky top-0 z-10">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
            <Bot className="size-4 text-zinc-500" />
            对话
          </h2>
          {isGenerating && (
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              <span className="flex items-center gap-0.5">
                <span className="inline-block size-1.5 rounded-full bg-emerald-500 animate-bounce-dot" style={{ animationDelay: '0ms' }} />
                <span className="inline-block size-1.5 rounded-full bg-emerald-500 animate-bounce-dot" style={{ animationDelay: '160ms' }} />
                <span className="inline-block size-1.5 rounded-full bg-emerald-500 animate-bounce-dot" style={{ animationDelay: '320ms' }} />
              </span>
              生成中
            </span>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-200 px-6 py-12 text-center">
              <div className="flex size-10 items-center justify-center rounded-xl bg-zinc-100">
                <Sparkles className="size-5 text-zinc-400" />
              </div>
              <p className="text-sm text-zinc-500">在下方输入，开始创建你的网页</p>
            </div>
          ) : (
            messages.map(message => (
              <Message
                key={message.id}
                message={message}
                regenerate={regenerate}
                status={status}
              />
            ))
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="sticky bottom-0 border-t border-zinc-100 bg-white/90 px-3 py-3 backdrop-blur-sm">
          <ChatInput
            status={status}
            stop={() => {
              fetch(`/api/agent/${chatData.id}/stream`, { method: 'DELETE' });
            }}
            onSubmit={text => {
              sendMessage({ text, metadata: { createdAt: Date.now() } });

              if (isNewChat) {
                window.history.pushState(null, '', `/chat/${chatData.id}`);
              }
            }}
            inputRef={inputRef}
          />
        </div>
      </div>

      <PreviewPanel
        chatId={chatData.id}
        snapshotId={chatData.workspacePages.activeSnapshotId}
        status={status}
      />
    </div>
  );
}
