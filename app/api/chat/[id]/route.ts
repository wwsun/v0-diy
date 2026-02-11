import { deleteChat, readChatIfExists } from '@util/chat-store';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const chat = await readChatIfExists(id);

  if (!chat) {
    return Response.json({ ok: false, error: 'not_found' }, { status: 404 });
  }

  return Response.json({
    ok: true,
    chat: {
      id: chat.id,
      mode: chat.mode,
      agentSdk: chat.agentSdk,
      builderContext: chat.builderContext,
      artifacts: chat.artifacts,
      messages: chat.messages,
      createdAt: chat.createdAt,
    },
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const deleted = await deleteChat(id);

  if (!deleted) {
    return Response.json({ ok: false, error: 'not_found' }, { status: 404 });
  }

  return Response.json({ ok: true });
}
