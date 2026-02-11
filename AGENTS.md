# AGENTS.md

Agent-focused instructions for this repository. Keep this file updated as code patterns evolve.

## Project overview
- Stack: Next.js App Router + TypeScript + Tailwind + Vercel AI SDK.
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
- `app/chat/new-chat-launcher.tsx`: first-message submit + route jump.
- `app/chat/[chatId]/page.tsx`: chat route page + existence checks.
- `app/chat/[chatId]/chat.tsx`: chat UI and transport wiring.
- `app/api/chat/**/route.ts`: streaming chat and stop/delete endpoints.
- `util/chat-store.ts`: persistence helpers (`readChat`, `readChatIfExists`, `saveChat`, `deleteChat`).

## Do
- Keep diffs small and focused; preserve existing behavior unless asked.
- Reuse shared components (`Sidebar`, `ChatListItem`) before creating new ones.
- Use `readChatIfExists` for existence checks; use `readChat` only when creation is intended.
- Keep UI compact and full-screen layout compatible (current sidebar width is `220px`).
- Run `npx tsc --noEmit` after changes.

## Don’t
- Don’t commit secrets or modify `.env.local` values in repo.
- Don’t edit generated/runtime artifacts (`.next/`, `.chats/`, `tsconfig.tsbuildinfo`, `node_modules/`).
- Don’t introduce heavy dependencies without explicit approval.
- Don’t rewrite unrelated files while fixing targeted tasks.

## Validation checklist
- For UI changes: manual smoke test in browser
  - Home shows sidebar.
  - Home send creates/opens `/chat/:id`.
  - Chat sidebar switch and delete work.
- For chat/data changes:
  - Stream still works via `/api/chat` and `/api/chat/[id]/stream`.
  - Deleting active chat redirects to `/`.

## PR / commit guidance
- Use Conventional Commits (`feat:`, `fix:`, `refactor:` etc.).
- Include: scope, behavior change, verification commands, and screenshots for UI updates.

## Safety boundaries
- Ask first before: deleting many files, changing env contract, or adding dependencies.
- If new env vars are required, update `.env.local.example` in the same change.
