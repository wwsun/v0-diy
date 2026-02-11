import type {
  AgentSdk,
  ChatAgentRuntimeState,
  ChatData,
  MyMessageMetadata,
  MyUIMessage,
} from '@/util/chat-schema';

export type AgentAdapterContext = {
  chat: ChatData;
  messages: MyUIMessage[];
  metadata: MyMessageMetadata;
  persist: (updates: {
    messages?: MyUIMessage[];
    agentRuntimeState?: ChatAgentRuntimeState;
    builderContext?: Partial<ChatData['builderContext']>;
    artifacts?: ChatData['artifacts'];
  }) => Promise<void>;
};

export interface AgentAdapter {
  sdk: AgentSdk;
  runAsUIMessageStream(context: AgentAdapterContext): Promise<Response>;
}
