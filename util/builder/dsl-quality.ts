import type { AppType, BuilderBrief, CampaignDslV1 } from '@/util/builder-schema';

export type DslQualityLevel = 'high' | 'medium' | 'low';

export type DslQualityReport = {
  score: number;
  level: DslQualityLevel;
  issues: string[];
  criticalIssues: string[];
};

function toLevel(score: number): DslQualityLevel {
  if (score >= 88) {
    return 'high';
  }

  if (score >= 72) {
    return 'medium';
  }

  return 'low';
}

function normalizeLocale(input: string): string {
  return input.trim().toLowerCase();
}

export function evaluateDslQuality({
  dsl,
  brief,
  appType,
  mode,
}: {
  dsl: CampaignDslV1;
  brief: BuilderBrief;
  appType: AppType;
  mode: 'create' | 'edit';
}): DslQualityReport {
  const issues: string[] = [];
  const criticalIssues: string[] = [];
  let score = 100;

  const hasHero = dsl.blocks.some(block => block.type === 'hero');
  const hasFooter = dsl.blocks.some(block => block.type === 'footer');

  if (!hasHero) {
    issues.push('缺少 hero 区块。');
    criticalIssues.push('missing_hero');
    score -= 24;
  }

  if (!hasFooter) {
    issues.push('缺少 footer 区块。');
    criticalIssues.push('missing_footer');
    score -= 20;
  }

  if (!dsl.cta.primaryText || dsl.cta.primaryText.trim().length < 2) {
    issues.push('主 CTA 文案过短或缺失。');
    criticalIssues.push('missing_primary_cta');
    score -= 20;
  }

  if (!dsl.meta.title || dsl.meta.title.trim().length < 4) {
    issues.push('页面标题过短。');
    criticalIssues.push('weak_title');
    score -= 16;
  }

  const normalizedDslLocale = normalizeLocale(dsl.meta.locale);
  const normalizedBriefLocale = normalizeLocale(brief.locale);
  if (
    normalizedBriefLocale &&
    normalizedDslLocale &&
    normalizedDslLocale !== normalizedBriefLocale
  ) {
    issues.push(`语种与 brief 不一致（${dsl.meta.locale} vs ${brief.locale}）。`);
    score -= 8;
  }

  if (dsl.blocks.length > 8) {
    issues.push('区块过多，移动端信息密度偏高。');
    score -= 6;
  }

  if (dsl.blocks.length < 2) {
    issues.push('区块数量过少，页面信息不足。');
    score -= 12;
  }

  const titleLower = dsl.meta.title.toLowerCase();
  if (brief.industry && !titleLower.includes(brief.industry.toLowerCase())) {
    issues.push('标题与行业关键词关联偏弱。');
    score -= 5;
  }

  if (appType === 'report-app' && mode === 'create') {
    const hasDataSignal = dsl.blocks.some(
      block =>
        block.type === 'benefits' &&
        block.items.some(item => /数据|指标|报告|趋势/i.test(item)),
    );

    if (!hasDataSignal) {
      issues.push('报告类场景缺少“指标/数据/趋势”表达。');
      score -= 8;
    }
  }

  const safeScore = Math.max(0, Math.min(100, score));

  return {
    score: safeScore,
    level: toLevel(safeScore),
    issues,
    criticalIssues,
  };
}

export function needsDslRepair(report: DslQualityReport): boolean {
  if (report.criticalIssues.length > 0) {
    return true;
  }

  return report.score < 75;
}
