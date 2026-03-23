# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个类 Vercel v0 的 AI 网页生成器。用户输入需求，Claude Agent SDK 驱动 Claude 生成 React + TailwindCSS + Babel Standalone 的单文件 HTML，实时在右侧 iframe 预览。

详细技术文档：`docs/technical-implementation.md`

## 常用命令

```bash
npm run dev       # 开发服务器（端口 4001）
npm run build     # 生产构建
npm run lint      # ESLint 检查
npx tsc --noEmit  # 类型检查（修改后必须运行）
```

## 核心架构

### 数据流

```
用户输入
  → POST /api/agent/[id]/stream
  → workspace-adapter.ts（调用 Claude Agent SDK query()）
      → Claude 写 .workspaces/{chatId}/index.html
      → Claude 调用 notify_preview → 保存 snapshotId 到 .workspaces/{chatId}/chat.json
  → claude-sdk-stream.ts 将 SDK 事件转为 Vercel AI SDK UIMessageStream
  → useChat hook 驱动前端消息渲染

预览刷新：
  → PreviewPanel 在 streaming 期间每 2s 轮询 GET /api/agent/[id]
  → 检测 activeSnapshotId 变化后更新 iframe src（带 ?t= 缓存破坏）
  → /api/workspace/[chatId] 返回 index.html 内容
```

### 目录结构

| 路径 | 职责 |
|---|---|
| `adapters/workspace-adapter.ts` | 核心：Claude Agent SDK 调用、notify_preview MCP 工具、system prompt |
| `adapters/types.ts` | AgentAdapter 接口定义 |
| `stream/claude-sdk-stream.ts` | Claude SDK 事件流 → Vercel AI UIMessageStream 转换 |
| `stream/abort-registry.ts` | 进程内 AbortController 注册表（支持 DELETE 取消） |
| `util/chat-schema.ts` | 核心类型（ChatData、MyUIMessage、WorkspacePagesMeta） |
| `util/chat-store.ts` | 文件系统持久化（`.workspaces/{chatId}/chat.json`） |
| `util/workspace.ts` | workspace 路径工具（`.workspaces/{chatId}/`） |
| `app/api/agent/[id]/stream/route.ts` | POST 触发流 / DELETE 中止 |
| `app/api/agent/[id]/route.ts` | GET 读取 chat 数据（供 PreviewPanel 轮询） |
| `app/api/workspace/[chatId]/route.ts` | GET 返回生成的 index.html |
| `app/chat/[chatId]/chat.tsx` | 对话界面：useChat + 拖拽调宽 |
| `app/chat/[chatId]/preview-panel.tsx` | Desktop/Mobile 切换 + 轮询预览刷新 |
| `app/chat/[chatId]/message.tsx` | 消息渲染（reasoning、tool、text） |
| `agent/CLAUDE.md` | Agent 运行时系统角色（指示使用 html-page 技能） |
| `agent/.claude/skills/html-page/SKILL.md` | 生成页面的技术规范 |

### 持久化

- **所有数据均在 `.workspaces/{chatId}/` 下**：
  - `chat.json`：对话元数据（`ChatData` 结构，含消息、sdkSessionId、workspacePages 等）
  - `index.html`：Agent 生成的网页文件
- 无数据库依赖，纯文件系统；删除对话时整个目录一并清理

### Agent 能力

`workspace-adapter.ts` 中配置的 Claude Agent 权限：
- 允许工具：`Write`、`Read`、`Edit`、`Skill`、`mcp__agent__notify_preview`
- `permissionMode: 'acceptEdits'`，最多 20 轮对话
- 工作目录：`agent/`（通过 `settingSources: ['project']` 自动加载 CLAUDE.md 和 skills）
- 支持通过 `sdkSessionId` 断点续传

### 生成页面规范

Agent 生成的 `index.html` 格式：使用 Babel Standalone 在浏览器端编译 JSX，通过 unpkg.com UMD 脚本加载 React 18，通过 CDN 加载 TailwindCSS。**禁止** ESM `import`，所有库通过全局变量访问。

## 关键设计决策

- **轮询而非 WebSocket**：预览刷新通过 2s 轮询实现，避免 WebSocket 复杂度
- **notify_preview 工具**：Claude 写完文件后主动调用，而非系统轮询文件变化
- **单 adapter 架构**：`AgentAdapter` 接口预留扩展点，当前只有 `workspace-adapter`
- **30 秒启动超时**：`claude-sdk-stream.ts` 中保护机制，防止 Agent 无响应
- **sdkSessionId 续传**：`system.init` 事件保存 session_id，后续请求通过 `resume` 复用

## 开发规范

- 修改代码后运行 `npx tsc --noEmit` 确保类型正确
- 使用 `readChatIfExists` 做存在性检查，`readChat` 仅在需要创建时使用
- 不要直接修改 `.workspaces/`、`.next/`、`node_modules/`
- 新增环境变量时同步更新 `.env.local.example`
- 保持 route handler 轻薄，业务逻辑在 adapter 层

## 环境变量

```env
ANTHROPIC_API_KEY=sk-ant-...   # 必填，Claude Agent SDK 使用
```
