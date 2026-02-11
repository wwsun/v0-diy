import { readAllChats } from '@util/chat-store';
import { History, Plus } from 'lucide-react';
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
    <aside className="flex flex-col border-r border-slate-200 bg-slate-50">
      <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
        <h2 className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
          <History className="size-3.5" />
          Recent Chats
        </h2>
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 transition hover:text-slate-900"
        >
          <Plus className="size-3.5" />
          New
        </Link>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {recentChats.length === 0 ? (
          <p className="rounded-md border border-dashed border-slate-200 p-2 text-xs text-slate-500">
            No chat history.
          </p>
        ) : (
          <ul className="space-y-1.5">
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

