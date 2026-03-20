import { readChatIfExists } from '@/util/chat-store';
import { NextResponse } from 'next/server';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const chat = await readChatIfExists(id);

  if (!chat) {
    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, chat });
}
