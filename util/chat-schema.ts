import { UIDataTypes, UIMessage } from 'ai';
import { z } from 'zod';

export const myMessageMetadataSchema = z.object({
  createdAt: z.number(),
});

export type MyMessageMetadata = z.infer<typeof myMessageMetadataSchema>;

export type MyUIMessage = UIMessage<MyMessageMetadata, UIDataTypes>;

export type ChatMode = 'chat' | 'agent';

export type AgentSdk = 'vercel-ai' | 'codex';

export type ChatAgentRuntimeState = {
  codexThreadId: string | null;
};

export type ChatData = {
  id: string;
  messages: MyUIMessage[];
  mode: ChatMode;
  agentSdk: AgentSdk;
  agentRuntimeState: ChatAgentRuntimeState;
  createdAt: number;
  activeStreamId: string | null;
  canceledAt: number | null;
};
