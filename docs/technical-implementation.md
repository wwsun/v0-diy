# 技术实现文档

本文档描述 v0-diy 当前的架构设计、核心数据流和关键技术决策。

## 项目定位

v0-diy 是一个 AI 驱动的网页生成器。用户输入自然语言需求，后端通过 Claude Agent SDK 调用 Claude 生成单文件 HTML（React + TailwindCSS + Babel Standalone），并实时在右侧 iframe 预览。

---

## 技术栈

| 层次 | 技术 |
|---|---|
| 框架 | Next.js 15 App Router |
| AI 引擎 | `@anthropic-ai/claude-agent-sdk` ^0.2.x |
| 流协议 | Vercel AI SDK 6（`ai` + `@ai-sdk/react`）|
| 样式 | Tailwind CSS 3 |
| 类型校验 | Zod 4 |
| 动画 | Framer Motion |
| 持久化 | 文件系统（无数据库）|
| 端口 | 4001（开发 & 生产）|

---

## 整体架构

```
用户输入
  │
  ▼
POST /api/agent/[id]/stream
  │
  ▼
adapters/workspace-adapter.ts
  ├─ 构建 systemPrompt（工作目录路径 + 当前状态）
  ├─ 注册 notify_preview MCP 工具（内置 SDK MCP Server）
  ├─ 调用 Claude Agent SDK query()
  │     cwd = agent/（含 CLAUDE.md + .claude/skills/）
  │     allowedTools = [Write, Read, Edit, Skill, mcp__agent__notify_preview]
  │     permissionMode = acceptEdits
  │     maxTurns = 20
  │
  ├─ Claude 执行：
  │     ① 读取已有 index.html（如有）
  │     ② 生成/修改 .workspaces/{chatId}/index.html
  │     ③ 调用 notify_preview → 保存 snapshotId 到 .workspaces/{chatId}/chat.json
  │
  └─ stream/claude-sdk-stream.ts
        将 Claude SDK 事件映射为 Vercel AI SDK UIMessageStream 事件

UIMessageStream → useChat hook（@ai-sdk/react）
  │
  ▼
前端消息渲染 + PreviewPanel 轮询

PreviewPanel（streaming 期间每 2s）
  → GET /api/agent/[id]
  → 检测 activeSnapshotId 变化
  → 更新 iframe src（?t={snapshotId} 破坏缓存）
  → /api/workspace/{chatId} 返回 index.html 内容
```

---

## 核心模块详解

### 1. `adapters/workspace-adapter.ts` — 唯一的 AgentAdapter 实现

**职责**：
- 组装 Claude Agent SDK 的调用参数
- 内置 `notify_preview` MCP 工具（`createSdkMcpServer`）
- 注册/注销 AbortController（支持取消）
- 将 `sdkSessionId` 用于断点续传（同一对话重新发消息时复用 session）
- 调用 `processClaudeStreamEvents()` 完成事件桥接
- 返回带 `X-Accel-Buffering: no` / `Cache-Control: no-cache` 头的 `Response`

**`buildSystemPrompt(chat)`**：动态生成 system prompt，注入工作区绝对路径和当前状态（是否已有页面），Agent 依此决定 Write（新建）还是 Read + Edit（修改）。

**`AgentAdapter` 接口**（`adapters/types.ts`）：
```typescript
interface AgentAdapter {
  runAsUIMessageStream(context: AdapterContext): Promise<Response>;
}
```
接口保留扩展点，当前只有 `workspaceAdapter` 一个实现。

---

### 2. `stream/claude-sdk-stream.ts` — Claude SDK 事件 → UIMessageStream 桥接

**核心函数**：`processClaudeStreamEvents(writer, events, options)`

处理 Claude Agent SDK `query()` 返回的 `AsyncIterable<unknown>`，将事件映射为 Vercel AI SDK UIMessageStream 事件：

| Claude SDK 事件 | UIMessageStream 事件 |
|---|---|
| `content_block_start` type=text | `text-start` |
| `content_block_delta` text_delta | `text-delta` |
| `content_block_stop` text | `text-end` |
| `content_block_start` type=thinking | `reasoning-start` |
| `content_block_delta` thinking_delta | `reasoning-delta` |
| `content_block_stop` thinking | `reasoning-end` |
| `content_block_start` type=tool_use | `tool-input-start` |
| `content_block_delta` input_json_delta | `tool-input-delta` |
| `content_block_stop` tool_use | `tool-input-available` |
| user event tool_result | `tool-output-available` |

**关键设计**：
- `blocks: Map<number, BlockState>` 维护当前活跃的内容块状态
- `registeredToolCalls: Set<string>` 避免 tool_result 输出被写入未注册的工具调用
- **30 秒启动超时**：首个事件到达前若超时，自动写入错误文本并 abort

**错误处理**：
- `system.subtype=api_retry` + `authentication_failed` → 写错误并中断
- `system.subtype=api_retry` + `billing_error` → 写错误并中断
- `result.subtype=error_max_turns` → 写专属错误提示
- `AbortError` / Request interrupted → 静默忽略（正常取消）

**Session 续传**：收到 `system.subtype=init` 时保存 `session_id` 到 `.workspaces/{chatId}/chat.json`，下次请求通过 `resume: sdkSessionId` 恢复。

---

### 3. `stream/abort-registry.ts` — 进程内取消注册表

进程级 `Map<chatId, AbortController>`，支持 `DELETE /api/agent/[id]/stream` 主动取消正在运行的 `query()`。

```
registerAbort(chatId)    → 注册新 controller（旧的先 abort）
abortIfRunning(chatId)   → 检查并 abort（DELETE 端点调用）
unregisterAbort(chatId)  → 流正常结束后清理
```

**注意**：这是进程内状态，不跨进程/副本共享。

---

### 4. `util/chat-schema.ts` — 核心数据类型

```typescript
// 对话持久化结构
type ChatData = {
  id: string;
  messages: MyUIMessage[];          // Vercel AI SDK UIMessage 数组
  sdkSessionId?: string;            // Claude Agent SDK session，用于续传
  workspacePages: {
    activeSnapshotId: string | null; // notify_preview 写入的时间戳 ID
  };
  createdAt: number;
  activeStreamId: string | null;    // 当前活跃流 ID
  canceledAt: number | null;        // 取消时间戳
};
```

---

### 5. `util/chat-store.ts` — 文件系统持久化

对话数据存储在 `.workspaces/{chatId}/chat.json`，与生成的 HTML 放在同一目录下，无数据库依赖。

主要函数：
- `createChat()` → 生成 ID，写入空白 ChatData
- `readChat(id)` → 读取或新建
- `readChatIfExists(id)` → 读取或返回 null（用于存在性检查）
- `saveChat(partial)` → merge patch 更新，写回文件
- `readAllChats()` → 扫描 `.workspaces/` 下所有子目录读取 chat.json
- `deleteChat(id)` → `rmSync` 删除整个 `.workspaces/{chatId}/` 目录（含 chat.json + index.html）

---

### 6. `util/workspace.ts` — Workspace 路径工具

生成的 HTML 存储在 `.workspaces/{chatId}/index.html`。

```
getWorkspacesRoot()          → .workspaces/
getChatWorkspaceDir(chatId)  → .workspaces/{chatId}/
getWorkspaceFilePath(chatId, filename)
ensureWorkspaceDir(chatId)   → mkdir -p
workspaceFileExists(chatId, filename)
```

---

### 7. API 路由

| 路由 | 方法 | 职责 |
|---|---|---|
| `/api/agent/[id]/stream` | POST | 触发 Agent 流（追加用户消息，启动 workspaceAdapter）|
| `/api/agent/[id]/stream` | DELETE | 取消运行中的流（调用 abortIfRunning）|
| `/api/agent/[id]` | GET | 读取 ChatData（供 PreviewPanel 轮询）|
| `/api/workspace/[chatId]` | GET | 返回 index.html 内容（iframe src）|

---

### 8. 前端核心组件

#### `app/chat/[chatId]/chat.tsx`
- 使用 `useChat`（`@ai-sdk/react`）管理消息状态和流
- `DefaultChatTransport` 指向 `/api/agent/{id}/stream`，请求体携带最后一条用户消息
- 新对话首次渲染后从 `sessionStorage` 读取 pending 消息并自动提交
- 支持左右拖拽调整对话区宽度（260px–680px）

#### `app/chat/[chatId]/preview-panel.tsx`
- **轮询逻辑**：streaming/submitted 状态下每 2s 调 `/api/agent/{chatId}`，检测 `activeSnapshotId` 变化
- **iframe 刷新**：`src` 加 `?t={snapshotId}` 破坏缓存，`key` prop 强制重新挂载
- 桌面/手机视口切换（桌面全宽 iframe vs. 390px 手机框）
- 支持刷新按钮和新标签页打开

#### `app/chat/[chatId]/message.tsx`
渲染三类消息 part：
- `reasoning` → `ThinkingBlock`（可折叠思考块）
- `dynamic-tool` → `FileChangeCard`（Write/Edit）或 `ToolCallCard`（其他工具）
- `text` → `ReactMarkdown`

---

### 9. Agent 配置目录（`agent/`）

Agent（Claude）运行时的 cwd 设为 `agent/` 目录，通过 `settingSources: ['project']` 自动加载：
- `agent/CLAUDE.md`：Agent 系统角色定义（指示 Agent 使用 `html-page` 技能）
- `agent/.claude/skills/html-page/SKILL.md`：生成页面的技术规范技能

**生成页面规范（`html-page` 技能）**：
- 完整单文件 HTML
- React 18 UMD via unpkg.com（全局变量 `React`、`ReactDOM`）
- Tailwind CSS via CDN
- Babel Standalone via unpkg.com（`type="text/babel"` 脚本）
- 禁止 ESM `import`，所有库通过全局变量访问

---

## 关键设计决策

### 决策 1：轮询而非 WebSocket
预览刷新通过 2s 轮询 `/api/agent/{chatId}` 实现，避免了 WebSocket 的连接管理复杂度。因为刷新频率低（Claude 写完文件才触发），轮询开销可接受。

### 决策 2：notify_preview 主动通知
Claude 写完 `index.html` 后**主动调用** `notify_preview` MCP 工具，而非系统被动轮询文件变化。这避免了文件系统 watch 的实现复杂度，且精确控制刷新时机（写完即通知）。

### 决策 3：单 adapter 架构
`AgentAdapter` 接口预留扩展点，当前只有 `workspaceAdapter`。新增 adapter 只需实现接口，无需修改 route handler。

### 决策 4：30 秒启动超时
`claude-sdk-stream.ts` 中设置 30s 超时，防止 `query()` 无响应时用户界面永久 loading。超时后写入错误提示并主动 abort。

### 决策 5：sdkSessionId 断点续传
Claude Agent SDK 支持 `resume: sessionId` 在同一对话中恢复上下文。`system.init` 事件携带 `session_id`，保存后用于后续轮次，避免重复发送历史消息。

### 决策 6：统一 workspace 目录

所有对话数据（`chat.json`）和生成产物（`index.html`）统一放在 `.workspaces/{chatId}/` 下，无数据库依赖，部署简单。删除对话时 `rmSync` 整目录，无需分别清理。代价是不支持横向扩展（进程内 AbortController 注册表同理）。

---

## 数据目录约定

| 路径 | 内容 |
|---|---|
| `.workspaces/{chatId}/chat.json` | ChatData 持久化（消息、状态、snapshotId） |
| `.workspaces/{chatId}/index.html` | Claude 生成的网页 |
| `agent/CLAUDE.md` | Agent 系统角色 |
| `agent/.claude/skills/` | Agent 可调用的技能 |

以上路径均在 `.gitignore` 中排除（`.workspaces/`）。

---

## 环境变量

| 变量 | 说明 |
|---|---|
| `ANTHROPIC_API_KEY` | 必填，Claude Agent SDK 使用 |

参考 `.env.local.example`。
