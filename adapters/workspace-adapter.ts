import 'server-only';

import path from 'path';
import {
  query,
  tool,
  createSdkMcpServer,
} from '@anthropic-ai/claude-agent-sdk';
import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateId,
} from 'ai';
import { z } from 'zod';
import { saveChat } from '@/util/chat-store';
import {
  getChatWorkspaceDir,
  ensureWorkspaceDir,
} from '@/util/workspace';
import { processClaudeStreamEvents } from '@/stream/claude-sdk-stream';
import { registerAbort, unregisterAbort } from '@/stream/abort-registry';
import type { AgentAdapter } from './types';
import type { ChatData } from '@/util/chat-schema';

// agent/ 目录：存放 CLAUDE.md 和 .claude/skills/，SDK 通过 settingSources 自动加载
const AGENT_DIR = path.resolve(process.cwd(), 'agent');

function buildSystemPrompt(chat: ChatData): string {
  const workspaceDir = getChatWorkspaceDir(chat.id);
  const hasExistingPage = chat.workspacePages?.activeSnapshotId !== null;
  return [
    '## 工作环境',
    '',
    `- **目标文件**：\`${workspaceDir}/index.html\`（使用 Write/Edit 操作此绝对路径）`,
    `- **状态**：${hasExistingPage ? '已有生成的页面，可读取后修改' : '首次生成，请从头创建 index.html'}`,
  ].join('\n');
}

export const workspaceAdapter: AgentAdapter = {
  async runAsUIMessageStream({ chat, messages, metadata, persist }) {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
    const lastUserContent = lastUserMessage
      ? lastUserMessage.parts
          .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
          .map((p) => p.text)
          .join('\n')
      : '';

    ensureWorkspaceDir(chat.id);

    // 内置 notify_preview 工具
    const agentServer = createSdkMcpServer({
      name: 'agent',
      version: '1.0.0',
      tools: [
        tool(
          'notify_preview',
          '页面文件写入完毕后调用，通知系统刷新预览',
          {
            summary: z.string().describe('本次生成内容的简洁描述（20字以内）'),
          },
          async ({ summary }) => {
            try {
              const snapshotId = Date.now().toString();
              await saveChat({
                id: chat.id,
                workspacePages: { activeSnapshotId: snapshotId },
              });
              console.log(`[workspace-adapter] notify_preview: ${summary}, snapshotId: ${snapshotId}`);
              return {
                content: [{ type: 'text' as const, text: `snapshot_id:${snapshotId}` }],
              };
            } catch (error) {
              const message = error instanceof Error ? error.message : String(error);
              throw new Error(`快照保存失败：${message}`);
            }
          },
        ),
      ],
    });

    const stream = createUIMessageStream({
      originalMessages: messages,
      generateId,
      execute: async ({ writer }) => {
        writer.write({ type: 'start', messageMetadata: metadata });

        // 如果有已有 sdkSessionId 但没有 assistant 消息，清除（防止 stale session）
        let sdkSessionId = chat.sdkSessionId;
        if (sdkSessionId && !messages.some((m) => m.role === 'assistant')) {
          sdkSessionId = undefined;
        }

        const abortController = registerAbort(chat.id);

        try {
          await processClaudeStreamEvents(
            writer,
            query({
              prompt: lastUserContent || '你好',
              options: {
                abortController,
                ...(sdkSessionId ? { resume: sdkSessionId } : {}),
                model: 'claude-sonnet-4-6',
                mcpServers: { agent: agentServer },
                allowedTools: ['Write', 'Read', 'Edit', 'Skill', 'mcp__agent__notify_preview'],
                permissionMode: 'acceptEdits',
                systemPrompt: buildSystemPrompt(chat),
                maxTurns: 20,
                cwd: AGENT_DIR,
                settingSources: ['project'],
                includePartialMessages: true,
              },
            }),
            {
              chatId: chat.id,
              logPrefix: '[workspace-adapter]',
              abortController,
              formatErrorMessage: (error) =>
                `\n\n[执行失败：${error instanceof Error ? error.message : '未知错误'}]`,
            },
          );
        } finally {
          unregisterAbort(chat.id);
        }
      },
      onFinish: ({ messages: finalMessages, isAborted }) => {
        if (isAborted) return;
        return persist({ messages: finalMessages });
      },
      onError: (error) => {
        console.error('[workspace-adapter] stream error:', error);
        return '请求失败，请稍后重试。';
      },
    });

    const response = createUIMessageStreamResponse({ stream });
    const headers = new Headers(response.headers);
    headers.set('X-Accel-Buffering', 'no');
    headers.set('Cache-Control', 'no-cache');

    return new Response(response.body, { headers });
  },
};
