import type { AgentSdk, MyUIMessage } from '@/util/chat-schema';
import type { AppType, BuilderBrief } from '@/util/builder-schema';
import { mergeBuilderContext } from '@/util/builder-schema';
import { ensureMessageIds } from '@/util/chat-message';
import { applyMessageTrigger } from '@/util/chat-request';
import { runGeneratePipeline } from '@/util/builder/generate-pipeline';
import { readChat, saveChat } from '@util/chat-store';

type GenerateBody = {
  prompt?: string;
  appType?: AppType;
  brief?: Partial<BuilderBrief>;
  agentSdk?: AgentSdk;
  message?: MyUIMessage;
  trigger?: 'submit-message' | 'regenerate-message';
  messageId?: string;
};

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body: GenerateBody = await req.json();
  const chat = await readChat(id);

  let messages = chat.messages;

  if (body.message && body.trigger) {
    messages = applyMessageTrigger({
      messages,
      trigger: body.trigger,
      message: body.message,
      messageId: body.messageId,
    });
  }

  messages = ensureMessageIds(messages);

  const nextBuilderContext = mergeBuilderContext(chat.builderContext, {
    appType: body.appType,
    brief: body.brief,
  });

  const nextSdk: AgentSdk =
    body.agentSdk ??
    (chat.agentSdk === 'codex' || chat.agentSdk === 'vercel-ai'
      ? chat.agentSdk
      : 'codex');

  await saveChat({
    id,
    messages,
    mode: 'agent',
    agentSdk: nextSdk,
    builderContext: nextBuilderContext,
    canceledAt: null,
  });

  return runGeneratePipeline({
    chat: {
      ...chat,
      mode: 'agent',
      agentSdk: nextSdk,
      builderContext: nextBuilderContext,
    },
    messages,
    metadata: { createdAt: Date.now() },
    prompt: body.prompt,
    appType: body.appType,
    brief: body.brief,
    agentSdk: nextSdk,
    persist: async ({
      messages: nextMessages,
      agentRuntimeState,
      builderContext,
      artifacts,
    }) => {
      await saveChat({
        id,
        messages: nextMessages,
        mode: 'agent',
        agentSdk: nextSdk,
        agentRuntimeState,
        builderContext,
        artifacts,
      });
    },
  });
}

