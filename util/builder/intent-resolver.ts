import type { AppType, BuilderBrief } from '@/util/builder-schema';
import type { MyUIMessage } from '@/util/chat-schema';

export type BuilderIntent =
  | {
      kind: 'generate';
      action: 'create' | 'edit';
      confidence: 'high' | 'medium';
      reason: string;
    }
  | {
      kind: 'chat';
      action: 'chat';
      confidence: 'low';
      reason: string;
    };

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
  'polish',
  'refine',
];

const RECREATE_KEYWORDS = [
  '重新生成',
  '重做',
  '重建',
  '从零',
  'from scratch',
  'restart',
];

function getTextPart(message: MyUIMessage): string {
  return message.parts
    .map(part => (part.type === 'text' ? part.text : ''))
    .join('')
    .trim();
}

export function getLastUserText(messages: MyUIMessage[]): string {
  return [...messages]
    .reverse()
    .find(message => message.role === 'user')
    ?.parts
    .map(part => (part.type === 'text' ? part.text : ''))
    .join('')
    .trim() ?? '';
}

export function getRecentUserTexts(
  messages: MyUIMessage[],
  limit = 3,
): string[] {
  const recent = [...messages]
    .reverse()
    .filter(message => message.role === 'user')
    .map(getTextPart)
    .filter(Boolean)
    .slice(0, limit)
    .reverse();

  return recent;
}

export function resolveBuilderIntent({
  text,
  appType,
  hasActiveArtifact,
}: {
  text: string;
  appType: AppType;
  hasActiveArtifact: boolean;
}): BuilderIntent {
  const normalized = text.toLowerCase();
  const hasGenerateKeyword = GENERATE_KEYWORDS.some(keyword =>
    normalized.includes(keyword),
  );
  const hasUpdateKeyword = UPDATE_KEYWORDS.some(keyword =>
    normalized.includes(keyword),
  );
  const hasRecreateKeyword = RECREATE_KEYWORDS.some(keyword =>
    normalized.includes(keyword),
  );

  if (appType === 'marketing-campaign' || appType === 'report-app') {
    if (hasRecreateKeyword || hasGenerateKeyword) {
      return {
        kind: 'generate',
        action: 'create',
        confidence: 'high',
        reason: hasRecreateKeyword
          ? 'matched_recreate_keyword'
          : 'matched_generate_keyword',
      };
    }

    if (hasUpdateKeyword) {
      if (hasActiveArtifact) {
        return {
          kind: 'generate',
          action: 'edit',
          confidence: 'medium',
          reason: 'matched_update_keyword_with_active_artifact',
        };
      }

      return {
        kind: 'generate',
        action: 'create',
        confidence: 'medium',
        reason: 'matched_update_keyword_without_active_artifact',
      };
    }
  }

  return {
    kind: 'chat',
    action: 'chat',
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
