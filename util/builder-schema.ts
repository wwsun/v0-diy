import { z } from 'zod';

export const appTypeSchema = z.enum(['marketing-campaign', 'report-app']);

export type AppType = z.infer<typeof appTypeSchema>;

export const builderBriefSchema = z.object({
  industry: z.string().default('general'),
  objective: z.string().default('conversion'),
  style: z.string().default('modern'),
  audience: z.string().default('mobile users'),
  locale: z.string().default('zh-CN'),
  primaryColor: z.string().default('#0f172a'),
  ctaTone: z.string().default('direct'),
});

export type BuilderBrief = z.infer<typeof builderBriefSchema>;

export const builderContextSchema = z.object({
  appType: appTypeSchema.default('marketing-campaign'),
  brief: builderBriefSchema.default({}),
  selectedTemplateId: z.string().nullable().default(null),
});

export type BuilderContext = z.infer<typeof builderContextSchema>;

export type BuilderContextPatch = {
  appType?: AppType;
  brief?: Partial<BuilderBrief>;
  selectedTemplateId?: string | null;
};

const heroBlockSchema = z.object({
  type: z.literal('hero'),
  headline: z.string(),
  subheadline: z.string().default(''),
  primaryCta: z.string().default('立即体验'),
  secondaryCta: z.string().default('了解更多'),
});

const benefitsBlockSchema = z.object({
  type: z.literal('benefits'),
  title: z.string().default('核心卖点'),
  items: z.array(z.string()).default([]),
});

const countdownBlockSchema = z.object({
  type: z.literal('countdown'),
  label: z.string().default('活动倒计时'),
  deadline: z.string().default('2026-12-31T23:59:59.000Z'),
});

const socialProofBlockSchema = z.object({
  type: z.literal('social-proof'),
  title: z.string().default('用户反馈'),
  quotes: z.array(z.string()).default([]),
});

const faqEntrySchema = z.object({
  question: z.string(),
  answer: z.string(),
});

const faqBlockSchema = z.object({
  type: z.literal('faq'),
  title: z.string().default('常见问题'),
  entries: z.array(faqEntrySchema).default([]),
});

const footerBlockSchema = z.object({
  type: z.literal('footer'),
  text: z.string().default('© 2026 Campaign Studio'),
});

export const campaignBlockSchema = z.discriminatedUnion('type', [
  heroBlockSchema,
  benefitsBlockSchema,
  countdownBlockSchema,
  socialProofBlockSchema,
  faqBlockSchema,
  footerBlockSchema,
]);

export type CampaignBlock = z.infer<typeof campaignBlockSchema>;

export const campaignDslSchema = z.object({
  meta: z.object({
    title: z.string(),
    description: z.string().default(''),
    locale: z.string().default('zh-CN'),
  }),
  theme: z.object({
    primaryColor: z.string().default('#0f172a'),
    backgroundColor: z.string().default('#ffffff'),
    textColor: z.string().default('#0f172a'),
  }),
  blocks: z.array(campaignBlockSchema).min(1),
  cta: z.object({
    primaryText: z.string().default('立即开始'),
    secondaryText: z.string().default('预约咨询'),
  }),
  tracking: z.object({
    campaignId: z.string().default('campaign-demo'),
    medium: z.string().default('organic'),
  }),
});

export type CampaignDslV1 = z.infer<typeof campaignDslSchema>;

export const artifactCompiledSchema = z.object({
  jsxCode: z.string(),
  cssCode: z.string().optional(),
});

export type ArtifactCompiled = z.infer<typeof artifactCompiledSchema>;

export const artifactPreviewSchema = z.object({
  html: z.string(),
  sandboxPolicy: z.string().default('allow-scripts'),
});

export type ArtifactPreview = z.infer<typeof artifactPreviewSchema>;

export function createDefaultBuilderContext(): BuilderContext {
  return builderContextSchema.parse({});
}

export function createDefaultCampaignDsl(): CampaignDslV1 {
  return campaignDslSchema.parse({
    meta: {
      title: '移动端营销活动页',
      description: '通过自然语言快速生成营销活动页',
      locale: 'zh-CN',
    },
    theme: {
      primaryColor: '#0f172a',
      backgroundColor: '#ffffff',
      textColor: '#0f172a',
    },
    blocks: [
      {
        type: 'hero',
        headline: '更高效的营销活动创建方式',
        subheadline: '几分钟内完成策划、生成与预览。',
        primaryCta: '立即试用',
        secondaryCta: '查看方案',
      },
      {
        type: 'benefits',
        title: '你将获得',
        items: ['更快上线活动页', '更统一的品牌表达', '可迭代的生成版本管理'],
      },
      {
        type: 'footer',
        text: '© 2026 Campaign Studio',
      },
    ],
    cta: {
      primaryText: '立即创建',
      secondaryText: '联系我们',
    },
    tracking: {
      campaignId: 'campaign-demo',
      medium: 'organic',
    },
  });
}

export function mergeBuilderContext(
  base: BuilderContext,
  patch?: BuilderContextPatch,
): BuilderContext {
  if (!patch) {
    return base;
  }

  return {
    appType: patch.appType ?? base.appType,
    brief: {
      ...base.brief,
      ...(patch.brief ?? {}),
    },
    selectedTemplateId: patch.selectedTemplateId ?? base.selectedTemplateId,
  };
}
