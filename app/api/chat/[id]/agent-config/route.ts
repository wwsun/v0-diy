import type { AgentSdk, ChatMode } from '@/util/chat-schema';
import { readChatIfExists, saveChat } from '@util/chat-store';

type AgentConfigBody = {
  mode?: ChatMode;
  agentSdk?: AgentSdk;
};

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { mode, agentSdk }: AgentConfigBody = await req.json();

  if (mode !== undefined && mode !== 'chat' && mode !== 'agent') {
    return Response.json({ ok: false, error: 'invalid_mode' }, { status: 400 });
  }

  if (
    agentSdk !== undefined &&
    agentSdk !== 'vercel-ai' &&
    agentSdk !== 'codex'
  ) {
    return Response.json(
      { ok: false, error: 'invalid_agent_sdk' },
      { status: 400 },
    );
  }

  const chat = await readChatIfExists(id);
  if (!chat) {
    return Response.json({ ok: false, error: 'not_found' }, { status: 404 });
  }

  const nextMode = mode ?? chat.mode;
  const nextAgentSdk = agentSdk ?? chat.agentSdk;

  await saveChat({
    id,
    mode: nextMode,
    agentSdk: nextAgentSdk,
  });

  return Response.json({
    ok: true,
    mode: nextMode,
    agentSdk: nextAgentSdk,
  });
}

