import { generateId } from 'ai';
import { existsSync, rmSync } from 'fs';
import { readdir, readFile, writeFile } from 'fs/promises';
import type { ChatData, MyUIMessage, WorkspacePagesMeta } from './chat-schema';
import {
  ensureWorkspaceDir,
  getChatWorkspaceDir,
  getWorkspaceFilePath,
  getWorkspacesRoot,
} from './workspace';

export async function createChat(): Promise<string> {
  const id = generateId();
  await writeChat(createBlankChat(id));
  return id;
}

export async function saveChat({
  id,
  activeStreamId,
  messages,
  canceledAt,
  sdkSessionId,
  workspacePages,
}: {
  id: string;
  activeStreamId?: string | null;
  messages?: MyUIMessage[];
  canceledAt?: number | null;
  sdkSessionId?: string;
  workspacePages?: Partial<WorkspacePagesMeta>;
}): Promise<boolean> {
  const chat = await readChatIfExists(id);
  if (!chat) return false;

  if (messages !== undefined) chat.messages = messages;
  if (activeStreamId !== undefined) chat.activeStreamId = activeStreamId;
  if (canceledAt !== undefined) chat.canceledAt = canceledAt;
  if (sdkSessionId !== undefined) chat.sdkSessionId = sdkSessionId;
  if (workspacePages !== undefined) {
    chat.workspacePages = { ...chat.workspacePages, ...workspacePages };
  }

  await writeChat(chat);
  return true;
}

export async function readChat(id: string): Promise<ChatData> {
  const existingChat = await readChatIfExists(id);
  if (existingChat) return existingChat;
  const blankChat = createBlankChat(id);
  await writeChat(blankChat);
  return blankChat;
}

export async function readChatIfExists(id: string): Promise<ChatData | null> {
  const chatFile = getChatFilePath(id);
  if (!existsSync(chatFile)) return null;

  const raw = JSON.parse(await readFile(chatFile, 'utf8')) as Partial<ChatData>;
  return {
    id: raw.id ?? id,
    messages: raw.messages ?? [],
    sdkSessionId: raw.sdkSessionId,
    workspacePages: {
      activeSnapshotId: raw.workspacePages?.activeSnapshotId ?? null,
    },
    createdAt: raw.createdAt ?? Date.now(),
    activeStreamId: raw.activeStreamId ?? null,
    canceledAt: raw.canceledAt ?? null,
  };
}

export async function readAllChats(): Promise<ChatData[]> {
  const workspacesRoot = getWorkspacesRoot();
  if (!existsSync(workspacesRoot)) return [];

  const entries = await readdir(workspacesRoot, { withFileTypes: true });
  const chats = await Promise.all(
    entries
      .filter(e => e.isDirectory())
      .map(e => readChatIfExists(e.name)),
  );
  return chats.filter((c): c is ChatData => c !== null);
}

export async function deleteChat(id: string): Promise<boolean> {
  const chatFile = getChatFilePath(id);
  if (!existsSync(chatFile)) return false;
  rmSync(getChatWorkspaceDir(id), { recursive: true, force: true });
  return true;
}

function getChatFilePath(id: string): string {
  return getWorkspaceFilePath(id, 'chat.json');
}

async function writeChat(chat: ChatData): Promise<void> {
  ensureWorkspaceDir(chat.id);
  await writeFile(getChatFilePath(chat.id), JSON.stringify(chat, null, 2));
}

function createBlankChat(id: string): ChatData {
  return {
    id,
    messages: [],
    workspacePages: { activeSnapshotId: null },
    createdAt: Date.now(),
    activeStreamId: null,
    canceledAt: null,
  };
}
