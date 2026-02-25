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
import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateId,
} from 'ai';
import { getAgentAdapter } from '@/util/agent-adapters/registry';
import { generateCampaignDsl } from './dsl-generator';
import {
  buildBriefSummary,
  getLastUserText,
  getRecentUserTexts,
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
  const recentUserTexts = getRecentUserTexts(messages, 3);
  const nextAppType = appType ?? chat.builderContext.appType;
  const nextBrief = builderBriefSchema.parse({
    ...chat.builderContext.brief,
    ...(brief ?? {}),
  });

  const activeArtifact =
    chat.artifacts.versions.find(
      artifact => artifact.id === chat.artifacts.activeArtifactId,
    ) ?? null;

  const intent = resolveBuilderIntent({
    text: lastUserText,
    appType: nextAppType,
    hasActiveArtifact: Boolean(activeArtifact),
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

  const generationMode = intent.action === 'edit' ? 'edit' : 'create';

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
        delta: `生成策略：${generationMode === 'edit' ? '基于当前版本增量修改' : '从当前约束创建新版本'}。\n`,
      });
      writer.write({
        type: 'text-delta',
        id: textId,
        delta: `当前配置：${buildBriefSummary(nextBrief)}\n`,
      });

      const generation = await generateCampaignDsl({
        userPrompt: lastUserText,
        brief: nextBrief,
        appType: nextAppType,
        mode: generationMode,
        baseDsl: generationMode === 'edit' ? activeArtifact?.dsl ?? null : null,
        recentUserMessages: recentUserTexts,
      });

      const dsl = generation.dsl;

      const sourceMessageId =
        [...messages].reverse().find(message => message.role === 'user')?.id ??
        'unknown-user-message';

      const qualityLabel =
        generation.meta.quality === 'high'
          ? '高'
          : generation.meta.quality === 'medium'
            ? '中'
            : '低';

      const artifact = createArtifactVersion({
        dsl,
        summary: `${generationMode === 'edit' ? '增量更新' : '新建'} ${dsl.meta.title}（质量${qualityLabel}${generation.meta.repaired ? '，已修复' : ''}）`,
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
        delta: `标题：${dsl.meta.title}\n质量评分：${generation.meta.score}/100（${qualityLabel}）\n`,
      });

      if (generation.meta.repaired) {
        writer.write({
          type: 'text-delta',
          id: textId,
          delta: '已触发一次自动修复以提升输出一致性。\n',
        });
      }

      if (generation.meta.issues.length > 0) {
        writer.write({
          type: 'text-delta',
          id: textId,
          delta: `质量提示：${generation.meta.issues.slice(0, 2).join('；')}\n`,
        });
      }

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
