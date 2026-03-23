import { useEffect, useState } from 'react';
import { ArrowUp, Square } from 'lucide-react';

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
  const isGenerating = status === 'streaming' || status === 'submitted';

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
      onSubmit={e => {
        e.preventDefault();
        submitText();
      }}
    >
      <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_2px_8px_rgb(0,0,0,0.06)] transition-shadow focus-within:shadow-[0_4px_12px_rgb(0,0,0,0.1)] focus-within:border-zinc-300">
        <textarea
          ref={inputRef}
          rows={2}
          className="max-h-[140px] min-h-[52px] w-full resize-none bg-transparent px-4 pt-3 pb-10 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 disabled:cursor-not-allowed disabled:opacity-60"
          placeholder="描述你想修改的内容..."
          disabled={isGenerating}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              submitText();
            }
          }}
        />

        {/* 底部工具栏 */}
        <div className="absolute bottom-0 inset-x-0 flex items-center justify-between px-3 py-2 border-t border-zinc-100 bg-white/95 backdrop-blur-sm">
          <span className="text-[11px] text-zinc-400">
            {isGenerating ? (
              <span className="flex items-center gap-1.5 text-zinc-400">
                <span className="flex gap-0.5">
                  {[0, 1, 2].map(i => (
                    <span
                      key={i}
                      className="inline-block size-1 rounded-full bg-zinc-400 animate-bounce-dot"
                      style={{ animationDelay: `${i * 160}ms` }}
                    />
                  ))}
                </span>
                AI 正在生成
              </span>
            ) : (
              <><kbd className="font-sans">⌘</kbd><kbd className="font-sans">↩</kbd> 发送</>
            )}
          </span>

          <div className="flex items-center gap-1.5">
            {isGenerating && (
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-zinc-600 transition hover:bg-zinc-50 hover:border-zinc-300"
                onClick={stop}
              >
                <Square className="size-2.5 fill-zinc-600" />
                停止
              </button>
            )}
            <button
              type="submit"
              className="inline-flex size-7 items-center justify-center rounded-lg bg-zinc-900 text-white transition hover:bg-zinc-700 active:scale-95 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-400"
              disabled={!canSubmit}
            >
              <ArrowUp className="size-3.5" />
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
