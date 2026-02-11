import type { CampaignBlock, CampaignDslV1 } from '@/util/builder-schema';

export type CompiledCampaignResult = {
  jsxCode: string;
  cssCode: string;
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderBlock(block: CampaignBlock): string {
  switch (block.type) {
    case 'hero':
      return `<section class="block hero"><h1>${escapeHtml(block.headline)}</h1><p>${escapeHtml(
        block.subheadline,
      )}</p><div class="cta-group"><button>${escapeHtml(
        block.primaryCta,
      )}</button><button class="ghost">${escapeHtml(
        block.secondaryCta,
      )}</button></div></section>`;
    case 'benefits':
      return `<section class="block benefits"><h2>${escapeHtml(
        block.title,
      )}</h2><ul>${block.items
        .map(item => `<li>${escapeHtml(item)}</li>`)
        .join('')}</ul></section>`;
    case 'countdown':
      return `<section class="block countdown"><h2>${escapeHtml(
        block.label,
      )}</h2><p data-deadline="${escapeHtml(block.deadline)}">${escapeHtml(
        block.deadline,
      )}</p></section>`;
    case 'social-proof':
      return `<section class="block social-proof"><h2>${escapeHtml(
        block.title,
      )}</h2><div>${block.quotes
        .map(quote => `<blockquote>${escapeHtml(quote)}</blockquote>`)
        .join('')}</div></section>`;
    case 'faq':
      return `<section class="block faq"><h2>${escapeHtml(block.title)}</h2>${block.entries
        .map(
          entry =>
            `<article><h3>${escapeHtml(entry.question)}</h3><p>${escapeHtml(entry.answer)}</p></article>`,
        )
        .join('')}</section>`;
    case 'footer':
      return `<footer class="block footer">${escapeHtml(block.text)}</footer>`;
  }
}

export function compileCampaignDsl(dsl: CampaignDslV1): CompiledCampaignResult {
  const sections = dsl.blocks.map(renderBlock).join('');
  const cssCode = `:root{--primary:${dsl.theme.primaryColor};--bg:${dsl.theme.backgroundColor};--text:${dsl.theme.textColor}}*{box-sizing:border-box}body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:var(--bg);color:var(--text)}.page{max-width:420px;margin:0 auto;padding:16px}.block{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:12px}.hero h1{margin:0 0 8px;font-size:24px;line-height:1.3}.hero p{margin:0 0 12px;color:#475569}.cta-group{display:flex;gap:8px}.cta-group button{border:none;background:var(--primary);color:white;border-radius:8px;padding:10px 12px;font-weight:600}.cta-group .ghost{background:#e2e8f0;color:#0f172a}.benefits ul{padding-left:18px}.benefits li{margin:6px 0}.social-proof blockquote{margin:8px 0;padding:8px 10px;background:#f8fafc;border-left:3px solid var(--primary)}.footer{text-align:center;color:#64748b}`;

  const jsxCode = `export default function CampaignPage(){return (<main className="page">${sections}</main>);}`;

  return {
    jsxCode,
    cssCode,
  };
}

