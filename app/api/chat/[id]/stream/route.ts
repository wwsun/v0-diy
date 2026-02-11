import { getAgentAdapter } from '@/util/agent-adapters/registry';
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
// import { weatherTool } from '@/tool/weather-tool';
// import { convertFahrenheitToCelsius } from '@/tool/convert-celsius-tool';
// import { stockTool } from '@/tool/stock-tool';
import { customOpenAIProvider } from '@/util/ai/provider';

const model = customOpenAIProvider('gpt-5');

export async function POST(req: Request) {
  const {
    message,
    id,
    trigger,
    messageId,
    mode,
    agentSdk,
  }: {
    message: MyUIMessage | undefined;
    id: string;
    trigger: 'submit-message' | 'regenerate-message';
    messageId: string | undefined;
    mode?: ChatMode;
    agentSdk?: AgentSdk;
  } = await req.json();

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
  const effectiveAgentSdk = agentSdk ?? chat.agentSdk;

  messages = applyMessageTrigger({
    messages,
    trigger,
    message,
    messageId,
  });

  messages = ensureMessageIds(messages);

  // save the user message and mode
  saveChat({
    id,
    messages,
    mode: effectiveMode,
    agentSdk: effectiveAgentSdk,
  });

  if (effectiveMode === 'agent') {
    return getAgentAdapter(effectiveAgentSdk).runAsUIMessageStream({
      chat: {
        ...chat,
        mode: effectiveMode,
        agentSdk: effectiveAgentSdk,
      },
      messages,
      metadata: { createdAt: Date.now() },
      persist: async ({ messages: nextMessages, agentRuntimeState }) => {
        await saveChat({
          id,
          messages: nextMessages,
          mode: effectiveMode,
          agentSdk: effectiveAgentSdk,
          agentRuntimeState,
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
    // throttle reading from chat store to max once per second
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

      // Accumulate text and save incrementally
      if (chunk.type === 'text-delta') {
        if (currentMessageId) {
          saveChat({
            id,
            messages,
            mode: effectiveMode,
            agentSdk: effectiveAgentSdk,
          });
        }
      }
    }, 500), // Save every 500ms
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
    onFinish: ({ messages }) => {
      saveChat({
        id,
        messages,
        mode: effectiveMode,
        agentSdk: effectiveAgentSdk,
      });
    },
  });
}
