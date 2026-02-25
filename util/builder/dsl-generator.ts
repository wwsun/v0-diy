import { generateObject } from 'ai';
import {
  builderBriefSchema,
  campaignDslSchema,
  createDefaultCampaignDsl,
  type AppType,
  type BuilderBrief,
  type CampaignDslV1,
} from '@/util/builder-schema';
import { customOpenAIProvider } from '@/util/ai/provider';
import { normalizeCampaignDsl } from './dsl-normalizer';
import {
  evaluateDslQuality,
  needsDslRepair,
  type DslQualityLevel,
  type DslQualityReport,
} from './dsl-quality';
import {
  buildRepairPrompt,
  buildSystemPrompt,
  buildUserPrompt,
} from './prompt-template';

const model = customOpenAIProvider('gpt-5');

export type BuilderTaskMode = 'create' | 'edit';

export type GenerateCampaignDslInput = {
  userPrompt: string;
  brief: Partial<BuilderBrief>;
  appType: AppType;
  mode: BuilderTaskMode;
  baseDsl?: CampaignDslV1 | null;
  recentUserMessages?: string[];
};

export type GenerateCampaignDslResult = {
  dsl: CampaignDslV1;
  meta: {
    mode: BuilderTaskMode;
    quality: DslQualityLevel;
    repaired: boolean;
    issues: string[];
    score: number;
  };
};

function createFallbackDsl({
  brief,
  appType,
}: {
  brief: BuilderBrief;
  appType: AppType;
}): CampaignDslV1 {
  const fallback = createDefaultCampaignDsl();

  return {
    ...fallback,
    meta: {
      ...fallback.meta,
      title: brief.industry
        ? appType === 'report-app'
          ? `${brief.industry} 移动端报告页`
          : `${brief.industry} 营销活动页`
        : fallback.meta.title,
      locale: brief.locale,
    },
    theme: {
      ...fallback.theme,
      primaryColor: brief.primaryColor,
    },
  };
}

async function generateDslFromPrompt({
  system,
  prompt,
}: {
  system: string;
  prompt: string;
}): Promise<CampaignDslV1> {
  const result = await generateObject({
    model,
    schema: campaignDslSchema,
    system,
    prompt,
    providerOptions: {
      langbase: {
        reasoningEffort: 'high',
      },
    },
  });

  return normalizeCampaignDsl(result.object);
}

function toMeta({
  mode,
  report,
  repaired,
}: {
  mode: BuilderTaskMode;
  report: DslQualityReport;
  repaired: boolean;
}): GenerateCampaignDslResult['meta'] {
  return {
    mode,
    quality: report.level,
    repaired,
    issues: report.issues,
    score: report.score,
  };
}

export async function generateCampaignDsl({
  userPrompt,
  brief,
  appType,
  mode,
  baseDsl,
  recentUserMessages = [],
}: GenerateCampaignDslInput): Promise<GenerateCampaignDslResult> {
  const normalizedBrief = builderBriefSchema.parse(brief);

  try {
    const systemPrompt = buildSystemPrompt({
      appType,
      mode,
      locale: normalizedBrief.locale,
    });

    const prompt = buildUserPrompt({
      appType,
      mode,
      userPrompt,
      brief: normalizedBrief,
      recentUserMessages,
      baseDsl,
    });

    let currentDsl = await generateDslFromPrompt({
      system: systemPrompt,
      prompt,
    });

    let qualityReport = evaluateDslQuality({
      dsl: currentDsl,
      brief: normalizedBrief,
      appType,
      mode,
    });

    let repaired = false;

    if (needsDslRepair(qualityReport)) {
      try {
        const repairPrompt = buildRepairPrompt({
          appType,
          mode,
          brief: normalizedBrief,
          userPrompt,
          issues: qualityReport.issues,
          currentDsl,
        });

        const repairedDsl = await generateDslFromPrompt({
          system: systemPrompt,
          prompt: repairPrompt,
        });

        const repairedReport = evaluateDslQuality({
          dsl: repairedDsl,
          brief: normalizedBrief,
          appType,
          mode,
        });

        if (repairedReport.score >= qualityReport.score) {
          currentDsl = repairedDsl;
          qualityReport = repairedReport;
          repaired = true;
        }
      } catch (repairError) {
        console.error('generateCampaignDsl repair failed', repairError);
      }
    }

    return {
      dsl: currentDsl,
      meta: toMeta({
        mode,
        report: qualityReport,
        repaired,
      }),
    };
  } catch (error) {
    console.error('generateCampaignDsl fallback', error);
    const fallbackDsl = createFallbackDsl({
      brief: normalizedBrief,
      appType,
    });
    const fallbackReport = evaluateDslQuality({
      dsl: fallbackDsl,
      brief: normalizedBrief,
      appType,
      mode,
    });

    return {
      dsl: fallbackDsl,
      meta: {
        ...toMeta({
          mode,
          report: fallbackReport,
          repaired: false,
        }),
        quality: 'low',
        issues: [
          '模型输出异常，已使用默认 DSL 回退。',
          ...fallbackReport.issues,
        ],
      },
    };
  }
}
