'use client';

import type { AgentSdk, ChatMode } from '@/util/chat-schema';
import { generateId } from 'ai';
import { MessageSquare, SendHorizonal } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import ModeToggle from './mode-toggle';
import SdkToggle from './sdk-toggle';

export default function NewChatLauncher() {
  const router = useRouter();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState('');
  const [mode, setMode] = useState<ChatMode>('chat');
  const [agentSdk, setAgentSdk] = useState<AgentSdk>('vercel-ai');
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

  const submit = async () => {
    if (!canSubmit) {
      return;
    }

    const userText = text;
    setIsSubmitting(true);

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        trigger: 'submit-message',
        id: chatId,
        mode,
        agentSdk,
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
      setIsSubmitting(false);
      window.alert('Failed to start a new chat. Please try again.');
      return;
    }

    router.push(`/chat/${chatId}`);
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="flex min-h-0 flex-1 items-center justify-center px-6">
        <div className="w-full max-w-2xl space-y-6">
          <div className="space-y-2 text-center">
            <div className="mx-auto inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <MessageSquare className="size-5" />
            </div>
            <h1 className="text-2xl font-semibold text-slate-900">
              What can I help with?
            </h1>
            <p className="text-sm text-slate-500">
              Start a new chat and continue in the conversation view.
            </p>
          </div>

          <form
            className="space-y-2"
            onSubmit={event => {
              event.preventDefault();
              void submit();
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Response mode</span>
              <ModeToggle
                value={mode}
                onChange={setMode}
                disabled={isSubmitting}
              />
            </div>

            {mode === 'agent' && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Agent SDK</span>
                <SdkToggle
                  value={agentSdk}
                  onChange={setAgentSdk}
                  disabled={isSubmitting}
                />
              </div>
            )}

            <textarea
              ref={inputRef}
              rows={2}
              value={text}
              disabled={isSubmitting}
              placeholder="Message AI Chat..."
              className="max-h-[140px] min-h-[56px] w-full resize-none rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100"
              onChange={event => setText(event.target.value)}
              onKeyDown={event => {
                if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                  event.preventDefault();
                  void submit();
                }
              }}
            />

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!canSubmit}
                className="inline-flex h-10 items-center rounded-md bg-slate-900 px-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <SendHorizonal className="mr-1 size-3.5" />
                {isSubmitting ? 'Starting...' : 'Send'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
