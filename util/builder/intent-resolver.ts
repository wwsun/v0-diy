import type { AppType, BuilderBrief } from '@/util/builder-schema';
import type { MyUIMessage } from '@/util/chat-schema';

export type BuilderIntent =
  | { kind: 'generate'; confidence: 'high' | 'medium'; reason: string }
  | { kind: 'chat'; confidence: 'low'; reason: string };

const GENERATE_KEYWORDS = [
  '生成',
  '创建',
  '搭建',
  '设计',
  '活动页',
  '落地页',
  'campaign',
  'landing page',
  'build',
  'generate',
  'create',
  'make',
];

const UPDATE_KEYWORDS = [
  '优化',
  '改成',
  '修改',
  '调整',
  'update',
  'change',
  'revise',
  'improve',
];

export function getLastUserText(messages: MyUIMessage[]): string {
  return (
    [...messages]
      .reverse()
      .find(message => message.role === 'user')
      ?.parts.map(part => (part.type === 'text' ? part.text : ''))
      .join('')
      .trim() ?? ''
  );
}

export function resolveBuilderIntent({
  text,
  appType,
}: {
  text: string;
  appType: AppType;
}): BuilderIntent {
  const normalized = text.toLowerCase();
  const hasGenerateKeyword = GENERATE_KEYWORDS.some(keyword =>
    normalized.includes(keyword),
  );
  const hasUpdateKeyword = UPDATE_KEYWORDS.some(keyword =>
    normalized.includes(keyword),
  );

  if (
    appType === 'marketing-campaign' &&
    (hasGenerateKeyword || hasUpdateKeyword)
  ) {
    return {
      kind: 'generate',
      confidence: hasGenerateKeyword ? 'high' : 'medium',
      reason: hasGenerateKeyword
        ? 'matched_generate_keyword'
        : 'matched_update_keyword',
    };
  }

  return {
    kind: 'chat',
    confidence: 'low',
    reason: 'no_generate_intent_detected',
  };
}

export function buildBriefSummary(brief: BuilderBrief): string {
  return [
    `行业: ${brief.industry}`,
    `目标: ${brief.objective}`,
    `风格: ${brief.style}`,
    `受众: ${brief.audience}`,
    `语种: ${brief.locale}`,
    `主色: ${brief.primaryColor}`,
    `CTA语气: ${brief.ctaTone}`,
  ].join('；');
}
