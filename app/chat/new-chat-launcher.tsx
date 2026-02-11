'use client';

import {
  builderBriefSchema,
  type AppType,
  type BuilderBrief,
} from '@/util/builder-schema';
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
  const [agentSdk, setAgentSdk] = useState<AgentSdk>('codex');
  const [appType, setAppType] = useState<AppType>('marketing-campaign');
  const [brief, setBrief] = useState<BuilderBrief>(() =>
    builderBriefSchema.parse({}),
  );
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
          builderContext: {
            appType,
            brief,
          },
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

      const configResponse = await fetch(`/api/chat/${chatId}/agent-config`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode,
          agentSdk,
          builderContext: {
            appType,
            brief,
          },
        }),
      });

      if (!configResponse.ok) {
        throw new Error('Failed to persist chat mode');
      }

      router.push(`/chat/${chatId}?new=1`);
    } catch (error) {
      console.error(error);
      window.alert('Failed to start a new chat. Please try again.');
      setIsSubmitting(false);
    }
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
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Agent SDK</span>
                  <SdkToggle
                    value={agentSdk}
                    onChange={setAgentSdk}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <label className="space-y-1 text-xs text-slate-500">
                    <span>App Type</span>
                    <select
                      value={appType}
                      onChange={event =>
                        setAppType(event.target.value as AppType)
                      }
                      disabled={isSubmitting}
                      className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-800"
                    >
                      <option value="marketing-campaign">Marketing Campaign</option>
                      <option value="report-app">Report App</option>
                    </select>
                  </label>

                  <label className="space-y-1 text-xs text-slate-500">
                    <span>Style</span>
                    <input
                      value={brief.style}
                      disabled={isSubmitting}
                      onChange={event =>
                        setBrief(previous => ({
                          ...previous,
                          style: event.target.value,
                        }))
                      }
                      className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-800"
                    />
                  </label>

                  <label className="space-y-1 text-xs text-slate-500">
                    <span>Industry</span>
                    <input
                      value={brief.industry}
                      disabled={isSubmitting}
                      onChange={event =>
                        setBrief(previous => ({
                          ...previous,
                          industry: event.target.value,
                        }))
                      }
                      className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-800"
                    />
                  </label>

                  <label className="space-y-1 text-xs text-slate-500">
                    <span>Objective</span>
                    <input
                      value={brief.objective}
                      disabled={isSubmitting}
                      onChange={event =>
                        setBrief(previous => ({
                          ...previous,
                          objective: event.target.value,
                        }))
                      }
                      className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-800"
                    />
                  </label>

                  <label className="col-span-2 space-y-1 text-xs text-slate-500">
                    <span>Primary Color</span>
                    <input
                      value={brief.primaryColor}
                      disabled={isSubmitting}
                      onChange={event =>
                        setBrief(previous => ({
                          ...previous,
                          primaryColor: event.target.value,
                        }))
                      }
                      className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-800"
                    />
                  </label>
                </div>
              </>
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
