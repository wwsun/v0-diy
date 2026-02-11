import { mergeBuilderContext } from '@/util/builder-schema';
import { runGeneratePipeline } from '@/util/builder/generate-pipeline';
import type { AgentSdk, ChatMode, MyUIMessage } from '@/util/chat-schema';
import { ensureMessageIds } from '@/util/chat-message';
import { applyMessageTrigger, isValidChatMode } from '@/util/chat-request';
import { readChat, readChatIfExists, saveChat } from '@util/chat-store';
import {
  convertToModelMessages,
  generateId,
  stepCountIs,
  streamText,
} from 'ai';
import throttle from 'throttleit';
import { customOpenAIProvider } from '@/util/ai/provider';

const model = customOpenAIProvider('gpt-5');

type ChatRequestBody = {
  message: MyUIMessage | undefined;
  id: string;
  trigger: 'submit-message' | 'regenerate-message';
  messageId: string | undefined;
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

export async function POST(req: Request) {
  const {
    message,
    id,
    trigger,
    messageId,
    mode,
    agentSdk,
    builderContext,
  }: ChatRequestBody = await req.json();

  if (mode !== undefined && !isValidChatMode(mode)) {
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

  const chat = await readChat(id);
  let messages: MyUIMessage[] = chat.messages;
  const effectiveMode = mode ?? chat.mode;
  const effectiveAgentSdk =
    agentSdk ??
    (chat.agentSdk === 'codex' || chat.agentSdk === 'vercel-ai'
      ? chat.agentSdk
      : 'codex');
  const effectiveBuilderContext = mergeBuilderContext(
    chat.builderContext,
    builderContext,
  );

  messages = applyMessageTrigger({
    messages,
    trigger,
    message,
    messageId,
  });

  messages = ensureMessageIds(messages);

  await saveChat({
    id,
    messages,
    mode: effectiveMode,
    agentSdk: effectiveAgentSdk,
    builderContext: effectiveBuilderContext,
    canceledAt: null,
  });

  if (effectiveMode === 'agent') {
    return runGeneratePipeline({
      chat: {
        ...chat,
        mode: effectiveMode,
        agentSdk: effectiveAgentSdk,
        builderContext: effectiveBuilderContext,
      },
      messages,
      metadata: { createdAt: Date.now() },
      appType: effectiveBuilderContext.appType,
      brief: effectiveBuilderContext.brief,
      agentSdk: effectiveAgentSdk,
      persist: async ({
        messages: nextMessages,
        agentRuntimeState,
        builderContext: nextBuilderContext,
        artifacts,
      }) => {
        await saveChat({
          id,
          messages: nextMessages,
          mode: effectiveMode,
          agentSdk: effectiveAgentSdk,
          agentRuntimeState,
          builderContext: nextBuilderContext,
          artifacts,
        });
      },
    });
  }

  const userStopSignal = new AbortController();
  let currentMessageId: string | null = null;

  const result = streamText({
    model,
    messages: await convertToModelMessages(messages),
    tools: {},
    providerOptions: {
      langbase: {
        reasoningEffort: 'high',
      },
    },
    stopWhen: stepCountIs(5),
    abortSignal: userStopSignal.signal,
    onChunk: throttle(async ({ chunk }) => {
      const chatState = await readChatIfExists(id);

      if (!chatState) {
        userStopSignal.abort();
        return;
      }

      const { canceledAt } = chatState;
      if (canceledAt) {
        userStopSignal.abort();
        return;
      }

      if (chunk.type === 'text-delta' && currentMessageId) {
        void saveChat({
          id,
          messages,
          mode: effectiveMode,
          agentSdk: effectiveAgentSdk,
        });
      }
    }, 500),
    onAbort: () => {
      console.log('aborted');
    },
  });

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    generateMessageId: () => {
      const msgId = generateId();
      currentMessageId = msgId;
      return msgId;
    },
    messageMetadata: ({ part }) => {
      if (part.type === 'start') {
        return { createdAt: Date.now() };
      }
    },
    onFinish: ({ messages: finishedMessages }) => {
      void saveChat({
        id,
        messages: finishedMessages,
        mode: effectiveMode,
        agentSdk: effectiveAgentSdk,
      });
    },
  });
}
