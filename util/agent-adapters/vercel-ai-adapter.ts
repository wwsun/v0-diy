import { chatAgent, type ChatAgentUIMessage } from '@/util/ai/agent';
import type { MyUIMessage } from '@/util/chat-schema';
import { createAgentUIStreamResponse, generateId } from 'ai';
import type { AgentAdapter } from './types';

export const vercelAiAdapter: AgentAdapter = {
  sdk: 'vercel-ai',
  async runAsUIMessageStream({ messages, metadata, persist }) {
    const agentMessages = messages as unknown as ChatAgentUIMessage[];

    return createAgentUIStreamResponse({
      agent: chatAgent,
      uiMessages: agentMessages,
      originalMessages: agentMessages,
      generateMessageId: () => generateId(),
      messageMetadata: ({ part }) => {
        if (part.type === 'start') {
          return metadata;
        }
      },
      onFinish: ({ messages: finalMessages }) => {
        return persist({
          messages: finalMessages as unknown as MyUIMessage[],
        });
      },
      onError: error => {
        console.error(error);
        return 'An error occurred.';
      },
    });
  },
};
