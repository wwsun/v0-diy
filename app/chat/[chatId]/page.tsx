import { readChat, readChatIfExists } from '@util/chat-store';
import { redirect } from 'next/navigation';
import Chat from './chat';
import Sidebar from '../sidebar';

export default async function Page(props: {
  params: Promise<{ chatId: string }>;
  searchParams?: Promise<{ new?: string }>;
}) {
  const { chatId } = await props.params; // get the chat ID from the URL
  const searchParams = props.searchParams ? await props.searchParams : undefined;

  const isNewRoute = searchParams?.new === '1';
  const chatData = isNewRoute
    ? await readChat(chatId)
    : await readChatIfExists(chatId); // load the chat

  if (!chatData) {
    redirect('/');
  }

  return (
    <main className="grid h-screen w-screen grid-cols-[220px_1fr] bg-white">
      <Sidebar activeChatId={chatId} />

      <section className="min-h-0">
        <Chat chatData={chatData} resume={chatData.activeStreamId !== null} />
      </section>
    </main>
  );
}
