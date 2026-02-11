'use client';

import { invalidateRouterCache } from '@/app/actions';
import type { ChatMode, MyUIMessage } from '@/util/chat-schema';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Bot, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import ChatInput from './chat-input';
import Message from './message';

export default function ChatComponent({
  chatData,
  isNewChat = false,
  resume = false,
}: {
  chatData: { id: string; messages: MyUIMessage[]; mode: ChatMode };
  isNewChat?: boolean;
  resume?: boolean;
}) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<ChatMode>(chatData.mode);
  const [isUpdatingMode, setIsUpdatingMode] = useState(false);

  const { status, sendMessage, messages, regenerate } = useChat({
    id: chatData.id,
    messages: chatData.messages,
    resume,
    transport: new DefaultChatTransport({
      prepareSendMessagesRequest: ({ id, messages, trigger, messageId }) => {
        switch (trigger) {
          case 'regenerate-message':
            // omit messages data transfer, only send the messageId:
            return {
              body: {
                trigger: 'regenerate-message',
                id,
                messageId,
                mode,
              },
            };

          case 'submit-message':
            // only send the last message to the server to limit the request size:
            return {
              body: {
                trigger: 'submit-message',
                id,
                message: messages[messages.length - 1],
                messageId,
                mode,
              },
            };
        }
      },
    }),
    onFinish(options) {
      console.log('onFinish', options);

      // for new chats, the router cache needs to be invalidated so
      // navigation to the previous page triggers SSR correctly
      if (isNewChat) {
        invalidateRouterCache();
      }

      // focus the input field again after the response is finished
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    },
  });

  // activate the input field
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, status]);

  useEffect(() => {
    setMode(chatData.mode);
  }, [chatData.mode, chatData.id]);

  const persistMode = async (nextMode: ChatMode) => {
    if (nextMode === mode || status !== 'ready' || isUpdatingMode) {
      return;
    }

    const previousMode = mode;
    setMode(nextMode);
    setIsUpdatingMode(true);

    try {
      const response = await fetch(`/api/chat/${chatData.id}/mode`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mode: nextMode }),
      });

      if (!response.ok) {
        throw new Error('Failed to update mode');
      }
    } catch (error) {
      console.error(error);
      setMode(previousMode);
      window.alert('Failed to switch mode. Please try again.');
    } finally {
      setIsUpdatingMode(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
        <div>
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
            <Bot className="size-4 text-slate-500" />
            Conversation
          </h2>
          <p className="text-[11px] text-slate-500">Chat ID: {chatData.id}</p>
        </div>
        {(status === 'streaming' || status === 'submitted') && (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
            <Loader2 className="size-3.5 animate-spin" />
            Generating...
          </span>
        )}
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-2 py-2">
        {messages.length === 0 ? (
          <div className="rounded-md border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
            Start by typing a message below.
          </div>
        ) : (
          messages.map(message => (
            <Message
              key={message.id}
              message={message}
              regenerate={regenerate}
              sendMessage={sendMessage}
              status={status}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="sticky bottom-0 border-t border-slate-200 bg-white px-2 py-2">
        <ChatInput
          status={status}
          stop={() => {
            fetch(`/api/chat/${chatData.id}/stream`, {
              method: 'DELETE',
            });
          }}
          onSubmit={text => {
            sendMessage({ text, metadata: { createdAt: Date.now() } });

            if (isNewChat) {
              window.history.pushState(null, '', `/chat/${chatData.id}`);
            }
          }}
          inputRef={inputRef}
          mode={mode}
          onModeChange={persistMode}
          modeDisabled={isUpdatingMode}
        />
      </div>
    </div>
  );
}
