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
      className="space-y-2"
      onSubmit={e => {
        e.preventDefault();
        submitText();
      }}
    >
      {(status === 'streaming' || status === 'submitted') && (
        <button
          type="button"
          className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 shadow-soft-sm transition hover:bg-zinc-50"
          onClick={stop}
        >
          <Square className="mr-1.5 size-3 fill-zinc-600" />
          停止生成
        </button>
      )}

      <div className="flex items-end gap-2 rounded-2xl border border-zinc-200 bg-white/90 p-2 shadow-soft-md backdrop-blur-sm focus-within:shadow-input-focus transition-shadow">
        <textarea
          ref={inputRef}
          rows={2}
          className="max-h-[140px] min-h-[52px] w-full resize-none bg-transparent px-2 py-1 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 disabled:cursor-not-allowed disabled:opacity-60"
          placeholder="描述你想要的网页..."
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
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 active:scale-95 disabled:cursor-not-allowed disabled:bg-zinc-300"
          disabled={!canSubmit}
        >
          <SendHorizonal className="size-3.5" />
          发送
        </button>
      </div>
    </form>
  );
}
