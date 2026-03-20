import type { ChatData, MyMessageMetadata, MyUIMessage } from '@/util/chat-schema';

export type AdapterContext = {
  chat: ChatData;
  messages: MyUIMessage[];
  metadata: MyMessageMetadata;
  persist: (updates: {
    messages?: MyUIMessage[];
    workspacePages?: { activeSnapshotId: string | null };
    sdkSessionId?: string;
  }) => Promise<void>;
};

export interface AgentAdapter {
  runAsUIMessageStream(context: AdapterContext): Promise<Response>;
}
