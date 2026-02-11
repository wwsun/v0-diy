'use client';

import type { ArtifactVersion } from '@/util/chat-schema';
import { Layers, RotateCcw } from 'lucide-react';

export default function ArtifactCard({
  artifact,
  isActive,
  onActivate,
  disabled = false,
}: {
  artifact: ArtifactVersion;
  isActive: boolean;
  onActivate: (artifactId: string) => void;
  disabled?: boolean;
}) {
  return (
    <article className="rounded-md border border-violet-200 bg-violet-50 px-3 py-2.5 text-xs text-slate-700">
      <header className="mb-2 flex items-start justify-between gap-2">
        <div>
          <h4 className="inline-flex items-center gap-1 text-sm font-semibold text-violet-900">
            <Layers className="size-3.5" />
            Artifact Version
          </h4>
          <p className="text-[11px] text-violet-700">ID: {artifact.id}</p>
        </div>
        <span
          className={`rounded px-2 py-0.5 text-[11px] font-medium ${
            isActive
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-slate-200 text-slate-600'
          }`}
        >
          {isActive ? 'Active' : 'History'}
        </span>
      </header>

      <p className="line-clamp-2 text-[12px] text-slate-700">{artifact.summary}</p>
      <p className="mt-1 text-[11px] text-slate-500">{artifact.dsl.meta.title}</p>

      <div className="mt-2 flex items-center justify-between">
        <time className="text-[11px] text-slate-500" suppressHydrationWarning>
          {new Date(artifact.createdAt).toLocaleString()}
        </time>

        <button
          type="button"
          onClick={() => onActivate(artifact.id)}
          disabled={disabled || isActive}
          className="inline-flex items-center gap-1 rounded border border-violet-300 bg-white px-2 py-1 text-[11px] font-medium text-violet-700 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RotateCcw className="size-3.5" />
          {isActive ? 'Using' : 'Activate'}
        </button>
      </div>
    </article>
  );
}

