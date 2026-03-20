import NewChatLauncher from './chat/new-chat-launcher';
import Sidebar from './chat/sidebar';

export default async function ChatPage() {
  return (
    <main className="grid h-screen w-screen grid-cols-[240px_1fr] bg-white">
      <Sidebar />

      <section className="min-h-0">
        <NewChatLauncher />
      </section>
    </main>
  );
}
