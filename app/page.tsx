import { generateId } from 'ai';
import { MessageSquare, SquarePen } from 'lucide-react';
import Link from 'next/link';
import Chat from './chat/[chatId]/chat';

export default async function ChatPage() {
  const chatId = generateId();

  return (
    <main className="flex h-screen w-screen flex-col bg-white">
      <header className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
        <div>
          <h1 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
            <MessageSquare className="size-4 text-slate-500" />
            AI Chat
          </h1>
          <p className="text-xs text-slate-500">Start a new conversation.</p>
        </div>
        <Link
          href={`/chat/${chatId}`}
          className="inline-flex items-center rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-slate-700"
        >
          <SquarePen className="mr-1 size-3.5" />
          Open route
        </Link>
      </header>

      <div className="min-h-0 flex-1">
        <Chat chatData={{ id: chatId, messages: [] }} isNewChat />
      </div>
    </main>
  );
}
