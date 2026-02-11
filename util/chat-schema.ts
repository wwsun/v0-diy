import { UIDataTypes, UIMessage } from 'ai';
import { z } from 'zod';
import type {
  ArtifactCompiled,
  ArtifactPreview,
  BuilderContext,
  CampaignDslV1,
} from './builder-schema';
import { createDefaultBuilderContext } from './builder-schema';

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

export type ArtifactVersion = {
  id: string;
  createdAt: number;
  dsl: CampaignDslV1;
  compiled: ArtifactCompiled;
  preview: ArtifactPreview;
  summary: string;
  sourceMessageId: string;
};

export type ChatArtifacts = {
  activeArtifactId: string | null;
  versions: ArtifactVersion[];
};

export type ChatBuilderContext = BuilderContext;

export type ChatData = {
  id: string;
  messages: MyUIMessage[];
  mode: ChatMode;
  agentSdk: AgentSdk;
  agentRuntimeState: ChatAgentRuntimeState;
  builderContext: ChatBuilderContext;
  artifacts: ChatArtifacts;
  createdAt: number;
  activeStreamId: string | null;
  canceledAt: number | null;
};

export function createEmptyArtifacts(): ChatArtifacts {
  return {
    activeArtifactId: null,
    versions: [],
  };
}

export function createDefaultBuilderConfig(): ChatBuilderContext {
  return createDefaultBuilderContext();
}
