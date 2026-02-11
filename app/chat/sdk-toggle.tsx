import type { AgentSdk } from '@/util/chat-schema';

export default function SdkToggle({
  value,
  onChange,
  disabled = false,
}: {
  value: AgentSdk;
  onChange: (sdk: AgentSdk) => void;
  disabled?: boolean;
}) {
  return (
    <div className="inline-flex items-center rounded-md border border-slate-300 bg-white p-0.5">
      <button
        type="button"
        onClick={() => onChange('codex')}
        disabled={disabled || value === 'codex'}
        className={`rounded px-2 py-1 text-xs font-medium transition ${
          value === 'codex'
            ? 'bg-slate-900 text-white'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        } disabled:cursor-not-allowed disabled:opacity-60`}
      >
        Codex
      </button>

      <button
        type="button"
        onClick={() => onChange('vercel-ai')}
        disabled={disabled || value === 'vercel-ai'}
        className={`rounded px-2 py-1 text-xs font-medium transition ${
          value === 'vercel-ai'
            ? 'bg-slate-900 text-white'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        } disabled:cursor-not-allowed disabled:opacity-60`}
      >
        Vercel AI
      </button>
    </div>
  );
}
