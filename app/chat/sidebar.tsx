import { readAllChats } from '@util/chat-store';
import { MessagesSquare, Plus, Sparkles } from 'lucide-react';
import Link from 'next/link';
import ChatListItem from './chat-list-item';

export default async function Sidebar({
  activeChatId,
}: {
  activeChatId?: string;
}) {
  const chats = await readAllChats();

  const recentChats = chats
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5);

  return (
    <aside className="flex flex-col border-r border-zinc-100 bg-zinc-50/50">
      {/* 品牌区 */}
      <div className="flex items-center gap-2 border-b border-zinc-100 px-4 py-3.5">
        <div className="flex size-7 items-center justify-center rounded-lg bg-zinc-900">
          <Sparkles className="size-3.5 text-white" />
        </div>
        <span className="text-sm font-semibold tracking-tight text-zinc-900">V0.DIY</span>
      </div>

      {/* 操作栏 */}
      <div className="flex items-center justify-between px-4 py-2.5">
        <span className="text-xs font-medium tracking-wide text-zinc-400 uppercase">recent chats</span>
        <Link
          href="/"
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
        >
          <Plus className="size-3.5" />
          New
        </Link>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        {recentChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-200 px-4 py-8 text-center">
            <MessagesSquare className="size-5 text-zinc-300" />
            <p className="text-xs text-zinc-400">暂无对话记录</p>
          </div>
        ) : (
          <ul className="space-y-1">
            {recentChats.map(chat => (
              <ChatListItem
                key={chat.id}
                chatId={chat.id}
                createdAt={chat.createdAt}
                isActive={chat.id === activeChatId}
              />
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
