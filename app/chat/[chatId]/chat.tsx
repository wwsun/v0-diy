'use client';

import { invalidateRouterCache } from '@/app/actions';
import type { MyUIMessage } from '@/util/chat-schema';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Sparkles } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
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

  const CHAT_MIN = 260;
  const CHAT_MAX = 680;
  const CHAT_DEFAULT = 440;
  const [chatWidth, setChatWidth] = useState(CHAT_DEFAULT);
  const [isDragging, setIsDragging] = useState(false);
  const chatWidthRef = useRef(CHAT_DEFAULT);

  const onDragHandleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = chatWidthRef.current;
    setIsDragging(true);

    const onMouseMove = (ev: MouseEvent) => {
      const newWidth = Math.min(CHAT_MAX, Math.max(CHAT_MIN, startWidth + ev.clientX - startX));
      chatWidthRef.current = newWidth;
      setChatWidth(newWidth);
    };

    const onMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, []);

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

  return (
    <div className={`flex h-full min-h-0 bg-white${isDragging ? ' cursor-col-resize select-none' : ''}`}>
      {/* 左侧：对话区 */}
      <div className="flex h-full shrink-0 flex-col border-r border-zinc-200 bg-white" style={{ width: chatWidth }}>
        {/* 消息列表 */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 space-y-3">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-zinc-100">
                <Sparkles className="size-4 text-zinc-400" />
              </div>
              <p className="text-sm text-zinc-400">在下方输入，开始创建你的网页</p>
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

        {/* 输入区 */}
        <div className="shrink-0 border-t border-zinc-100 bg-white px-3 py-3">
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

      {/* 拖拽调宽 handle */}
      <div
        className="group relative w-1 shrink-0 cursor-col-resize"
        onMouseDown={onDragHandleMouseDown}
      >
        <div className="absolute inset-y-0 left-0 w-px bg-zinc-200 transition-colors group-hover:bg-zinc-400" />
      </div>

      {/* 右侧：预览区，拖拽时盖透明遮罩阻止 iframe 捕获鼠标事件 */}
      <div className="relative h-full min-w-0 flex-1 overflow-hidden">
        {isDragging && <div className="absolute inset-0 z-10" />}
        <PreviewPanel
          chatId={chatData.id}
          snapshotId={chatData.workspacePages.activeSnapshotId}
          status={status}
        />
      </div>
    </div>
  );
}
