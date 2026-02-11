import { generateId } from 'ai';
import type {
  ArtifactVersion,
  ChatArtifacts,
  ChatData,
  MyUIMessage,
} from '@/util/chat-schema';
import type { CampaignDslV1 } from '@/util/builder-schema';
import { appendArtifactVersion } from '@/util/chat-store';
import { compileCampaignDsl } from './dsl-compiler';
import { buildPreviewHtml } from './preview-html';

export function createArtifactVersion({
  dsl,
  summary,
  sourceMessageId,
}: {
  dsl: CampaignDslV1;
  summary: string;
  sourceMessageId: string;
}): ArtifactVersion {
  const compiled = compileCampaignDsl(dsl);
  const html = buildPreviewHtml({ dsl, compiled });

  return {
    id: generateId(),
    createdAt: Date.now(),
    dsl,
    compiled: {
      jsxCode: compiled.jsxCode,
      cssCode: compiled.cssCode,
    },
    preview: {
      html,
      sandboxPolicy: 'allow-scripts',
    },
    summary,
    sourceMessageId,
  };
}

export async function persistArtifactVersion({
  chat,
  artifact,
  messages,
  persist,
}: {
  chat: ChatData;
  artifact: ArtifactVersion;
  messages?: MyUIMessage[];
  persist?: (updates: {
    messages?: MyUIMessage[];
    artifacts?: ChatArtifacts;
  }) => Promise<void>;
}): Promise<boolean> {
  const ok = await appendArtifactVersion({
    id: chat.id,
    artifact,
  });

  if (!ok) {
    return false;
  }

  if (persist) {
    await persist({
      messages,
      artifacts: {
        activeArtifactId: artifact.id,
        versions: [...chat.artifacts.versions, artifact],
      },
    });
  }

  return true;
}
