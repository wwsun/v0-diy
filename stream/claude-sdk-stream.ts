import 'server-only';

import { createUIMessageStream, generateId } from 'ai';
import { readChatIfExists, saveChat } from '@/util/chat-store';

// 从 createUIMessageStream 签名提取 writer 类型，避免导入内部类型
type StreamWriter = Parameters<
  NonNullable<Parameters<typeof createUIMessageStream>[0]['execute']>
>[0]['writer'];

type BlockState =
  | { kind: 'text'; id: string }
  | { kind: 'thinking'; id: string }
  | { kind: 'tool_use'; toolCallId: string; toolName: string; inputBuffer: string };

export interface ProcessStreamEventsOptions {
  chatId: string;
  logPrefix: string;
  /** 自定义错误提示文本 */
  formatErrorMessage?: (error: unknown) => string;
  /** AbortController，用于超时或不可恢复错误时主动中断 query() */
  abortController?: AbortController;
}

/**
 * 处理 Claude Agent SDK query() 返回的事件流，映射为 UI Message Stream。
 */
export async function processClaudeStreamEvents(
  writer: StreamWriter,
  events: AsyncIterable<unknown>,
  options: ProcessStreamEventsOptions,
): Promise<void> {
  const { chatId, logPrefix, formatErrorMessage, abortController } = options;

  const blocks = new Map<number, BlockState>();
  const registeredToolCalls = new Set<string>();

  // 30 秒启动超时保护
  const QUERY_STARTUP_TIMEOUT_MS = 30_000;
  let startupTimer: ReturnType<typeof setTimeout> | undefined;
  if (abortController) {
    startupTimer = setTimeout(() => {
      console.error(`${logPrefix} query() 启动超时（${QUERY_STARTUP_TIMEOUT_MS}ms），主动中断`);
      const errId = generateId();
      writer.write({ type: 'text-start', id: errId });
      writer.write({ type: 'text-delta', id: errId, delta: '\n\nAI 响应超时，请重试。' });
      writer.write({ type: 'text-end', id: errId });
      abortController.abort();
    }, QUERY_STARTUP_TIMEOUT_MS);
  }

  const flushBlocks = () => {
    blocks.forEach((block) => {
      if (block.kind === 'text') {
        writer.write({ type: 'text-end', id: block.id });
      } else if (block.kind === 'thinking') {
        writer.write({ type: 'reasoning-end', id: block.id });
      } else if (block.kind === 'tool_use') {
        let input: unknown = {};
        try { input = JSON.parse(block.inputBuffer || '{}'); } catch { input = {}; }
        registeredToolCalls.add(block.toolCallId);
        writer.write({ type: 'tool-input-available', toolCallId: block.toolCallId, toolName: block.toolName, input, dynamic: true });
      }
    });
    blocks.clear();
  };

  try {
    for await (const event of events) {
      if (startupTimer) {
        clearTimeout(startupTimer);
        startupTimer = undefined;
      }

      const e = event as Record<string, unknown>;
      const isKeyEvent = e.type === 'message_start' || e.type === 'message_stop' || e.type === 'system';
      if (isKeyEvent) {
        const currentChat = await readChatIfExists(chatId);
        if (!currentChat || currentChat.canceledAt) {
          flushBlocks();
          break;
        }
      }

      // 保存 SDK session ID 用于续传
      if (e.type === 'system' && e.subtype === 'init' && typeof e.session_id === 'string') {
        await saveChat({ id: chatId, sdkSessionId: e.session_id });
        continue;
      }

      // API 重试事件：认证/账单错误时中断
      if (e.type === 'system' && e.subtype === 'api_retry') {
        const sdkError = e.error as string | undefined;
        if (sdkError === 'authentication_failed') {
          flushBlocks();
          const errId = generateId();
          writer.write({ type: 'text-start', id: errId });
          writer.write({ type: 'text-delta', id: errId, delta: '\n\nAPI 认证失败，请检查 ANTHROPIC_API_KEY 配置。' });
          writer.write({ type: 'text-end', id: errId });
          abortController?.abort();
          break;
        }
        if (sdkError === 'billing_error') {
          flushBlocks();
          const errId = generateId();
          writer.write({ type: 'text-start', id: errId });
          writer.write({ type: 'text-delta', id: errId, delta: '\n\nAPI 账单异常，请检查账户状态。' });
          writer.write({ type: 'text-end', id: errId });
          abortController?.abort();
          break;
        }
        continue;
      }

      if (e.type === 'stream_event') {
        const sdkEvent = e.event as Record<string, unknown> | undefined;
        if (!sdkEvent) continue;

        if (sdkEvent.type === 'content_block_start') {
          const index = sdkEvent.index as number;
          const block = sdkEvent.content_block as Record<string, unknown>;

          if (block.type === 'text') {
            const id = generateId();
            blocks.set(index, { kind: 'text', id });
            writer.write({ type: 'text-start', id });
          } else if (block.type === 'thinking') {
            const id = generateId();
            blocks.set(index, { kind: 'thinking', id });
            writer.write({ type: 'reasoning-start', id });
          } else if (block.type === 'tool_use') {
            const toolCallId = (block.id as string) ?? generateId();
            const toolName = block.name as string;
            blocks.set(index, { kind: 'tool_use', toolCallId, toolName, inputBuffer: '' });
            writer.write({ type: 'tool-input-start', toolCallId, toolName, dynamic: true });
          }
          continue;
        }

        if (sdkEvent.type === 'content_block_delta') {
          const index = sdkEvent.index as number;
          const delta = sdkEvent.delta as Record<string, unknown>;
          const block = blocks.get(index);
          if (!block) continue;

          if (delta.type === 'text_delta' && block.kind === 'text') {
            writer.write({ type: 'text-delta', id: block.id, delta: delta.text as string });
          } else if (delta.type === 'thinking_delta' && block.kind === 'thinking') {
            writer.write({ type: 'reasoning-delta', id: block.id, delta: delta.thinking as string });
          } else if (delta.type === 'input_json_delta' && block.kind === 'tool_use') {
            const jsonDelta = (delta.partial_json as string) ?? '';
            block.inputBuffer += jsonDelta;
            writer.write({ type: 'tool-input-delta', toolCallId: block.toolCallId, inputTextDelta: jsonDelta });
          }
          continue;
        }

        if (sdkEvent.type === 'content_block_stop') {
          const index = sdkEvent.index as number;
          const block = blocks.get(index);
          if (block) {
            if (block.kind === 'text') {
              writer.write({ type: 'text-end', id: block.id });
            } else if (block.kind === 'thinking') {
              writer.write({ type: 'reasoning-end', id: block.id });
            } else if (block.kind === 'tool_use') {
              let input: unknown = {};
              try { input = JSON.parse(block.inputBuffer || '{}'); }
              catch { input = { _raw: block.inputBuffer }; }
              registeredToolCalls.add(block.toolCallId);
              writer.write({ type: 'tool-input-available', toolCallId: block.toolCallId, toolName: block.toolName, input, dynamic: true });
            }
            blocks.delete(index);
          }
          continue;
        }

        continue;
      }

      if (e.type === 'user') {
        const content = (e as { message?: { content?: unknown[] } }).message?.content;
        if (Array.isArray(content)) {
          for (const part of content as Record<string, unknown>[]) {
            if (part.type === 'tool_result') {
              const toolUseId = part.tool_use_id as string;
              if (!registeredToolCalls.has(toolUseId)) continue;
              let output: unknown = part.content;
              if (Array.isArray(output)) {
                output = (output as Record<string, unknown>[])
                  .map((c) => (c.type === 'text' ? c.text : JSON.stringify(c)))
                  .join('\n');
              }
              writer.write({ type: 'tool-output-available', toolCallId: toolUseId, output, dynamic: true });
            }
          }
        }
        continue;
      }

      if (e.type === 'result') {
        const subtype = e.subtype as string | undefined;
        if (subtype && subtype !== 'success') {
          flushBlocks();
          const errors = e.errors as string[] | undefined;
          const errText = errors?.join('; ') ?? '';
          const errId = generateId();
          let errorMsg = '\n\n请求异常，请重试。';
          if (subtype === 'error_max_turns') {
            errorMsg = '\n\nAI 已达到最大执行轮次，请简化需求后重新尝试。';
          } else if (formatErrorMessage) {
            errorMsg = formatErrorMessage(new Error(errText || subtype));
          }
          writer.write({ type: 'text-start', id: errId });
          writer.write({ type: 'text-delta', id: errId, delta: errorMsg });
          writer.write({ type: 'text-end', id: errId });
          console.error(`${logPrefix} result error: ${subtype}`, errors);
        }
        break;
      }
    }
  } catch (error) {
    const isCancel =
      (error instanceof DOMException && error.name === 'AbortError') ||
      (error instanceof Error &&
        (error.message.includes('Request interrupted') ||
          error.message.includes('aborted')));

    if (!isCancel) {
      const errId = generateId();
      const errorText = formatErrorMessage
        ? formatErrorMessage(error)
        : '\n\n[Claude 请求失败，请重试]';
      writer.write({ type: 'text-start', id: errId });
      writer.write({ type: 'text-delta', id: errId, delta: errorText });
      writer.write({ type: 'text-end', id: errId });
      console.error(`${logPrefix} stream error:`, error);
    }
  } finally {
    if (startupTimer) clearTimeout(startupTimer);
    flushBlocks();
  }
}

