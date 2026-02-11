'use client';

import type { ArtifactVersion } from '@/util/chat-schema';

export default function PreviewPanel({
  artifact,
}: {
  artifact: ArtifactVersion | null;
}) {
  if (!artifact) {
    return (
      <aside className="flex h-full min-h-0 w-[360px] flex-col border-l border-slate-200 bg-slate-50">
        <div className="border-b border-slate-200 px-3 py-2">
          <h3 className="text-xs font-semibold text-slate-700">Mobile Preview</h3>
        </div>
        <div className="flex min-h-0 flex-1 items-center justify-center p-3">
          <p className="rounded-md border border-dashed border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
            No generated artifact yet.
          </p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex h-full min-h-0 w-[360px] flex-col border-l border-slate-200 bg-slate-50">
      <div className="border-b border-slate-200 px-3 py-2">
        <h3 className="text-xs font-semibold text-slate-700">Mobile Preview</h3>
        <p className="text-[11px] text-slate-500">{artifact.dsl.meta.title}</p>
      </div>

      <div className="min-h-0 flex-1 p-3">
        <div className="mx-auto h-full max-h-full w-[320px] overflow-hidden rounded-[20px] border border-slate-300 bg-white shadow-sm">
          <iframe
            title="Generated mobile preview"
            srcDoc={artifact.preview.html}
            sandbox="allow-scripts"
            className="h-full w-full border-0"
          />
        </div>
      </div>
    </aside>
  );
}
