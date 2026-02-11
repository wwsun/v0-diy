# AGENTS.md

Agent-focused instructions for this repository. Keep this file updated as code patterns evolve.

## Project overview
- Stack: Next.js App Router + TypeScript + Tailwind + AI SDK 6.
- Chat runtime supports two SDK paths in Agent mode (`vercel-ai`, `codex`) via adapter registry.
- Chat data is file-based in `.chats/*.json` via `util/chat-store.ts`.
- Home page (`/`) is a launcher: submit first message, then navigate to `/chat/:id`.

## Setup commands
- Install deps: `npm install`
- Dev server: `npm run dev`
- Type check (required): `npx tsc --noEmit`
- Production build: `npm run build`

Note: `npm run lint` currently uses `next lint` and may prompt interactively if ESLint config is missing.

## Project structure
- `app/page.tsx`: home shell (sidebar + new chat launcher).
- `app/chat/sidebar.tsx`: shared sidebar for home and chat pages.
- `app/chat/chat-list-item.tsx`: sidebar chat row item with navigation/delete actions.
- `app/chat/new-chat-launcher.tsx`: first-message submit + route jump.
- `app/chat/mode-toggle.tsx`: chat/agent mode switch control.
- `app/chat/sdk-toggle.tsx`: SDK switch control for agent mode (`vercel-ai` / `codex`).
- `app/chat/[chatId]/page.tsx`: chat route page + existence checks.
- `app/chat/[chatId]/chat.tsx`: chat UI and transport wiring.
- `app/chat/[chatId]/chat-input.tsx`: message composer with submit/stop behavior.
- `app/chat/[chatId]/message.tsx`: message rendering.
- `app/actions.ts`: server action helpers (router cache invalidation hooks).
- `app/api/chat/route.ts`: primary chat stream endpoint (submit/regenerate).
- `app/api/chat/[id]/stream/route.ts`: chat stream endpoint by chat id.
- `app/api/chat/[id]/route.ts`: chat delete endpoint.
- `app/api/chat/[id]/agent-config/route.ts`: unified mode + SDK persistence endpoint.
- `app/api/chat/[id]/mode/route.ts`: mode-only endpoint (legacy/compat; prefer `agent-config`).
- `util/chat-store.ts`: persistence helpers (`createChat`, `readChat`, `readChatIfExists`, `readAllChats`, `saveChat`, `appendMessageToChat`, `deleteChat`).
- `util/chat-schema.ts`: shared chat/message/mode/agent types.
- `util/chat-request.ts`: request validation + message trigger application.
- `util/chat-message.ts`: message utilities (e.g. message ID normalization).
- `util/agent-adapters/registry.ts`: centralized adapter selection by SDK.
- `util/agent-adapters/*.ts`: adapter implementations for each agent SDK.
- `util/ai/provider.ts`: model provider factory.
- `util/ai/agent.ts`: core AI agent helpers.

## Do
- Keep diffs small and focused; preserve existing behavior unless asked.
- Reuse shared components (`Sidebar`, `ChatListItem`, toggles) before creating new ones.
- Use `readChatIfExists` for existence checks; use `readChat` only when creation is intended.
- Prefer `PATCH /api/chat/[id]/agent-config` when persisting mode and/or SDK from UI.
- Keep adapter routing centralized in `util/agent-adapters/registry.ts`.
- Keep UI compact and full-screen layout compatible (current sidebar width is `220px`).
- Run `npx tsc --noEmit` after changes.

## Don’t
- Don’t commit secrets or modify `.env.local` values in repo.
- Don’t edit generated/runtime artifacts (`.next/`, `.chats/`, `tsconfig.tsbuildinfo`, `node_modules/`).
- Don’t introduce heavy dependencies without explicit approval.
- Don’t bypass adapter abstraction by hardcoding SDK-specific logic directly in route handlers.
- Don’t rewrite unrelated files while fixing targeted tasks.

## Validation checklist
- For UI changes: manual smoke test in browser
  - Home shows sidebar.
  - Home send creates/opens `/chat/:id`.
  - Chat sidebar switch and delete work.
  - Mode toggle and SDK toggle persist correctly after refresh/navigation.
- For chat/data changes:
  - Stream still works via `/api/chat` and `/api/chat/[id]/stream`.
  - `PATCH /api/chat/[id]/agent-config` correctly updates `mode` and `agentSdk`.
  - Deleting active chat redirects to `/`.

## PR / commit guidance
- Use Conventional Commits (`feat:`, `fix:`, `refactor:` etc.).
- Include: scope, behavior change, verification commands, and screenshots for UI updates.

## Safety boundaries
- Ask first before: deleting many files, changing env contract, or adding dependencies.
- If new env vars are required, update `.env.local.example` in the same change.
