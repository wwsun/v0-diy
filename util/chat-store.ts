import { generateId } from 'ai';
import { existsSync, mkdirSync } from 'fs';
import { readdir, readFile, unlink, writeFile } from 'fs/promises';
import path from 'path';
import {
  AgentSdk,
  ArtifactVersion,
  ChatAgentRuntimeState,
  ChatArtifacts,
  ChatBuilderContext,
  ChatData,
  ChatMode,
  MyUIMessage,
  createDefaultBuilderConfig,
  createEmptyArtifacts,
} from './chat-schema';
import { mergeBuilderContext } from './builder-schema';
import type { BuilderContextPatch } from './builder-schema';

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
  builderContext,
  artifacts,
}: {
  id: string;
  activeStreamId?: string | null;
  messages?: MyUIMessage[];
  canceledAt?: number | null;
  mode?: ChatMode;
  agentSdk?: AgentSdk;
  agentRuntimeState?: ChatAgentRuntimeState;
  builderContext?: BuilderContextPatch;
  artifacts?: ChatArtifacts;
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

  if (builderContext !== undefined) {
    chat.builderContext = mergeBuilderContext(chat.builderContext, builderContext);
  }

  if (artifacts !== undefined) {
    chat.artifacts = artifacts;
  }

  await writeChat(chat);
  return true;
}

export async function appendArtifactVersion({
  id,
  artifact,
}: {
  id: string;
  artifact: ArtifactVersion;
}): Promise<boolean> {
  const chat = await readChatIfExists(id);

  if (!chat) {
    return false;
  }

  chat.artifacts.versions.push(artifact);
  chat.artifacts.activeArtifactId = artifact.id;

  await writeChat(chat);
  return true;
}

export async function activateArtifactVersion({
  id,
  artifactId,
}: {
  id: string;
  artifactId: string;
}): Promise<boolean> {
  const chat = await readChatIfExists(id);

  if (!chat) {
    return false;
  }

  const hasArtifact = chat.artifacts.versions.some(
    version => version.id === artifactId,
  );

  if (!hasArtifact) {
    return false;
  }

  chat.artifacts.activeArtifactId = artifactId;
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
    agentSdk: chat.agentSdk === 'vercel-ai' ? 'vercel-ai' : 'codex',
    agentRuntimeState: {
      codexThreadId: chat.agentRuntimeState?.codexThreadId ?? null,
    },
    builderContext: normalizeBuilderContext(chat.builderContext),
    artifacts: normalizeArtifacts(chat.artifacts),
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
    agentSdk: 'codex',
    agentRuntimeState: {
      codexThreadId: null,
    },
    builderContext: createDefaultBuilderConfig(),
    artifacts: createEmptyArtifacts(),
    createdAt: Date.now(),
    activeStreamId: null,
    canceledAt: null,
  };
}

function normalizeBuilderContext(
  builderContext: ChatBuilderContext | undefined,
): ChatBuilderContext {
  if (!builderContext) {
    return createDefaultBuilderConfig();
  }

  return mergeBuilderContext(createDefaultBuilderConfig(), builderContext);
}

function normalizeArtifacts(artifacts: ChatArtifacts | undefined): ChatArtifacts {
  if (!artifacts) {
    return createEmptyArtifacts();
  }

  return {
    activeArtifactId: artifacts.activeArtifactId ?? null,
    versions: artifacts.versions ?? [],
  };
}
