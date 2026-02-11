import { generateId } from 'ai';
import { existsSync, mkdirSync } from 'fs';
import { readdir, readFile, unlink, writeFile } from 'fs/promises';
import path from 'path';
import {
  AgentSdk,
  ChatAgentRuntimeState,
  ChatData,
  ChatMode,
  MyUIMessage,
} from './chat-schema';

// example implementation for demo purposes
// in a real app, you would save the chat to a database
// and use the id from the database entry

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
  mode,
  agentSdk,
  agentRuntimeState,
}: {
  id: string;
  activeStreamId?: string | null;
  messages?: MyUIMessage[];
  canceledAt?: number | null;
  mode?: ChatMode;
  agentSdk?: AgentSdk;
  agentRuntimeState?: ChatAgentRuntimeState;
}): Promise<boolean> {
  const chat = await readChatIfExists(id);

  if (!chat) {
    return false;
  }

  if (messages !== undefined) {
    chat.messages = messages;
  }

  if (activeStreamId !== undefined) {
    chat.activeStreamId = activeStreamId;
  }

  if (canceledAt !== undefined) {
    chat.canceledAt = canceledAt;
  }

  if (mode !== undefined) {
    chat.mode = mode;
  }

  if (agentSdk !== undefined) {
    chat.agentSdk = agentSdk;
  }

  if (agentRuntimeState !== undefined) {
    chat.agentRuntimeState = agentRuntimeState;
  }

  await writeChat(chat);
  return true;
}

export async function appendMessageToChat({
  id,
  message,
}: {
  id: string;
  message: MyUIMessage;
}): Promise<void> {
  const chat = (await readChatIfExists(id)) ?? createBlankChat(id);
  chat.messages.push(message);
  await writeChat(chat);
}

async function writeChat(chat: ChatData) {
  await ensureChatDir();
  await writeFile(getChatFilePath(chat.id), JSON.stringify(chat, null, 2));
}

export async function readChat(id: string): Promise<ChatData> {
  const existingChat = await readChatIfExists(id);
  if (existingChat) {
    return existingChat;
  }

  const blankChat = createBlankChat(id);
  await writeChat(blankChat);
  return blankChat;
}

export async function readChatIfExists(id: string): Promise<ChatData | null> {
  const chatFile = getChatFilePath(id);

  if (!existsSync(chatFile)) {
    return null;
  }

  const chat = JSON.parse(await readFile(chatFile, 'utf8')) as Partial<ChatData>;

  return {
    id: chat.id ?? id,
    messages: chat.messages ?? [],
    mode: chat.mode === 'agent' ? 'agent' : 'chat',
    agentSdk: chat.agentSdk === 'codex' ? 'codex' : 'vercel-ai',
    agentRuntimeState: {
      codexThreadId: chat.agentRuntimeState?.codexThreadId ?? null,
    },
    createdAt: chat.createdAt ?? Date.now(),
    activeStreamId: chat.activeStreamId ?? null,
    canceledAt: chat.canceledAt ?? null,
  };
}

export async function readAllChats(): Promise<ChatData[]> {
  const chatDir = getChatDir();

  if (!existsSync(chatDir)) {
    return [];
  }

  const files = await readdir(chatDir, { withFileTypes: true });
  const chats = await Promise.all(
    files
      .filter(file => file.isFile() && file.name.endsWith('.json'))
      .map(async file => readChatIfExists(file.name.replace('.json', ''))),
  );

  return chats.filter((chat): chat is ChatData => chat !== null);
}

export async function deleteChat(id: string): Promise<boolean> {
  const chatFile = getChatFilePath(id);

  if (!existsSync(chatFile)) {
    return false;
  }

  await unlink(chatFile);
  return true;
}

function getChatDir(): string {
  return path.join(process.cwd(), '.chats');
}

async function ensureChatDir(): Promise<void> {
  const chatDir = getChatDir();
  if (!existsSync(chatDir)) mkdirSync(chatDir, { recursive: true });
}

function getChatFilePath(id: string): string {
  return path.join(getChatDir(), `${id}.json`);
}

function createBlankChat(id: string): ChatData {
  return {
    id,
    messages: [],
    mode: 'chat',
    agentSdk: 'vercel-ai',
    agentRuntimeState: {
      codexThreadId: null,
    },
    createdAt: Date.now(),
    activeStreamId: null,
    canceledAt: null,
  };
}
