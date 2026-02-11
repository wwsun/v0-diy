import {
  builderBriefSchema,
  builderContextSchema,
  type AppType,
  type BuilderBrief,
} from '@/util/builder-schema';
import type {
  AgentSdk,
  ChatArtifacts,
  ChatBuilderContext,
  ChatData,
  MyUIMessage,
} from '@/util/chat-schema';
import { createUIMessageStream, createUIMessageStreamResponse, generateId } from 'ai';
import { getAgentAdapter } from '@/util/agent-adapters/registry';
import { generateCampaignDsl } from './dsl-generator';
import {
  buildBriefSummary,
  getLastUserText,
  resolveBuilderIntent,
} from './intent-resolver';
import { createArtifactVersion, persistArtifactVersion } from './artifact-store';

export type GeneratePipelineInput = {
  chat: ChatData;
  messages: MyUIMessage[];
  metadata: { createdAt: number };
  prompt?: string;
  appType?: AppType;
  brief?: Partial<BuilderBrief>;
  agentSdk: AgentSdk;
  persist: (updates: {
    messages?: MyUIMessage[];
    agentRuntimeState?: ChatData['agentRuntimeState'];
    builderContext?: Partial<ChatBuilderContext>;
    artifacts?: ChatArtifacts;
  }) => Promise<void>;
};

export async function runGeneratePipeline({
  chat,
  messages,
  metadata,
  prompt,
  appType,
  brief,
  agentSdk,
  persist,
}: GeneratePipelineInput): Promise<Response> {
  const lastUserText = prompt ?? getLastUserText(messages);
  const nextAppType = appType ?? chat.builderContext.appType;
  const nextBrief = builderBriefSchema.parse({
    ...chat.builderContext.brief,
    ...(brief ?? {}),
  });

  const intent = resolveBuilderIntent({
    text: lastUserText,
    appType: nextAppType,
  });

  await persist({
    builderContext: builderContextSchema.parse({
      ...chat.builderContext,
      appType: nextAppType,
      brief: nextBrief,
    }),
  });

  if (intent.kind !== 'generate') {
    return getAgentAdapter(agentSdk).runAsUIMessageStream({
      chat: {
        ...chat,
        builderContext: {
          ...chat.builderContext,
          appType: nextAppType,
          brief: nextBrief,
        },
      },
      messages,
      metadata,
      persist,
    });
  }

  const stream = createUIMessageStream({
    originalMessages: messages,
    generateId,
    execute: async ({ writer }) => {
      writer.write({
        type: 'start',
        messageMetadata: metadata,
      });

      const textId = generateId();
      writer.write({ type: 'text-start', id: textId });
      writer.write({
        type: 'text-delta',
        id: textId,
        delta: `已识别为页面生成任务（${intent.reason}）。\n`,
      });
      writer.write({
        type: 'text-delta',
        id: textId,
        delta: `当前配置：${buildBriefSummary(nextBrief)}\n`,
      });

      const dsl = await generateCampaignDsl({
        userPrompt: lastUserText,
        brief: nextBrief,
      });

      const sourceMessageId =
        [...messages].reverse().find(message => message.role === 'user')?.id ??
        'unknown-user-message';

      const artifact = createArtifactVersion({
        dsl,
        summary: `已生成 ${dsl.meta.title}`,
        sourceMessageId,
      });

      await persistArtifactVersion({
        chat,
        artifact,
        persist,
      });

      writer.write({
        type: 'text-delta',
        id: textId,
        delta: `已创建新版本：${artifact.id}\n`,
      });

      writer.write({
        type: 'text-delta',
        id: textId,
        delta: `标题：${dsl.meta.title}\n摘要：${artifact.summary}\n`,
      });

      writer.write({ type: 'text-end', id: textId });
    },
    onFinish: async ({ messages: finalMessages }) => {
      await persist({ messages: finalMessages });
    },
    onError: error => {
      console.error(error);
      return '生成失败，请稍后重试。';
    },
  });

  return createUIMessageStreamResponse({ stream });
}
