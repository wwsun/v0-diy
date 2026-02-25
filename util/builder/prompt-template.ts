import type {
  AppType,
  BuilderBrief,
  CampaignDslV1,
} from '@/util/builder-schema';

function clipText(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength)}...`;
}

function stringifyJson(value: unknown, maxLength = 4000): string {
  return clipText(JSON.stringify(value, null, 2), maxLength);
}

export function buildSystemPrompt({
  appType,
  mode,
  locale,
}: {
  appType: AppType;
  mode: 'create' | 'edit';
  locale: string;
}): string {
  return [
    '你是移动端可视化页面 DSL 生成器。',
    '你的目标是输出可直接用于渲染移动端页面的结构化 JSON。',
    '必须严格遵守给定 schema，不得输出 schema 之外的字段。',
    '禁止输出解释、注释、Markdown 代码块。',
    '优先保证移动端可读性、清晰信息层级和转化导向 CTA。',
    `当前应用类型: ${appType}`,
    `当前任务模式: ${mode}`,
    `目标语言/语种: ${locale}`,
  ].join('\n');
}

export function buildFewShotExamples(appType: AppType): string {
  if (appType === 'report-app') {
    return [
      '示例意图：用户要求“做一个移动端周报页面，突出核心指标变化”。',
      '示例策略：保留 Hero + 指标亮点 + FAQ + Footer，文案偏数据导向与可信表达。',
      '示例结果特征：标题明确、卖点条目简短、CTA 指向“查看完整报告/订阅更新”。',
    ].join('\n');
  }

  return [
    '示例意图：用户要求“生成新品推广活动页，面向年轻用户”。',
    '示例策略：Hero 强主张、Benefits 短句列点、Social proof 增强信任、Footer 明确归属。',
    '示例结果特征：CTA 直接、移动端段落简短、品牌色统一。',
  ].join('\n');
}

export function buildConstraintChecklist({
  brief,
  mode,
}: {
  brief: BuilderBrief;
  mode: 'create' | 'edit';
}): string[] {
  return [
    `行业: ${brief.industry}`,
    `目标: ${brief.objective}`,
    `风格: ${brief.style}`,
    `受众: ${brief.audience}`,
    `语种: ${brief.locale}`,
    `主色: ${brief.primaryColor}`,
    `CTA语气: ${brief.ctaTone}`,
    `任务模式: ${mode}`,
    '必须包含 hero 与 footer。',
    '文案尽量短句，避免长段落。',
  ];
}

export function buildUserPrompt({
  appType,
  mode,
  userPrompt,
  brief,
  recentUserMessages,
  baseDsl,
}: {
  appType: AppType;
  mode: 'create' | 'edit';
  userPrompt: string;
  brief: BuilderBrief;
  recentUserMessages: string[];
  baseDsl?: CampaignDslV1 | null;
}): string {
  const sections: string[] = [];

  sections.push('## Task');
  sections.push(`appType: ${appType}`);
  sections.push(`mode: ${mode}`);

  sections.push('## Brief');
  sections.push(...buildConstraintChecklist({ brief, mode }).map(item => `- ${item}`));

  if (recentUserMessages.length > 0) {
    sections.push('## Recent User Constraints');
    sections.push(
      ...recentUserMessages.map((message, index) => `- #${index + 1} ${clipText(message, 240)}`),
    );
  }

  sections.push('## Current User Request');
  sections.push(clipText(userPrompt, 1200));

  sections.push('## Output Rules');
  sections.push('- 输出严格合法的 JSON 对象。');
  sections.push('- 文案和语气必须与 brief 约束一致。');
  sections.push('- CTA 文案明确，避免空泛表达。');

  if (mode === 'edit' && baseDsl) {
    sections.push('## Edit Baseline DSL');
    sections.push(stringifyJson(baseDsl));
    sections.push('## Edit Rules');
    sections.push('- 基于基线 DSL 做最小必要改动。');
    sections.push('- 未被用户点名的模块尽量保持原结构与顺序。');
    sections.push('- 除非用户明确要求，不要重写整页。');
  }

  sections.push('## Strategy Example');
  sections.push(buildFewShotExamples(appType));

  return sections.join('\n');
}

export function buildRepairPrompt({
  appType,
  mode,
  brief,
  userPrompt,
  issues,
  currentDsl,
}: {
  appType: AppType;
  mode: 'create' | 'edit';
  brief: BuilderBrief;
  userPrompt: string;
  issues: string[];
  currentDsl: CampaignDslV1;
}): string {
  return [
    '请修复当前 DSL，满足以下质量问题。',
    `appType: ${appType}`,
    `mode: ${mode}`,
    `用户请求: ${clipText(userPrompt, 900)}`,
    `Brief: ${stringifyJson(brief, 1200)}`,
    '问题列表:',
    ...issues.map(item => `- ${item}`),
    '当前 DSL:',
    stringifyJson(currentDsl),
    '修复要求：仅做最小必要改动并返回完整 DSL JSON。',
  ].join('\n');
}
