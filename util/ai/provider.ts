import 'server-only';

import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

export const customOpenAIProvider = createOpenAICompatible({
  name: 'langbase',
  apiKey: process.env.CUSTOM_OPENAI_API_KEY!,
  baseURL: process.env.CUSTOM_OPENAI_BASE_URL!,
  includeUsage: false,
});
