'use client';

import type { ArtifactVersion } from '@/util/chat-schema';
import { useState } from 'react';

type PreviewView = 'preview' | 'code';

export default function PreviewPanel({
  artifact,
}: {
  artifact: ArtifactVersion | null;
}) {
  const [view, setView] = useState<PreviewView>('preview');

  return (
    <aside className="flex h-full min-h-0 w-[360px] flex-col border-l border-slate-200 bg-slate-50">
      <div className="border-b border-slate-200 px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-semibold text-slate-700">Mobile Preview</h3>
            <p className="text-[11px] text-slate-500">
              {artifact ? artifact.dsl.meta.title : 'No generated artifact yet.'}
            </p>
          </div>

          <div className="inline-flex rounded-md border border-slate-300 bg-white p-0.5">
            <button
              type="button"
              onClick={() => setView('preview')}
              className={`rounded px-2 py-1 text-[11px] font-medium transition ${
                view === 'preview'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Preview
            </button>
            <button
              type="button"
              onClick={() => setView('code')}
              className={`rounded px-2 py-1 text-[11px] font-medium transition ${
                view === 'code'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Code
            </button>
          </div>
        </div>
      </div>

      {view === 'preview' ? (
        <div className="min-h-0 flex-1 p-3">
          {!artifact ? (
            <div className="flex h-full items-center justify-center">
              <p className="rounded-md border border-dashed border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
                No generated artifact yet.
              </p>
            </div>
          ) : (
            <div className="mx-auto h-full max-h-full w-[320px] overflow-hidden rounded-[20px] border border-slate-300 bg-white shadow-sm">
              <iframe
                title="Generated mobile preview"
                srcDoc={artifact.preview.html}
                sandbox={artifact.preview.sandboxPolicy || 'allow-scripts'}
                className="h-full w-full border-0"
              />
            </div>
          )}
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {!artifact ? (
            <div className="flex h-full items-center justify-center">
              <p className="rounded-md border border-dashed border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
                No generated code yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <section>
                <h4 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  JSX
                </h4>
                <pre className="overflow-x-auto rounded-md border border-slate-200 bg-white p-2 text-[11px] leading-5 text-slate-800">
                  <code>{artifact.compiled.jsxCode || '// No JSX generated'}</code>
                </pre>
              </section>

              <section>
                <h4 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  CSS
                </h4>
                <pre className="overflow-x-auto rounded-md border border-slate-200 bg-white p-2 text-[11px] leading-5 text-slate-800">
                  <code>{artifact.compiled.cssCode || '/* No CSS generated */'}</code>
                </pre>
              </section>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
