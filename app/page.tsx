import NewChatLauncher from './chat/new-chat-launcher';
import Sidebar from './chat/sidebar';

export default async function ChatPage() {
  return (
    <main className="flex h-screen w-screen bg-white overflow-hidden">
      <div className="w-[220px] shrink-0 h-full">
        <Sidebar />
      </div>

      <section className="min-h-0 flex-1 h-full overflow-hidden">
        <NewChatLauncher />
      </section>
    </main>
  );
}
