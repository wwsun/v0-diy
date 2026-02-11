import { readAllChats, readChat } from '@util/chat-store';
import { History, MessageSquare, Plus } from 'lucide-react';
import Link from 'next/link';
import Chat from './chat';

export default async function Page(props: {
  params: Promise<{ chatId: string }>;
}) {
  const { chatId } = await props.params; // get the chat ID from the URL
  const chatData = await readChat(chatId); // load the chat
  const chats = await readAllChats(); // load all chats

  // filter to 5 most recent chats
  const recentChats = chats
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5);

  return (
    <main className="grid h-screen w-screen grid-cols-1 bg-white lg:grid-cols-[260px_1fr]">
      <aside className="hidden border-r border-slate-200 bg-slate-50 lg:flex lg:flex-col">
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
              {recentChats.map(chat => {
                const isActive = chat.id === chatId;

                return (
                  <li key={chat.id}>
                    <Link
                      href={`/chat/${chat.id}`}
                      className={`block rounded-md border px-2.5 py-2 text-xs transition ${
                        isActive
                          ? 'border-slate-300 bg-white text-slate-900'
                          : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate font-medium">
                        <MessageSquare className="size-3.5 shrink-0 text-slate-400" />
                        <span className="truncate">{chat.id}</span>
                      </div>
                      <div className="mt-1 text-[11px] text-slate-400">
                        {new Date(chat.createdAt).toLocaleString()}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      <section className="min-h-0">
        <div className="flex h-full min-h-0 flex-col">
          <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2 lg:hidden">
            <h1 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
              <MessageSquare className="size-4 text-slate-500" />
              AI Chat
            </h1>
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 transition hover:text-slate-900"
            >
              <Plus className="size-3.5" />
              New
            </Link>
          </div>
          <Chat chatData={chatData} resume={chatData.activeStreamId !== null} />
        </div>
      </section>
    </main>
  );
}
