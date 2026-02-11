import { activateArtifactVersion, readChatIfExists } from '@util/chat-store';

export async function GET(
  _req: Request,
  {
    params,
  }: {
    params: Promise<{ id: string; artifactId: string }>;
  },
) {
  const { id, artifactId } = await params;
  const chat = await readChatIfExists(id);

  if (!chat) {
    return Response.json({ ok: false, error: 'not_found' }, { status: 404 });
  }

  const artifact = chat.artifacts.versions.find(
    version => version.id === artifactId,
  );

  if (!artifact) {
    return Response.json(
      { ok: false, error: 'artifact_not_found' },
      { status: 404 },
    );
  }

  return Response.json({
    ok: true,
    artifact,
    isActive: chat.artifacts.activeArtifactId === artifactId,
  });
}

export async function POST(
  _req: Request,
  {
    params,
  }: {
    params: Promise<{ id: string; artifactId: string }>;
  },
) {
  const { id, artifactId } = await params;
  const ok = await activateArtifactVersion({ id, artifactId });

  if (!ok) {
    return Response.json(
      { ok: false, error: 'artifact_not_found' },
      { status: 404 },
    );
  }

  return Response.json({ ok: true, artifactId });
}

