# AGENTS.md

Agent 专用指南。代码演进时请同步更新本文件。

## 项目概述

- **定位**：AI 驱动的网页生成器，类 Vercel v0
- **技术栈**：Next.js 15 App Router + TypeScript + Tailwind CSS + Claude Agent SDK + Vercel AI SDK 6
- **端口**：4001（开发 & 生产）
- **持久化**：纯文件系统，无数据库（`.workspaces/{chatId}/chat.json` + `.workspaces/{chatId}/index.html`，删除时整目录清理）

## 技术参考

- `docs/technical-implementation.md`：主架构参考（完整数据流、模块详解、设计决策）
- `CLAUDE.md`：项目级 Claude Code 配置（常用命令、目录结构速查）
- 如文档与代码不一致，以代码为准，并在同一 PR 中更新文档

## 安装与运行

```bash
npm install
npm run dev          # 端口 4001
npx tsc --noEmit     # 类型检查（修改后必须运行）
npm run build        # 生产构建
```

## 项目结构

```
v0-diy/
├── adapters/
│   ├── types.ts                    # AgentAdapter 接口
│   └── workspace-adapter.ts        # 唯一 adapter 实现，调用 Claude Agent SDK
├── stream/
│   ├── abort-registry.ts           # 进程内取消注册表
│   └── claude-sdk-stream.ts        # SDK 事件 → UIMessageStream 桥接
├── util/
│   ├── chat-schema.ts              # 核心类型（ChatData、MyUIMessage）
│   ├── chat-store.ts               # 文件系统持久化
│   ├── chat-message.ts             # 消息工具函数
│   └── workspace.ts                # workspace 路径工具
├── app/
│   ├── api/agent/[id]/
│   │   ├── route.ts                # GET 读取 chat 数据
│   │   └── stream/route.ts         # POST 触发流 / DELETE 中止
│   ├── api/workspace/[chatId]/
│   │   └── route.ts                # GET 返回生成的 index.html
│   └── chat/[chatId]/
│       ├── chat.tsx                # 对话界面 + useChat
│       ├── message.tsx             # 消息渲染
│       ├── preview-panel.tsx       # 预览面板 + 轮询
│       ├── chat-input.tsx          # 输入框
│       └── page.tsx                # 路由页面
├── components/
│   ├── thinking-block.tsx          # 推理过程展示
│   └── tool-cards/                 # 工具调用卡片（FileChangeCard、ToolCallCard）
└── agent/
    ├── CLAUDE.md                   # Agent 运行时角色定义
    └── .claude/skills/html-page/   # 生成页面技术规范技能
```

## 核心数据流

```
POST /api/agent/[id]/stream
  └─ workspace-adapter.runAsUIMessageStream()
       ├─ Claude Agent SDK query()
       │    cwd = agent/
       │    tools = [Write, Read, Edit, Skill, mcp__agent__notify_preview]
       │    maxTurns = 20, permissionMode = acceptEdits
       │
       ├─ Claude 写 .workspaces/{chatId}/index.html
       ├─ Claude 调用 notify_preview → snapshotId 写入 .workspaces/{chatId}/chat.json
       └─ processClaudeStreamEvents() → UIMessageStream → useChat
```

预览刷新：`PreviewPanel` 每 2s 轮询 `GET /api/agent/{chatId}`，检测 `activeSnapshotId` 变化后更新 iframe src。

## 关键类型

```typescript
// util/chat-schema.ts
type ChatData = {
  id: string;
  messages: MyUIMessage[];
  sdkSessionId?: string;           // Claude SDK session，用于断点续传
  workspacePages: {
    activeSnapshotId: string | null; // notify_preview 写入的时间戳
  };
  activeStreamId: string | null;
  canceledAt: number | null;
  createdAt: number;
};

// adapters/types.ts
interface AgentAdapter {
  runAsUIMessageStream(context: AdapterContext): Promise<Response>;
}
```

## 开发规范

### 必须遵守

- 修改后运行 `npx tsc --noEmit` 确保无类型错误
- 使用 `readChatIfExists` 做存在性检查；`readChat` 仅在需要自动创建时使用
- route handler 保持轻薄，业务逻辑放在 adapter 层
- 新增环境变量时同步更新 `.env.local.example`
- Commit 使用 Conventional Commits（`feat:` `fix:` `refactor:` 等）

### 禁止

- 不得提交 `.env.local` 中的密钥
- 不得修改运行时产物（`.chats/` `.workspaces/` `.next/` `tsconfig.tsbuildinfo`）
- 不得绕过 adapter 抽象，在 route handler 中直接写 SDK 调用逻辑
- 不得引入重型依赖，未经确认不得修改 `package.json`

## SDK 使用指南

### Claude Agent SDK (`@anthropic-ai/claude-agent-sdk`)

- 通过 `query()` 调用，返回 `AsyncIterable<unknown>` 事件流
- `settingSources: ['project']` 让 Agent 自动加载 `agent/CLAUDE.md` 和 skills
- `resume: sdkSessionId` 在同一对话的后续轮次复用 session（避免重复传历史消息）
- 自定义 MCP 工具通过 `createSdkMcpServer` + `tool()` 注册
- 完整事件映射见 `stream/claude-sdk-stream.ts` 注释

### Vercel AI SDK 6 (`ai` + `@ai-sdk/react`)

- 前端用 `useChat`（`@ai-sdk/react`），配合 `DefaultChatTransport` 指向 `/api/agent/{id}/stream`
- 后端用 `createUIMessageStream` + `createUIMessageStreamResponse` 包装响应
- 消息 part 类型：`text`、`reasoning`（thinking）、`dynamic-tool`（工具调用）

## 生成页面规范

Agent 生成的 `index.html` 必须遵循 `agent/.claude/skills/html-page/SKILL.md`：

- React 18 UMD via unpkg.com（全局变量 `React`、`ReactDOM`）
- Tailwind CSS via CDN（`cdn.tailwindcss.com`）
- Babel Standalone via unpkg.com（`type="text/babel"` 脚本）
- **禁止** ESM `import`，所有库通过全局变量访问
- Hooks 解构：`const { useState, useEffect } = React;`

## 验证清单

### UI 变更

- [ ] 首页侧边栏正常显示历史对话
- [ ] 发送消息后跳转到 `/chat/:id`
- [ ] 对话输入和停止按钮正常工作
- [ ] PreviewPanel 在生成完成后显示页面
- [ ] 桌面/手机预览切换正常

### 数据 / 流变更

- [ ] `POST /api/agent/[id]/stream` 流式响应正常
- [ ] `DELETE /api/agent/[id]/stream` 取消流正常
- [ ] `GET /api/agent/[id]` 返回最新 chat 数据
- [ ] `notify_preview` 调用后预览面板刷新
- [ ] 同一对话多轮对话时 `sdkSessionId` 正确复用
- [ ] 删除对话后重定向到 `/`

## 安全边界

遇到以下情况须先确认再操作：

- 删除多个文件
- 修改环境变量合约
- 添加新依赖包
- 修改 `.gitignore` 或 CI 配置
