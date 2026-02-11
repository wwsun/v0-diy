import { generateObject } from 'ai';
import {
  builderBriefSchema,
  campaignDslSchema,
  createDefaultCampaignDsl,
  type BuilderBrief,
  type CampaignDslV1,
} from '@/util/builder-schema';
import { customOpenAIProvider } from '@/util/ai/provider';
import { normalizeCampaignDsl } from './dsl-normalizer';

const model = customOpenAIProvider('gpt-5');

function createPrompt({
  userPrompt,
  brief,
}: {
  userPrompt: string;
  brief: BuilderBrief;
}): string {
  return [
    '你是移动端营销活动页设计专家。',
    '请输出严格符合 schema 的 JSON DSL。',
    '页面需适配手机端，强调转化。',
    `行业: ${brief.industry}`,
    `目标: ${brief.objective}`,
    `风格: ${brief.style}`,
    `受众: ${brief.audience}`,
    `语言: ${brief.locale}`,
    `主色: ${brief.primaryColor}`,
    `CTA语气: ${brief.ctaTone}`,
    `用户描述: ${userPrompt}`,
  ].join('\n');
}

export async function generateCampaignDsl({
  userPrompt,
  brief,
}: {
  userPrompt: string;
  brief: Partial<BuilderBrief>;
}): Promise<CampaignDslV1> {
  const normalizedBrief = builderBriefSchema.parse(brief);

  try {
    const result = await generateObject({
      model,
      schema: campaignDslSchema,
      prompt: createPrompt({ userPrompt, brief: normalizedBrief }),
      providerOptions: {
        langbase: {
          reasoningEffort: 'high',
        },
      },
    });

    return normalizeCampaignDsl(result.object);
  } catch (error) {
    console.error('generateCampaignDsl fallback', error);
    const fallback = createDefaultCampaignDsl();

    return {
      ...fallback,
      meta: {
        ...fallback.meta,
        title: normalizedBrief.industry
          ? `${normalizedBrief.industry} 营销活动页`
          : fallback.meta.title,
      },
      theme: {
        ...fallback.theme,
        primaryColor: normalizedBrief.primaryColor,
      },
    };
  }
}

