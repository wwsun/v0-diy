import type { AgentSdk, ChatMode } from '@/util/chat-schema';
import type { AppType, BuilderBrief } from '@/util/builder-schema';
import { useEffect, useState } from 'react';
import { SendHorizonal, Square } from 'lucide-react';
import ModeToggle from '../mode-toggle';
import SdkToggle from '../sdk-toggle';

export default function ChatInput({
  status,
  onSubmit,
  inputRef,
  stop,
  mode,
  onModeChange,
  agentSdk,
  onAgentSdkChange,
  appType,
  onAppTypeChange,
  brief,
  onBriefChange,
  modeDisabled = false,
}: {
  status: string;
  onSubmit: (text: string) => void;
  inputRef: React.RefObject<HTMLTextAreaElement>;
  stop: () => void;
  mode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  agentSdk: AgentSdk;
  onAgentSdkChange: (sdk: AgentSdk) => void;
  appType: AppType;
  onAppTypeChange: (appType: AppType) => void;
  brief: BuilderBrief;
  onBriefChange: (patch: Partial<BuilderBrief>) => void;
  modeDisabled?: boolean;
}) {
  const [text, setText] = useState('');
  const canSubmit = status === 'ready' && text.trim().length > 0;

  useEffect(() => {
    const textarea = inputRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 140)}px`;
  }, [text, inputRef]);

  const submitText = () => {
    if (text.trim() === '') return;
    onSubmit(text);
    setText('');
  };

  return (
    <form
      className="space-y-1.5"
      onSubmit={e => {
        e.preventDefault();
        submitText();
      }}
    >
      {(status === 'streaming' || status === 'submitted') && (
        <button
          type="button"
          className="inline-flex items-center rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 transition hover:bg-rose-100"
          onClick={stop}
        >
          <Square className="mr-1 size-3.5" />
          Stop generating
        </button>
      )}

      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">Response mode</span>
        <ModeToggle
          value={mode}
          onChange={onModeChange}
          disabled={status !== 'ready' || modeDisabled}
        />
      </div>

      {mode === 'agent' && (
        <>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Agent SDK</span>
            <SdkToggle
              value={agentSdk}
              onChange={onAgentSdkChange}
              disabled={status !== 'ready' || modeDisabled}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label className="space-y-1 text-xs text-slate-500">
              <span>App Type</span>
              <select
                value={appType}
                onChange={event =>
                  onAppTypeChange(event.target.value as AppType)
                }
                disabled={status !== 'ready' || modeDisabled}
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
                disabled={status !== 'ready' || modeDisabled}
                onChange={event => onBriefChange({ style: event.target.value })}
                className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-800"
              />
            </label>

            <label className="space-y-1 text-xs text-slate-500">
              <span>Industry</span>
              <input
                value={brief.industry}
                disabled={status !== 'ready' || modeDisabled}
                onChange={event =>
                  onBriefChange({ industry: event.target.value })
                }
                className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-800"
              />
            </label>

            <label className="space-y-1 text-xs text-slate-500">
              <span>Objective</span>
              <input
                value={brief.objective}
                disabled={status !== 'ready' || modeDisabled}
                onChange={event =>
                  onBriefChange({ objective: event.target.value })
                }
                className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-800"
              />
            </label>

            <label className="col-span-2 space-y-1 text-xs text-slate-500">
              <span>Primary Color</span>
              <input
                value={brief.primaryColor}
                disabled={status !== 'ready' || modeDisabled}
                onChange={event =>
                  onBriefChange({ primaryColor: event.target.value })
                }
                className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-800"
              />
            </label>
          </div>
        </>
      )}

      <div className="flex items-center gap-2">
        <textarea
          ref={inputRef}
          rows={2}
          className="max-h-[140px] min-h-[56px] w-full resize-none rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100"
          placeholder="Say something..."
          disabled={status !== 'ready'}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              submitText();
            }
          }}
        />

        <button
          type="submit"
          className="inline-flex h-10 items-center rounded-md bg-slate-900 px-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          disabled={!canSubmit}
        >
          <SendHorizonal className="mr-1 size-3.5" />
          Send
        </button>
      </div>
    </form>
  );
}
