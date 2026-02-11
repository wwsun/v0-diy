import type { ChatMode } from '@/util/chat-schema';
import { readChatIfExists, saveChat } from '@util/chat-store';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { mode }: { mode?: ChatMode } = await req.json();

  if (mode !== 'chat' && mode !== 'agent') {
    return Response.json({ ok: false, error: 'invalid_mode' }, { status: 400 });
  }

  const chat = await readChatIfExists(id);
  if (!chat) {
    return Response.json({ ok: false, error: 'not_found' }, { status: 404 });
  }

  await saveChat({ id, mode });

  return Response.json({ ok: true, mode });
}

