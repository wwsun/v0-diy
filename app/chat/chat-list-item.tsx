'use client';

import { Check, MessageSquare, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

function formatChatLabel(createdAt: number): string {
  const now = new Date();
  const date = new Date(createdAt);

  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dateDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((nowDay.getTime() - dateDay.getTime()) / (1000 * 60 * 60 * 24));

  const timeStr = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });

  if (diffDays === 0) {
    return `今天 ${timeStr}`;
  } else if (diffDays < 7) {
    const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return `${dayNames[date.getDay()]} ${timeStr}`;
  } else {
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  }
}

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
        className={`flex items-center gap-1 rounded-lg text-xs transition-colors ${
          isActive
            ? 'bg-white/[0.08] text-white'
            : 'text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-200'
        }`}
      >
        <Link href={`/chat/${chatId}`} className="min-w-0 flex-1 px-3 py-2">
          <div className="flex items-center gap-2 truncate">
            <MessageSquare className="size-3.5 shrink-0 opacity-50" />
            <span className="truncate font-medium" suppressHydrationWarning>
              {formatChatLabel(createdAt)}
            </span>
          </div>
        </Link>

        {isConfirmingDelete ? (
          <div className="mr-1 flex items-center gap-0.5">
            <button
              type="button"
              aria-label="Confirm delete chat"
              disabled={isDeleting}
              className="inline-flex rounded-md p-1 text-rose-400 transition hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-40"
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
              className="inline-flex rounded-md p-1 text-zinc-500 transition hover:bg-white/[0.05] hover:text-zinc-300 disabled:cursor-not-allowed disabled:opacity-40"
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
            className={`mr-1 inline-flex rounded-md p-1 text-zinc-500 transition hover:bg-rose-500/10 hover:text-rose-400 disabled:cursor-not-allowed disabled:opacity-40 ${
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
