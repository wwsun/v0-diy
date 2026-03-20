import 'server-only';

import { readChat, saveChat } from '@/util/chat-store';
import { workspaceAdapter } from '@/adapters/workspace-adapter';
import { abortIfRunning } from '@/stream/abort-registry';
import { generateId } from 'ai';
import type { MyUIMessage, MyMessageMetadata } from '@/util/chat-schema';
import { myMessageMetadataSchema } from '@/util/chat-schema';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json() as {
    message?: MyUIMessage;
    trigger?: string;
  };

  const chat = await readChat(id);

  // 追加用户消息到 chat
  if (body.message) {
    const messages = [...chat.messages, body.message];
    await saveChat({ id, messages });
    chat.messages = messages;
  }

  // 重置取消状态
  await saveChat({ id, canceledAt: null });
  chat.canceledAt = null;

  const streamId = generateId();
  await saveChat({ id, activeStreamId: streamId });

  const metadata: MyMessageMetadata = { createdAt: Date.now() };

  const persist = async (updates: {
    messages?: MyUIMessage[];
    workspacePages?: { activeSnapshotId: string | null };
    sdkSessionId?: string;
  }) => {
    await saveChat({
      id,
      ...updates,
      activeStreamId: null,
    });
  };

  return workspaceAdapter.runAsUIMessageStream({
    chat,
    messages: chat.messages,
    metadata,
    persist,
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  abortIfRunning(id);
  await saveChat({ id, canceledAt: Date.now(), activeStreamId: null });
  return new Response(null, { status: 204 });
}
