# V0 DIY

一个受 Vercel v0 启发的 AI Agent 应用，专注于通过自然语言快速生成移动端 H5 页面（如营销活动页、可视化报告）。

## 概述

v0-diy 不仅仅是一个对话机器人，它拥有完整的生成流水线。通过意图识别，它能自动判断是在与用户进行普通对话，还是需要生成/修改代码。系统采用 DSL（领域特定语言）作为中间层，确保了生成的稳定性和可维护性。

## 主要特性

- **🚀 意图驱动流水线 (Intent-Driven Pipeline)**：自动识别用户意图（创建、修改或对话），并触发相应的处理逻辑。
- **🏗️ 基于 DSL 的生成**：AI 生成结构化 JSON (DSL) 而非直接生成原始代码。
  - **为什么使用 DSL？**：相比直接生成代码，DSL 具有更好的可预测性、易于校验、方便在不同平台间转换，并且可以进行自动化的质量评分与修复。
- **🛡️ 质量保障机制**：包含 DSL 校验、自动修复（Auto-repair）和质量评分系统，确保预览成功率。
- **🧩 丰富的 UI 组件库**：目前已支持 `Hero` 头部、`Benefits` 卖点、`Countdown` 倒计时、`Social Proof` 用户口碑、`FAQ` 常见问题、`Footer` 页脚等核心营销组件。
- **🔌 多 Agent 适配器**：解耦 AI 引擎，支持 Vercel AI SDK 和 OpenAI Codex SDK。
- **📱 移动端优先预览**：内置实时预览面板，支持 Artifact 版本历史管理，专为移动端渲染优化。
- **🌊 流式状态反馈**：通过自定义流协议，实时反馈生成进度、质量评分及修复说明。

## 技术栈

- **框架**: Next.js 15 (App Router)
- **AI 引擎**: 
  - Vercel AI SDK (Core & React)
  - OpenAI Codex SDK
- **样式**: Tailwind CSS (支持动态主题色切换)
- **验证**: Zod (用于 DSL 校验和意图识别)
- **渲染**: React Markdown & Lucide React

## 核心工作流

### 1. 意图解析 (Intent Resolution)
系统会根据对话上下文判断用户意图：
- `CREATE`: 从零开始生成新的 H5 页面。
- `EDIT`: 基于当前版本进行局部修改。
- `CONTINUE`: 纯对话沟通，不涉及代码修改。

### 2. DSL 生成与自动修复
AI 按照 `CampaignDslV1` 协议生成 JSON。如果生成的 JSON 格式有误或缺少必要字段，系统会通过 `dsl-quality.ts` 进行质量打分并尝试自动修复，从而大幅降低渲染崩溃的概率。

### 3. DSL 编译器 (DSL Compiler)
编译器将结构化的 DSL 转化为高性能的 JSX 代码，并注入 Tailwind 样式，最终在预览面板的 iframe 中安全渲染。

## 项目结构

```text
v0-diy/
├── app/
│   ├── api/chat/          # 核心 API 路由（流式响应、模式切换）
│   └── chat/[chatId]/     # 聊天与预览的核心交互界面
├── util/
│   ├── builder/           # 生成黑盒：意图识别、DSL 生成、编译器、质量控制
│   ├── agent-adapters/    # AI SDK 适配层（Vercel AI, Codex）
│   ├── ai/                # 基础 Agent 配置与 Provider
│   ├── chat-store.ts      # Zustand 状态管理逻辑
│   └── chat-schema.ts     # 统一的数据模型定义
└── docs/                  # 技术实现细节文档
```

## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 配置环境
创建 `.env.local` 文件：
```bash
OPENAI_API_KEY=your_api_key_here
```

### 3. 运行开发服务器
```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 即可开始。

## 生成流程说明

1. **意图解析**: 识别用户是想 `create`、`edit` 还是 `continue_conversation`。
2. **DSL 生成**: 根据上下文生成或更新 `CampaignDslV1`。
3. **质量检测**: 对 DSL 进行结构校验和评分，必要时进行自动修复。
4. **编译与渲染**: DSL 转化为 JSX/HTML，通过 Artifact 系统推送到前端预览面板。

## 开发路线

- [x] 基础聊天界面与流式响应
- [x] 基于 DSL 的生成流水线
- [x] 意图识别与自动修复
- [x] Vercel AI & Codex 适配器
- [ ] 交互式组件调整 (Visual Editor)
- [ ] 多模态输入 (图片转 H5)
- [ ] 更多行业模板库

## License

MIT
