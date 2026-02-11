import { deleteChat } from '@util/chat-store';

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

