import type { AgentSdk, ChatMode } from '@/util/chat-schema';
import { mergeBuilderContext } from '@/util/builder-schema';
import { readChatIfExists, saveChat } from '@util/chat-store';

type AgentConfigBody = {
  mode?: ChatMode;
  agentSdk?: AgentSdk;
  builderContext?: {
    appType?: 'marketing-campaign' | 'report-app';
    brief?: {
      industry?: string;
      objective?: string;
      style?: string;
      audience?: string;
      locale?: string;
      primaryColor?: string;
      ctaTone?: string;
    };
    selectedTemplateId?: string | null;
  };
};

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await req.json()) as AgentConfigBody;
  const { mode, agentSdk, builderContext } = body;

  const hasAnyUpdate =
    mode !== undefined ||
    agentSdk !== undefined ||
    builderContext !== undefined;

  if (!hasAnyUpdate) {
    return Response.json(
      { ok: false, error: 'missing_update_payload' },
      { status: 400 },
    );
  }

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
  const nextBuilderContext = mergeBuilderContext(
    chat.builderContext,
    builderContext,
  );

  await saveChat({
    id,
    mode: nextMode,
    agentSdk: nextAgentSdk,
    builderContext: nextBuilderContext,
  });

  return Response.json({
    ok: true,
    mode: nextMode,
    agentSdk: nextAgentSdk,
    builderContext: nextBuilderContext,
  });
}
