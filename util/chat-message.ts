import type { MyUIMessage } from './chat-schema';
import { generateId } from 'ai';

export function ensureMessageIds(messages: MyUIMessage[]): MyUIMessage[] {
  return messages.map(message => {
    if (typeof message.id === 'string' && message.id.length > 0) {
      return message;
    }

    return {
      ...message,
      id: generateId(),
    } as MyUIMessage;
  });
}

