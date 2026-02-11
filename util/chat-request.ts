import type { ChatMode, MyUIMessage } from '@/util/chat-schema';

export function applyMessageTrigger({
  messages,
  trigger,
  message,
  messageId,
}: {
  messages: MyUIMessage[];
  trigger: 'submit-message' | 'regenerate-message';
  message: MyUIMessage | undefined;
  messageId: string | undefined;
}): MyUIMessage[] {
  if (trigger === 'submit-message') {
    if (messageId != null) {
      const messageIndex = messages.findIndex(m => m.id === messageId);

      if (messageIndex === -1) {
        throw new Error(`message ${messageId} not found`);
      }

      return [...messages.slice(0, messageIndex), message!];
    }

    return [...messages, message!];
  }

  const messageIndex =
    messageId == null
      ? messages.length - 1
      : messages.findIndex(messageItem => messageItem.id === messageId);

  if (messageIndex === -1) {
    throw new Error(`message ${messageId} not found`);
  }

  return messages.slice(
    0,
    messages[messageIndex].role === 'assistant' ? messageIndex : messageIndex + 1,
  );
}

export function isValidChatMode(mode: unknown): mode is ChatMode {
  return mode === 'chat' || mode === 'agent';
}

