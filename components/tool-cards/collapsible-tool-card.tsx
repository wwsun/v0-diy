'use client';

import { CheckCircle2, ChevronDown, ChevronUp, XCircle } from 'lucide-react';
import { type ReactNode, useEffect, useState } from 'react';

interface CollapsibleToolCardProps {
  state: string;
  headerContent: ReactNode | ((expanded: boolean) => ReactNode);
  children: ReactNode;
  defaultExpanded?: boolean;
}

export function CollapsibleToolCard({
  state,
  headerContent,
  children,
  defaultExpanded = false,
}: CollapsibleToolCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const isDone = state === 'output-available' || state === 'output-denied';
  const isError = state === 'output-error';

  useEffect(() => {
    if (isError) setExpanded(true);
  }, [isError]);

  const renderedHeader =
    typeof headerContent === 'function' ? headerContent(expanded) : headerContent;

  return (
    <div className="rounded-lg overflow-hidden text-xs my-1 border border-zinc-100">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full text-left bg-zinc-50 hover:bg-zinc-100 transition-colors"
      >
        <div className="flex items-center gap-2 px-2 py-1.5">
          {renderedHeader}
          <span className="ml-auto flex items-center gap-1 flex-shrink-0">
            {isDone ? (
              <CheckCircle2 className="w-3 h-3 text-zinc-400" />
            ) : isError ? (
              <XCircle className="w-3 h-3 text-red-400" />
            ) : (
              <PulsingDot />
            )}
            {expanded ? (
              <ChevronUp className="w-3 h-3 text-zinc-400" />
            ) : (
              <ChevronDown className="w-3 h-3 text-zinc-400" />
            )}
          </span>
        </div>
      </button>

      <div
        className={`grid transition-all duration-200 ease-in-out ${
          expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="bg-white border-t border-zinc-100 px-3 py-2 space-y-2 max-h-[300px] overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function PulsingDot() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
    </span>
  );
}
