# Repository Guidelines

## Project Structure & Module Organization
This repository is a Next.js (App Router) TypeScript app.

- `app/`: routes, layouts, server actions, and UI components.
  - `app/api/**/route.ts`: API route handlers.
  - `app/chat/[chatId]/*`: dynamic chat UI and route-specific components.
- `util/`: shared schemas and state helpers (for example `chat-schema.ts`, `chat-store.ts`).
- Root config: `next.config.js`, `tailwind.config.js`, `postcss.config.js`, `tsconfig.json`.
- Env files: copy `.env.local.example` to `.env.local` for local setup.

## Build, Test, and Development Commands
Use npm scripts from `package.json`:

- `npm run dev`: start local dev server (`http://localhost:3000`).
- `npm run build`: create production build.
- `npm run start`: run the production build locally.
- `npm run lint`: run Next.js + ESLint checks.

Run `npm install` before first start.

## Coding Style & Naming Conventions
- Language: TypeScript + React function components.
- Indentation: 2 spaces; keep imports grouped and ordered logically.
- Components/files: use lowercase route files (`page.tsx`, `layout.tsx`, `route.ts`), and descriptive kebab/lowercase names for utility files (for example `chat-store.ts`).
- Prefer explicit types on exported utilities and shared function interfaces.
- Styling: use Tailwind utility classes in JSX and keep global styles in `app/globals.css`.

## Testing Guidelines
There is currently no dedicated test suite in this repository.

- Minimum validation for each change: `npm run lint` and a manual smoke test in `npm run dev`.
- If you add tests, colocate them near features (for example under `app/**`) and use clear names like `*.test.ts` or `*.test.tsx`.

## Commit & Pull Request Guidelines
Git history currently uses Conventional Commits (example: `feat: init vercel ai sdk`).

- Commit format: `type(scope): short summary` (e.g., `fix(chat): handle empty stream`).
- Keep commits focused and atomic.
- PRs should include: purpose, key changes, verification steps, and screenshots/GIFs for UI changes.
- Link related issues/tasks and note any required env/config changes.

## Security & Configuration Tips
- Never commit secrets; keep API keys only in `.env.local`.
- Update `.env.local.example` when adding new required environment variables.
