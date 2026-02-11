import type { CampaignDslV1 } from '@/util/builder-schema';
import type { CompiledCampaignResult } from './dsl-compiler';

function sanitizeText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildPreviewHtml({
  dsl,
  compiled,
}: {
  dsl: CampaignDslV1;
  compiled: CompiledCampaignResult;
}): string {
  const title = sanitizeText(dsl.meta.title);
  const description = sanitizeText(dsl.meta.description);

  return `<!doctype html>
<html lang="${sanitizeText(dsl.meta.locale)}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <style>${compiled.cssCode ?? ''}</style>
  </head>
  <body>
    <main class="page">
      ${dsl.blocks
        .map(block => {
          if (block.type === 'hero') {
            return `<section class="block hero"><h1>${sanitizeText(
              block.headline,
            )}</h1><p>${sanitizeText(block.subheadline)}</p><div class="cta-group"><button>${sanitizeText(
              block.primaryCta,
            )}</button><button class="ghost">${sanitizeText(
              block.secondaryCta,
            )}</button></div></section>`;
          }

          if (block.type === 'benefits') {
            return `<section class="block benefits"><h2>${sanitizeText(
              block.title,
            )}</h2><ul>${block.items
              .map(item => `<li>${sanitizeText(item)}</li>`)
              .join('')}</ul></section>`;
          }

          if (block.type === 'countdown') {
            return `<section class="block countdown"><h2>${sanitizeText(
              block.label,
            )}</h2><p>${sanitizeText(block.deadline)}</p></section>`;
          }

          if (block.type === 'social-proof') {
            return `<section class="block social-proof"><h2>${sanitizeText(
              block.title,
            )}</h2>${block.quotes
              .map(quote => `<blockquote>${sanitizeText(quote)}</blockquote>`)
              .join('')}</section>`;
          }

          if (block.type === 'faq') {
            return `<section class="block faq"><h2>${sanitizeText(
              block.title,
            )}</h2>${block.entries
              .map(
                entry =>
                  `<article><h3>${sanitizeText(entry.question)}</h3><p>${sanitizeText(entry.answer)}</p></article>`,
              )
              .join('')}</section>`;
          }

          return `<footer class="block footer">${sanitizeText(block.text)}</footer>`;
        })
        .join('')}
    </main>
  </body>
</html>`;
}

