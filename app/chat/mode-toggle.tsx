import type { ChatMode } from '@/util/chat-schema';

export default function ModeToggle({
  value,
  onChange,
  disabled = false,
}: {
  value: ChatMode;
  onChange: (mode: ChatMode) => void;
  disabled?: boolean;
}) {
  return (
    <div className="inline-flex items-center rounded-md border border-slate-300 bg-white p-0.5">
      <button
        type="button"
        onClick={() => onChange('chat')}
        disabled={disabled || value === 'chat'}
        className={`rounded px-2 py-1 text-xs font-medium transition ${
          value === 'chat'
            ? 'bg-slate-900 text-white'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        } disabled:cursor-not-allowed disabled:opacity-60`}
      >
        Chat
      </button>

      <button
        type="button"
        onClick={() => onChange('agent')}
        disabled={disabled || value === 'agent'}
        className={`rounded px-2 py-1 text-xs font-medium transition ${
          value === 'agent'
            ? 'bg-slate-900 text-white'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        } disabled:cursor-not-allowed disabled:opacity-60`}
      >
        Agent
      </button>
    </div>
  );
}

