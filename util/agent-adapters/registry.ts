import type { AgentSdk } from '@/util/chat-schema';
import { codexAdapter } from './codex-adapter';
import type { AgentAdapter } from './types';
import { vercelAiAdapter } from './vercel-ai-adapter';

const adapters: Record<AgentSdk, AgentAdapter> = {
  'vercel-ai': vercelAiAdapter,
  codex: codexAdapter,
};

export function getAgentAdapter(sdk: AgentSdk): AgentAdapter {
  return adapters[sdk];
}

