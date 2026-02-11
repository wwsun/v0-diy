import 'server-only';

import type { MyMessageMetadata } from '@/util/chat-schema';
import { customOpenAIProvider } from '@/util/ai/provider';
import { InferAgentUIMessage, ToolLoopAgent, stepCountIs, tool } from 'ai';
import { z } from 'zod';

const model = customOpenAIProvider('gpt-5');

const currentTimeTool = tool({
  description: 'Get the current time in a timezone',
  inputSchema: z.object({
    timezone: z.string().optional(),
  }),
  execute: async ({ timezone }) => {
    const now = new Date();
    const requestedTimezone = timezone ?? 'UTC';
    let resolvedTimezone = requestedTimezone;

    const locale = (() => {
      try {
        return new Intl.DateTimeFormat('en-US', {
          dateStyle: 'full',
          timeStyle: 'long',
          timeZone: requestedTimezone,
        }).format(now);
      } catch {
        resolvedTimezone = 'UTC';
        return new Intl.DateTimeFormat('en-US', {
          dateStyle: 'full',
          timeStyle: 'long',
          timeZone: resolvedTimezone,
        }).format(now);
      }
    })();

    return {
      iso: now.toISOString(),
      timezone: resolvedTimezone,
      locale,
    };
  },
});

const calculateTool = tool({
  description: 'Perform a basic arithmetic operation with two numbers',
  inputSchema: z.object({
    operation: z.enum(['add', 'subtract', 'multiply', 'divide']),
    a: z.number(),
    b: z.number(),
  }),
  execute: async ({ operation, a, b }) => {
    if (operation === 'divide' && b === 0) {
      return {
        ok: false,
        error: 'Division by zero is not allowed.',
      };
    }

    const result =
      operation === 'add'
        ? a + b
        : operation === 'subtract'
          ? a - b
          : operation === 'multiply'
            ? a * b
            : a / b;

    return {
      ok: true,
      operation,
      a,
      b,
      result,
    };
  },
});

export const chatAgent = new ToolLoopAgent({
  model,
  instructions: `You are a helpful assistant.

When users ask for time/date info, prefer using the currentTime tool.
When users ask for arithmetic, prefer using the calculate tool.
If tools are not needed, answer normally and keep responses concise.`,
  tools: {
    currentTime: currentTimeTool,
    calculate: calculateTool,
  },
  providerOptions: {
    langbase: {
      reasoningEffort: 'high',
    },
  },
  stopWhen: stepCountIs(8),
});

export type ChatAgentUIMessage = InferAgentUIMessage<
  typeof chatAgent,
  MyMessageMetadata
>;
