import { useEffect, useState } from 'react';
import { SendHorizonal, Square } from 'lucide-react';

export default function ChatInput({
  status,
  onSubmit,
  inputRef,
  stop,
}: {
  status: string;
  onSubmit: (text: string) => void;
  inputRef: React.RefObject<HTMLTextAreaElement>;
  stop: () => void;
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
