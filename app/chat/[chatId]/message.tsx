import type { MyUIMessage } from '@/util/chat-schema';
import { ChatStatus } from 'ai';
import { Bot, RefreshCcw, Sparkles, UserRound } from 'lucide-react';

export default function Message({
  message,
  status,
  regenerate,
  sendMessage,
}: {
  status: ChatStatus;
  message: MyUIMessage;
  regenerate: ({ messageId }: { messageId: string }) => void;
  sendMessage: ({
    text,
    messageId,
  }: {
    text: string;
    messageId?: string;
  }) => void;
}) {
  const date = message.metadata?.createdAt
    ? new Date(message.metadata.createdAt).toLocaleString()
    : '';
  const isUser = message.role === 'user';

  return (
    <article className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-md border px-3 py-2.5 text-sm ${
          isUser
            ? 'border-sky-200 bg-sky-50 text-slate-800'
            : 'border-slate-200 bg-slate-50 text-slate-800'
        }`}
      >
        <div
          className="mb-1.5 text-xs text-slate-500"
        >
          <span className="inline-flex items-center gap-1">
            {isUser ? (
              <UserRound className="size-3.5" />
            ) : (
              <Bot className="size-3.5" />
            )}
            {isUser ? 'You' : 'Assistant'}
          </span>
          {date ? ` · ${date}` : ''}
        </div>
        <div className="whitespace-pre-wrap break-words leading-6">
          {message.parts
            .map(part => (part.type === 'text' ? part.text : ''))
            .join('')}
        </div>

        {message.role === 'user' && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            <button
              onClick={() => regenerate({ messageId: message.id })}
              className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
              disabled={status !== 'ready'}
            >
              <RefreshCcw className="size-3.5" />
              Regenerate
            </button>
            <button
              onClick={() =>
                sendMessage({ text: 'Hello', messageId: message.id })
              }
              className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
              disabled={status !== 'ready'}
            >
              <Sparkles className="size-3.5" />
              Replace with Hello
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
