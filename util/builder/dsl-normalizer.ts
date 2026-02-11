import {
  campaignDslSchema,
  createDefaultCampaignDsl,
  type CampaignDslV1,
} from '@/util/builder-schema';

export function normalizeCampaignDsl(input: unknown): CampaignDslV1 {
  const parsed = campaignDslSchema.safeParse(input);

  if (!parsed.success) {
    return createDefaultCampaignDsl();
  }

  const dsl = parsed.data;
  const hasHero = dsl.blocks.some(block => block.type === 'hero');
  const hasFooter = dsl.blocks.some(block => block.type === 'footer');

  if (hasHero && hasFooter) {
    return dsl;
  }

  const fallback = createDefaultCampaignDsl();

  return {
    ...dsl,
    blocks: [
      ...(hasHero ? [] : fallback.blocks.filter(block => block.type === 'hero')),
      ...dsl.blocks,
      ...(hasFooter
        ? []
        : fallback.blocks.filter(block => block.type === 'footer')),
    ],
  };
}
