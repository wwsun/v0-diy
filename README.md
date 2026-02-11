# V0 DIY

一个类似 Vercel v0 的 AI Agent 应用,用于快速生成 mobile web pages。

## 概述

通过自然语言对话,快速生成移动端可视化报告应用和营销活动应用。该项目基于 Next.js 15 和 AI SDK 构建,支持流式响应、多会话管理等功能。

## 主要特性

- **AI 对话生成** - 通过自然语言描述需求,AI 自动生成移动端页面代码
- **流式响应** - 实时展示 AI 生成过程,提供流畅的交互体验
- **会话管理** - 支持多会话创建、切换和删除
- **代码预览** - (开发中) 实时预览生成的代码效果
- **Agent 模式** - (开发中) 支持 Codex SDK 和 Vercel AI Agent 适配

## 技术栈

- **框架**: Next.js 15 (App Router)
- **AI SDK**: Vercel AI SDK 6.0, OpenAI Codex SDK
- **样式**: Tailwind CSS
- **语言**: TypeScript
- **状态管理**: Zustand (chat-store)
- **图标**: Lucide React

## 快速开始

### 环境要求

- Node.js 18+
- npm/yarn/pnpm

### 安装

```bash
# 克隆项目
git clone https://github.com/wwsun/v0-diy.git
cd v0-diy

# 安装依赖
npm install
```

### 配置

创建 `.env.local` 文件并配置 OpenAI API 密钥:

```bash
OPENAI_API_KEY=your_api_key_here
```

### 运行

```bash
# 开发模式
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

访问 [http://localhost:3000](http://localhost:3000) 开始使用。

## 项目结构

```
v0-diy/
├── app/
│   ├── api/chat/          # Chat API 路由
│   │   ├── route.ts       # 创建新会话
│   │   └── [id]/          # 会话相关 API
│   │       ├── route.ts   # 获取/删除会话
│   │       ├── stream/    # 流式响应
│   │       └── mode/      # Agent 模式切换
│   ├── chat/              # 聊天界面组件
│   │   ├── [chatId]/      # 动态聊天页面
│   │   ├── sidebar.tsx    # 侧边栏
│   │   └── mode-toggle.tsx # 模式切换
│   └── page.tsx           # 首页
├── util/
│   ├── chat-schema.ts     # Chat 数据结构
│   ├── chat-store.ts      # Zustand 状态管理
│   └── ai/
│       └── agent.ts       # Agent 实现
└── package.json
```

## 开发路线

- [x] 基础聊天界面
- [x] 流式 AI 响应
- [x] 会话管理(新增/删除/切换)
- [ ] Agent 模式支持
- [ ] Agent 适配器 (Codex SDK, Vercel AI Agent)
- [ ] 代码生成与预览
- [ ] 移动端页面模板库

## 学习要点

这个项目是学习和实践以下技术的好例子:

- Next.js 15 App Router 的 Server Actions 和 Route Handlers
- AI SDK 的流式响应处理
- Zustand 在 Next.js 中的状态管理
- TypeScript 泛型和类型推导
- Vercel Blob 存储集成

## License

MIT
