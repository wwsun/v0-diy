import 'server-only';

import { Codex, type Thread, type ThreadEvent, type ThreadItem } from '@openai/codex-sdk';
import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateId,
} from 'ai';
import type { AgentAdapter } from './types';

const codex = new Codex();

function getTextFromItem(item: ThreadItem): string {
  switch (item.type) {
    case 'agent_message':
      return item.text;
    case 'reasoning':
      return `[reasoning] ${item.text}`;
    case 'command_execution': {
      const exitCodeText =
        item.exit_code !== undefined ? ` (exit ${item.exit_code})` : '';
      return `[command:${item.status}] ${item.command}${exitCodeText}`;
    }
    case 'file_change': {
      const changes = item.changes
        .map(change => `${change.kind}:${change.path}`)
        .join(', ');
      return `[file_change:${item.status}] ${changes || 'none'}`;
    }
    case 'mcp_tool_call':
      return `[tool:${item.status}] ${item.server}/${item.tool}`;
    case 'web_search':
      return `[web_search] ${item.query}`;
    case 'todo_list':
      return `[todo] ${item.items
        .map(todo => `${todo.completed ? '✓' : '·'} ${todo.text}`)
        .join('; ')}`;
    case 'error':
      return `[error] ${item.message}`;
    default:
      return '[event] unsupported item';
  }
}

function getTextFromEvent(event: ThreadEvent): string | null {
  switch (event.type) {
    case 'turn.started':
      return '[codex] turn started';
    case 'turn.completed':
      return '[codex] turn completed';
    case 'turn.failed':
      return `[codex] turn failed: ${event.error.message}`;
    case 'item.started':
      return `[codex] item started: ${event.item.type}`;
    case 'item.updated':
      return `[codex] item updated: ${event.item.type}`;
    case 'item.completed':
      return getTextFromItem(event.item);
    case 'thread.started':
      return null;
    case 'error':
      return `[codex] ${event.message}`;
    default:
      return null;
  }
}

export const codexAdapter: AgentAdapter = {
  sdk: 'codex',
  async runAsUIMessageStream({ chat, messages, metadata, persist }) {
    const userText = [...messages]
      .reverse()
      .find(message => message.role === 'user')
      ?.parts.map(part => (part.type === 'text' ? part.text : ''))
      .join('')
      .trim();

    if (!userText) {
      const stream = createUIMessageStream({
        originalMessages: messages,
        generateId,
        execute: ({ writer }) => {
          const textId = generateId();
          writer.write({ type: 'text-start', id: textId });
          writer.write({
            type: 'text-delta',
            id: textId,
            delta: 'No user message found for Codex adapter.',
          });
          writer.write({ type: 'text-end', id: textId });
        },
        onFinish: ({ messages: finalMessages }) => {
          persist({ messages: finalMessages });
        },
      });

      return createUIMessageStreamResponse({ stream });
    }

    const stream = createUIMessageStream({
      originalMessages: messages,
      generateId,
      execute: async ({ writer }) => {
        writer.write({
          type: 'start',
          messageMetadata: metadata,
        });

        const textId = generateId();

        writer.write({ type: 'text-start', id: textId });
        writer.write({
          type: 'text-delta',
          id: textId,
          delta: '[codex] starting...\n',
        });

        let hadVisibleEvent = false;

        try {
          let thread: Thread;
          if (chat.agentRuntimeState.codexThreadId) {
            thread = codex.resumeThread(chat.agentRuntimeState.codexThreadId, {
              sandboxMode: 'read-only',
              approvalPolicy: 'never',
              networkAccessEnabled: false,
            });
          } else {
            thread = codex.startThread({
              sandboxMode: 'read-only',
              approvalPolicy: 'never',
              networkAccessEnabled: false,
              workingDirectory: process.cwd(),
            });
          }

          const { events } = await thread.runStreamed(userText);

          for await (const event of events) {
            if (event.type === 'thread.started') {
              await persist({
                agentRuntimeState: {
                  ...chat.agentRuntimeState,
                  codexThreadId: event.thread_id,
                },
              });

              continue;
            }

            const text = getTextFromEvent(event);
            if (!text) {
              continue;
            }

            hadVisibleEvent = true;

            writer.write({
              type: 'text-delta',
              id: textId,
              delta: `${text}\n`,
            });
          }

          if (!hadVisibleEvent) {
            writer.write({
              type: 'text-delta',
              id: textId,
              delta:
                '[codex] no stream events were emitted. Please retry or switch SDK.\n',
            });
          }
        } catch (error) {
          writer.write({
            type: 'text-delta',
            id: textId,
            delta: `Codex execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          });
        }

        writer.write({ type: 'text-end', id: textId });
      },
      onFinish: ({ messages: finalMessages }) => {
        return persist({ messages: finalMessages });
      },
      onError: error => {
        console.error(error);
        return 'An error occurred.';
      },
    });

    return createUIMessageStreamResponse({ stream });
  },
};
