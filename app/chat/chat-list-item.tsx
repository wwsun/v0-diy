'use client';

import { Check, MessageSquare, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function ChatListItem({
  chatId,
  createdAt,
  isActive,
}: {
  chatId: string;
  createdAt: number;
  isActive: boolean;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/chat/${chatId}`, {
        method: 'DELETE',
      });

      if (!response.ok && response.status !== 404) {
        throw new Error('Failed to delete chat');
      }

      if (isActive) {
        router.push('/');
        return;
      }

      setIsDeleted(true);
      router.refresh();
    } catch (error) {
      console.error(error);
      window.alert('Failed to delete chat. Please try again.');
      setIsDeleting(false);
      setIsConfirmingDelete(false);
    }
  };

  if (isDeleted) {
    return null;
  }

  return (
    <li className="group">
      <div
        className={`flex items-center gap-1 rounded-md border text-xs transition ${
          isActive
            ? 'border-slate-300 bg-white text-slate-900'
            : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-white'
        }`}
      >
        <Link href={`/chat/${chatId}`} className="min-w-0 flex-1 px-2.5 py-2">
          <div className="flex items-center gap-1.5 truncate font-medium">
            <MessageSquare className="size-3.5 shrink-0 text-slate-400" />
            <span className="truncate">{chatId}</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            <time suppressHydrationWarning>
              {new Date(createdAt).toLocaleString()}
            </time>
          </div>
        </Link>

        {isConfirmingDelete ? (
          <div className="mr-1 flex items-center gap-1">
            <button
              type="button"
              aria-label="Confirm delete chat"
              disabled={isDeleting}
              className="inline-flex rounded-md p-1 text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
              onClick={async event => {
                event.preventDefault();
                event.stopPropagation();
                await handleDelete();
              }}
            >
              <Check className="size-3.5" />
            </button>

            <button
              type="button"
              aria-label="Cancel delete chat"
              disabled={isDeleting}
              className="inline-flex rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
              onClick={event => {
                event.preventDefault();
                event.stopPropagation();
                setIsConfirmingDelete(false);
              }}
            >
              <X className="size-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            aria-label="Delete chat"
            disabled={isDeleting}
            className={`mr-1 inline-flex rounded-md p-1 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40 ${
              isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
            onClick={event => {
              event.preventDefault();
              event.stopPropagation();
              setIsConfirmingDelete(true);
            }}
          >
            <Trash2 className="size-3.5" />
          </button>
        )}
      </div>
    </li>
  );
}

