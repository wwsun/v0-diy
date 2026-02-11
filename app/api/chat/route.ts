import type { MyUIMessage } from '@/util/chat-schema';
import { readChat, saveChat } from '@util/chat-store';
import {
  convertToModelMessages,
  generateId,
  stepCountIs,
  streamText,
} from 'ai';
import throttle from 'throttleit';
import { customOpenAIProvider } from '@/util/ai/provider';

const model = customOpenAIProvider('gpt-5');

export async function POST(req: Request) {
  const {
    message,
    id,
    trigger,
    messageId,
  }: {
    message: MyUIMessage | undefined;
    id: string;
    trigger: 'submit-message' | 'regenerate-message';
    messageId: string | undefined;
  } = await req.json();

  const chat = await readChat(id);
  let messages: MyUIMessage[] = chat.messages;

  if (trigger === 'submit-message') {
    if (messageId != null) {
      const messageIndex = messages.findIndex((m) => m.id === messageId);

      if (messageIndex === -1) {
        throw new Error(`message ${messageId} not found`);
      }

      messages = messages.slice(0, messageIndex);
      messages.push(message!);
    } else {
      messages = [...messages, message!];
    }
  } else if (trigger === 'regenerate-message') {
    const messageIndex =
      messageId == null
        ? messages.length - 1
        : messages.findIndex((message) => message.id === messageId);

    if (messageIndex === -1) {
      throw new Error(`message ${messageId} not found`);
    }

    // set the messages to the message before the assistant message
    messages = messages.slice(
      0,
      messages[messageIndex].role === 'assistant'
        ? messageIndex
        : messageIndex + 1,
    );
  }

  // save the user message
  saveChat({ id, messages });

  const userStopSignal = new AbortController();
  let currentMessageId: string | null = null;
  let accumulatedText = '';

  const result = streamText({
    model,
    messages: await convertToModelMessages(messages),
    tools: {},
    providerOptions: {
      langbase: {
        reasoningEffort: 'high',
      },
    },
    stopWhen: stepCountIs(5),
    abortSignal: userStopSignal.signal,
    // throttle reading from chat store to max once per second
    onChunk: throttle(async ({ chunk }) => {
      const { canceledAt } = await readChat(id);
      if (canceledAt) {
        userStopSignal.abort();
        return;
      }

      // Accumulate text and save incrementally
      if (chunk.type === 'text-delta') {
        accumulatedText += chunk.textDelta;
        if (currentMessageId) {
          saveChat({
            id,
            messages,
          });
        }
      }
    }, 500), // Save every 500ms
    onAbort: () => {
      console.log('aborted');
    },
  });

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    generateMessageId: () => {
      const msgId = generateId();
      currentMessageId = msgId;
      return msgId;
    },
    messageMetadata: ({ part }) => {
      if (part.type === 'start') {
        return { createdAt: Date.now() };
      }
    },
    onFinish: ({ messages }) => {
      saveChat({ id, messages });
    },
  });
}
