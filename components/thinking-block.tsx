'use client';

import { ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';
import { useLayoutEffect, useRef, useState } from 'react';

interface ThinkingBlockProps {
  content: string;
  isStreaming?: boolean;
}

const shimmerKeyframes = `
@keyframes thinkingShimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
`;

export function ThinkingBlock({ content, isStreaming }: ThinkingBlockProps) {
  const [expanded, setExpanded] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const preview = content.slice(0, 100) + (content.length > 100 ? '...' : '');

  useLayoutEffect(() => {
    if (isStreaming && expanded && contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [isStreaming, expanded, content]);

  return (
    <>
      {isStreaming && <style>{shimmerKeyframes}</style>}
      <div className="my-1 rounded-lg overflow-hidden bg-zinc-50 text-xs border border-zinc-100">
        <button
          onClick={() => setExpanded((e) => !e)}
          className="w-full text-left px-3 py-2 hover:bg-zinc-100 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Lightbulb className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            {isStreaming ? (
              <span className="relative inline-block font-medium text-zinc-500">
                <span>思考中...</span>
                <span
                  aria-hidden
                  className="absolute inset-0 text-zinc-500"
                  style={{
                    background:
                      'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)',
                    backgroundSize: '200% 100%',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    animation: 'thinkingShimmer 2s ease-in-out infinite',
                  }}
                >
                  思考中...
                </span>
              </span>
            ) : (
              <span className="font-medium text-zinc-500">
                {expanded ? '收起思路' : '显示思路'}
              </span>
            )}
            {!isStreaming && (
              expanded ? (
                <ChevronUp className="w-3 h-3 text-zinc-400 ml-auto" />
              ) : (
                <ChevronDown className="w-3 h-3 text-zinc-400 ml-auto" />
              )
            )}
          </div>
          {!expanded && !isStreaming && content && (
            <p className="mt-1 text-zinc-400 italic text-[11px] leading-4">
              {preview}
            </p>
          )}
        </button>

        <div
          className={`grid transition-all duration-200 ease-in-out ${
            expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className="overflow-hidden">
            <div
              ref={contentRef}
              className={`bg-white border-t border-zinc-100 px-3 py-2 text-zinc-500 italic whitespace-pre-wrap text-[11px] leading-5 ${
                isStreaming ? 'overflow-visible' : 'max-h-[250px] overflow-y-auto'
              }`}
            >
              {content}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
