import { readAllChats } from '@util/chat-store';
import { Plus, Sparkles } from 'lucide-react';
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
    .slice(0, 20);

  return (
    <aside className="flex h-full flex-col bg-[#0a0a0a] text-zinc-100">
      {/* 品牌区 */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-white/[0.06]">
        <div className="flex size-7 items-center justify-center rounded-lg bg-white">
          <Sparkles className="size-3.5 text-black" />
        </div>
        <span className="text-sm font-semibold tracking-tight text-white">v0.diy</span>
      </div>

      {/* New Chat 按钮 */}
      <div className="px-3 pt-3 pb-1">
        <Link
          href="/"
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-white"
        >
          <Plus className="size-4" />
          新建对话
        </Link>
      </div>

      {/* 历史列表 */}
      {recentChats.length > 0 && (
        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
          <p className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
            最近对话
          </p>
          <ul className="space-y-0.5">
            {recentChats.map(chat => (
              <ChatListItem
                key={chat.id}
                chatId={chat.id}
                createdAt={chat.createdAt}
                isActive={chat.id === activeChatId}
              />
            ))}
          </ul>
        </div>
      )}

      {recentChats.length === 0 && (
        <div className="flex-1 flex items-start px-3 pt-2">
          <p className="px-3 py-2 text-xs text-zinc-600">暂无对话记录</p>
        </div>
      )}
    </aside>
  );
}
